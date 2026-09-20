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

    // --- Data Dummy (Diperkaya dengan Kota Asal dan Kota Tujuan) ---
    const [antreanAjuan, setAntreanAjuan] = useState([
        {
            id: 'IZN-021', tipe: 'IZIN BARU', jenis: 'PULANG_WALI',
            nama: 'Fathan Mubin', kelas: '8A', pengaju: 'Ust. Mahmud', waktuAjuan: '20 Sep 2026, 08:15',
            alasan: 'Hajatan kakak kandung', jadwal: 'Brgkt: 21 Sep - Kmbli: 23 Sep',
            penjemput: 'Bpk. Ridwan (Ayah)', kotaAsal: 'Cirebon', kotaTujuan: 'Bandung', // Asal & Tujuan Beda
            trackRecord: { totalIzinBulanIni: 1, totalTerlambat: 0 }
        },
        {
            id: 'IZN-008-EXT', tipe: 'PERPANJANGAN', jenis: 'RUJUK_INAP_KLINIK',
            nama: 'Eka Saputra', kelas: '7A', pengaju: 'Ust. Zulfikar', waktuAjuan: '20 Sep 2026, 09:30',
            alasan: 'Surat dokter menyusul via WA. Bed rest 3 hari karena Typus.', jadwal: 'Batas Baru: 25 Sep 2026',
            penjemput: 'Ibu Nisa (Ibu)', kotaAsal: 'Majalengka', kotaTujuan: 'Majalengka', // Asal & Tujuan Sama
            trackRecord: { totalIzinBulanIni: 2, totalTerlambat: 1 }
        },
        {
            id: 'IZN-022', tipe: 'IZIN BARU', jenis: 'PP_WALI',
            nama: 'Umar Al-Faruq', kelas: '7C', pengaju: 'Ust. Budi', waktuAjuan: '20 Sep 2026, 10:00',
            alasan: 'Ke dokter gigi (kontrol kawat gigi)', jadwal: 'Brgkt: 20 Sep - Kmbli: Hari Ini',
            penjemput: 'Bpk. Hasan (Paman)', kotaAsal: 'Kuningan', kotaTujuan: 'Cirebon', // Asal & Tujuan Beda
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
                        <p className="text-gray-500 text-sm mt-1">Evaluasi pengajuan izin santri yang diteruskan oleh Walikelas.</p>
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
                                    <div className="text-[10px] font-mono text-gray-400 mt-1">{ajuan.waktuAjuan}</div>
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
                                                <span className="text-xs font-bold text-emerald-600">Kls {ajuan.kelas}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-500">{ajuan.pengaju}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BARU: Visualisasi Penjemput & Rute (Asal -> Tujuan) */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-3">
                                        {/* Penjemput */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <Car size={14} /> Penjemput
                                            </div>
                                            <div className="text-xs font-semibold text-gray-800">{ajuan.penjemput}</div>
                                        </div>

                                        {/* Garis Pemisah */}
                                        <div className="h-px bg-gray-200/60 w-full"></div>

                                        {/* Rute Asal -> Tujuan */}
                                        <div className="flex items-center justify-between">
                                            {/* Kota Asal */}
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Kota Asal (Pondok)</span>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                                    <Home size={12} className="text-gray-400" /> {ajuan.kotaAsal}
                                                </div>
                                            </div>

                                            {/* Panah (Arrow) */}
                                            <div className="text-gray-300 px-2 flex-shrink-0">
                                                <ArrowRight size={14} />
                                            </div>

                                            {/* Kota Tujuan */}
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Kota Tujuan (Izin)</span>
                                                <div className={`flex items-center gap-1 text-xs font-bold ${ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-600' : 'text-emerald-700'}`}>
                                                    <MapPin size={12} className={ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-500' : 'text-emerald-500'} /> {ajuan.kotaTujuan}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Peringatan Track Record jika ada */}
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
                                    <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                                        <CalendarClock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-mono font-bold text-amber-800 leading-relaxed">{ajuan.jadwal}</p>
                                    </div>
                                </div>

                                {/* Card Footer (Aksi Single) */}
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

            {/* Modals tetap sama... */}
        </>
    );
};

export default PersetujuanIzin;