import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom'; // 1. Wajib ada untuk melepaskan modal dari kurungan layout
import { Users, Search, CheckCircle, Clock, AlertTriangle, History, MapPin, Phone, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, XCircle, FileText } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const KelasSaya = () => {
    const { user } = useContext(AuthContext);

    // --- State Management ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterStatus, setFilterStatus] = useState('SEMUA');

    const [namaKelas, setNamaKelas] = useState('-');
    const [dataSantri, setDataSantri] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // --- State Modal Riwayat Izin ---
    const [isModalRiwayatBuka, setIsModalRiwayatBuka] = useState(false);
    const [santriPilihan, setSantriPilihan] = useState(null);
    const [riwayatSantri, setRiwayatSantri] = useState([]);
    const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);

    // ==========================================
    // STATE SORTING & PAGINATION
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });

    // --- Mengambil Data Kelas & Santri ---
    useEffect(() => {
        if (user && user.id) fetchKelasInfo();
    }, [user]);

    const fetchKelasInfo = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('kelas').select('id, nama_kelas').eq('wali_kelas_id', user.id).single();
            if (error) throw error;

            if (data) {
                setNamaKelas(data.nama_kelas);
                fetchDataSantri(data.id);
            } else {
                setIsLoading(false);
                setErrorMsg("Belum ada kelas yang ditugaskan kepada Anda.");
            }
        } catch (error) {
            console.error("Gagal mendapat info kelas:", error);
            setErrorMsg("Gagal memuat informasi kelas.");
            setIsLoading(false);
        }
    };

    const fetchDataSantri = async (idKelas) => {
        try {
            const { data, error } = await supabase
                .from('santri')
                .select(`
                    id,
                    nama_lengkap,
                    kota_asal,
                    nomor_wa_wali,
                    status_asrama,
                    kelas ( nama_kelas )
                `)
                .eq('kelas_id', idKelas);

            if (error) throw error;

            const formattedData = data.map(item => ({
                id: item.id,
                nama: item.nama_lengkap,
                kelas: item.kelas?.nama_kelas || '-',
                kotaAsal: item.kota_asal || '-',
                nomorWhatsApp: item.nomor_wa_wali || '-',
                statusAktif: item.status_asrama
            }));

            setDataSantri(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data santri:", error);
            setErrorMsg("Gagal memuat data santri dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FUNGSI TARIK RIWAYAT PERIZINAN PER SANTRI ---
    const bukaModalRiwayat = async (santri) => {
        setSantriPilihan(santri);
        setIsModalRiwayatBuka(true);
        setIsLoadingRiwayat(true);

        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id,
                    kode_izin,
                    jenis_izin,
                    alasan,
                    batas_waktu,
                    waktu_kembali_aktual,
                    status,
                    created_at,
                    users!perizinan_disetujui_oleh_fkey ( nama_lengkap )
                `)
                .eq('santri_id', santri.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedRiwayat = data.map(item => ({
                id: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                tanggalAjuan: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                jenis: item.jenis_izin,
                alasan: item.alasan,
                batasTenggat: item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
                waktuKembali: item.waktu_kembali_aktual ? new Date(item.waktu_kembali_aktual).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum Kembali',
                status: item.status,
                disetujuiOleh: item.users ? item.users.nama_lengkap : 'Sistem'
            }));

            setRiwayatSantri(formattedRiwayat);
        } catch (error) {
            console.error("Gagal memuat riwayat izin santri:", error);
            setRiwayatSantri([]);
        } finally {
            setIsLoadingRiwayat(false);
        }
    };

    // --- Hitung Statistik ---
    const totalSantri = dataSantri.length;
    const totalDiPondok = dataSantri.filter(s => s.statusAktif === 'DI_PONDOK').length;
    const totalDiLuar = dataSantri.filter(s => s.statusAktif === 'DI_LUAR').length;
    const totalTerlambat = dataSantri.filter(s => s.statusAktif === 'TERLAMBAT').length;

    // --- Helper UI Badge ---
    const getStatusUI = (status) => {
        if (status === 'DI_PONDOK') {
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black tracking-wide"><CheckCircle size={12} /> DI PONDOK</span>;
        } else if (status === 'DI_LUAR') {
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide"><Clock size={12} /> IZIN DI LUAR</span>;
        } else if (status === 'TERLAMBAT') {
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse"><AlertTriangle size={12} /> TERLAMBAT</span>;
        }
        return <span className="text-gray-400 text-xs italic">-</span>;
    };

    const getStatusBadgeIzin = (status) => {
        switch (status) {
            case 'MENUNGGU_PERSETUJUAN': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">MENUNGGU</span>;
            case 'DISETUJUI': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">DISETUJUI</span>;
            case 'DI_LUAR': return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">DI LUAR</span>;
            case 'TERLAMBAT': return <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold">TERLAMBAT</span>;
            case 'SELESAI': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">SELESAI</span>;
            case 'DITOLAK': return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-300 rounded text-[10px] font-bold">DITOLAK</span>;
            default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-bold">{status}</span>;
        }
    };

    // ==========================================
    // LOGIKA SORTING CERDAS
    // ==========================================
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
    };

    const sortData = (data, config) => {
        return [...data].sort((a, b) => {
            const valA = String(a[config.key] || '');
            const valB = String(b[config.key] || '');
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    useEffect(() => { setCurrentPage(1); }, [kataKunci, filterStatus]);

    // ==========================================
    // ALUR DATA: FILTER -> SORT -> PAGINATE
    // ==========================================
    const filteredData = dataSantri.filter(santri => {
        const matchKata = santri.nama.toLowerCase().includes(kataKunci.toLowerCase()) || santri.kotaAsal.toLowerCase().includes(kataKunci.toLowerCase());
        const matchStatus = filterStatus === 'SEMUA' || santri.statusAktif === filterStatus;
        return matchKata && matchStatus;
    });

    const sortedData = sortData(filteredData, sortConfig);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const PaginationControls = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
        const [inputPage, setInputPage] = useState(currentPage);
        useEffect(() => { setInputPage(currentPage); }, [currentPage]);
        const handlePageSubmit = (e) => {
            if (e.key === 'Enter' || e.type === 'blur') {
                let newPage = parseInt(inputPage, 10);
                if (isNaN(newPage) || newPage < 1) newPage = 1;
                if (newPage > totalPages) newPage = totalPages;
                onPageChange(newPage);
                setInputPage(newPage);
            }
        };
        if (totalItems === 0) return null;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        return (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                    <div>Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> data</div>
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                        <span className="hidden sm:inline">Per halaman:</span>
                        <select value={itemsPerPage} onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold shadow-sm">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronLeft size={16} /></button>
                    <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                        <span className="hidden sm:inline">Halaman</span>
                        <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} title="Ketik lalu Enter" />
                        <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                    </div>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-emerald-600" />
                        Pantauan Santri <span className="text-emerald-600">(Kelas {namaKelas})</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Data terhubung langsung secara real-time dengan Supabase.</p>
                </div>
                <button onClick={fetchKelasInfo} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                    Segarkan Data
                </button>
            </div>

            {/* --- STATISTIK KILAT --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Santri</span>
                    <div className="text-2xl font-black text-gray-800">{isLoading ? '...' : totalSantri} <span className="text-sm font-medium text-gray-500">Santri</span></div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Di Pondok</span>
                    <div className="text-2xl font-black text-emerald-800">{isLoading ? '...' : totalDiPondok} <span className="text-sm font-medium text-emerald-600/70">Santri</span></div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Sedang Izin</span>
                    <div className="text-2xl font-black text-blue-800">{isLoading ? '...' : totalDiLuar} <span className="text-sm font-medium text-blue-600/70">Santri</span></div>
                </div>
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 relative z-10">Terlambat</span>
                    <div className="text-2xl font-black text-red-800 relative z-10">{isLoading ? '...' : totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></div>
                </div>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari Nama Santri atau Kota Asal..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 md:w-48">
                    <option value="SEMUA">Semua Status</option>
                    <option value="DI_PONDOK">Di Pondok</option>
                    <option value="DI_LUAR">Sedang Izin</option>
                    <option value="TERLAMBAT">Terlambat</option>
                </select>
            </div>

            {/* --- TABEL DATA KELAS --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                    <div className="flex items-center gap-2">Informasi Santri {getSortIcon('nama')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kotaAsal')}>
                                    <div className="flex items-center gap-2">Asal Kota & Kontak Wali {getSortIcon('kotaAsal')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('statusAktif')}>
                                    <div className="flex items-center gap-2">Status Asrama {getSortIcon('statusAktif')}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                            ) : errorMsg ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Tidak ada data santri kelas {namaKelas} yang sesuai.</td></tr>
                            ) : currentData.map((santri) => (
                                <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">{santri.nama}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 font-bold uppercase tracking-wider">Kelas {santri.kelas}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                                            <MapPin size={14} className="text-gray-400" /> {santri.kotaAsal}
                                        </div>
                                        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                            <Phone size={12} /> {santri.nomorWhatsApp}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusUI(santri.statusAktif)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => bukaModalRiwayat(santri)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all"
                                        >
                                            <History size={14} /> Riwayat Izin
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={sortedData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                </div>
            </div>

            {/* --- MODAL RIWAYAT DIRENDER MENGGUNAKAN CREATE PORTAL AGAR BEBAS DARI KONTEN TERBATAS --- */}
            {isModalRiwayatBuka && santriPilihan && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsModalRiwayatBuka(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh] border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <div>
                                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                                    <FileText className="text-emerald-600" size={20} />
                                    Riwayat Izin: {santriPilihan.nama}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Catatan seluruh rekam jejak perizinan santri.</p>
                            </div>
                            <button
                                onClick={() => setIsModalRiwayatBuka(false)}
                                className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/40 space-y-3">
                            {isLoadingRiwayat ? (
                                <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <span className="text-sm font-medium">Memuat riwayat izin santri...</span>
                                </div>
                            ) : riwayatSantri.length === 0 ? (
                                <div className="py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    Belum ada catatan riwayat perizinan untuk santri ini.
                                </div>
                            ) : (
                                riwayatSantri.map((izin) => (
                                    <div key={izin.id} className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-2.5 hover:border-emerald-300 transition-colors">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-gray-400">#{izin.id}</span>
                                                <span className="text-xs text-gray-500">• {izin.tanggalAjuan}</span>
                                            </div>
                                            <div>{getStatusBadgeIzin(izin.status)}</div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-black text-emerald-700 uppercase tracking-wide">{izin.jenis.replace(/_/g, ' ')}</div>
                                            <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100/80 italic">"{izin.alasan}"</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-gray-600 font-medium bg-gray-50/50 p-2.5 rounded-xl">
                                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Batas Tenggat</span> {izin.batasTenggat}</div>
                                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Waktu Kembali</span> {izin.waktuKembali}</div>
                                        </div>

                                        <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-50 flex justify-between items-center">
                                            <span>Persetujuan: <strong className="text-gray-600">{izin.disetujuiOleh}</strong></span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setIsModalRiwayatBuka(false)}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-colors shadow-sm"
                            >
                                Tutup Jendela
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default KelasSaya;