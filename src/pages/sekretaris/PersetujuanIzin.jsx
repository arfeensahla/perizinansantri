import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, CheckSquare, XSquare, Clock, User, CalendarClock, Check, CheckCircle2, MapPin, Car, History, ArrowRight, Home, Loader2, AlertCircle, Phone } from 'lucide-react';
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
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
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
                <div className="absolute z-50 mt-1 w-full min-w-[120px] right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden animate-fade-in-down origin-top">
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
const MinimalistDonut = ({ dataWali, dataKlinik, label, title, icon: Icon, color = 'emerald' }) => {
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
                    Total: {totalItems} Data
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

            {/* Table Area */}
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
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 bg-gray-50/30">Tidak ada data santri yang sesuai kriteria.</td></tr>
                        ) : currentData.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama} <span className="font-mono font-normal text-gray-400 bg-gray-100 px-1 py-0.5 rounded ml-1">({santri.kelas})</span></div>
                                    <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-700">{santri.walikelas}</div>
                                    <div className="text-xs text-gray-500">Wali: {santri.waliSiswa}</div>
                                </td>
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

// --- Komponen Utama PersetujuanIzin ---
const PersetujuanIzin = () => {
    const { user } = useContext(AuthContext);

    // --- State Modals & Bulk ---
    const [isModalApproveBuka, setIsModalApproveBuka] = useState(false);
    const [isModalRejectBuka, setIsModalRejectBuka] = useState(false);
    const [isModalBulkBuka, setIsModalBulkBuka] = useState(false);

    const [selectedAjuan, setSelectedAjuan] = useState(null);
    const [alasanTolak, setAlasanTolak] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- State Database ---
    const [antreanAjuan, setAntreanAjuan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Fetch Antrean Persetujuan dari Supabase ---
    useEffect(() => {
        fetchAntreanIzin();
    }, []);

    const fetchAntreanIzin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, alasan, tujuan, penjemput, hubungan_penjemput, 
                    waktu_berangkat, batas_waktu, status, created_at, parent_izin_id,
                    santri (
                        id, nama_lengkap, kota_asal,
                        kelas ( nama_kelas )
                    ),
                    pengaju:users!perizinan_pengaju_id_fkey ( nama_lengkap, role )
                `)
                .eq('status', 'MENUNGGU_PERSETUJUAN')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Mapping Data
            const formatted = data.map(item => {
                const isPerpanjangan = item.parent_izin_id !== null;
                const tipeLabel = isPerpanjangan ? 'PERPANJANGAN' : 'IZIN BARU';

                let alasanBersih = item.alasan || 'Tanpa keterangan';
                const finalTujuan = item.tujuan || (item.jenis_izin.includes('KLINIK') ? 'RS/Faskes Luar' : 'Rumah/Domisili');
                const finalKotaAsal = item.santri?.kota_asal || 'Cirebon';

                // --- Logika Ekstraksi Pendamping Klinik vs Walikelas ---
                let namaPenjemputBersih = '-';
                let kontakPendamping = null;

                if (item.penjemput) {
                    if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') {
                        namaPenjemputBersih = item.penjemput;
                        // Ekstrak nomor HP dari string "Petugas (HP: 0812...)"
                        const hpMatch = item.hubungan_penjemput?.match(/HP:\s*([\d\+\-\s]+)\)/);
                        if (hpMatch) kontakPendamping = hpMatch[1].trim();
                    } else {
                        // Perizinan Walikelas (Wali Santri)
                        namaPenjemputBersih = item.hubungan_penjemput ? `${item.penjemput} (${item.hubungan_penjemput})` : item.penjemput;
                    }
                }

                // Tentukan Pengaju
                let namaPengaju = 'Tidak Diketahui';
                if (item.pengaju) {
                    const roleLabel = item.pengaju.role === 'KLINIK' ? 'Klinik' : (item.pengaju.role === 'WALIKELAS' ? 'Walikelas' : item.pengaju.role);
                    namaPengaju = `${item.pengaju.nama_lengkap} (${roleLabel})`;
                }

                return {
                    id: item.id,
                    kode: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                    tipe: tipeLabel,
                    jenis: item.jenis_izin,
                    nama: item.santri?.nama_lengkap || 'Unknown',
                    kelas: item.santri?.kelas?.nama_kelas || '-',
                    pengaju: namaPengaju,
                    waktuAjuan: new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
                    alasan: alasanBersih,
                    jadwalAwal: isPerpanjangan ? 'Sedang memuat data awal...' : null,
                    jadwalBatasBaru: item.batas_waktu,
                    jadwal: `Keberangkatan: ${new Date(item.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}\nKembali: ${item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}`,
                    penjemput: namaPenjemputBersih,
                    kontakPendamping: kontakPendamping, // Disimpan terpisah khusus untuk klinik
                    kotaAsal: finalKotaAsal,
                    kotaTujuan: finalTujuan,
                    trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 },
                    rawItem: item
                };
            });

            setAntreanAjuan(formatted);
        } catch (error) {
            console.error("Gagal memuat antrean izin:", error);
            setErrorMsg("Gagal memuat data dari server: " + (error.message || 'Silakan cek console Chrome'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Logika Checkbox (Bulk) ---
    const toggleCheck = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleCheckAll = () => {
        if (selectedIds.length === antreanAjuan.length) setSelectedIds([]);
        else setSelectedIds(antreanAjuan.map(a => a.id));
    };

    // --- Action Handlers ---
    const bukaModalApprove = (e, ajuan) => {
        e.stopPropagation();
        setSelectedAjuan(ajuan);
        setIsModalApproveBuka(true);
    };

    const bukaModalReject = (e, ajuan) => {
        e.stopPropagation();
        setSelectedAjuan(ajuan);
        setAlasanTolak('');
        setIsModalRejectBuka(true);
    };

    // FUNGSI EKSEKUSI DATABASE
    const handleProsesSingle = async (aksi) => {
        setIsProcessing(true);
        try {
            const isApprove = aksi === 'APPROVE';
            const statusBaru = isApprove ? 'DISETUJUI' : 'DITOLAK';

            const { error: updateErr } = await supabase
                .from('perizinan')
                .update({
                    status: statusBaru,
                    disetujui_oleh: user.id,
                    catatan_penolakan: !isApprove ? alasanTolak : null
                })
                .eq('id', selectedAjuan.id);

            if (updateErr) throw updateErr;

            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: isApprove ? 'SETUJUI_IZIN' : 'TOLAK_IZIN',
                tabel_terdampak: 'perizinan',
                data_id: selectedAjuan.id,
                keterangan: `Sekretaris Mudir ${isApprove ? 'Menyetujui' : 'Menolak'} pengajuan ${selectedAjuan.kode} untuk ${selectedAjuan.nama}. ${!isApprove ? 'Alasan: ' + alasanTolak : ''}`
            }]);

            setAntreanAjuan(prev => prev.filter(item => item.id !== selectedAjuan.id));
            setSelectedIds(prev => prev.filter(id => id !== selectedAjuan.id));

            setIsModalApproveBuka(false);
            setIsModalRejectBuka(false);

        } catch (error) {
            console.error("Gagal memproses perizinan:", error);
            alert("Gagal menyimpan ke database. Coba lagi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProsesBulk = async () => {
        setIsProcessing(true);
        try {
            for (const id of selectedIds) {
                await supabase
                    .from('perizinan')
                    .update({ status: 'DISETUJUI', disetujui_oleh: user.id })
                    .eq('id', id);

                await supabase.from('audit_log').insert([{
                    user_id: user.id,
                    aksi: 'SETUJUI_IZIN_MASSAL',
                    tabel_terdampak: 'perizinan',
                    data_id: id,
                    keterangan: `Sekretaris Mudir menyetujui izin ini secara massal (Bulk Approve).`
                }]);
            }

            setAntreanAjuan(prev => prev.filter(item => !selectedIds.includes(item.id)));
            setSelectedIds([]);
            setIsModalBulkBuka(false);

        } catch (error) {
            console.error("Gagal bulk approve:", error);
            alert("Sebagian pengajuan mungkin gagal diproses.");
        } finally {
            setIsProcessing(false);
        }
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

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                        {errorMsg}
                    </div>
                )}

                {/* --- HEADER TOOLS (Pilih Semua) --- */}
                {antreanAjuan.length > 0 && !isLoading && (
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
                {isLoading ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-1">Memuat Antrean</h3>
                        <p className="text-sm text-gray-500">Mengambil data terbaru dari server...</p>
                    </div>
                ) : antreanAjuan.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <ShieldCheck size={64} className="text-emerald-100 mb-4" />
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
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border mb-1.5 ${ajuan.tipe === 'IZIN BARU' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {ajuan.tipe}
                                        </span>
                                        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                            {ajuan.jenis.replace(/_/g, ' ')}
                                            <span className="text-[9px] font-mono font-bold bg-gray-200 text-gray-500 px-1 rounded">{ajuan.kode}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400 mt-1" title="Waktu diajukan">{ajuan.waktuAjuan}</div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1">
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

                                    {/* Visualisasi Rute & Penjemput (Kondisional berdasarkan Jenis Izin) */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-3">
                                        {/* Hilangkan baris penjemput khusus Rujuk Inap Klinik */}
                                        {ajuan.jenis !== 'RUJUK_INAP_KLINIK' && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <Car size={14} />
                                                        {ajuan.jenis === 'RAWAT_JALAN_KLINIK' ? 'Pendamping' : 'Penjemput'}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-semibold text-gray-800">{ajuan.penjemput}</span>
                                                        {ajuan.kontakPendamping && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono mt-0.5">
                                                                <Phone size={10} /> {ajuan.kontakPendamping}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-px bg-gray-200/60 w-full"></div>
                                            </>
                                        )}

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
                                    <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl mb-4 relative mt-3">
                                        <span className="absolute -top-2.5 left-3 bg-blue-100 px-1.5 rounded text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-200">Alasan Izin</span>
                                        <p className="text-sm text-gray-800 mt-1 leading-relaxed">{ajuan.alasan}</p>
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
                                                {ajuan.tipe === 'PERPANJANGAN' && <span className="font-bold uppercase tracking-wider text-[9px] text-amber-600 block mb-0.5">Ajuan Perpanjangan Baru</span>}
                                                {ajuan.jadwal}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                                    <button onClick={(e) => bukaModalReject(e, ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-sm transition-all relative z-20">
                                        <XSquare size={16} /> Tolak
                                    </button>
                                    <button onClick={(e) => bukaModalApprove(e, ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm transition-all shadow-sm relative z-20">
                                        <CheckSquare size={16} /> Setujui
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FLOATING ACTION BAR (BULK APPROVE) --- */}
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
            {isModalApproveBuka && selectedAjuan && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalApproveBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-emerald-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><CheckSquare size={20} /></div>
                            <h3 className="font-bold text-emerald-900 text-lg">Konfirmasi Persetujuan</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Anda yakin ingin menyetujui pengajuan izin ini? Data persetujuan akan langsung tercatat di sistem Security (Satpam).</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2 mb-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Santri:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.nama} <span className="font-normal text-gray-500">({selectedAjuan.kelas})</span></span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tipe:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.tipe}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    <span className="text-gray-500 text-xs block mb-1 font-bold">{selectedAjuan.tipe === 'PERPANJANGAN' ? 'Waktu Diperpanjang Menjadi:' : 'Batas Waktu Kepulangan:'}</span>
                                    <span className="font-mono text-sm font-bold text-emerald-700 block whitespace-pre-line">{selectedAjuan.jadwalBatasBaru ? new Date(selectedAjuan.jadwalBatasBaru).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalApproveBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Batal</button>
                            <button onClick={() => handleProsesSingle('APPROVE')} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center min-w-[100px] disabled:opacity-50 shadow-sm">
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Setujui Izin'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Reject Single */}
            {isModalRejectBuka && selectedAjuan && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalRejectBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-red-50">
                            <div className="w-10 h-10 rounded-full bg-red-200 text-red-700 flex items-center justify-center"><XSquare size={20} /></div>
                            <h3 className="font-bold text-red-900 text-lg">Tolak Pengajuan</h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 text-sm">
                                Menolak pengajuan <span className="font-bold text-gray-900">{selectedAjuan.nama}</span>.
                            </div>
                            <textarea
                                required
                                value={alasanTolak}
                                onChange={(e) => setAlasanTolak(e.target.value)}
                                rows="3"
                                placeholder="Wajib mengisi alasan penolakan untuk walikelas/klinik..."
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                autoFocus
                            ></textarea>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalRejectBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl disabled:opacity-50">Batal</button>
                            <button onClick={() => handleProsesSingle('REJECT')} disabled={isProcessing || !alasanTolak.trim()} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl flex items-center justify-center min-w-[100px] ${!alasanTolak.trim() ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm'}`}>
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Tolak Izin'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Bulk Approve */}
            {isModalBulkBuka && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalBulkBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-center gap-3 bg-emerald-600 text-white text-center">
                            <CheckCircle2 size={24} />
                            <h3 className="font-bold text-lg">Persetujuan Massal</h3>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100 shadow-inner">
                                <span className="text-4xl font-black">{selectedIds.length}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 leading-relaxed">Anda akan menyetujui <b className="text-emerald-700 text-base">{selectedIds.length} pengajuan izin</b> secara bersamaan.</p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 flex gap-2 text-left">
                                <AlertCircle className="text-amber-500 flex-shrink-0" size={16} />
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">Pastikan Anda telah membaca sekilas alasan setiap ajuan sebelum menyetujuinya secara massal. Tindakan ini akan dicatat di log audit.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalBulkBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Periksa Kembali</button>
                            <button onClick={handleProsesBulk} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-emerald-400 hover:bg-emerald-500 rounded-xl transition-colors flex items-center justify-center min-w-[150px] shadow-sm disabled:opacity-50 gap-2">
                                {isProcessing ? <Loader2 size={18} className="animate-spin text-gray-900" /> : <><CheckCircle2 size={16} /> Ya, Setujui Semua</>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PersetujuanIzin;