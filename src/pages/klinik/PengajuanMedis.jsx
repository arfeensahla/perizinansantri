import React, { useState } from 'react';
import { Send, User, CalendarClock, FileText, AlertCircle, Info, Clock, CheckCircle, Stethoscope, Search, ChevronDown, History } from 'lucide-react';

const PengajuanMedis = () => {
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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Data Dummy Tanpa Nomor Induk ---
    const daftarSantri = [
        { id: 'S-001', nama: 'Ahmad Muzakki', kelas: '7A', trackRecord: { totalIzinBulanIni: 1, totalTerlambat: 0 } },
        { id: 'S-002', nama: 'Dimas Anggara', kelas: '7A', trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 } },
        { id: 'S-003', nama: 'Tariq bin Ziyad', kelas: '8B', trackRecord: { totalIzinBulanIni: 3, totalTerlambat: 1 } },
        { id: 'S-004', nama: 'Faisal Rahman', kelas: '8B', trackRecord: { totalIzinBulanIni: 4, totalTerlambat: 2 } },
        { id: 'S-005', nama: 'Zaid bin Tsabit', kelas: '9A', trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 } },
    ];

    const santriTampil = daftarSantri.filter(s =>
        s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchSantri.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSantriTerpilih(''); setSantriTerpilihObj(null); setSearchSantri('');
                setJenisIzin(''); setDiagnosis('');
                setNamaPendamping(''); setHpPendamping('');
                setMulaiTanggal(''); setMulaiJam(''); setBatasTanggal(''); setBatasJam('');
            }, 3000);
        }, 1500);
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

            {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><CheckCircle size={32} /></div>
                    <h3 className="text-xl font-black text-emerald-800 mb-2">Rujukan Berhasil Diajukan!</h3>
                    <p className="text-emerald-600 text-sm mb-6 max-w-md">Pengajuan telah dikirim langsung ke antrean <b>Sekretaris Mudir</b> untuk diproses. Walikelas juga telah mendapatkan notifikasi.</p>
                    <button onClick={() => setIsSuccess(false)} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">Buat Rujukan Lainnya</button>
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
                                    {santriTerpilihObj ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{santriTerpilihObj.nama}</span>
                                            <span className="text-[10px] text-gray-500 uppercase mt-0.5">Kelas {santriTerpilihObj.kelas}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-- Cari Nama atau Kelas --</span>
                                    )}
                                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownSantriBuka ? 'rotate-180' : ''}`} />
                                </div>

                                {isDropdownSantriBuka && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <div className="relative">
                                                <input type="text" placeholder="Ketik untuk mencari..." value={searchSantri} onChange={(e) => setSearchSantri(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" autoFocus />
                                                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {santriTampil.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">Santri tidak ditemukan.</div>
                                            ) : (
                                                santriTampil.map(santri => (
                                                    <div key={santri.id} onClick={() => { setSantriTerpilih(santri.id); setSantriTerpilihObj(santri); setIsDropdownSantriBuka(false); setSearchSantri(''); }} className="p-3 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                                        <div className="font-bold text-gray-800">{santri.nama}</div>
                                                        <div className="text-xs text-gray-500 mt-1">Kelas {santri.kelas}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NOTIFIKASI TRACK RECORD */}
                            {santriTerpilihObj && (santriTerpilihObj.trackRecord.totalIzinBulanIni > 2 || santriTerpilihObj.trackRecord.totalTerlambat > 0) && (
                                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl animate-fade-in">
                                    <History size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-red-700 leading-relaxed font-medium">
                                        <b>Perhatian Riwayat:</b> Pasien ini sudah izin keluar {santriTerpilihObj.trackRecord.totalIzinBulanIni}x bulan ini
                                        {santriTerpilihObj.trackRecord.totalTerlambat > 0 ? ` & punya riwayat ${santriTerpilihObj.trackRecord.totalTerlambat}x terlambat kembali.` : '.'}
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
                                        <div className="text-[11px] text-gray-500 mt-1">Santri menginap di RS / Rumah.</div>
                                    </div>
                                    {jenisIzin === 'RUJUK_INAP_KLINIK' && <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />}
                                </label>
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'RAWAT_JALAN_KLINIK' ? 'border-rose-500 bg-rose-50' : 'border-gray-100 bg-white hover:border-rose-200'}`}>
                                    <input type="radio" name="jenisIzin" value="RAWAT_JALAN_KLINIK" onChange={(e) => setJenisIzin(e.target.value)} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Rujuk Rawat Jalan (PP)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Wajib didampingi petugas klinik.</div>
                                    </div>
                                    {jenisIzin === 'RAWAT_JALAN_KLINIK' && <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />}
                                </label>
                            </div>

                            {jenisIzin === 'RAWAT_JALAN_KLINIK' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in">
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Petugas Pendamping</label><input required type="text" value={namaPendamping} onChange={(e) => setNamaPendamping(e.target.value)} placeholder="Contoh: Ustadz Budi (Perawat)" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm transition-all" /></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1.5">No. WhatsApp Pendamping</label><input required type="text" value={hpPendamping} onChange={(e) => setHpPendamping(e.target.value)} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm font-mono transition-all" /></div>
                                </div>
                            )}

                            <textarea required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows="3" placeholder="Jelaskan diagnosis medis & Fasilitas Tujuan (Cth: RSUD Majalengka)..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white text-sm transition-all resize-none"></textarea>
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
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500"><AlertCircle size={14} /> Pastikan kondisi pasien telah diperiksa oleh perawat jaga.</div>
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