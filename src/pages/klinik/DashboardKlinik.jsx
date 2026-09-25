import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    PlusSquare, Activity, MapPin, Clock, AlertTriangle,
    Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    Check, Search, Filter
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// --- Konfigurasi Tema Khusus Klinik (Solusi Dynamic Class Tailwind) ---
const THEME_CONFIG = {
    red: {
        bg50: 'bg-red-50',
        bg50_30: 'bg-red-50/30',
        bg100: 'bg-red-100',
        text600: 'text-red-600',
        text700: 'text-red-700',
        border200: 'border-red-200'
    },
    blue: {
        bg50: 'bg-blue-50',
        bg50_30: 'bg-blue-50/30',
        bg100: 'bg-blue-100',
        text600: 'text-blue-600',
        text700: 'text-blue-700',
        border200: 'border-blue-200'
    }
};

// --- Komponen Custom Select ---
const CustomSelect = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[70px] border border-gray-200 rounded-lg bg-white text-gray-700 font-bold shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm h-[36px]"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[140px] right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden animate-fade-in-down origin-top">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${value === option.value ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-gray-600 font-medium'
                                }`}
                        >
                            {option.label}
                            {value === option.value && <Check size={14} className="text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Komponen Pagination Controls ---
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

    const perPageOptions = [
        { value: 5, label: '5' },
        { value: 10, label: '10' },
        { value: 25, label: '25' },
        { value: 50, label: '50' }
    ];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                <div>Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> data</div>
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4 relative">
                    <span className="hidden sm:inline">Per halaman:</span>
                    <CustomSelect options={perPageOptions} value={itemsPerPage} onChange={(val) => { onItemsPerPageChange(val); onPageChange(1); }} />
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"><ChevronLeft size={16} /></button>
                <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                    <span className="hidden sm:inline">Halaman</span>
                    <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all" min={1} max={totalPages} title="Ketik lalu Enter" />
                    <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                </div>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

// --- Logika Sorting Terpusat ---
const smartSortData = (data, config) => {
    return [...data].sort((a, b) => {
        if (config.key === 'nama') {
            const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
            const splitA = String(a.kelas || '').split('-');
            const splitB = String(b.kelas || '').split('-');
            const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
            const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

            let comparison = 0;
            if (gradeA !== gradeB) {
                comparison = (typeof gradeA === 'number' && typeof gradeB === 'number') ? gradeA - gradeB : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
            } else {
                comparison = String(a.nama || '').localeCompare(String(b.nama || ''));
            }
            return config.direction === 'asc' ? comparison : -comparison;
        }

        if (config.key === 'batasTanggal') {
            const timeA = a.rawBatasWaktu || 0;
            const timeB = b.rawBatasWaktu || 0;
            return config.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }

        const valA = String(a[config.key] || '');
        const valB = String(b[config.key] || '');
        if (valA < valB) return config.direction === 'asc' ? -1 : 1;
        if (valA > valB) return config.direction === 'asc' ? 1 : -1;
        return 0;
    });
};

const getSortIcon = (config, key, themeColorClass = "text-emerald-600") => {
    if (config.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
    return config.direction === 'asc' ? <ChevronUp size={16} className={themeColorClass} /> : <ChevronDown size={16} className={themeColorClass} />;
};

// --- KOMPONEN TABEL MODULAR KLINIK ---
const TabelMedis = ({ judul, deskripsi, icon: Icon, color, data, isLoading }) => {
    const theme = THEME_CONFIG[color] || THEME_CONFIG.red;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'batasTanggal', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Pipa Data Terpusat menggunakan useMemo
    const processedData = useMemo(() => {
        const filtered = data.filter(item => {
            const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.kode.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchSearch && matchStatus;
        });

        return smartSortData(filtered, sortConfig);
    }, [data, searchTerm, statusFilter, sortConfig]);

    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8`}>
            {/* Header Card */}
            <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bg50_30}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme.bg100} ${theme.text600}`}><Icon size={20} /></div>
                    <div>
                        <h3 className="font-bold text-gray-800">{judul}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border self-start sm:self-auto ${theme.bg50} ${theme.text700} ${theme.border200}`}>
                    {totalItems} Pasien
                </span>
            </div>

            {/* Toolbar Filter & Search */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari nama atau kode pasien..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[36px]"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="text-gray-400 hidden sm:block" size={16} />
                    <CustomSelect
                        options={[
                            { value: 'ALL', label: 'Semua Status' },
                            { value: 'DI_LUAR', label: 'Sedang Dirawat' },
                            { value: 'TERLAMBAT', label: 'Terlambat' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                <div className="flex items-center gap-2">Data Pasien {getSortIcon(sortConfig, 'nama', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('diagnosa')}>
                                <div className="flex items-center gap-2">Diagnosis / Alasan {getSortIcon(sortConfig, 'diagnosa', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batasTanggal')}>
                                <div className="flex items-center gap-2">Batas Tenggat {getSortIcon(sortConfig, 'batasTanggal', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('status')}>
                                <div className="flex items-center justify-center gap-2">Status {getSortIcon(sortConfig, 'status', theme.text600)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className={`w-6 h-6 animate-spin mx-auto mb-2 ${theme.text600}`} /> Memuat data medis...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 bg-gray-50/30">Tidak ada data pasien yang sesuai kriteria.</td></tr>
                        ) : currentData.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama} <span className="font-mono font-normal text-gray-400 bg-gray-100 px-1 py-0.5 rounded ml-1">{santri.kode}</span></div>
                                    <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Kelas {santri.kelas}</div>
                                </td>
                                <td className="px-6 py-4"><div className="text-xs text-gray-700 truncate max-w-xs" title={santri.diagnosa}>{santri.diagnosa}</div></td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${santri.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-900'}`}>{santri.batasTanggal}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam} WIB</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {santri.status === 'TERLAMBAT' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 rounded border border-red-200 text-[10px] font-black shadow-sm animate-pulse">
                                            <AlertTriangle size={12} /> MELEWATI BATAS
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-bold tracking-wide">
                                            <Clock size={12} /> SEDANG DIRAWAT
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
            </div>
        </div>
    );
};

const DashboardKlinik = () => {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [dataAntrean, setDataAntrean] = useState({ inap: 0, pp: 0 });
    const [dataBerjalan, setDataBerjalan] = useState({ inap: 0, pp: 0 });

    const [santriInap, setSantriInap] = useState([]);
    const [santriRujuk, setSantriRujuk] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, alasan, status, batas_waktu, created_at,
                    santri ( nama_lengkap, kelas ( nama_kelas ) )
                `)
                .in('jenis_izin', ['RUJUK_INAP_KLINIK', 'RAWAT_JALAN_KLINIK'])
                .in('status', ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DI_LUAR', 'TERLAMBAT'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            let antreanInap = 0, antreanPP = 0;
            let berjalanInap = 0, berjalanPP = 0;
            let listInap = [];
            let listRujuk = [];

            data.forEach(item => {
                const isRujukInap = item.jenis_izin === 'RUJUK_INAP_KLINIK';
                const isRawatJalan = item.jenis_izin === 'RAWAT_JALAN_KLINIK';

                if (item.status === 'MENUNGGU_PERSETUJUAN' || item.status === 'DISETUJUI') {
                    if (isRujukInap) antreanInap++;
                    if (isRawatJalan) antreanPP++;
                }

                if (item.status === 'DI_LUAR' || item.status === 'TERLAMBAT') {
                    if (isRujukInap) berjalanInap++;
                    if (isRawatJalan) berjalanPP++;

                    const formattedItem = {
                        id: item.id,
                        kode: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                        nama: item.santri?.nama_lengkap || 'Unknown',
                        kelas: item.santri?.kelas?.nama_kelas || '-',
                        jenis: item.jenis_izin,
                        diagnosa: item.alasan,
                        status: item.status,
                        rawBatasWaktu: item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0,
                        batasTanggal: item.batas_waktu ? new Date(item.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                        batasJam: item.batas_waktu ? new Date(item.batas_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
                    };

                    if (isRujukInap) listInap.push(formattedItem);
                    if (isRawatJalan) listRujuk.push(formattedItem);
                }
            });

            setDataAntrean({ inap: antreanInap, pp: antreanPP });
            setDataBerjalan({ inap: berjalanInap, pp: berjalanPP });
            setSantriInap(listInap);
            setSantriRujuk(listRujuk);

        } catch (error) {
            console.error("Gagal memuat data klinik:", error);
            setErrorMsg("Gagal terhubung ke database. Silakan muat ulang.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <PlusSquare className="text-red-600" />
                        Dashboard Klinik
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pemantauan data rujukan pasien ke rumah sakit atau faskes luar.</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors shadow-sm flex justify-center items-center gap-2 w-full sm:w-auto"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Segarkan Data"}
                </button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Menunggu Persetujuan Sekretaris</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-200 hover:shadow-md transition-all">
                    <div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">Antrean Rujuk Inap</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? <Loader2 size={24} className="animate-spin text-gray-400" /> : <span className="text-3xl font-black text-gray-800">{dataAntrean.inap}</span>}
                            <span className="text-sm font-medium text-gray-500">Ajuan Baru</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center"><Activity size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all">
                    <div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">Antrean Rawat Jalan</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? <Loader2 size={24} className="animate-spin text-gray-400" /> : <span className="text-3xl font-black text-gray-800">{dataAntrean.pp}</span>}
                            <span className="text-sm font-medium text-gray-500">Ajuan Baru</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center"><MapPin size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-6"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Status Pasien Saat Ini</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-red-50/30">
                    <div>
                        <p className="text-red-600 text-[11px] font-black uppercase tracking-widest mb-1">Pasien Rujuk Inap Medis</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? <Loader2 size={24} className="animate-spin text-red-400" /> : <span className="text-3xl font-black text-gray-800">{dataBerjalan.inap}</span>}
                            <span className="text-sm font-medium text-gray-500">Sedang Di Luar</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm"><Activity size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-blue-50/30">
                    <div>
                        <p className="text-blue-600 text-[11px] font-black uppercase tracking-widest mb-1">Pasien Rawat Jalan</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? <Loader2 size={24} className="animate-spin text-blue-400" /> : <span className="text-3xl font-black text-gray-800">{dataBerjalan.pp}</span>}
                            <span className="text-sm font-medium text-gray-500">Sedang Di Luar</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm"><MapPin size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Pasien Rujukan Aktif</h3></div>

            <TabelMedis
                judul="Pasien Rujuk Inap Medis"
                deskripsi="Santri yang sedang dirawat inap di luar pondok."
                icon={Activity}
                color="red"
                data={santriInap}
                isLoading={isLoading}
            />

            <TabelMedis
                judul="Pasien Rujuk Rawat Jalan"
                deskripsi="Santri yang sedang berobat keluar dan wajib segera kembali."
                icon={MapPin}
                color="blue"
                data={santriRujuk}
                isLoading={isLoading}
            />
        </div>
    );
};

export default DashboardKlinik;