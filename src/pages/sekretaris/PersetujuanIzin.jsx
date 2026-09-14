import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X, ClipboardCheck, CheckSquare, Square } from 'lucide-react';

const PersetujuanIzin = () => {
    // Dummy Data Antrean Izin
    const [antreanIzin, setAntreanIzin] = useState([
        { id: '1', kode: 'IZN-9905', santri: 'Ahmad Muzakki', kelas: '7A', jenis: 'PULANG_WALI', tujuan: 'Pernikahan Kakak', waktuKeluar: '15 Sep 2026 08:00', deadline: '18 Sep 2026', pengaju: 'Ust. Ahmad' },
        { id: '2', kode: 'IZN-9906', santri: 'Rifky Hidayat', kelas: '8B', jenis: 'RUJUK_PP_KLINIK', tujuan: 'RSUD Cirebon', waktuKeluar: '15 Sep 2026 09:00', deadline: '15 Sep 2026 15:00', pengaju: 'Klinik Pusat' },
        { id: '3', kode: 'IZN-9907', santri: 'Faisal Rahman', kelas: '7B', jenis: 'PP_WALI', tujuan: 'Ambil Kacamata', waktuKeluar: '16 Sep 2026 10:00', deadline: '16 Sep 2026 14:00', pengaju: 'Ust. Budi' },
    ]);

    // State untuk Bulk Approval
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);

    // State untuk Modal Penolakan Individual
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedIzinToReject, setSelectedIzinToReject] = useState(null);
    const [alasanTolak, setAlasanTolak] = useState('');

    // --- LOGIKA BULK SELECTION ---
    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === antreanIzin.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(antreanIzin.map(izin => izin.id));
        }
    };

    const handleConfirmBulkApprove = () => {
        alert(`${selectedIds.length} Izin berhasil DISETUJUI secara massal! QR Code diterbitkan.`);
        // Simulasi menghapus dari antrean
        setAntreanIzin(prev => prev.filter(izin => !selectedIds.includes(izin.id)));
        setSelectedIds([]);
        setIsBulkApproveModalOpen(false);
    };

    // --- LOGIKA PENOLAKAN ---
    const handleBukaModalTolak = (izin) => {
        setSelectedIzinToReject(izin);
        setAlasanTolak('');
        setIsRejectModalOpen(true);
    };

    const handleTolakIzin = (e) => {
        e.preventDefault();
        alert(`Izin ${selectedIzinToReject.kode} DITOLAK dengan alasan: ${alasanTolak}`);
        setAntreanIzin(prev => prev.filter(izin => izin.id !== selectedIzinToReject.id));
        setIsRejectModalOpen(false);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 relative pb-24">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardCheck className="text-emerald-600" />
                        Antrean Persetujuan
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Screening pengajuan izin dalam bentuk kartu interaktif.</p>
                </div>

                {/* Tombol Pilih Semua */}
                {antreanIzin.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-emerald-700 transition-colors bg-white px-4 py-2 border rounded-lg shadow-sm"
                    >
                        {selectedIds.length === antreanIzin.length ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                        {selectedIds.length === antreanIzin.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                )}
            </div>

            {/* Layout Grid (Card) */}
            {antreanIzin.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 shadow-sm">
                    Tidak ada antrean persetujuan saat ini.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {antreanIzin.map((izin) => {
                        const isSelected = selectedIds.includes(izin.id);
                        return (
                            <div
                                key={izin.id}
                                className={`relative bg-white border-2 rounded-xl shadow-sm transition-all overflow-hidden flex flex-col ${isSelected ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100' : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                {/* Area klik untuk memilih card */}
                                <div
                                    className="p-5 flex-1 cursor-pointer"
                                    onClick={() => toggleSelect(izin.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="inline-block px-2 py-1 mb-2 bg-purple-100 text-purple-800 rounded text-[10px] font-black uppercase tracking-wider">
                                                {izin.jenis.replace(/_/g, ' ')}
                                            </span>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{izin.santri}</h3>
                                            <p className="text-xs text-gray-500">{izin.kelas} | <span className="font-mono">{izin.kode}</span></p>
                                        </div>
                                        <div className="text-gray-300">
                                            {isSelected ? <CheckSquare size={24} className="text-emerald-500" /> : <Square size={24} />}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tujuan:</span>
                                            <span className="font-bold text-gray-700 text-right truncate max-w-[120px]" title={izin.tujuan}>{izin.tujuan}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Keluar:</span>
                                            <span className="font-bold text-gray-700">{izin.waktuKeluar}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Batas:</span>
                                            <span className="font-bold text-red-600">{izin.deadline}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-400">
                                        Diajukan oleh: <span className="font-bold text-gray-600">{izin.pengaju}</span>
                                    </div>
                                </div>

                                {/* Tombol Aksi Individual (Hanya tolak yang tersisa di card, setuju pindah ke bulk action bar jika ada yang dipilih) */}
                                {!isSelected && selectedIds.length === 0 && (
                                    <div className="flex border-t border-gray-100 bg-gray-50">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSelect(izin.id); setIsBulkApproveModalOpen(true); }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors"
                                        >
                                            <CheckCircle size={16} /> Setujui
                                        </button>
                                        <div className="w-px bg-gray-200"></div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleBukaModalTolak(izin); }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                                        >
                                            <XCircle size={16} /> Tolak
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FLOATING ACTION BAR UNTUK BULK APPROVAL */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm md:max-w-md px-4 z-40 animate-fade-in-down">
                    <div className="bg-emerald-800 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between">
                        <div className="font-bold">
                            <span className="bg-white text-emerald-800 px-2 py-1 rounded-md mr-2">{selectedIds.length}</span>
                            Izin Terpilih
                        </div>
                        <button
                            onClick={() => setIsBulkApproveModalOpen(true)}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                        >
                            <CheckCircle size={18} /> Setujui
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI BULK APPROVE (Wajib Sesuai PRD V3 Bab 18) */}
            {isBulkApproveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-down p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-emerald-50">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                <CheckCircle size={18} /> Konfirmasi Persetujuan
                            </h3>
                            <button onClick={() => { setIsBulkApproveModalOpen(false); setSelectedIds([]); }} className="text-emerald-500 hover:text-emerald-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-6">
                                Anda akan menyetujui <span className="font-black text-emerald-600 text-lg">{selectedIds.length}</span> pengajuan izin sekaligus. Aksi ini akan menerbitkan QR Code untuk masing-masing santri. Lanjutkan?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setIsBulkApproveModalOpen(false); setSelectedIds([]); }} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleConfirmBulkApprove} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">
                                    Ya, Setujui Semua
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PENOLAKAN IZIN (TETAP ADA) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-down p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle size={18} /> Tolak Izin {selectedIzinToReject?.kode}
                            </h3>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-red-500 hover:text-red-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleTolakIzin} className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Anda akan menolak pengajuan izin untuk santri <span className="font-bold text-gray-800">{selectedIzinToReject?.santri}</span>. Sesuai prosedur, <strong>alasan penolakan wajib diisi</strong>.
                                </p>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows="3"
                                    value={alasanTolak}
                                    onChange={(e) => setAlasanTolak(e.target.value)}
                                    placeholder="Tulis alasan secara jelas..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors">
                                    Konfirmasi Tolak
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersetujuanIzin;