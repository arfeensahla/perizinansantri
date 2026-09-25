import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Search, Filter, AlertTriangle, Clock, MapPin, User, CheckCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// --- Komponen Custom Select (Standar) ---
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

const getSortIcon = (config, key) => {
    if (config.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
    return config.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
};

// --- KOMPONEN TABEL MODULAR ---
const TabelMonitoring = ({ data, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [kelasFilter, setKelasFilter] = useState('SEMUA');
    const [sortConfig, setSortConfig] = useState({ key: 'batasTanggal', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, kelasFilter]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Pipa Data Terpusat
    const processedData = useMemo(() => {
        const filtered = data.filter(item => {
            const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomorInduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.walikelas.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

            // Logika cerdas filter awalan Kelas Romawi
            let matchKelas = true;
            if (kelasFilter !== 'SEMUA') {
                const mapRomawi = { '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII' };
                const romawiDicari = mapRomawi[kelasFilter];
                matchKelas = item.kelas.startsWith(romawiDicari) || item.kelas.startsWith(kelasFilter);
            }

            return matchSearch && matchStatus && matchKelas;
        });

        return smartSortData(filtered, sortConfig);
    }, [data, searchTerm, statusFilter, kelasFilter, sortConfig]);

    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            {/* Toolbar Filter & Search */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
                <div className="relative w-full md:flex-1 md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari Santri, NIS, atau Walikelas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[38px]"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-gray-400 hidden sm:block" size={16} />
                    <CustomSelect
                        options={[
                            { value: 'SEMUA', label: 'Semua Kelas' },
                            { value: '7', label: 'Kelas 7 (VII)' },
                            { value: '8', label: 'Kelas 8 (VIII)' },
                            { value: '9', label: 'Kelas 9 (IX)' },
                            { value: '10', label: 'Kelas 10 (X)' },
                            { value: '11', label: 'Kelas 11 (XI)' },
                            { value: '12', label: 'Kelas 12 (XII)' }
                        ]}
                        value={kelasFilter}
                        onChange={setKelasFilter}
                    />
                    <CustomSelect
                        options={[
                            { value: 'ALL', label: 'Semua Status' },
                            { value: 'DI_LUAR', label: 'Aman (Di Luar)' },
                            { value: 'TERLAMBAT', label: 'Terlambat' }
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Table Area (Tanpa Tombol WhatsApp) */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[850px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                <div className="flex items-center gap-2">Data Santri & Kategori {getSortIcon(sortConfig, 'nama')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kotaTujuan')}>
                                <div className="flex items-center gap-2">Tujuan Izin {getSortIcon(sortConfig, 'kotaTujuan')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batasTanggal')}>
                                <div className="flex items-center gap-2">Status & Waktu Tenggat {getSortIcon(sortConfig, 'batasTanggal')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('walikelas')}>
                                <div className="flex items-center justify-end gap-2">Informasi Walikelas {getSortIcon(sortConfig, 'walikelas')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" /> Memuat radar pemantauan...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <CheckCircle size={48} className="mb-3 opacity-20 text-emerald-500" />
                                        <p className="text-base font-bold text-gray-600">Alhamdulillah, Radar Bersih!</p>
                                        <p className="text-sm mt-1">Tidak ada santri yang sesuai dengan filter pencarian Anda.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : currentData.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200 flex-shrink-0">
                                            {santri.kelas}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">{santri.nama} <span className="font-mono text-gray-400 font-normal text-xs ml-1">({santri.nomorInduk})</span></div>
                                            <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">
                                                {santri.jenis.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700">
                                        <MapPin size={12} className="text-gray-400" /> {santri.kotaTujuan}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {santri.status === 'TERLAMBAT' ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse">
                                                <AlertTriangle size={12} /> MELEWATI BATAS ({santri.durasiTelat})
                                            </span>
                                            <span className="text-[11px] font-mono font-bold text-red-600" title={santri.batasTanggal}>
                                                Batas: {santri.batasJam} WIB
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide">
                                                <Clock size={12} /> SEDANG IZIN
                                            </span>
                                            <span className="text-[11px] font-mono text-gray-600" title={santri.batasTanggal}>
                                                Batas: {santri.batasJam} WIB
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end justify-center">
                                        <div className="text-sm font-bold text-gray-800">{santri.walikelas}</div>
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">Kontak: {santri.hpWalikelas || '-'}</div>
                                    </div>
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

// --- Komponen Utama Monitoring ---
const Monitoring = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [dataSantriLuar, setDataSantriLuar] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Kalkulasi Durasi Keterlambatan Otomatis ---
    const hitungDurasiTelat = (batasWaktuISO) => {
        const sekarang = new Date();
        const batasWaktu = new Date(batasWaktuISO);
        const selisihMs = sekarang - batasWaktu;

        if (selisihMs <= 0) return '-';

        const selisihJam = Math.floor(selisihMs / (1000 * 60 * 60));
        const sisaMenit = Math.floor((selisihMs % (1000 * 60 * 60)) / (1000 * 60));

        if (selisihJam > 24) {
            const hari = Math.floor(selisihJam / 24);
            return `${hari} Hari ${selisihJam % 24} Jam`;
        }
        if (selisihJam > 0) return `${selisihJam} Jam ${sisaMenit} Menit`;
        return `${sisaMenit} Menit`;
    };

    useEffect(() => {
        fetchDataMonitoring();

        // Setup Interval untuk Update Durasi Telat (Setiap 1 Menit)
        const intervalId = setInterval(() => {
            setDataSantriLuar(prevData => prevData.map(item => {
                if (item.status === 'TERLAMBAT' && item.rawBatasWaktu) {
                    return { ...item, durasiTelat: hitungDurasiTelat(item.rawBatasWaktu) };
                }
                return item;
            }));
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchDataMonitoring = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // HAPUS pemanggilan 'nis' dari dalam relasi santri
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, batas_waktu, status, tujuan,
                    santri (
                        id, nama_lengkap,
                        kelas ( 
                            nama_kelas,
                            users!kelas_wali_kelas_id_fkey ( nama_lengkap )
                        )
                    )
                `)
                .in('status', ['DI_LUAR', 'TERLAMBAT'])
                .order('batas_waktu', { ascending: true });

            if (error) throw error;

            const formatted = data.map(item => {
                const namaWaliKelasRelasi = item.santri?.kelas?.users?.nama_lengkap;
                const finalWalikelas = namaWaliKelasRelasi ? `Ust. ${namaWaliKelasRelasi}` : 'Belum Diatur';

                // Karena belum pasti ada kolom nomor telepon di tabel users, kita default ke '-' 
                const hpWalikelas = '-';

                let kotaTujuan = item.tujuan || (item.jenis_izin.includes('KLINIK') ? 'RS/Faskes' : 'Rumah/Domisili');

                return {
                    id: item.id,
                    nomorInduk: item.kode_izin, // Ganti NIS yang tidak ada dengan Kode Izin
                    nama: item.santri?.nama_lengkap || 'Unknown',
                    kelas: item.santri?.kelas?.nama_kelas || '-',
                    walikelas: finalWalikelas,
                    hpWalikelas: hpWalikelas,
                    jenis: item.jenis_izin,
                    kotaTujuan: kotaTujuan,
                    rawBatasWaktu: item.batas_waktu,
                    batasTanggal: item.batas_waktu ? new Date(item.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                    batasJam: item.batas_waktu ? new Date(item.batas_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
                    status: item.status,
                    durasiTelat: item.status === 'TERLAMBAT' ? hitungDurasiTelat(item.batas_waktu) : '-'
                };
            });

            setDataSantriLuar(formatted);
        } catch (error) {
            console.error("Gagal memuat data monitoring:", error);
            setErrorMsg("Gagal memuat data radar dari server: " + (error.message || 'Silakan cek console Chrome'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Kalkulasi Statistik ---
    const totalDiLuar = dataSantriLuar.length;
    const totalTerlambat = dataSantriLuar.filter(s => s.status === 'TERLAMBAT').length;
    const totalAman = totalDiLuar - totalTerlambat;

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-emerald-600" />
                        Radar Keterlambatan
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau seluruh santri dari semua kelas yang belum kembali ke pondok pesantren.</p>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {/* --- STATISTIK RADAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total di Luar</div>
                        <div className="text-2xl font-black text-gray-800">
                            {isLoading ? <Loader2 size={20} className="animate-spin mt-1 text-gray-400" /> : <>{totalDiLuar} <span className="text-sm font-medium text-gray-500">Santri</span></>}
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-all">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Status Aman</div>
                        <div className="text-2xl font-black text-emerald-800">
                            {isLoading ? <Loader2 size={20} className="animate-spin mt-1 text-emerald-500" /> : <>{totalAman} <span className="text-sm font-medium text-emerald-600/70">Santri</span></>}
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden hover:border-red-300 transition-all">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center relative z-10">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm font-bold text-red-700 uppercase tracking-wider mb-0.5">Terlambat Kembali</div>
                        <div className="text-2xl font-black text-red-800">
                            {isLoading ? <Loader2 size={20} className="animate-spin mt-1 text-red-400" /> : <>{totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></>}
                        </div>
                    </div>
                    {totalTerlambat > 0 && <AlertTriangle className="absolute -right-4 -bottom-4 text-red-200 opacity-40 w-24 h-24 transform -rotate-12" />}
                </div>
            </div>

            {/* TABEL PENGAMATAN (MODULAR) */}
            <TabelMonitoring data={dataSantriLuar} isLoading={isLoading} />
        </div>
    );
};

export default Monitoring;