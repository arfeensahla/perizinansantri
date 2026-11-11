import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Search, Filter, AlertTriangle, Clock, MapPin, User, CheckCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Loader2, Phone, Eye, X, ShieldCheck, QrCode, Scan } from 'lucide-react';
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

    const selectedOption = options.find(opt => opt.value === value) || options[0] || { label: 'Pilih...' };

    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[70px] border border-gray-200 rounded-lg bg-white text-gray-700 font-bold shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm h-[36px]"
            >
                <span className="truncate">{selectedOption.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[150px] right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden animate-fade-in-down origin-top max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${value === option.value ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-gray-600 font-medium'}`}
                        >
                            <span className="truncate pr-2">{option.label}</span>
                            {value === option.value && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
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
        { value: 5, label: '5 Data' },
        { value: 10, label: '10 Data' },
        { value: 25, label: '25 Data' },
        { value: 50, label: '50 Data' }
    ];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                <div>Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> data</div>
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4 relative">
                    <span className="hidden sm:inline">Tampilan:</span>
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
            const timeA = a.rawBatasWaktu ? new Date(a.rawBatasWaktu).getTime() : 0;
            const timeB = b.rawBatasWaktu ? new Date(b.rawBatasWaktu).getTime() : 0;
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
const TabelMonitoring = ({ data, isLoading, onShowDetail }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [kelasFilter, setKelasFilter] = useState('SEMUA');
    const [sortConfig, setSortConfig] = useState({ key: 'batasTanggal', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const kelasOptions = useMemo(() => {
        const unique = Array.from(new Set(data.map(item => item.kelas).filter(k => k !== '-')));
        unique.sort((a, b) => {
            const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
            const splitA = String(a).split('-');
            const splitB = String(b).split('-');
            const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
            const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

            if (gradeA !== gradeB) {
                return (typeof gradeA === 'number' && typeof gradeB === 'number') ? gradeA - gradeB : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
            }
            return (splitA[1]?.trim() || a).localeCompare((splitB[1]?.trim() || b));
        });

        return [
            { value: 'SEMUA', label: 'Semua Kelas' },
            ...unique.map(k => ({ value: k, label: `Kelas ${k}` }))
        ];
    }, [data]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, kelasFilter]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        const filtered = data.filter(item => {
            const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nomorInduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.walikelas.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

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
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-3 bg-white">
                <div className="relative w-full lg:flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari Santri, Kode Izin, atau Walikelas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[38px]"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <Filter className="text-gray-400 hidden sm:block mr-1" size={16} />
                    <CustomSelect options={kelasOptions} value={kelasFilter} onChange={setKelasFilter} />
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

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1050px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                <div className="flex items-center gap-2">Data Santri & Izin {getSortIcon(sortConfig, 'nama')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kotaTujuan')}>
                                <div className="flex items-center gap-2">Lokasi Tujuan {getSortIcon(sortConfig, 'kotaTujuan')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batasTanggal')}>
                                <div className="flex items-center gap-2">Batas Tenggat Waktu {getSortIcon(sortConfig, 'batasTanggal')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('status')}>
                                <div className="flex items-center justify-center gap-2">Status {getSortIcon(sortConfig, 'status')}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('walikelas')}>
                                <div className="flex items-center justify-end gap-2">Penanggung Jawab {getSortIcon(sortConfig, 'walikelas')}</div>
                            </th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" /> Memuat radar pemantauan...</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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
                                    <div className="font-mono text-[10px] font-bold text-gray-400 mb-0.5">{santri.nomorInduk}</div>
                                    <div className="font-bold text-gray-900 text-base">{santri.nama} <span className="font-normal text-gray-500 text-sm">({santri.kelas})</span></div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                                            {santri.jenis.replace(/_/g, ' ')}
                                        </div>
                                        {santri.isPerpanjangan && (
                                            <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase border border-blue-100 tracking-wider shadow-sm">
                                                Perpanjangan
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700">
                                        <MapPin size={12} className="text-gray-400" /> {santri.kotaTujuan}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${santri.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-900'}`}>{santri.batasTanggal}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {santri.status === 'TERLAMBAT' ? (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse">
                                                <AlertTriangle size={12} /> TERLAMBAT
                                            </span>
                                            <span className="text-[10px] font-bold text-red-600">Telat: {santri.durasiTelat}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide">
                                                <Clock size={12} /> SEDANG IZIN
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end justify-center">
                                        <div className="text-sm font-bold text-gray-800">{santri.walikelas}</div>
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center justify-end gap-1">
                                            <Phone size={10} className="text-gray-400" /> {santri.hpWalikelas}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => onShowDetail(santri)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 rounded-lg shadow-sm text-xs font-bold transition-all"
                                    >
                                        <Eye size={14} /> Detail
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

// --- Komponen Utama Monitoring ---
const Monitoring = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [dataSantriLuar, setDataSantriLuar] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    const [selectedIzinDetail, setSelectedIzinDetail] = useState(null);
    const [isModalDetailBuka, setIsModalDetailBuka] = useState(false);
    const [trackingPetugas, setTrackingPetugas] = useState(null);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);

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

    const formatTanggalLengkap = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    const formatJamLengkap = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    };

    useEffect(() => {
        fetchDataMonitoring();

        const intervalId = setInterval(() => {
            setDataSantriLuar(prevData => prevData.map(item => {
                const batasWaktuMs = item.rawBatasWaktu ? new Date(item.rawBatasWaktu).getTime() : 0;
                const isSudahTerlewat = batasWaktuMs > 0 && batasWaktuMs < new Date().getTime();
                const newStatus = isSudahTerlewat ? 'TERLAMBAT' : item.status;

                if (newStatus === 'TERLAMBAT' && item.rawBatasWaktu) {
                    return { ...item, status: newStatus, durasiTelat: hitungDurasiTelat(item.rawBatasWaktu) };
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
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, batas_waktu, status, tujuan, parent_izin_id, alasan, waktu_berangkat, disetujui_oleh,
                    santri (
                        id, nama_lengkap,
                        kelas ( 
                            nama_kelas,
                            users!kelas_wali_kelas_id_fkey ( nama_lengkap, nomor_wa )
                        )
                    )
                `)
                .in('status', ['DI_LUAR', 'TERLAMBAT'])
                .order('batas_waktu', { ascending: true });

            if (error) throw error;

            const santriIds = [...new Set(data.map(item => item.santri?.id).filter(id => id))];
            let historyData = [];

            if (santriIds.length > 0) {
                const { data: hData, error: hErr } = await supabase
                    .from('perizinan')
                    .select('id, parent_izin_id, tujuan, alasan')
                    .in('santri_id', santriIds);
                if (!hErr && hData) historyData = hData;
            }

            const getRootTujuan = (startId) => {
                let currentId = startId;
                let foundTujuan = null;
                let visited = new Set();

                while (currentId && !visited.has(currentId)) {
                    visited.add(currentId);
                    const currentRecord = historyData.find(x => x.id === currentId);
                    if (!currentRecord) break;

                    if (currentRecord.tujuan) {
                        foundTujuan = currentRecord.tujuan;
                    } else {
                        const match = (currentRecord.alasan || '').match(/\[(.*?)\]/);
                        if (match && match[1].includes('Tujuan:')) {
                            foundTujuan = match[1].split('Tujuan:')[1].split(',')[0].trim();
                        }
                    }

                    if (foundTujuan) break;
                    currentId = currentRecord.parent_izin_id;
                }
                return foundTujuan;
            };

            const waktuSekarangMs = new Date().getTime();

            const formatted = data.map(item => {
                const namaWaliKelasRelasi = item.santri?.kelas?.users?.nama_lengkap;
                const finalWalikelas = namaWaliKelasRelasi ? `Ust. ${namaWaliKelasRelasi}` : 'Belum Diatur';
                const hpWalikelas = item.santri?.kelas?.users?.nomor_wa || '-';

                let finalTujuan = getRootTujuan(item.id);
                let kotaTujuan = finalTujuan || (item.jenis_izin.includes('KLINIK') ? 'RS/Faskes' : 'Rumah/Domisili');

                const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                const isSudahTerlewat = batasWaktuMs > 0 && batasWaktuMs < waktuSekarangMs;

                let computedStatus = item.status;
                if (isSudahTerlewat) {
                    computedStatus = 'TERLAMBAT';
                }

                let cleanAlasan = item.alasan || 'Tanpa keterangan';
                const bracketMatch = cleanAlasan.match(/\[(.*?)\]/);
                if (bracketMatch) {
                    cleanAlasan = cleanAlasan.replace(bracketMatch[0], '').trim();
                }

                return {
                    id: item.id,
                    santri_id: item.santri?.id,
                    nomorInduk: item.kode_izin || '-',
                    isPerpanjangan: item.parent_izin_id !== null,
                    nama: item.santri?.nama_lengkap || 'Unknown',
                    kelas: item.santri?.kelas?.nama_kelas || '-',
                    walikelas: finalWalikelas,
                    hpWalikelas: hpWalikelas,
                    jenis: item.jenis_izin,
                    kotaTujuan: kotaTujuan,
                    rawBatasWaktu: item.batas_waktu,
                    batasTanggal: formatTanggalLengkap(item.batas_waktu),
                    batasJam: formatJamLengkap(item.batas_waktu),
                    status: computedStatus,
                    durasiTelat: computedStatus === 'TERLAMBAT' ? hitungDurasiTelat(item.batas_waktu) : '-',
                    rawWaktuBerangkat: item.waktu_berangkat,
                    alasan: cleanAlasan,
                    parent_izin_id: item.parent_izin_id
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

    // --- FUNGSI HYPER-SAFE TRACKING UNTUK BUKA MODAL DETAIL (MULTI-LEVEL & TIMESTAMP) ---
    const bukaModalDetail = async (izin) => {
        try {
            if (!izin) return;

            setSelectedIzinDetail(izin);
            setIsModalDetailBuka(true);
            setTrackingPetugas(null);
            setIsLoadingTracking(true);

            let listIdDilacak = [izin.id];

            // Lacak ke atas jika ini adalah perpanjangan
            if (izin.parent_izin_id) {
                // Tarik semua ID di tabel perizinan untuk menemukan silsilah
                const { data: allIzinIds, error: errIzin } = await supabase
                    .from('perizinan')
                    .select('id, parent_izin_id');

                if (!errIzin && allIzinIds) {
                    let currentParentId = izin.parent_izin_id;
                    let visited = new Set(listIdDilacak);

                    while (currentParentId && !visited.has(currentParentId)) {
                        listIdDilacak.push(currentParentId);
                        visited.add(currentParentId);
                        const parentData = allIzinIds.find(x => x.id === currentParentId);
                        if (parentData) {
                            currentParentId = parentData.parent_izin_id;
                        } else {
                            break;
                        }
                    }
                } else {
                    listIdDilacak.push(izin.parent_izin_id); // Fallback aman
                }
            }

            const { data: auditData, error } = await supabase
                .from('audit_log')
                .select('aksi, created_at, users(nama_lengkap)')
                .in('data_id', listIdDilacak)
                .in('aksi', ['SCAN_KELUAR_KESANTRIAN', 'SCAN_KELUAR_GERBANG', 'SCAN_KEMBALI_GERBANG', 'SCAN_KEMBALI_GERBANG_MEDIS', 'SCAN_KEMBALI_KESANTRIAN'])
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error Supabase:", error);
                throw error;
            }

            const mapping = {
                keluarKesantrian: { nama: '-', waktu: '-' },
                keluarGerbang: { nama: '-', waktu: '-' },
                masukGerbang: { nama: '-', waktu: '-' },
                masukKesantrian: { nama: '-', waktu: '-' }
            };

            if (auditData && auditData.length > 0) {
                auditData.forEach(log => {
                    const petugas = log.users?.nama_lengkap || 'Sistem';
                    const waktuFormat = log.created_at
                        ? `${new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                        : '-';

                    const dataTahap = { nama: petugas, waktu: waktuFormat };

                    if (log.aksi === 'SCAN_KELUAR_KESANTRIAN') mapping.keluarKesantrian = dataTahap;
                    if (log.aksi === 'SCAN_KELUAR_GERBANG') mapping.keluarGerbang = dataTahap;
                    if (log.aksi.includes('SCAN_KEMBALI_GERBANG')) mapping.masukGerbang = dataTahap;
                    if (log.aksi === 'SCAN_KEMBALI_KESANTRIAN') mapping.masukKesantrian = dataTahap;
                });
            }
            setTrackingPetugas(mapping);
        } catch (error) {
            console.error("Gagal melacak petugas:", error);
            setTrackingPetugas({
                keluarKesantrian: { nama: '-', waktu: '-' },
                keluarGerbang: { nama: '-', waktu: '-' },
                masukGerbang: { nama: '-', waktu: '-' },
                masukKesantrian: { nama: '-', waktu: '-' }
            });
        } finally {
            setIsLoadingTracking(false);
        }
    };

    const totalDiLuar = dataSantriLuar.length;
    const totalTerlambat = dataSantriLuar.filter(s => s.status === 'TERLAMBAT').length;
    const totalAman = totalDiLuar - totalTerlambat;

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="text-emerald-600" />
                            Radar Keterlambatan
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Pantau seluruh santri dari semua kelas yang belum kembali ke pondok pesantren.</p>
                    </div>
                    <button
                        onClick={fetchDataMonitoring}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 w-full md:w-auto"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : null}
                        Segarkan Data
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                        {errorMsg}
                    </div>
                )}

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

                <TabelMonitoring data={dataSantriLuar} isLoading={isLoading} onShowDetail={bukaModalDetail} />
            </div>

            {/* --- MODAL DETAIL IZIN --- */}
            {isModalDetailBuka && selectedIzinDetail && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalDetailBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Header Modal */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg leading-tight">Rincian Perizinan</h3>
                                    <span className="font-mono text-xs font-bold text-gray-500 tracking-wider bg-gray-200/50 px-2 py-0.5 rounded">{selectedIzinDetail.nomorInduk}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsModalDetailBuka(false)} className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-full transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">

                            {/* Info Santri & Status */}
                            <div className="mb-6">
                                <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedIzinDetail.nama}</h2>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-bold text-emerald-600">Kelas {selectedIzinDetail.kelas}</span>
                                    <span className={`px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border ${selectedIzinDetail.status === 'TERLAMBAT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {selectedIzinDetail.status}
                                    </span>
                                </div>
                            </div>

                            {/* Info Kategori & Penanggung Jawab */}
                            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-100 pb-6">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Kategori Izin</div>
                                    <div className="font-bold text-gray-800 text-sm">{selectedIzinDetail.jenis.replace(/_/g, ' ')}</div>
                                    {selectedIzinDetail.isPerpanjangan && (
                                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase border border-blue-200 tracking-wider">
                                            Perpanjangan
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Penanggung Jawab</div>
                                    <div className="font-bold text-emerald-700 text-sm">{selectedIzinDetail.walikelas}</div>
                                </div>
                            </div>

                            {/* Box Tujuan */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                                    <MapPin size={14} /> Tujuan Izin
                                </div>
                                <div className="font-black text-gray-800 text-base">{selectedIzinDetail.kotaTujuan}</div>
                            </div>

                            {/* Box Waktu */}
                            <div className="grid grid-cols-2 gap-3 mb-6 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                                <div>
                                    <div className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mb-1">Waktu Keluar</div>
                                    <div className="font-bold text-gray-800 text-sm">
                                        {selectedIzinDetail.rawWaktuBerangkat
                                            ? `${new Date(selectedIzinDetail.rawWaktuBerangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(selectedIzinDetail.rawWaktuBerangkat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                                            : '-'
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mb-1">Batas Kembali</div>
                                    <div className="font-bold text-gray-800 text-sm">
                                        {selectedIzinDetail.rawBatasWaktu
                                            ? `${new Date(selectedIzinDetail.rawBatasWaktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(selectedIzinDetail.rawBatasWaktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                                            : '-'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Box Alasan */}
                            <div className="mb-6">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Alasan / Kepentingan</div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 italic">
                                    "{selectedIzinDetail.alasan}"
                                </div>
                            </div>

                            {/* AREA TRACKING (AUDIT LOG PETUGAS) DENGAN TIMESTAMP */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Jejak Pindaian Petugas (Log)</h4>
                                </div>

                                {isLoadingTracking ? (
                                    <div className="flex items-center justify-center py-6 text-gray-400">
                                        <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-emerald-100 ml-3 space-y-6">

                                        {/* KELUAR TAHAP 1 */}
                                        <div className="relative pl-6">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${trackingPetugas?.keluarKesantrian?.nama !== '-' ? 'border-emerald-500' : 'border-gray-300'}`}></div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                    <QrCode size={12} className={trackingPetugas?.keluarKesantrian?.nama !== '-' ? 'text-emerald-500' : ''} />
                                                    Keluar (Tahap 1 - Kesantrian)
                                                </div>
                                                {trackingPetugas?.keluarKesantrian?.waktu !== '-' && (
                                                    <div className="text-[11px] font-bold text-gray-900 mb-0.5">
                                                        {trackingPetugas?.keluarKesantrian?.waktu}
                                                    </div>
                                                )}
                                                <div className="text-xs font-medium text-gray-600">
                                                    Petugas: <span className={trackingPetugas?.keluarKesantrian?.nama !== '-' ? 'font-bold text-gray-900' : 'italic'}>{trackingPetugas?.keluarKesantrian?.nama || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* KELUAR TAHAP 2 */}
                                        <div className="relative pl-6">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${trackingPetugas?.keluarGerbang?.nama !== '-' ? 'border-emerald-500' : 'border-gray-300'}`}></div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                    <Scan size={12} className={trackingPetugas?.keluarGerbang?.nama !== '-' ? 'text-emerald-500' : ''} />
                                                    Keluar (Tahap 2 - Gerbang)
                                                </div>
                                                {trackingPetugas?.keluarGerbang?.waktu !== '-' && (
                                                    <div className="text-[11px] font-bold text-gray-900 mb-0.5">
                                                        {trackingPetugas?.keluarGerbang?.waktu}
                                                    </div>
                                                )}
                                                <div className="text-xs font-medium text-gray-600">
                                                    Petugas: <span className={trackingPetugas?.keluarGerbang?.nama !== '-' ? 'font-bold text-gray-900' : 'italic'}>{trackingPetugas?.keluarGerbang?.nama || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* KEMBALI TAHAP 1 */}
                                        <div className="relative pl-6">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${trackingPetugas?.masukGerbang?.nama !== '-' ? 'border-emerald-500' : 'border-gray-300'}`}></div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                    <Scan size={12} className={trackingPetugas?.masukGerbang?.nama !== '-' ? 'text-emerald-500' : ''} />
                                                    Kembali (Tahap 1 - Gerbang)
                                                </div>
                                                {trackingPetugas?.masukGerbang?.waktu !== '-' && (
                                                    <div className="text-[11px] font-bold text-gray-900 mb-0.5">
                                                        {trackingPetugas?.masukGerbang?.waktu}
                                                    </div>
                                                )}
                                                <div className="text-xs font-medium text-gray-600">
                                                    Petugas: <span className={trackingPetugas?.masukGerbang?.nama !== '-' ? 'font-bold text-gray-900' : 'italic'}>{trackingPetugas?.masukGerbang?.nama || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* KEMBALI TAHAP 2 */}
                                        <div className="relative pl-6">
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${trackingPetugas?.masukKesantrian?.nama !== '-' ? 'border-emerald-500' : 'border-gray-300'}`}></div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                    <QrCode size={12} className={trackingPetugas?.masukKesantrian?.nama !== '-' ? 'text-emerald-500' : ''} />
                                                    Kembali (Tahap 2 - Kesantrian Lapor)
                                                </div>
                                                {trackingPetugas?.masukKesantrian?.waktu !== '-' && (
                                                    <div className="text-[11px] font-bold text-gray-900 mb-0.5">
                                                        {trackingPetugas?.masukKesantrian?.waktu}
                                                    </div>
                                                )}
                                                <div className="text-xs font-medium text-gray-600">
                                                    Petugas: <span className={trackingPetugas?.masukKesantrian?.nama !== '-' ? 'font-bold text-gray-900' : 'italic'}>{trackingPetugas?.masukKesantrian?.nama || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
                            <button onClick={() => setIsModalDetailBuka(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-bold text-sm transition-all shadow-sm">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Monitoring;