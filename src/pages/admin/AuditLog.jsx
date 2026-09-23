import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ShieldCheck, UserPlus, KeyRound, CheckSquare, XSquare, Scan, Database, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const AuditLog = () => {
    // --- State Filters ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterModul, setFilterModul] = useState('SEMUA');
    const [filterRole, setFilterRole] = useState('SEMUA');

    // --- State Database ---
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // ==========================================
    // STATE SORTING & PAGINATION
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Default terbaru di atas

    // --- Mengambil Data dari Supabase ---
    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('audit_log')
                .select(`
                    id,
                    aksi,
                    tabel_terdampak,
                    keterangan,
                    created_at,
                    users ( nama_lengkap, role )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data.map(item => ({
                id: item.id.substring(0, 8).toUpperCase(),
                created_at: item.created_at, // Disimpan untuk sorting kronologis presisi
                waktu: formatWaktuLengkap(item.created_at),
                aktor: item.users ? item.users.nama_lengkap : 'Sistem / Anonim',
                role: item.users ? item.users.role : 'SISTEM',
                modul: item.tabel_terdampak ? item.tabel_terdampak.toUpperCase() : 'UMUM',
                aksi: item.aksi,
                deskripsi: item.keterangan
            }));

            setLogs(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data audit log:", error);
            setErrorMsg("Gagal memuat rekam jejak dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Helper Format Waktu ---
    const formatWaktuLengkap = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${tanggal}, ${jam}`;
    };

    // --- Helper Icon & Warna ---
    const getAksiVisual = (aksi) => {
        const aksiUpper = aksi.toUpperCase();
        if (aksiUpper.includes('LOGIN')) return { icon: <KeyRound size={14} />, color: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (aksiUpper.includes('SETUJUI') || aksiUpper.includes('APPROVE')) return { icon: <CheckSquare size={14} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (aksiUpper.includes('TOLAK') || aksiUpper.includes('BATAL')) return { icon: <XSquare size={14} />, color: 'bg-red-50 text-red-700 border-red-200' };
        if (aksiUpper.includes('TAMBAH') || aksiUpper.includes('BUAT')) return { icon: <UserPlus size={14} />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
        if (aksiUpper.includes('SCAN')) return { icon: <Scan size={14} />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (aksiUpper.includes('IMPORT')) return { icon: <Database size={14} />, color: 'bg-gray-100 text-gray-700 border-gray-300' };
        return { icon: <ShieldCheck size={14} />, color: 'bg-gray-100 text-gray-700 border-gray-200' };
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
            let valA = a[config.key] || '';
            let valB = b[config.key] || '';

            if (config.key === 'created_at') {
                valA = new Date(a.created_at).getTime();
                valB = new Date(b.created_at).getTime();
            }

            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Reset pagination ketika filter berubah
    useEffect(() => { setCurrentPage(1); }, [kataKunci, filterModul, filterRole]);

    // ==========================================
    // ALUR DATA: FILTER -> SORT -> PAGINATE
    // ==========================================
    const filteredData = logs.filter(log => {
        const matchKata = log.aktor.toLowerCase().includes(kataKunci.toLowerCase()) || log.deskripsi.toLowerCase().includes(kataKunci.toLowerCase());
        const matchModul = filterModul === 'SEMUA' || log.modul.includes(filterModul) || filterModul.includes(log.modul);
        const matchRole = filterRole === 'SEMUA' || log.role === filterRole;
        return matchKata && matchModul && matchRole;
    });

    const sortedData = sortData(filteredData, sortConfig);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ==========================================
    // KOMPONEN PAGINATION REUSABLE
    // ==========================================
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
                        <Activity className="text-emerald-600" />
                        Audit Log Sistem
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Rekam jejak aktivitas pengguna untuk transparansi dan keamanan sistem.</p>
                </div>
                <button onClick={fetchLogs} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm hidden md:block">
                    Segarkan Data
                </button>
            </div>

            {/* --- FILTER TOOLBAR --- */}
            <div className="bg-white p-5 rounded-t-2xl border border-gray-200 border-b-0 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Cari nama aktor atau deskripsi aktivitas..."
                            value={kataKunci}
                            onChange={(e) => setKataKunci(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 md:w-auto w-full">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-1">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-full md:w-40"
                            >
                                <option value="SEMUA">Semua Aktor</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                                <option value="WALIKELAS">Walikelas</option>
                                <option value="KLINIK">Klinik Pusat</option>
                                <option value="SECURITY">Security</option>
                                <option value="KESANTRIAN">Kesantrian</option>
                            </select>
                        </div>

                        <select
                            value={filterModul}
                            onChange={(e) => setFilterModul(e.target.value)}
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 md:w-56"
                        >
                            <option value="SEMUA">Semua Modul Sistem</option>
                            <option value="SISTEM">Keamanan / Login</option>
                            <option value="PERIZINAN">Alur Perizinan</option>
                            <option value="USERS">Manajemen Pengguna</option>
                            <option value="SANTRI">Master Data Santri</option>
                            <option value="RIWAYAT_SCAN">Operasional (Gerbang)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABEL LOG --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                            <tr>
                                <th className="px-6 py-4 w-56 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-2">Catatan Waktu {getSortIcon('created_at')}</div>
                                </th>
                                <th className="px-6 py-4 w-56 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('aktor')}>
                                    <div className="flex items-center gap-2">Pengguna & Hak Akses {getSortIcon('aktor')}</div>
                                </th>
                                <th className="px-6 py-4 w-40 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('modul')}>
                                    <div className="flex items-center justify-center gap-2">Modul / Tindakan {getSortIcon('modul')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('deskripsi')}>
                                    <div className="flex items-center gap-2">Deskripsi Aktivitas {getSortIcon('deskripsi')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[13px]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-gray-500 font-sans">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                                        Memuat rekam jejak...
                                    </td>
                                </tr>
                            ) : errorMsg ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-red-500 font-sans font-bold">{errorMsg}</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-sans">Tidak ada rekam jejak aktivitas yang ditemukan.</td></tr>
                            ) : currentData.map((log) => {
                                const visual = getAksiVisual(log.aksi);
                                return (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800 font-bold">{log.waktu.split(', ')[0]}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{log.waktu.split(', ')[1]} WIB</div>
                                        </td>
                                        <td className="px-6 py-4 font-sans">
                                            <div className="font-bold text-gray-900">{log.aktor}</div>
                                            <div className="text-[10px] font-black tracking-widest text-gray-400 mt-0.5">{log.role.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg font-sans font-bold text-[10px] uppercase tracking-wide ${visual.color}`}>
                                                {visual.icon}
                                                {log.aksi.replace(/_/g, ' ')}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1.5 tracking-wider font-bold">{log.modul.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 leading-relaxed font-sans text-sm">
                                            {log.deskripsi}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={sortedData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                </div>
            </div>

            {/* Catatan Kaki */}
            <div className="mt-4 flex items-start gap-2 px-2 text-xs text-gray-500">
                <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                <p>Data rekam jejak bersifat <i>read-only</i> (hanya baca). Sesuai kebijakan keamanan sistem, Super Admin sekalipun tidak dapat mengubah atau menghapus rekam jejak aktivitas ini.</p>
            </div>
        </div>
    );
};

export default AuditLog;