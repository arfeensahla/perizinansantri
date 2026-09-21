import React, { useState } from 'react';
import { Send, User, CalendarClock, FileText, AlertCircle, Info, Clock, CheckCircle, Users, History } from 'lucide-react';

const AjukanIzin = () => {
    const [santriTerpilih, setSantriTerpilih] = useState('');
    const [jenisIzin, setJenisIzin] = useState('');
    const [penjemput, setPenjemput] = useState('');
    const [alasan, setAlasan] = useState('');

    const [hubunganPenjemput, setHubunganPenjemput] = useState('');
    const [hubunganLainnya, setHubunganLainnya] = useState('');

    const [mulaiTanggal, setMulaiTanggal] = useState('');
    const [mulaiJam, setMulaiJam] = useState('');
    const [batasTanggal, setBatasTanggal] = useState('');
    const [batasJam, setBatasJam] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Data Dummy Tanpa Nomor Induk ---
    const dataSantri7A = [
        { id: 'S-001', nama: 'Ahmad Muzakki', trackRecord: { totalIzinBulanIni: 1, totalTerlambat: 0 } },
        { id: 'S-002', nama: 'Bintang Pratama', trackRecord: { totalIzinBulanIni: 3, totalTerlambat: 1 } },
        { id: 'S-003', nama: 'Chairil Anwar', trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 } },
        { id: 'S-004', nama: 'Dimas Anggara', trackRecord: { totalIzinBulanIni: 4, totalTerlambat: 2 } },
    ];

    const selectedSantriInfo = dataSantri7A.find(s => s.id === santriTerpilih);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSantriTerpilih(''); setJenisIzin(''); setPenjemput(''); setAlasan('');
                setHubunganPenjemput(''); setHubunganLainnya('');
                setMulaiTanggal(''); setMulaiJam(''); setBatasTanggal(''); setBatasJam('');
            }, 3000);
        }, 1500);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Send className="text-emerald-600" />
                    Ajukan Izin Santri
                </h2>
                <p className="text-gray-500 text-sm mt-1">Formulir pengajuan izin khusus untuk santri perwalian Anda (Kelas 7A).</p>
            </div>

            {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-emerald-800 mb-2">Pengajuan Berhasil Dikirim!</h3>
                    <p className="text-emerald-600 text-sm mb-6">Ajuan izin sedang diteruskan ke Sekretaris Mudir untuk proses persetujuan.</p>
                    <button onClick={() => setIsSuccess(false)} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">
                        Ajukan Izin Lainnya
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50/50 border-b border-blue-100 p-4 flex items-start gap-3">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <strong>Standar Operasional (SOP):</strong> Pengajuan ini akan masuk ke antrean <b>Sekretaris Mudir</b>. Santri tidak diperkenankan menuju Pos Kesantrian sebelum status izin disetujui.
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 1. Pilih Santri & Penjemput */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <User size={16} className="text-emerald-600" /> Nama Santri
                                </label>
                                <select
                                    required value={santriTerpilih} onChange={(e) => setSantriTerpilih(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
                                >
                                    <option value="" disabled>-- Pilih Nama Santri --</option>
                                    {dataSantri7A.map(santri => (
                                        <option key={santri.id} value={santri.id}>{santri.nama}</option>
                                    ))}
                                </select>

                                {/* NOTIFIKASI TRACK RECORD */}
                                {selectedSantriInfo && (selectedSantriInfo.trackRecord.totalIzinBulanIni > 2 || selectedSantriInfo.trackRecord.totalTerlambat > 0) && (
                                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-xl animate-fade-in">
                                        <History size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-red-700 leading-relaxed font-medium">
                                            <b>Perhatian Riwayat:</b> Santri ini sudah izin {selectedSantriInfo.trackRecord.totalIzinBulanIni}x bulan ini
                                            {selectedSantriInfo.trackRecord.totalTerlambat > 0 ? ` & punya riwayat ${selectedSantriInfo.trackRecord.totalTerlambat}x terlambat kembali.` : '.'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Users size={16} className="text-emerald-600" /> Nama Penjemput
                                </label>
                                <input required type="text" value={penjemput} onChange={(e) => setPenjemput(e.target.value)} placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hubungan Penjemput</label>
                                <select required value={hubunganPenjemput} onChange={(e) => { setHubunganPenjemput(e.target.value); if (e.target.value !== 'Lainnya') setHubunganLainnya(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all">
                                    <option value="" disabled>-- Pilih Hubungan --</option>
                                    <option value="Ayah">Ayah</option>
                                    <option value="Ibu">Ibu</option>
                                    <option value="Kakak Kandung">Kakak Kandung</option>
                                    <option value="Adik Kandung">Adik Kandung</option>
                                    <option value="Kakek">Kakek</option>
                                    <option value="Nenek">Nenek</option>
                                    <option value="Paman">Paman</option>
                                    <option value="Bibi">Bibi</option>
                                    <option value="Lainnya">Lainnya...</option>
                                </select>
                            </div>
                            {hubunganPenjemput === 'Lainnya' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Sebutkan Hubungan <span className="text-red-500">*</span></label>
                                    <input required type="text" value={hubunganLainnya} onChange={(e) => setHubunganLainnya(e.target.value)} placeholder="Contoh: Sopir Keluarga, Tetangga..." className="w-full px-4 py-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm transition-all" />
                                </div>
                            )}
                        </div>

                        {/* 2. Jenis Izin & Alasan */}
                        <div className="border-t border-gray-100 pt-6">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><FileText size={16} className="text-purple-600" /> Kategori Izin & Alasan</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'PULANG_MENGINAP_WALI' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200'}`}>
                                    <input type="radio" name="jenisIzin" value="PULANG_MENGINAP_WALI" onChange={(e) => { setJenisIzin(e.target.value); setBatasTanggal(''); }} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Izin Pulang (Menginap)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Wajib lapor Pos Kesantrian & Gerbang Depan.</div>
                                    </div>
                                    {jenisIzin === 'PULANG_MENGINAP_WALI' && <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />}
                                </label>
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'PULANG_PERGI_WALI' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200'}`}>
                                    <input type="radio" name="jenisIzin" value="PULANG_PERGI_WALI" onChange={(e) => setJenisIzin(e.target.value)} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Izin Keluar (Pulang Pergi)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Wajib lapor Pos Kesantrian & Gerbang Depan.</div>
                                    </div>
                                    {jenisIzin === 'PULANG_PERGI_WALI' && <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />}
                                </label>
                            </div>
                            <textarea required value={alasan} onChange={(e) => setAlasan(e.target.value)} rows="3" placeholder="Jelaskan alasan izin secara rinci..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all resize-none"></textarea>
                        </div>

                        {/* 3. Rentang Waktu Perizinan */}
                        <div className="border-t border-gray-100 pt-6">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4"><CalendarClock size={16} className="text-amber-600" /> Jadwal Perizinan</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3">Waktu Keberangkatan</label>
                                    <div className="space-y-3">
                                        <input required type="date" value={mulaiTanggal} onChange={(e) => setMulaiTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        <div className="relative">
                                            <input required type="time" value={mulaiJam} onChange={(e) => setMulaiJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                                    <label className="block text-[11px] font-black text-amber-700 uppercase tracking-wider mb-3">Batas Waktu Kembali</label>
                                    <div className="space-y-3">
                                        {jenisIzin === 'PULANG_PERGI_WALI' ? (
                                            <div className="w-full px-4 py-2.5 bg-amber-100/50 border border-amber-200/50 rounded-lg text-sm text-amber-800 font-medium flex items-center">
                                                {mulaiTanggal ? `Di hari yang sama (${mulaiTanggal})` : 'Sama dengan tanggal keberangkatan'}
                                            </div>
                                        ) : (
                                            <input required type="date" value={batasTanggal} onChange={(e) => setBatasTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        )}
                                        <div className="relative">
                                            <input required type="time" value={batasJam} onChange={(e) => setBatasJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle size={14} /> Pastikan data yang dimasukkan sudah benar.
                        </div>
                        <button type="submit" disabled={isSubmitting || !santriTerpilih} className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${isSubmitting || !santriTerpilih ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memproses...</>
                            ) : (
                                <><Send size={16} /> Kirim Pengajuan</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AjukanIzin;