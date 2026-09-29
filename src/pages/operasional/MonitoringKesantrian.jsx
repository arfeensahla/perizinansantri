import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, Search, Filter, AlertTriangle, Clock, MapPin, User, CheckCircle, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

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
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                    <span className="hidden sm:inline">Halaman</span>
                    <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} />
                    <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                </div>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

// --- Logika Sorting ---
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

const MonitoringKesantrian = () => {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [dataSantriLuar, setDataSantriLuar] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // --- State Pencarian & Filter ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterStatus, setFilterStatus] = useState('SEMUA');
    const [filterKelas, setFilterKelas] = useState('SEMUA');

    // --- State Sorting & Pagination ---
    const [sortConfig, setSortConfig] = useState({ key: 'batasTanggal', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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

        // Auto-update durasi telat setiap 1 menit
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
            // Tarik data dengan DISETUJUI agar perpanjangan terdeteksi
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, batas_waktu, status, tujuan, parent_izin_id,
                    santri (
                        id, nama_lengkap,
                        kelas ( nama_kelas, users!kelas_wali_kelas_id_fkey ( nama_lengkap, nomor_wa ) )
                    )
                `)
                .in('status', ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DI_LUAR', 'TERLAMBAT']);

            if (error) throw error;
            const allIzin = data || [];

            // FILTER CERDAS: Hapus izin lama HANYA JIKA perpanjangannya sudah DI-ACC
            const replacedParentIds = allIzin
                .filter(i => i.parent_izin_id !== null && ['DISETUJUI', 'DI_LUAR', 'TERLAMBAT'].includes(i.status))
                .map(i => i.parent_izin_id);

            const validData = allIzin.filter(i => !replacedParentIds.includes(i.id));
            let formattedList = [];
            const waktuSekarangMs = new Date().getTime();

            validData.forEach(item => {
                const isAktifBerjalan = item.status === 'DI_LUAR' || item.status === 'TERLAMBAT' || (item.status === 'DISETUJUI' && item.parent_izin_id !== null);

                if (isAktifBerjalan) {
                    const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                    const isSudahTerlewat = batasWaktuMs < waktuSekarangMs;
                    const isPendingPerpanjangan = allIzin.some(p => p.parent_izin_id === item.id && p.status === 'MENUNGGU_PERSETUJUAN');

                    let computedStatus = item.status === 'DISETUJUI' ? 'DI_LUAR' : item.status;
                    if (isSudahTerlewat) computedStatus = 'TERLAMBAT';

                    let namaWalikelas = item.santri?.kelas?.users?.nama_lengkap || 'Belum Diatur';
                    let hpWalikelas = item.santri?.kelas?.users?.nomor_wa || '-';

                    let finalTujuan = item.tujuan;
                    if (!finalTujuan) finalTujuan = item.jenis_izin.includes('KLINIK') ? 'RS/Faskes Luar' : 'Rumah/Domisili';

                    formattedList.push({
                        id: item.kode_izin || item.id,
                        nama: item.santri?.nama_lengkap || 'Unknown',
                        kelas: item.santri?.kelas?.nama_kelas || '-',
                        walikelas: `Ust. ${namaWalikelas}`,
                        hpWalikelas: hpWalikelas,
                        jenisIzin: item.jenis_izin,
                        tujuan: finalTujuan,
                        rawBatasWaktu: item.batas_waktu,
                        batasWaktu: item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-',
                        status: computedStatus,
                        durasiTelat: computedStatus === 'TERLAMBAT' ? hitungDurasiTelat(item.batas_waktu) : '-',
                        isPending: isPendingPerpanjangan // Flag khusus jika sedang ada ajuan perpanjangan
                    });
                }
            });

            setDataSantriLuar(formattedList);
        } catch (error) {
            console.error("Gagal memuat data monitoring:", error);
            setErrorMsg("Gagal terhubung ke database. Silakan muat ulang.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Hitung Statistik ---
    const totalDiLuar = dataSantriLuar.length;
    const totalTerlambat = dataSantriLuar.filter(s => s.status === 'TERLAMBAT').length;
    const totalAman = totalDiLuar - totalTerlambat;

    // --- Logika Filter Data ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        const filtered = dataSantriLuar.filter(santri => {
            const matchKata = santri.nama.toLowerCase().includes(kataKunci.toLowerCase()) || santri.walikelas.toLowerCase().includes(kataKunci.toLowerCase());
            const matchStatus = filterStatus === 'SEMUA' || santri.status === filterStatus;

            let matchKelas = true;
            if (filterKelas !== 'SEMUA') {
                const mapRomawi = { '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII' };
                const romawiDicari = mapRomawi[filterKelas];
                matchKelas = santri.kelas.startsWith(romawiDicari) || santri.kelas.startsWith(filterKelas);
            }

            return matchKata && matchStatus && matchKelas;
        });

        return smartSortData(filtered, sortConfig);
    }, [dataSantriLuar, kataKunci, filterStatus, filterKelas, sortConfig]);

    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-emerald-600" />
                        Radar Kesantrian (Monitoring)
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pencocokan data absensi asrama dengan daftar santri yang sedang izin keluar/pulang.</p>
                </div>
                <button onClick={fetchDataMonitoring} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors hidden md:block">
                    Segarkan Data
                </button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {/* --- STATISTIK RADAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total di Luar Asrama</div>
                        <div className="text-2xl font-black text-gray-800">{isLoading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : totalDiLuar} <span className="text-sm font-medium text-gray-500">Santri</span></div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Status Aman (Masih Izin)</div>
                        <div className="text-2xl font-black text-emerald-800">{isLoading ? <Loader2 size={20} className="animate-spin text-emerald-500" /> : totalAman} <span className="text-sm font-medium text-emerald-600/70">Santri</span></div>
                    </div>
                </div>

                <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center relative z-10">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm font-bold text-red-700 uppercase tracking-wider mb-0.5">Terlambat Kembali</div>
                        <div className="text-2xl font-black text-red-800">{isLoading ? <Loader2 size={20} className="animate-spin text-red-400" /> : totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></div>
                    </div>
                    {totalTerlambat > 0 && <AlertTriangle className="absolute -right-4 -bottom-4 text-red-200 opacity-40 w-24 h-24 transform -rotate-12" />}
                </div>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari Nama Santri atau Nama Walikelas..."
                        value={kataKunci}
                        onChange={(e) => { setKataKunci(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>

                <div className="flex gap-3 md:w-auto w-full">
                    <div className="flex-1 md:w-40 flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-1">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={filterKelas}
                            onChange={(e) => { setFilterKelas(e.target.value); setCurrentPage(1); }}
                            className="px-2 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-full"
                        >
                            <option value="SEMUA">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                            <option value="10">Kelas 10</option>
                            <option value="11">Kelas 11</option>
                            <option value="12">Kelas 12</option>
                        </select>
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="flex-1 md:w-56 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700"
                    >
                        <option value="SEMUA">Semua Status</option>
                        <option value="TERLAMBAT">Hanya Terlambat</option>
                        <option value="DI_LUAR">Masih Aman (Di Luar)</option>
                    </select>
                </div>
            </div>

            {/* --- TABEL DATA GLOBAL --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[850px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                    <div className="flex items-center gap-2">Data Santri & Kategori {getSortIcon(sortConfig, 'nama')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tujuan')}>
                                    <div className="flex items-center gap-2">Tujuan Izin {getSortIcon(sortConfig, 'tujuan')}</div>
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
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data kesantrian...</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <CheckCircle size={48} className="mb-3 opacity-20 text-emerald-500" />
                                            <p className="text-base font-bold text-gray-600">Alhamdulillah, Radar Bersih!</p>
                                            <p className="text-sm mt-1">Tidak ada santri di luar asrama yang sesuai dengan pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentData.map((santri) => (
                                <tr key={santri.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                                                {santri.kelas}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-base">{santri.nama}</div>
                                                <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                                                    {santri.jenisIzin.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700">
                                            <MapPin size={12} className="text-gray-400" /> {santri.tujuan}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {santri.status === 'TERLAMBAT' ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse">
                                                    <AlertTriangle size={12} /> MELEWATI BATAS ({santri.durasiTelat})
                                                </span>
                                                <span className="text-[11px] font-mono font-bold text-red-600">Batas: {santri.batasWaktu}</span>
                                            </div>
                                        ) : santri.isPending ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black tracking-wide">
                                                    <Clock size={12} /> MENUNGGU ACC
                                                </span>
                                                <span className="text-[11px] font-mono text-amber-600">Batas: {santri.batasWaktu}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide">
                                                    <Clock size={12} /> SEDANG IZIN
                                                </span>
                                                <span className="text-[11px] font-mono text-gray-600">Batas: {santri.batasWaktu}</span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm font-bold text-gray-800">{santri.walikelas}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">Kontak: {santri.hpWalikelas}</div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                </div>
            </div>
        </div>
    );
};

export default MonitoringKesantrian;