import React, { useState, useEffect, useContext } from 'react';
import { Stethoscope, User, CalendarClock, FileText, AlertCircle, Info, Clock, CheckCircle, Search, ChevronDown, History, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const PengajuanMedis = () => {
    const { user } = useContext(AuthContext);

    // --- State Form ---
    const [santriTerpilih, setSantriTerpilih] = useState('');
    const [santriTerpilihObj, setSantriTerpilihObj] = useState(null);

    const [searchSantri, setSearchSantri] = useState('');
    const [isDropdownSantriBuka, setIsDropdownSantriBuka] = useState(false);

    const [jenisIzin, setJenisIzin] = useState('');
    const [diagnosis, setDiagnosis] = useState('');

    const [namaPendamping, setNamaPendamping] = useState('');
    const [hpPendamping, setHpPendamping] = useState('');

    const [mulaiTanggal, setMulaiTanggal] = useState('');
    const [mulaiJam, setMulaiJam] = useState('');
    const [batasTanggal, setBatasTanggal] = useState('');
    const [batasJam, setBatasJam] = useState('');

    // --- State Database ---
    const [daftarSantri, setDaftarSantri] = useState([]);
    const [isLoadingSantri, setIsLoadingSantri] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Tarik Data Semua Santri Aktif dari Supabase ---
    useEffect(() => {
        fetchDaftarSantri();
    }, []);

    const fetchDaftarSantri = async () => {
        setIsLoadingSantri(true);
        try {
            // Klinik bisa melihat SELURUH santri di pondok
            const { data, error } = await supabase
                .from('santri')
                .select(`
                    id, 
                    nama_lengkap, 
                    status_asrama,
                    kelas ( nama_kelas )
                `)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;

            // Memformat data untuk kemudahan UI Dropdown Search
            const formattedSantri = data.map(s => ({
                id: s.id,
                nama: s.nama_lengkap,
                kelas: s.kelas?.nama_kelas || '-',
                status_asrama: s.status_asrama,
                trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 } // *Bisa dikembangkan nanti dengan query COUNT terpisah
            }));

            setDaftarSantri(formattedSantri);
        } catch (error) {
            console.error("Gagal mengambil data master santri:", error);
            setErrorMsg("Gagal memuat daftar master santri dari database.");
        } finally {
            setIsLoadingSantri(false);
        }
    };

    const santriTampil = daftarSantri.filter(s =>
        s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchSantri.toLowerCase())
    );

    // --- Proses Simpan Ajuan Rujukan Medis ke Supabase ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!santriTerpilih || !jenisIzin || !diagnosis || !mulaiTanggal || !mulaiJam) {
            return alert("Mohon lengkapi semua formulir pengajuan medis dengan benar.");
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            // Tentukan Detail Diagnosis & Pendamping (Jika ada)
            const alasanLengkap = jenisIzin === 'RAWAT_JALAN_KLINIK'
                ? `${diagnosis} [Pendamping PP: ${namaPendamping} - ${hpPendamping}]`
                : `${diagnosis} [Dirujuk Rawat Inap]`;

            // Susun format waktu ISO
            const waktuBerangkatIso = new Date(`${mulaiTanggal}T${mulaiJam}:00`).toISOString();

            let batasWaktuIso = null;
            if (jenisIzin === 'RAWAT_JALAN_KLINIK') {
                const jamBatas = batasJam ? batasJam : '23:59';
                batasWaktuIso = new Date(`${mulaiTanggal}T${jamBatas}:00`).toISOString();
            } else {
                const tglBatas = batasTanggal ? batasTanggal : mulaiTanggal;
                const jamBatas = batasJam ? batasJam : '17:00';
                batasWaktuIso = new Date(`${tglBatas}T${jamBatas}:00`).toISOString();
            }

            // Generate Kode Izin Khusus Medis (MED)
            const kodeUnik = `MED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // 1. Masukkan ke tabel perizinan
            const { data: izinData, error: izinErr } = await supabase
                .from('perizinan')
                .insert([{
                    kode_izin: kodeUnik,
                    santri_id: santriTerpilih,
                    jenis_izin: jenisIzin,
                    alasan: alasanLengkap,
                    waktu_berangkat: waktuBerangkatIso,
                    batas_waktu: batasWaktuIso,
                    status: 'MENUNGGU_PERSETUJUAN',
                    pengaju_id: user.id
                }])
                .select()
                .single();

            if (izinErr) throw izinErr;

            // 2. Catat ke Audit Log Sistem
            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: 'AJUKAN_IZIN_MEDIS',
                tabel_terdampak: 'perizinan',
                data_id: izinData.id,
                keterangan: `Petugas Klinik ${user.name} mengajukan rujukan medis darurat (${jenisIzin.replace(/_/g, ' ')}) untuk santri ${santriTerpilihObj?.nama || 'Unknown'}.`
            }]);

            setIsSuccess(true);

            // Reset Form (Hanya dijalankan saat tombol "Buat Rujukan Lainnya" ditekan)
        } catch (error) {
            console.error("Gagal mengirim ajuan rujukan medis:", error);
            setErrorMsg("Gagal mengirim ajuan medis ke server: " + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPenuh = () => {
        setIsSuccess(false);
        setSantriTerpilih('');
        setSantriTerpilihObj(null);
        setSearchSantri('');
        setJenisIzin('');
        setDiagnosis('');
        setNamaPendamping('');
        setHpPendamping('');
        setMulaiTanggal('');
        setMulaiJam('');
        setBatasTanggal('');
        setBatasJam('');
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Stethoscope className="text-rose-600" />
                    Ajukan Rujukan Medis
                </h2>
                <p className="text-gray-500 text-sm mt-1">Formulir pengajuan izin keluar untuk penanganan kesehatan darurat.</p>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} /></div>
                    <h3 className="text-xl font-black text-emerald-800 mb-2">Rujukan Berhasil Diajukan!</h3>
                    <p className="text-emerald-600 text-sm mb-6 max-w-md">Pengajuan telah dikirim langsung ke antrean <b>Sekretaris Mudir</b> untuk diproses. Pihak Walikelas juga akan bisa memantau status ini di dasbor mereka.</p>
                    <button onClick={resetPenuh} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">Buat Rujukan Lainnya</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {isDropdownSantriBuka && <div className="fixed inset-0 z-10" onClick={() => setIsDropdownSantriBuka(false)}></div>}

                    <div className="bg-blue-50/50 border-b border-blue-100 p-4 flex items-start gap-3 relative z-0">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <strong>Standar Operasional (SOP):</strong> Formulir medis ini akan mem-*bypass* Walikelas dan masuk langsung ke antrean <b>Sekretaris Mudir</b>.
                        </div>
                    </div>

                    <div className="p-6 space-y-6 relative z-20">
                        {/* 1. Pilih Santri */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <User size={16} className="text-rose-600" /> Nama Santri (Pasien)
                            </label>

                            <div className="relative">
                                <div onClick={() => setIsDropdownSantriBuka(!isDropdownSantriBuka)} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm transition-all cursor-pointer flex justify-between items-center ${isDropdownSantriBuka ? 'border-rose-500 ring-2 ring-rose-100 bg-white' : 'border-gray-200 hover:border-rose-300'}`}>
                                    {isLoadingSantri ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Loader2 size={16} className="animate-spin text-rose-500" /> Memuat data master santri...
                                        </div>
                                    ) : santriTerpilihObj ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{santriTerpilihObj.nama}</span>
                                            <span className="text-[10px] text-gray-500 uppercase mt-0.5">Kelas {santriTerpilihObj.kelas}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-- Cari Nama atau Kelas --</span>
                                    )}
                                    {!isLoadingSantri && <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownSantriBuka ? 'rotate-180' : ''}`} />}
                                </div>

                                {isDropdownSantriBuka && !isLoadingSantri && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <div className="relative">
                                                <input type="text" placeholder="Ketik untuk mencari nama/kelas..." value={searchSantri} onChange={(e) => setSearchSantri(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" autoFocus />
                                                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {santriTampil.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">Santri tidak ditemukan.</div>
                                            ) : (
                                                santriTampil.map(santri => (
                                                    <div key={santri.id} onClick={() => { setSantriTerpilih(santri.id); setSantriTerpilihObj(santri); setIsDropdownSantriBuka(false); setSearchSantri(''); }} className="p-3 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center">
                                                        <div>
                                                            <div className="font-bold text-gray-800">{santri.nama}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Kelas {santri.kelas}</div>
                                                        </div>
                                                        {santri.status_asrama === 'DI_LUAR' && (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded-full uppercase border border-purple-200">Di Luar</span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Peringatan Status Asrama */}
                            {santriTerpilihObj && santriTerpilihObj.status_asrama === 'DI_LUAR' && (
                                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 p-3 rounded-xl animate-fade-in">
                                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-700 leading-relaxed font-medium">
                                        <b>Perhatian:</b> Santri ini terpantau <b>masih berstatus DI LUAR</b> pondok pada sistem. Pastikan bahwa santri memang sudah kembali ke klinik sebelum mengajukan rujukan baru.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Jenis Izin & Alasan */}
                        <div className="border-t border-gray-100 pt-6 relative z-0">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><FileText size={16} className="text-rose-600" /> Kategori Medis & Diagnosis</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'RUJUK_INAP_KLINIK' ? 'border-rose-500 bg-rose-50' : 'border-gray-100 bg-white hover:border-rose-200'}`}>
                                    <input type="radio" name="jenisIzin" value="RUJUK_INAP_KLINIK" onChange={(e) => { setJenisIzin(e.target.value); setBatasTanggal(''); setNamaPendamping(''); setHpPendamping(''); }} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Rujuk Inap / Pulang Sakit</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Santri dirawat di RS luar pondok.</div>
                                    </div>
                                    {jenisIzin === 'RUJUK_INAP_KLINIK' && <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />}
                                </label>
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'RAWAT_JALAN_KLINIK' ? 'border-rose-500 bg-rose-50' : 'border-gray-100 bg-white hover:border-rose-200'}`}>
                                    <input type="radio" name="jenisIzin" value="RAWAT_JALAN_KLINIK" onChange={(e) => setJenisIzin(e.target.value)} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Rujuk Rawat Jalan (PP)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Wajib didampingi petugas/pengurus.</div>
                                    </div>
                                    {jenisIzin === 'RAWAT_JALAN_KLINIK' && <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />}
                                </label>
                            </div>

                            {jenisIzin === 'RAWAT_JALAN_KLINIK' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in">
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Petugas Pendamping <span className="text-red-500">*</span></label><input required type="text" value={namaPendamping} onChange={(e) => setNamaPendamping(e.target.value)} placeholder="Contoh: Ustadz Budi (Perawat)" className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm transition-all" /></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1.5">No. Telepon / WA Pendamping <span className="text-red-500">*</span></label><input required type="text" value={hpPendamping} onChange={(e) => setHpPendamping(e.target.value)} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm font-mono transition-all" /></div>
                                </div>
                            )}

                            <textarea required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows="3" placeholder="Jelaskan diagnosis medis & Fasilitas Tujuan (Contoh: Rujuk ke RSUD Majalengka karena indikasi DBD)..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white text-sm transition-all resize-none"></textarea>
                        </div>

                        {/* 3. Rentang Waktu Perizinan */}
                        <div className="border-t border-gray-100 pt-6 relative z-0">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4"><CalendarClock size={16} className="text-amber-600" /> Jadwal Perizinan Medis</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3">Waktu Keberangkatan</label>
                                    <div className="space-y-3">
                                        <input required type="date" value={mulaiTanggal} onChange={(e) => setMulaiTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        <div className="relative"><input required type="time" value={mulaiJam} onChange={(e) => setMulaiJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /><Clock size={16} className="absolute left-3 top-3 text-gray-400" /></div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                                    <label className="block text-[11px] font-black text-amber-700 uppercase tracking-wider mb-3">Batas Waktu Kembali</label>
                                    <div className="space-y-3">
                                        {jenisIzin === 'RAWAT_JALAN_KLINIK' ? (
                                            <div className="w-full px-4 py-2.5 bg-amber-100/50 border border-amber-200/50 rounded-lg text-sm text-amber-800 font-medium flex items-center">{mulaiTanggal ? `Di hari yang sama (${mulaiTanggal})` : 'Sama dengan tanggal keberangkatan'}</div>
                                        ) : (
                                            <input required type="date" value={batasTanggal} onChange={(e) => setBatasTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        )}
                                        <div className="relative"><input required type="time" value={batasJam} onChange={(e) => setBatasJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /><Clock size={16} className="absolute left-3 top-3 text-gray-400" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between relative z-0">
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500"><AlertCircle size={14} /> Pastikan kondisi pasien telah diperiksa oleh perawat jaga/dokter spesialis.</div>
                        <button type="submit" disabled={isSubmitting || !santriTerpilih} className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${isSubmitting || !santriTerpilih ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}>
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memproses...</>
                            ) : (
                                <><Stethoscope size={16} /> Ajukan Rujukan Medis</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PengajuanMedis;