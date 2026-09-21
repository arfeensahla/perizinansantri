import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, XSquare, Clock, AlertCircle, User, CalendarClock, Check, CheckCircle2, MapPin, Car, History, ArrowRight, Home } from 'lucide-react';

const PersetujuanIzin = () => {
    // --- State Modals & Bulk ---
    const [isModalApproveBuka, setIsModalApproveBuka] = useState(false);
    const [isModalRejectBuka, setIsModalRejectBuka] = useState(false);
    const [isModalBulkBuka, setIsModalBulkBuka] = useState(false);

    const [selectedAjuan, setSelectedAjuan] = useState(null);
    const [alasanTolak, setAlasanTolak] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- State Loading ---
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Data Dummy (Format Baku Tanpa Singkatan) ---
    const [antreanAjuan, setAntreanAjuan] = useState([
        {
            id: 'IZN-021', tipe: 'IZIN BARU', jenis: 'PULANG_MENGINAP_WALI',
            nama: 'Fathan Mubin', kelas: '8A', pengaju: 'Ustadz Mahmud (Walikelas)',
            waktuAjuan: '20 September 2026, 08:15 WIB',
            alasan: 'Hajatan kakak kandung di Bandung',
            jadwal: 'Berangkat: 21 September 2026, 08:00 WIB\nKembali: 23 September 2026, 17:00 WIB',
            penjemput: 'Bapak Ridwan (Ayah)', kotaAsal: 'Cirebon', kotaTujuan: 'Bandung',
            trackRecord: { totalIzinBulanIni: 1, totalTerlambat: 0 }
        },
        {
            id: 'IZN-008-EXT', tipe: 'PERPANJANGAN', jenis: 'RUJUK_INAP_KLINIK',
            nama: 'Eka Saputra', kelas: '7A', pengaju: 'Ustadz Zulfikar (Walikelas)',
            waktuAjuan: '20 September 2026, 09:30 WIB',
            alasan: 'Surat dokter menyusul via WhatsApp. Bed rest 3 hari karena Tipes.',
            jadwalAwal: 'Batas Waktu Awal: 22 September 2026, 12:00 WIB',
            jadwal: 'Batas Waktu Baru: 25 September 2026, 12:00 WIB',
            penjemput: 'Ibu Nisa (Ibu)', kotaAsal: 'Majalengka', kotaTujuan: 'Majalengka',
            trackRecord: { totalIzinBulanIni: 2, totalTerlambat: 1 }
        },
        {
            id: 'IZN-022', tipe: 'IZIN BARU', jenis: 'PULANG_PERGI_WALI',
            nama: 'Umar Al-Faruq', kelas: '7C', pengaju: 'Ustadz Budi (Walikelas)',
            waktuAjuan: '20 September 2026, 10:00 WIB',
            alasan: 'Ke dokter gigi (kontrol kawat gigi)',
            jadwal: 'Berangkat: 20 September 2026, 13:00 WIB\nKembali: 20 September 2026, 17:00 WIB',
            penjemput: 'Bapak Hasan (Paman)', kotaAsal: 'Kuningan', kotaTujuan: 'Cirebon',
            trackRecord: { totalIzinBulanIni: 4, totalTerlambat: 0 }
        }
    ]);

    // --- Logika Checkbox (Bulk) ---
    const toggleCheck = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleCheckAll = () => {
        if (selectedIds.length === antreanAjuan.length) setSelectedIds([]);
        else setSelectedIds(antreanAjuan.map(a => a.id));
    };

    // --- Action Handlers ---
    const bukaModalApprove = (ajuan) => {
        setSelectedAjuan(ajuan); setIsModalApproveBuka(true);
    };

    const bukaModalReject = (ajuan) => {
        setSelectedAjuan(ajuan); setAlasanTolak(''); setIsModalRejectBuka(true);
    };

    const handleProsesSingle = (aksi) => {
        setIsProcessing(true);
        setTimeout(() => {
            setAntreanAjuan(prev => prev.filter(item => item.id !== selectedAjuan.id));
            setSelectedIds(prev => prev.filter(id => id !== selectedAjuan.id));
            setIsProcessing(false); setIsModalApproveBuka(false); setIsModalRejectBuka(false);
        }, 1200);
    };

    const handleProsesBulk = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setAntreanAjuan(prev => prev.filter(item => !selectedIds.includes(item.id)));
            setSelectedIds([]);
            setIsProcessing(false); setIsModalBulkBuka(false);
        }, 1500);
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-28 max-w-7xl mx-auto">
                {/* --- HEADER --- */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600" />
                            Persetujuan Izin (Approval)
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Evaluasi pengajuan izin santri yang diteruskan oleh Walikelas dan Klinik.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                        <Clock className="text-amber-500" size={18} />
                        <span className="text-sm font-bold text-amber-700">{antreanAjuan.length} Menunggu</span>
                    </div>
                </div>

                {/* --- HEADER TOOLS (Pilih Semua) --- */}
                {antreanAjuan.length > 0 && (
                    <div className="mb-4 flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border-2 ${selectedIds.length === antreanAjuan.length ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                                {selectedIds.length === antreanAjuan.length && <Check size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={selectedIds.length === antreanAjuan.length} onChange={toggleCheckAll} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">Pilih Semua ({antreanAjuan.length})</span>
                        </label>
                        {selectedIds.length > 0 && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{selectedIds.length} Terpilih</span>
                        )}
                    </div>
                )}

                {/* --- ANTREAN KARTU (CARD MODEL) --- */}
                {antreanAjuan.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <ShieldCheck size={64} className="text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-1">Antrean Bersih</h3>
                        <p className="text-sm text-gray-500">Tidak ada pengajuan izin yang menunggu persetujuan Anda saat ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {antreanAjuan.map((ajuan) => (
                            <div
                                key={ajuan.id}
                                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative cursor-pointer border-2 ${selectedIds.includes(ajuan.id) ? 'border-emerald-500' : 'border-gray-200'}`}
                                onClick={() => toggleCheck(ajuan.id)}
                            >
                                {/* Checkbox Kanan Atas */}
                                <div className="absolute top-4 right-4 z-10">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border-2 ${selectedIds.includes(ajuan.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                                        {selectedIds.includes(ajuan.id) && <Check size={16} className="text-white" />}
                                    </div>
                                </div>

                                {/* Card Header */}
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 pr-12 flex justify-between items-start">
                                    <div>
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border mb-1.5 ${ajuan.tipe === 'IZIN BARU' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {ajuan.tipe}
                                        </span>
                                        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{ajuan.jenis.replace(/_/g, ' ')}</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400 mt-1" title="Waktu diajukan">{ajuan.waktuAjuan}</div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1">
                                    {/* Info Santri Utama */}
                                    <div className="mb-4 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 text-lg leading-tight">{ajuan.nama}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-emerald-600">Kelas {ajuan.kelas}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[11px] font-medium text-gray-500">Pengaju: {ajuan.pengaju}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualisasi Penjemput & Rute */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <Car size={14} /> Penjemput
                                            </div>
                                            <div className="text-xs font-semibold text-gray-800">{ajuan.penjemput}</div>
                                        </div>

                                        <div className="h-px bg-gray-200/60 w-full"></div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Kota Asal</span>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                                    <Home size={12} className="text-gray-400" /> {ajuan.kotaAsal}
                                                </div>
                                            </div>
                                            <div className="text-gray-300 px-2 flex-shrink-0">
                                                <ArrowRight size={14} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tujuan</span>
                                                <div className={`flex items-center gap-1 text-xs font-bold ${ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-600' : 'text-emerald-700'}`}>
                                                    <MapPin size={12} className={ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-500' : 'text-emerald-500'} /> {ajuan.kotaTujuan}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Peringatan Track Record */}
                                    {(ajuan.trackRecord.totalIzinBulanIni > 2 || ajuan.trackRecord.totalTerlambat > 0) && (
                                        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                                            <History size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                            <div className="text-[10px] text-red-700 leading-tight font-medium">
                                                <b>Perhatian:</b> Bulan ini sudah izin {ajuan.trackRecord.totalIzinBulanIni}x
                                                {ajuan.trackRecord.totalTerlambat > 0 ? ` & punya riwayat ${ajuan.trackRecord.totalTerlambat}x terlambat.` : '.'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Alasan */}
                                    <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl mb-4 relative">
                                        <span className="absolute -top-2 left-3 bg-blue-50/80 px-1 text-[10px] font-black text-blue-400 uppercase backdrop-blur-sm">Alasan Izin</span>
                                        <p className="text-sm text-gray-800 italic mt-1 leading-relaxed">"{ajuan.alasan}"</p>
                                    </div>

                                    {/* Jadwal */}
                                    <div>
                                        {ajuan.tipe === 'PERPANJANGAN' && ajuan.jadwalAwal && (
                                            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 p-2.5 rounded-t-xl border-b-0 border-dashed">
                                                <History size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-[11px] font-mono text-gray-500 leading-relaxed whitespace-pre-line">
                                                    <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Jadwal Awal</span>
                                                    {ajuan.jadwalAwal}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-3 ${ajuan.tipe === 'PERPANJANGAN' ? 'rounded-b-xl' : 'rounded-xl'}`}>
                                            <CalendarClock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-[11px] font-mono font-bold text-amber-800 leading-relaxed whitespace-pre-line w-full">
                                                {ajuan.tipe === 'PERPANJANGAN' && <span className="font-bold uppercase tracking-wider text-[9px] text-amber-600 block mb-0.5">Ajuan Perpanjangan</span>}
                                                {ajuan.jadwal}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => bukaModalReject(ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-sm transition-all">
                                        <XSquare size={16} /> Tolak
                                    </button>
                                    <button onClick={() => bukaModalApprove(ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm transition-all shadow-sm">
                                        <CheckSquare size={16} /> Setujui
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FLOATING ACTION BAR --- */}
            {selectedIds.length > 0 && (
                <div className="fixed top-6 left-0 right-0 z-40 px-4 animate-fade-in-down flex justify-center pointer-events-none">
                    <div className="bg-gray-900 rounded-2xl shadow-2xl p-3 pr-4 flex items-center gap-4 max-w-sm w-full border border-gray-700 pointer-events-auto">
                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 text-emerald-400 font-black">
                            {selectedIds.length}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white">Ajuan Terpilih</div>
                            <div className="text-[10px] text-gray-400">Siap disetujui massal</div>
                        </div>
                        <button
                            onClick={() => setIsModalBulkBuka(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <CheckCircle2 size={16} /> Setujui Semua
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Approve Single */}
            {isModalApproveBuka && selectedAjuan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-emerald-50">
                            <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><CheckSquare size={18} /></div>
                            <h3 className="font-bold text-emerald-900 text-lg">Konfirmasi Persetujuan</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Anda yakin ingin menyetujui pengajuan izin ini? Data santri akan langsung diteruskan ke sistem keamanan (Security).</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Santri:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.nama} (Kelas {selectedAjuan.kelas})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tipe:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.tipe}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    {selectedAjuan.tipe === 'PERPANJANGAN' && selectedAjuan.jadwalAwal && (
                                        <div className="mb-2">
                                            <span className="text-gray-500 text-xs block mb-0.5">Jadwal Awal:</span>
                                            <span className="font-mono text-xs text-gray-500 block">{selectedAjuan.jadwalAwal}</span>
                                        </div>
                                    )}
                                    <span className="text-gray-500 text-xs block mb-0.5">{selectedAjuan.tipe === 'PERPANJANGAN' ? 'Disetujui menjadi:' : 'Jadwal:'}</span>
                                    <span className="font-mono text-xs font-bold text-emerald-700 block whitespace-pre-line">{selectedAjuan.jadwal}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalApproveBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => handleProsesSingle('APPROVE')} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2">
                                {isProcessing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Setujui'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Reject Single */}
            {isModalRejectBuka && selectedAjuan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-red-50">
                            <div className="w-8 h-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center"><XSquare size={18} /></div>
                            <h3 className="font-bold text-red-900 text-lg">Tolak Pengajuan</h3>
                        </div>
                        <div className="p-6">
                            <textarea required value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)} rows="3" placeholder="Alasan penolakan..." className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm resize-none"></textarea>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalRejectBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl">Batal</button>
                            <button onClick={() => handleProsesSingle('REJECT')} disabled={isProcessing || !alasanTolak} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl ${!alasanTolak ? 'bg-gray-400' : 'bg-red-600'}`}>
                                {isProcessing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Bulk Approve */}
            {isModalBulkBuka && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-emerald-600 text-white">
                            <CheckCircle2 size={24} />
                            <h3 className="font-bold text-lg">Persetujuan Massal</h3>
                        </div>
                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                                <span className="text-3xl font-black">{selectedIds.length}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Anda akan menyetujui <b>{selectedIds.length} pengajuan izin</b> sekaligus.</p>
                            <p className="text-xs text-gray-400">Pastikan Anda telah membaca alasan setiap ajuan sebelum menyetujuinya secara massal.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalBulkBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Periksa Kembali</button>
                            <button onClick={handleProsesBulk} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-emerald-400 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
                                {isProcessing ? <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span> : 'Ya, Setujui Semua'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PersetujuanIzin;