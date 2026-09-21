import React, { useState } from 'react';
import { CalendarPlus, User, Clock, FileText, AlertCircle, CheckCircle, Info, CalendarClock, History } from 'lucide-react';

const PerpanjanganIzin = () => {
    // --- State Form ---
    const [selectedIzinId, setSelectedIzinId] = useState('');
    const [alasanPerpanjangan, setAlasanPerpanjangan] = useState('');
    const [batasTanggalBaru, setBatasTanggalBaru] = useState('');
    const [batasJamBaru, setBatasJamBaru] = useState('');

    // State Status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Data Dummy Izin Aktif (Tanpa Singkatan & Kamus Standar) ---
    const dataIzinAktif = [
        { id: 'IZN-001', nomorInduk: '260011', nama: 'Ahmad Muzakki', jenis: 'PULANG_MENGINAP_WALI', alasanAwal: 'Hajatan keluarga di kampung', batasAwal: '21 September 2026', jamAwal: '17:00', status: 'DI_LUAR' },
        { id: 'IZN-004', nomorInduk: '260032', nama: 'Dimas Anggara', jenis: 'PULANG_PERGI_WALI', alasanAwal: 'Beli kacamata baru', batasAwal: '20 September 2026', jamAwal: '15:00', status: 'TERLAMBAT' },
        { id: 'IZN-008', nomorInduk: '260040', nama: 'Eka Saputra', jenis: 'RUJUK_INAP_KLINIK', alasanAwal: 'Gejala Typus, rawat inap', batasAwal: '22 September 2026', jamAwal: '12:00', status: 'DI_LUAR' },
    ];

    const selectedIzinData = dataIzinAktif.find(izin => izin.id === selectedIzinId);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSelectedIzinId(''); setAlasanPerpanjangan(''); setBatasTanggalBaru(''); setBatasJamBaru('');
            }, 3000);
        }, 1500);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-4xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarPlus className="text-emerald-600" />
                    Perpanjangan Izin
                </h2>
                <p className="text-gray-500 text-sm mt-1">Ajukan penambahan batas waktu untuk santri yang masih berada di luar pondok pesantren.</p>
            </div>

            {isSuccess ? (
                // --- KONDISI SUKSES ---
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
                // --- FORMULIR PERPANJANGAN ---
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
                            <select
                                required
                                value={selectedIzinId}
                                onChange={(e) => setSelectedIzinId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
                            >
                                <option value="" disabled>-- Pilih dari daftar izin aktif Kelas 7A --</option>
                                {dataIzinAktif.map(izin => (
                                    <option key={izin.id} value={izin.id}>
                                        {izin.nama} (Nomor Induk: {izin.nomorInduk}) - {izin.status === 'TERLAMBAT' ? '⚠️ MELEWATI BATAS' : 'Sedang Izin'}
                                    </option>
                                ))}
                            </select>
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
                                            placeholder="Contoh: Sakit tipes bertambah parah, surat dokter menyusul via WA..."
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