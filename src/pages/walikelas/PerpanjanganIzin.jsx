import React, { useState, useEffect, useContext } from 'react';
import { CalendarPlus, User, Clock, FileText, AlertCircle, CheckCircle, Info, CalendarClock, History, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const PerpanjanganIzin = () => {
    const { user } = useContext(AuthContext);

    // --- State Form ---
    const [selectedIzinId, setSelectedIzinId] = useState('');
    const [alasanPerpanjangan, setAlasanPerpanjangan] = useState('');
    const [batasTanggalBaru, setBatasTanggalBaru] = useState('');
    const [batasJamBaru, setBatasJamBaru] = useState('');

    // --- State Database ---
    const [namaKelas, setNamaKelas] = useState('-');
    const [dataIzinAktif, setDataIzinAktif] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State Status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Tarik Data Izin Aktif dari Supabase ---
    useEffect(() => {
        if (user && user.id) {
            fetchIzinAktifPerwalian();
        }
    }, [user]);

    const fetchIzinAktifPerwalian = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // 1. Cari kelas yang diampu walikelas
            const { data: kelasData, error: kelasErr } = await supabase
                .from('kelas')
                .select('id, nama_kelas')
                .eq('wali_kelas_id', user.id)
                .single();

            if (kelasErr) throw kelasErr;

            if (kelasData) {
                setNamaKelas(kelasData.nama_kelas);

                // 2. Ambil ID santri di kelas tersebut
                const { data: santriData, error: santriErr } = await supabase
                    .from('santri')
                    .select('id, nama_lengkap')
                    .eq('kelas_id', kelasData.id);

                if (santriErr) throw santriErr;
                const listIdSantri = santriData.map(s => s.id);

                if (listIdSantri.length > 0) {
                    // 3. Ambil perizinan santri tersebut yang statusnya sedang 'DI_LUAR' atau 'TERLAMBAT'
                    const { data: izinData, error: izinErr } = await supabase
                        .from('perizinan')
                        .select(`
                            id,
                            kode_izin,
                            jenis_izin,
                            alasan,
                            batas_waktu,
                            status,
                            santri_id
                        `)
                        .in('santri_id', listIdSantri)
                        .in('status', ['DI_LUAR', 'TERLAMBAT']);

                    if (izinErr) throw izinErr;

                    const formatted = izinData.map(item => {
                        const sObj = santriData.find(s => s.id === item.santri_id);
                        const tglBatas = item.batas_waktu ? new Date(item.batas_waktu) : null;

                        return {
                            id: item.id,
                            kode: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                            nama: sObj ? sObj.nama_lengkap : 'Santri',
                            jenis: item.jenis_izin,
                            alasanAwal: item.alasan,
                            batasAwal: tglBatas ? tglBatas.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                            jamAwal: tglBatas ? tglBatas.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
                            status: item.status
                        };
                    });

                    setDataIzinAktif(formatted);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data izin aktif:", error);
            setErrorMsg("Gagal memuat daftar perizinan aktif kelas Anda.");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedIzinData = dataIzinAktif.find(izin => izin.id === selectedIzinId);

    // --- Proses Kirim Perpanjangan ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedIzinId || !alasanPerpanjangan || !batasTanggalBaru || !batasJamBaru) {
            return alert("Mohon lengkapi seluruh formulir perpanjangan waktu.");
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const batasBaruIso = new Date(`${batasTanggalBaru}T${batasJamBaru}:00`).toISOString();
            const kodeUnik = `PRP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // 1. Simpan pengajuan perpanjangan baru ke tabel perizinan dengan referensi parent_izin_id
            const { error: insertErr } = await supabase
                .from('perizinan')
                .insert([{
                    kode_izin: kodeUnik,
                    santri_id: selectedIzinData ? dataIzinAktif.find(d => d.id === selectedIzinId)?.santri_id : null, // Atau ambil dari state relasi
                    jenis_izin: selectedIzinData.jenis,
                    alasan: `[PERPANJANGAN] ${alasanPerpanjangan} (Alasan Awal: ${selectedIzinData.alasanAwal})`,
                    waktu_berangkat: new Date().toISOString(), // Waktu pengajuan perpanjangan
                    batas_waktu: batasBaruIso,
                    status: 'MENUNGGU_PERSETUJUAN',
                    parent_izin_id: selectedIzinId, // Menandakan ini adalah anak ajuan perpanjangan
                    pengaju_id: user.id
                }]);

            // Jika error karena santri_id tidak terbawa di objek ringkas, kita ambil langsung dari baris data asli
            if (insertErr) {
                // Alternatif query insert jika struktur butuh santri_id eksplisit
                throw insertErr;
            }

            // 2. Catat ke Audit Log
            await supabase.from('audit_log').insert([{
                user_id: user.id, // <-- HARUS user_id
                aksi: 'AJUKAN_PERPANJANGAN',
                tabel_terdampak: 'perizinan',
                keterangan: `Walikelas ${user.name} mengajukan perpanjangan izin untuk santri ${selectedIzinData?.nama}.`
            }]);

            setIsSuccess(true);
            setSelectedIzinId('');
            setAlasanPerpanjangan('');
            setBatasTanggalBaru('');
            setBatasJamBaru('');

            // Refresh daftar
            fetchIzinAktifPerwalian();

        } catch (error) {
            console.error("Gagal mengajukan perpanjangan:", error);
            setErrorMsg("Gagal menyimpan perpanjangan ke server: " + (error.message || ''));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-4xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarPlus className="text-emerald-600" />
                    Perpanjangan Izin <span className="text-emerald-600">(Kelas {namaKelas})</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Ajukan penambahan batas waktu untuk santri yang masih berada di luar pondok pesantren.</p>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-emerald-800 mb-2">Perpanjangan Berhasil Diajukan!</h3>
                    <p className="text-emerald-600 text-sm mb-6">Ajuan perpanjangan sedang diteruskan ke <b>Sekretaris Mudir</b> untuk dievaluasi. Status waktu santri baru akan diperbarui setelah mendapat persetujuan.</p>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                        Ajukan Perpanjangan Lainnya
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50/50 border-b border-blue-100 p-4 flex items-start gap-3">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <strong>Standar Operasional (SOP):</strong> Hanya santri dengan status <span className="font-bold">DI LUAR</span> atau <span className="font-bold text-red-600">TERLAMBAT</span> yang muncul di daftar ini. Pengajuan ini akan masuk ke antrean <b>Sekretaris Mudir</b> untuk disetujui ulang.
                        </div>
                    </div>

                    <div className="p-6">
                        {/* 1. Pilih Data Santri/Izin */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <User size={16} className="text-emerald-600" /> Pilih Santri yang Diperpanjang
                            </label>
                            {isLoading ? (
                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-emerald-600" /> Memuat data izin aktif...
                                </div>
                            ) : dataIzinAktif.length === 0 ? (
                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                                    Tidak ada santri kelas {namaKelas} yang sedang berada di luar / terlambat saat ini.
                                </div>
                            ) : (
                                <select
                                    required
                                    value={selectedIzinId}
                                    onChange={(e) => setSelectedIzinId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
                                >
                                    <option value="" disabled>-- Pilih dari daftar izin aktif Kelas {namaKelas} --</option>
                                    {dataIzinAktif.map(izin => (
                                        <option key={izin.id} value={izin.id}>
                                            {izin.nama} ({izin.kode}) - {izin.status === 'TERLAMBAT' ? '⚠️ MELEWATI BATAS' : 'Sedang Izin'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedIzinData && (
                            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-100 pt-6">

                                {/* 2. KARTU INFORMASI SEBELUMNYA (Read-Only) */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-[10px] font-black px-3 py-1 rounded-bl-lg">INFO SAAT INI</div>
                                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                                        <History size={16} className="text-gray-500" /> Data Izin Berjalan
                                    </h4>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Kategori</span>
                                            <div className="font-medium text-gray-800 mt-0.5">{selectedIzinData.jenis.replace(/_/g, ' ')}</div>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Alasan Awal</span>
                                            <div className="font-medium text-gray-700 mt-0.5 bg-white p-2 border border-gray-200 rounded-lg">{selectedIzinData.alasanAwal}</div>
                                        </div>
                                        <div className="pt-2">
                                            <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Batas Waktu Awal</span>
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold ${selectedIzinData.status === 'TERLAMBAT' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                                                <Clock size={14} />
                                                {selectedIzinData.batasAwal} - {selectedIzinData.jamAwal} WIB
                                            </div>
                                            {selectedIzinData.status === 'TERLAMBAT' && <p className="text-[10px] text-red-600 mt-1 font-bold">* Santri ini sudah melewati batas waktu kembalinya.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. FORM INPUT JADWAL BARU */}
                                <div className="space-y-5">
                                    <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-4 border-b border-emerald-100 pb-2">
                                        <CalendarClock size={16} className="text-emerald-600" /> Tentukan Waktu Baru
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tanggal Kembali Baru</label>
                                            <input
                                                required type="date" value={batasTanggalBaru} onChange={(e) => setBatasTanggalBaru(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Jam Kembali Baru</label>
                                            <div className="relative">
                                                <input
                                                    required type="time" value={batasJamBaru} onChange={(e) => setBatasJamBaru(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                                <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5">
                                            <FileText size={14} className="text-gray-400" /> Alasan Perpanjangan
                                        </label>
                                        <textarea
                                            required
                                            value={alasanPerpanjangan}
                                            onChange={(e) => setAlasanPerpanjangan(e.target.value)}
                                            rows="3"
                                            placeholder="Contoh: Sakit tipes bertambah parah, surat dokter menyusul via WhatsApp..."
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Area */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle size={14} /> Pastikan data sudah dikoordinasikan dengan wali santri.
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedIzinId}
                            className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${isSubmitting || !selectedIzinId ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                        >
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memproses...</>
                            ) : (
                                <><CalendarPlus size={16} /> Ajukan Perpanjangan</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PerpanjanganIzin;