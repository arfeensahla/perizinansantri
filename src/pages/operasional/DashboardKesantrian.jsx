import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutDashboard, Home, Map, AlertTriangle, Clock, Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// --- Konfigurasi Tema ---
const THEME_CONFIG = {
    emerald: {
        bg50: 'bg-emerald-50',
        bg50_30: 'bg-emerald-50/30',
        bg50_50: 'bg-emerald-50/50',
        bg100: 'bg-emerald-100',
        text600: 'text-emerald-600',
        text700: 'text-emerald-700',
        border200: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-200',
        chartPrimary: '#10b981',
        chartSecondary: '#3b82f6'
    },
    purple: {
        bg50: 'bg-purple-50',
        bg50_30: 'bg-purple-50/30',
        bg50_50: 'bg-purple-50/50',
        bg100: 'bg-purple-100',
        text600: 'text-purple-600',
        text700: 'text-purple-700',
        border200: 'border-purple-200',
        hoverBorder: 'hover:border-purple-200',
        chartPrimary: '#a855f7',
        chartSecondary: '#f59e0b'
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

// --- Komponen SVG Donut Chart Minimalis ---
const MinimalistDonut = ({ dataWali, dataKlinik = 0, label, title, icon: Icon, color, showKlinik = true }) => {
    const theme = THEME_CONFIG[color] || THEME_CONFIG.emerald;
    const total = dataWali + dataKlinik;
    const pctWali = total === 0 ? 0 : (dataWali / total) * 100;
    const pctKlinik = total === 0 ? 0 : (dataKlinik / total) * 100;

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${theme.hoverBorder} transition-colors`}>
            <div className={`px-5 py-4 ${theme.bg50_50} border-b border-gray-50 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 ${theme.bg100} ${theme.text700} rounded-lg`}><Icon size={18} /></div>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izin Berjalan</span>
            </div>

            <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        {pctWali > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.chartPrimary} strokeWidth="4" strokeDasharray={`${pctWali}, 100`} />}
                        {pctKlinik > 0 && showKlinik && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.chartSecondary} strokeWidth="4" strokeDasharray={`${pctKlinik}, 100`} strokeDashoffset={`-${pctWali}`} />}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-800 leading-none">{total}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{label}</span>
                    </div>
                </div>
                <div className="space-y-4 min-w-[120px]">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.chartPrimary }}></div>
                            <span className="text-sm font-semibold text-gray-600">Walisantri</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataWali}</span>
                    </div>
                    {showKlinik && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.chartSecondary }}></div>
                                <span className="text-sm font-semibold text-gray-600">Klinik</span>
                            </div>
                            <span className="text-lg font-black text-gray-900">{dataKlinik}</span>
                        </div>
                    )}
                </div>
            </div>
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
            onPageChange(newPage); setInputPage(newPage);
        }
    };
    if (totalItems === 0) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const perPageOptions = [{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 25, label: '25' }, { value: 50, label: '50' }];

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
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 shadow-sm transition-all"><ChevronLeft size={16} /></button>
                <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                    <span className="hidden sm:inline">Halaman</span>
                    <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all" min={1} max={totalPages} />
                    <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                </div>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 shadow-sm transition-all"><ChevronRight size={16} /></button>
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
            const timeA = new Date(a.rawBatasWaktu || 0).getTime();
            const timeB = new Date(b.rawBatasWaktu || 0).getTime();
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

// --- KOMPONEN TABEL MODULAR ---
const TabelPengawasan = ({ judul, deskripsi, icon: Icon, color = 'emerald', data, isLoading }) => {
    const theme = THEME_CONFIG[color] || THEME_CONFIG.emerald;

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

    const processedData = useMemo(() => {
        const filtered = data.filter(item => {
            const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.walikelas.toLowerCase().includes(searchTerm.toLowerCase());
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
                    Total: {totalItems} Santri
                </span>
            </div>

            {/* Toolbar Filter & Search */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari nama santri..."
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
                            { value: 'DI_LUAR', label: 'Di Luar' },
                            { value: 'TERLAMBAT', label: 'Terlambat' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Table Area (Tanpa Tombol Aksi) */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                <div className="flex items-center gap-2">Data Santri & Izin {getSortIcon(sortConfig, 'nama', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('walikelas')}>
                                <div className="flex items-center gap-2">Penanggung Jawab {getSortIcon(sortConfig, 'walikelas', theme.text600)}</div>
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
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className={`w-6 h-6 animate-spin mx-auto mb-2 ${theme.text600}`} /> Memuat data...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 bg-gray-50/30">Tidak ada santri yang harus kembali hari ini.</td></tr>
                        ) : currentData.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama} <span className="font-mono font-normal text-gray-400 bg-gray-100 px-1 py-0.5 rounded ml-1">({santri.kelas})</span></div>
                                    <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">{santri.walikelas}</td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${santri.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-900'}`}>{santri.batasTanggal}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam} WIB</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {santri.status === 'TERLAMBAT' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded border border-red-200 text-xs font-black shadow-sm animate-pulse">
                                            <AlertTriangle size={12} /> TERLAMBAT
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-bold tracking-wide shadow-sm">
                                            <Clock size={12} /> DI LUAR
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

// --- Komponen Utama Kesantrian ---
const DashboardKesantrian = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [dataAntrean, setDataAntrean] = useState({ pulangWali: 0, pulangKlinik: 0, keluarWali: 0 });
    const [dataBerjalan, setDataBerjalan] = useState({ pulangWali: 0, pulangKlinik: 0, keluarWali: 0 });
    const [santriPulangList, setSantriPulangList] = useState([]);
    const [santriKeluarList, setSantriKeluarList] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

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
                    id, kode_izin, jenis_izin, batas_waktu, status,
                    santri (
                        nama_lengkap, 
                        kelas ( nama_kelas )
                    ),
                    pengaju:users!perizinan_pengaju_id_fkey ( nama_lengkap, role )
                `)
                .in('status', ['MENUNGGU_PERSETUJUAN', 'DI_LUAR', 'TERLAMBAT']);

            if (error) throw error;

            let countAntrean = { pulangWali: 0, pulangKlinik: 0, keluarWali: 0 };
            let countBerjalan = { pulangWali: 0, pulangKlinik: 0, keluarWali: 0 };
            let listPulang = [];
            let listKeluar = [];

            // FILTER TANGGAL: Untuk menyaring "Hari Ini" atau "Terlambat"
            const hariIniStr = new Date().toDateString();
            const waktuSekarangMs = new Date().getTime();

            data.forEach(item => {
                const isPulangMenginap = item.jenis_izin === 'PULANG_MENGINAP_WALI';
                const isRujukInap = item.jenis_izin === 'RUJUK_INAP_KLINIK';
                const isPulangPergi = item.jenis_izin === 'PULANG_PERGI_WALI';

                // Hitung Antrean
                if (item.status === 'MENUNGGU_PERSETUJUAN') {
                    if (isPulangMenginap) countAntrean.pulangWali++;
                    if (isRujukInap) countAntrean.pulangKlinik++;
                    if (isPulangPergi) countAntrean.keluarWali++;
                }

                // Hitung dan Format Berjalan (Di Luar / Terlambat)
                if (item.status === 'DI_LUAR' || item.status === 'TERLAMBAT') {
                    // STATISTIK: Tetap hitung semua santri yang di luar agar akurat
                    if (isPulangMenginap) countBerjalan.pulangWali++;
                    if (isRujukInap) countBerjalan.pulangKlinik++;
                    if (isPulangPergi) countBerjalan.keluarWali++;

                    // LOGIKA PENYARINGAN TABEL PENGAWASAN
                    const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                    const batasWaktuStr = item.batas_waktu ? new Date(item.batas_waktu).toDateString() : '';

                    const isBatasWaktuHariIni = batasWaktuStr === hariIniStr;
                    const isSudahTerlewat = batasWaktuMs < waktuSekarangMs;

                    // HANYA MASUKKAN KE TABEL JIKA: Terlambat, ATAU Tenggat Waktunya Hari Ini, ATAU Sudah Terlewat Waktunya
                    if (item.status === 'TERLAMBAT' || isBatasWaktuHariIni || isSudahTerlewat) {
                        let namaPengaju = 'Belum Diatur';
                        if (item.pengaju) {
                            const roleLabel = item.pengaju.role === 'KLINIK' ? 'Klinik' : (item.pengaju.role === 'WALIKELAS' ? 'Walikelas' : item.pengaju.role);
                            namaPengaju = `${item.pengaju.nama_lengkap} (${roleLabel})`;
                        }

                        const objSantri = {
                            id: item.id,
                            nama: item.santri?.nama_lengkap || 'Unknown',
                            kelas: item.santri?.kelas?.nama_kelas || '-',
                            walikelas: namaPengaju,
                            jenis: item.jenis_izin,
                            rawBatasWaktu: item.batas_waktu || 0,
                            batasTanggal: item.batas_waktu ? new Date(item.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                            batasJam: item.batas_waktu ? new Date(item.batas_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
                            status: item.status
                        };

                        if (isPulangMenginap || isRujukInap) listPulang.push(objSantri);
                        if (isPulangPergi) listKeluar.push(objSantri);
                    }
                }
            });

            setDataAntrean(countAntrean);
            setDataBerjalan(countBerjalan);
            setSantriPulangList(listPulang);
            setSantriKeluarList(listKeluar);

        } catch (error) {
            console.error("Gagal memuat data kesantrian:", error);
            setErrorMsg("Gagal memuat data dari server: " + (error.message || 'Silakan cek console Chrome'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-600" />
                        Dashboard Kesantrian
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pemantauan volume pergerakan santri di gerbang dan informasi antrean sistem.</p>
                </div>
                <button onClick={fetchDashboardData} disabled={isLoading} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full md:w-auto">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Segarkan Data"}
                </button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Informasi Antrean (Menunggu Sekretaris)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all">
                    <div>
                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Menginap</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{dataAntrean.pulangWali + dataAntrean.pulangKlinik}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Home size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-purple-300 transition-all">
                    <div>
                        <p className="text-purple-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Pergi (Non-Medis)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{dataAntrean.keluarWali}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Map size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Statistik Santri di Luar</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <MinimalistDonut
                    dataWali={dataBerjalan.pulangWali}
                    dataKlinik={dataBerjalan.pulangKlinik}
                    showKlinik={true}
                    label="Di Luar" title="Volume Izin Pulang Menginap" icon={Home} color="emerald"
                />
                <MinimalistDonut
                    dataWali={dataBerjalan.keluarWali}
                    dataKlinik={0}
                    showKlinik={false}
                    label="Di Luar" title="Volume Izin Pulang Pergi" icon={Map} color="purple"
                />
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Wajib Kembali (Hari Ini & Terlambat)</h3></div>
            <TabelPengawasan judul="Pantauan Arus Izin Pulang Menginap" deskripsi="Santri yang diekspektasikan masuk gerbang hari ini (termasuk rawat inap/pulang sakit)." icon={Home} color="emerald" data={santriPulangList} isLoading={isLoading} />
            <TabelPengawasan judul="Pantauan Arus Izin Pulang Pergi" deskripsi="Santri izin keluar singkat yang akan kembali ke gerbang hari ini (Non-Medis)." icon={Map} color="purple" data={santriKeluarList} isLoading={isLoading} />
        </div>
    );
};

export default DashboardKesantrian;