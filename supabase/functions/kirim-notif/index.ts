import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    // Hanya kirim notifikasi jika statusnya MENUNGGU_PERSETUJUAN
    if (!record || record.status !== "MENUNGGU_PERSETUJUAN") {
      return new Response(JSON.stringify({ message: "Bukan ajuan baru" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    webpush.setVapidDetails(
      "mailto:admin@alislam.sch.id",
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Ambil detail nama santri & kelasnya
    let namaSantri = "Santri";
    let namaKelas = "-";
    if (record.santri_id) {
      const { data: santri } = await supabase
        .from("santri")
        .select("nama_lengkap, kelas(nama_kelas)")
        .eq("id", record.santri_id)
        .single();

      if (santri) {
        namaSantri = santri.nama_lengkap;
        namaKelas = (santri.kelas as any)?.nama_kelas || "-";
      }
    }

    // 2. Hitung jumlah total izin yang masih MENUNGGU_PERSETUJUAN untuk angka di ikon aplikasi
    const { count: badgeCount } = await supabase
      .from("perizinan")
      .select("*", { count: "exact", head: true })
      .eq("status", "MENUNGGU_PERSETUJUAN");

    // 3. Ambil seluruh token Sekretaris Mudir dari tabel push_tokens
    const { data: tokenList, error: tokenErr } = await supabase
      .from("push_tokens")
      .select("id, token")
      .eq("role", "SEKRETARIS_MUDIR");

    if (tokenErr || !tokenList || tokenList.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada token terdaftar" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const jenisIzin = (record.jenis_izin || "Izin").replace(/_/g, " ");
    const isPerpanjangan = record.parent_izin_id !== null;

    const notifPayload = JSON.stringify({
      title: isPerpanjangan ? "⏳ Ajuan Perpanjangan Izin!" : "🔔 Ajuan E-Pass Baru!",
      body: `${namaSantri} (Kelas ${namaKelas}) mengajukan ${jenisIzin}.`,
      badge: badgeCount || 1,
      url: "/",
    });

    // 4. Kirim ke semua perangkat Sekretaris Mudir & bersihkan token mati (410/404)
    const results = await Promise.allSettled(
      tokenList.map(async (item) => {
        try {
          await webpush.sendNotification(item.token, notifPayload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_tokens").delete().eq("id", item.id);
          }
          throw err;
        }
      })
    );

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});