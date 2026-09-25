import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import {
    LayoutDashboard, Home, Map, Clock, AlertTriangle,
    MessageCircle, Loader2, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, Search, Filter, Check
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

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
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${value === option.value ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-gray-600 font-medium'}`}
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
const MinimalistDonut = ({ dataWali, dataKlinik, label, title, icon: Icon, color }) => {
    const theme = THEME_CONFIG[color];
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
                        {pctKlinik > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.chartSecondary} strokeWidth="4" strokeDasharray={`${pctKlinik}, 100`} strokeDashoffset={`-${pctWali}`} />}
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.chartSecondary }}></div>
                            <span className="text-sm font-semibold text-gray-600">Klinik</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataKlinik}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Komponen Pagination Baku ---
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
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                    <span className="hidden sm:inline">Halaman</span>
                    <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} title="Ketik lalu Enter" />
                    <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                </div>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

// --- Logika Sorting Baku ---
const smartSortData = (data, config) => {
    return [...data].sort((a, b) => {
        const valA = String(a[config.key] || '').toLowerCase();
        const valB = String(b[config.key] || '').toLowerCase();
        if (valA < valB) return config.direction === 'asc' ? -1 : 1;
        if (valA > valB) return config.direction === 'asc' ? 1 : -1;
        return 0;
    });
};

const getSortIcon = (config, key, themeColorClass = "text-emerald-600") => {
    if (config.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
    return config.direction === 'asc' ? <ChevronUp size={16} className={themeColorClass} /> : <ChevronDown size={16} className={themeColorClass} />;
};

// --- Komponen Tabel Cerdas (Mengenkapsulasi Search, Filter, Sort, Pagination) ---
const TabelPengawasan = ({ judul, deskripsi, icon: Icon, color, data, isLoading }) => {
    const theme = THEME_CONFIG[color];

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const filteredData = data.filter((item) => {
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.waliSiswa.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' ? true : item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const sortedData = smartSortData(filteredData, sortConfig);
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleWAOrtu = (waliSiswa, nomorWa, santri) => {
        if (!nomorWa || nomorWa === '-') {
            alert(`Nomor WhatsApp untuk wali dari ananda ${santri} belum diatur di sistem.`);
            return;
        }

        let cleanNumber = nomorWa.replace(/\D/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        }

        const message = `Assalamu'alaikum Bapak/Ibu ${waliSiswa},\n\nMohon maaf mengingatkan bahwa ananda *${santri}* tenggat waktu izinnya telah habis. Mohon agar ananda dapat segera kembali ke pondok pesantren. Terima kasih.`;
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className={`px-6 py-5 border-b ${theme.bg50_30} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 ${theme.bg100} ${theme.text600} rounded-lg`}><Icon size={20} /></div>
                    <div>
                        <h3 className="font-bold text-gray-800">{judul}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 ${theme.bg50} ${theme.text700} text-xs font-bold rounded-full border ${theme.border200} w-fit`}>
                    Total: {totalItems} Data
                </span>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama santri atau wali..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter size={18} className="text-gray-400 hidden sm:block" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="DI_LUAR">Di Luar (Aman)</option>
                        <option value="TERLAMBAT">Terlambat</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                <div className="flex items-center gap-2">Nama Santri & Izin {getSortIcon(sortConfig, 'nama', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('waliSiswa')}>
                                <div className="flex items-center gap-2">Wali Santri {getSortIcon(sortConfig, 'waliSiswa', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batasTanggal')}>
                                <div className="flex items-center gap-2">Batas Tenggat {getSortIcon(sortConfig, 'batasTanggal', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('status')}>
                                <div className="flex items-center justify-center gap-2">Status {getSortIcon(sortConfig, 'status', theme.text600)}</div>
                            </th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    {data.length === 0 ? "Aman. Tidak ada santri yang harus kembali hari ini." : "Pencarian tidak ditemukan."}
                                </td>
                            </tr>
                        ) : currentData.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama}</div>
                                    <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">{santri.waliSiswa}</td>
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
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleWAOrtu(santri.waliSiswa, santri.nomorWa, santri.nama)}
                                        className="inline-flex items-center justify-center w-9 h-9 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 rounded-lg shadow-sm transition-all"
                                        title={`Hubungi WhatsApp Wali`}
                                    >
                                        <MessageCircle size={18} />
                                    </button>
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

// --- Komponen Utama ---
const DashboardWalikelas = () => {
    const { user } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);
    const [namaKelas, setNamaKelas] = useState('-');
    const [kelasId, setKelasId] = useState(null);

    const [stats, setStats] = useState({
        antrean: { pulang: 0, keluar: 0, perpanjangan: 0 },
        berjalan: { pulang: { wali: 0, klinik: 0 }, keluar: { wali: 0, klinik: 0 } }
    });

    const [santriPulang, setSantriPulang] = useState([]);
    const [santriKeluar, setSantriKeluar] = useState([]);

    const fetchDashboardData = useCallback(async (idKelas) => {
        setIsLoading(true);
        try {
            const { data: dataIzin, error: errIzin } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, batas_waktu, status, parent_izin_id, santri_id,
                    santri!inner(id, nama_lengkap, nama_wali, nomor_wa_wali, kelas_id)
                `)
                .eq('santri.kelas_id', idKelas)
                .in('status', ['MENUNGGU_PERSETUJUAN', 'DI_LUAR', 'TERLAMBAT']);

            if (errIzin) throw errIzin;

            let tempStats = {
                antrean: { pulang: 0, keluar: 0, perpanjangan: 0 },
                berjalan: { pulang: { wali: 0, klinik: 0 }, keluar: { wali: 0, klinik: 0 } }
            };
            let listPulang = [];
            let listKeluar = [];

            // FILTER TANGGAL: Untuk menyaring "Hari Ini" atau "Terlambat"
            const hariIniStr = new Date().toDateString();
            const waktuSekarangMs = new Date().getTime();

            dataIzin.forEach(item => {
                const isMenginap = item.jenis_izin === 'PULANG_MENGINAP_WALI' || item.jenis_izin === 'RUJUK_INAP_KLINIK';
                const isPergi = item.jenis_izin === 'PULANG_PERGI_WALI' || item.jenis_izin === 'RAWAT_JALAN_KLINIK';
                const santriData = item.santri;

                if (item.status === 'MENUNGGU_PERSETUJUAN') {
                    if (item.parent_izin_id) tempStats.antrean.perpanjangan++;
                    else if (isMenginap) tempStats.antrean.pulang++;
                    else if (isPergi) tempStats.antrean.keluar++;
                }

                if (item.status === 'DI_LUAR' || item.status === 'TERLAMBAT') {
                    // STATISTIK GLOBAL TETAP JALAN
                    if (item.jenis_izin === 'PULANG_MENGINAP_WALI') tempStats.berjalan.pulang.wali++;
                    if (item.jenis_izin === 'RUJUK_INAP_KLINIK') tempStats.berjalan.pulang.klinik++;
                    if (item.jenis_izin === 'PULANG_PERGI_WALI') tempStats.berjalan.keluar.wali++;
                    if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') tempStats.berjalan.keluar.klinik++;

                    // LOGIKA PENYARINGAN TABEL PENGAWASAN
                    const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                    const batasWaktuStr = item.batas_waktu ? new Date(item.batas_waktu).toDateString() : '';

                    const isBatasWaktuHariIni = batasWaktuStr === hariIniStr;
                    const isSudahTerlewat = batasWaktuMs < waktuSekarangMs;

                    if (item.status === 'TERLAMBAT' || isBatasWaktuHariIni || isSudahTerlewat) {
                        const objSantri = {
                            id: item.kode_izin || item.id,
                            nama: santriData ? santriData.nama_lengkap : 'Tidak Diketahui',
                            waliSiswa: santriData ? santriData.nama_wali : 'Belum Diatur',
                            nomorWa: santriData ? santriData.nomor_wa_wali : null,
                            jenis: item.jenis_izin,
                            batasTanggal: formatTanggal(item.batas_waktu),
                            batasJam: formatJam(item.batas_waktu),
                            status: item.status
                        };

                        if (isMenginap) listPulang.push(objSantri);
                        if (isPergi) listKeluar.push(objSantri);
                    }
                }
            });

            setStats(tempStats);
            setSantriPulang(listPulang);
            setSantriKeluar(listKeluar);
        } catch (error) {
            console.error("Gagal mengambil data dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchKelasInfo = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('kelas').select('id, nama_kelas').eq('wali_kelas_id', user.id).single();
            if (error) throw error;

            if (data) {
                setNamaKelas(data.nama_kelas);
                setKelasId(data.id);
                fetchDashboardData(data.id);
            }
        } catch (error) {
            console.error("Gagal mendapat info kelas:", error);
            setIsLoading(false);
        }
    }, [user.id, fetchDashboardData]);

    useEffect(() => {
        if (user && user.id) fetchKelasInfo();
    }, [user, fetchKelasInfo]);

    const formatTanggal = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatJam = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (!kelasId && !isLoading) {
        return (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ditugaskan Kelas</h2>
                <p className="text-gray-500 max-w-md">Akun Anda berstatus Walikelas, namun belum ada kelas yang ditugaskan kepada Anda. Silakan hubungi Administrator sistem.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-600" />
                        Dashboard Walikelas <span className="text-emerald-600">(Kelas {namaKelas})</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau khusus pengajuan dan kepulangan santri kelas Anda.</p>
                </div>
                <button onClick={() => fetchDashboardData(kelasId)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm w-full sm:w-auto flex justify-center items-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Segarkan Data"}
                </button>
            </div>

            <div className="mb-2"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Menunggu Persetujuan Sekretaris</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Menginap</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{isLoading ? '-' : stats.antrean.pulang}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Home size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-purple-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Pergi</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{isLoading ? '-' : stats.antrean.keluar}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors"><Map size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-1">Perpanjangan Waktu</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{isLoading ? '-' : stats.antrean.perpanjangan}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Santri Kelas {namaKelas} di Luar</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <MinimalistDonut dataWali={stats.berjalan.pulang.wali} dataKlinik={stats.berjalan.pulang.klinik} label="Di Luar" title="Pulang Menginap" icon={Home} color="emerald" />
                <MinimalistDonut dataWali={stats.berjalan.keluar.wali} dataKlinik={stats.berjalan.keluar.klinik} label="Di Luar" title="Pulang Pergi" icon={Map} color="purple" />
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Santri Kelas {namaKelas} (Hari Ini & Terlambat)</h3></div>

            <TabelPengawasan
                judul="Pantauan Pulang Menginap"
                deskripsi="Santri kelas Anda yang wajib kembali dari rumah hari ini."
                icon={Home}
                color="emerald"
                data={santriPulang}
                isLoading={isLoading}
            />

            <TabelPengawasan
                judul="Pantauan Pulang Pergi"
                deskripsi="Santri kelas Anda yang harus segera kembali hari ini."
                icon={Map}
                color="purple"
                data={santriKeluar}
                isLoading={isLoading}
            />
        </div>
    );
};

export default DashboardWalikelas;