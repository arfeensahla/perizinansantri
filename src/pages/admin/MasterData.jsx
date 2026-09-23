import React, { useState, useEffect } from 'react';
import { Database, Users, GraduationCap, Search, Plus, Edit, Trash2, FileSpreadsheet, X, UploadCloud, Download, Phone, MapPin, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';

const MasterData = () => {
    const [tabAktif, setTabAktif] = useState('SANTRI');

    // --- State Manajemen Santri ---
    const [kataKunciSantri, setKataKunciSantri] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [isModalSantriBuka, setIsModalSantriBuka] = useState(false);

    // --- State Manajemen Kelas ---
    const [kataKunciKelas, setKataKunciKelas] = useState('');
    const [isModalKelasBuka, setIsModalKelasBuka] = useState(false);

    // --- State Database (Supabase) ---
    const [dataKelas, setDataKelas] = useState([]);
    const [dataSantri, setDataSantri] = useState([]);
    const [isLoadingKelas, setIsLoadingKelas] = useState(true);
    const [isLoadingSantri, setIsLoadingSantri] = useState(true);

    // ==========================================
    // STATE SORTING & PAGINATION (DIPERBARUI)
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10); // Sekarang bisa diubah-ubah

    // State Santri
    const [currentPageSantri, setCurrentPageSantri] = useState(1);
    const [sortConfigSantri, setSortConfigSantri] = useState({ key: 'nama', direction: 'asc' });

    // State Kelas
    const [currentPageKelas, setCurrentPageKelas] = useState(1);
    const [sortConfigKelas, setSortConfigKelas] = useState({ key: 'nama', direction: 'asc' });

    // State Import & Form Write
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);
    const [fileExcel, setFileExcel] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [formKelas, setFormKelas] = useState({ nama: '' });
    const [formSantri, setFormSantri] = useState({
        nama: '', kelas_id: '', gender: 'Laki-laki', kota: '', namaWali: '', waWali: ''
    });

    // --- Fetch Data ---
    useEffect(() => {
        fetchDataKelas();
        fetchDataSantri();
    }, []);

    const fetchDataKelas = async () => {
        setIsLoadingKelas(true);
        try {
            // Menarik data tanpa pengurutan dari Supabase, karena kita akan mengurutkannya secara cerdas di Frontend
            const { data, error } = await supabase.from('kelas').select(`id, nama_kelas, users!kelas_wali_kelas_id_fkey(nama_lengkap), santri(id)`);
            if (error) throw error;

            let formatted = data.map(k => ({
                id: k.id, nama: k.nama_kelas, wali: k.users ? k.users.nama_lengkap : '-', totalSantri: k.santri ? k.santri.length : 0
            }));

            // ==========================================
            // LOGIKA PENGURUTAN (SORTING) CERDAS KELAS
            // ==========================================
            formatted.sort((a, b) => {
                // 1. Kamus konversi Romawi SMP/SMA ke angka asli agar urutan logis (VII=7, IX=9)
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };

                // 2. Memisahkan string, misal "VIII-A" menjadi ["VIII", "A"]
                const splitA = a.nama.split('-');
                const splitB = b.nama.split('-');

                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                // 3. Urutkan berdasarkan Tingkat Kelas terlebih dahulu (7, 8, 9)
                if (gradeA !== gradeB) {
                    if (typeof gradeA === 'number' && typeof gradeB === 'number') return gradeA - gradeB;
                    return String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                }

                // 4. Jika tingkat kelas sama (misal sama-sama VIII), urutkan abjad belakangnya (A, B, C, D, H)
                const sectionA = splitA[1]?.trim() || a.nama;
                const sectionB = splitB[1]?.trim() || b.nama;
                return sectionA.localeCompare(sectionB);
            });

            setDataKelas(formatted);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingKelas(false);
        }
    };

    const fetchDataSantri = async () => {
        setIsLoadingSantri(true);
        try {
            const { data, error } = await supabase.from('santri').select(`id, nama_lengkap, jenis_kelamin, kota_asal, nama_wali, nomor_wa_wali, kelas(nama_kelas)`);
            if (error) throw error;
            setDataSantri(data.map(s => ({
                id: s.id, nama: s.nama_lengkap, gender: s.jenis_kelamin, kotaAsal: s.kota_asal, kelas: s.kelas ? s.kelas.nama_kelas : '-', waliSiswa: s.nama_wali, nomorWhatsApp: s.nomor_wa_wali
            })));
        } catch (error) { console.error(error); } finally { setIsLoadingSantri(false); }
    };

    // --- Logika Sorting ---
    const handleSort = (key, config, setConfig) => {
        let direction = 'asc';
        if (config.key === key && config.direction === 'asc') direction = 'desc';
        setConfig({ key, direction });
    };

    const getSortIcon = (config, key) => {
        if (config.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return config.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
    };

    const sortData = (data, config) => {
        return [...data].sort((a, b) => {
            // Gunakan logika cerdas angka romawi KHUSUS untuk kolom 'kelas' (Tabel Santri) 
            // atau kolom 'nama' (Tabel Kelas - dideteksi dari adanya totalSantri)
            const isKolomKelas = config.key === 'kelas' || (config.key === 'nama' && a.totalSantri !== undefined);

            if (isKolomKelas) {
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                const splitA = String(a[config.key] || '').split('-');
                const splitB = String(b[config.key] || '').split('-');

                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                let comparison = 0;
                // Urutkan angkanya dulu (7, 8, 9)
                if (gradeA !== gradeB) {
                    if (typeof gradeA === 'number' && typeof gradeB === 'number') {
                        comparison = gradeA - gradeB;
                    } else {
                        comparison = String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                    }
                } else {
                    // Jika angkanya sama (sama-sama 8), urutkan abjadnya (A, B, C)
                    const sectionA = splitA[1]?.trim() || String(a[config.key] || '');
                    const sectionB = splitB[1]?.trim() || String(b[config.key] || '');
                    comparison = sectionA.localeCompare(sectionB);
                }

                return config.direction === 'asc' ? comparison : -comparison;
            }

            // Default sorting murni untuk teks biasa (Nama Santri, Kota Asal, Walikelas, dll)
            if (a[config.key] < b[config.key]) return config.direction === 'asc' ? -1 : 1;
            if (a[config.key] > b[config.key]) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Reset pagination ketika filter berubah
    useEffect(() => { setCurrentPageSantri(1); }, [kataKunciSantri, filterKelas]);
    useEffect(() => { setCurrentPageKelas(1); }, [kataKunciKelas]);

    // --- Alur Data ---
    const filteredSantri = dataSantri.filter(s => {
        const matchKata = s.nama.toLowerCase().includes(kataKunciSantri.toLowerCase()) || s.kotaAsal.toLowerCase().includes(kataKunciSantri.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || s.kelas === filterKelas;
        return matchKata && matchKelas;
    });
    const sortedSantri = sortData(filteredSantri, sortConfigSantri);
    const totalPagesSantri = Math.ceil(sortedSantri.length / itemsPerPage);
    const currentSantri = sortedSantri.slice((currentPageSantri - 1) * itemsPerPage, currentPageSantri * itemsPerPage);

    const filteredKelas = dataKelas.filter(k =>
        k.nama.toLowerCase().includes(kataKunciKelas.toLowerCase()) || k.wali.toLowerCase().includes(kataKunciKelas.toLowerCase())
    );
    const sortedKelas = sortData(filteredKelas, sortConfigKelas);
    const totalPagesKelas = Math.ceil(sortedKelas.length / itemsPerPage);
    const currentKelas = sortedKelas.slice((currentPageKelas - 1) * itemsPerPage, currentPageKelas * itemsPerPage);


    // --- FUNGSI WRITE & IMPORT ---
    const handleSimpanKelas = async () => { /* Logika sama seperti sebelumnya */ };
    const handleSimpanSantri = async () => { /* Logika sama seperti sebelumnya */ };
    const unduhTemplateExcel = () => { /* Logika sama seperti sebelumnya */ };
    const handleProsesImport = async () => { /* Logika sama seperti sebelumnya */ };

    // ==========================================
    // KOMPONEN PAGINATION LANJUTAN (Advanced UI)
    // ==========================================
    const PaginationControls = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
        // State lokal untuk menampung ketikan pengguna di kotak input halaman
        const [inputPage, setInputPage] = useState(currentPage);

        // Sinkronisasi otomatis jika tombol Prev/Next ditekan
        useEffect(() => {
            setInputPage(currentPage);
        }, [currentPage]);

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
                {/* Bagian Kiri: Info & Pilih Jumlah Baris */}
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                    <div>
                        Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> data
                    </div>
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                        <span className="hidden sm:inline">Per halaman:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1); // Reset ke halaman 1 tiap limit diubah
                            }}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold transition-all shadow-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {/* Bagian Kanan: Kontrol Paginasi dengan Input */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                        <span className="hidden sm:inline">Halaman</span>
                        <input
                            type="number"
                            value={inputPage}
                            onChange={(e) => setInputPage(e.target.value)}
                            onBlur={handlePageSubmit}
                            onKeyDown={handlePageSubmit}
                            className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={1}
                            max={totalPages}
                            title="Ketik lalu Enter"
                        />
                        <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                {/* --- HEADER --- */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Database className="text-emerald-600" /> Master Data
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Pusat pengelolaan data referensi kelas dan santri pondok pesantren.</p>
                    </div>
                </div>

                {/* --- TAB NAVIGASI --- */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
                    <button onClick={() => setTabAktif('SANTRI')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'SANTRI' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Users size={18} /> Data Santri</button>
                    <button onClick={() => setTabAktif('KELAS')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'KELAS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><GraduationCap size={18} /> Data Kelas</button>
                </div>

                {/* =========================================
                    TAB 1: TAMPILAN DATA SANTRI
                ============================================= */}
                {tabAktif === 'SANTRI' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                                <div className="relative flex-1 md:max-w-xs">
                                    <input type="text" placeholder="Cari Nama Santri atau Kota Asal..." value={kataKunciSantri} onChange={(e) => setKataKunciSantri(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700">
                                    <option value="SEMUA">Semua Kelas</option>
                                    {dataKelas.map(k => <option key={k.id} value={k.nama}>Kelas {k.nama}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setIsModalImportBuka(true)} className="flex-1 md:flex-none bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <FileSpreadsheet size={18} /> Impor Data
                                </button>
                                <button onClick={() => setIsModalSantriBuka(true)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    <Plus size={18} /> Tambah Santri
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[850px]">
                                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Nama Lengkap Santri {getSortIcon(sortConfigSantri, 'nama')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kelas', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kelas & Jenis Kelamin {getSortIcon(sortConfigSantri, 'kelas')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kotaAsal', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kota Asal {getSortIcon(sortConfigSantri, 'kotaAsal')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('waliSiswa', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kontak Orang Tua / Wali {getSortIcon(sortConfigSantri, 'waliSiswa')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingSantri ? (
                                            <tr><td colSpan="5" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                                        ) : currentSantri.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data santri tidak ditemukan.</td></tr>
                                        ) : currentSantri.map((santri) => (
                                            <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4"><div className="font-bold text-gray-900 text-base">{santri.nama}</div></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-black">Kelas {santri.kelas}</span>
                                                        <span className={`text-[11px] font-bold ${santri.gender === 'Laki-laki' ? 'text-blue-600' : 'text-pink-600'}`}>{santri.gender}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><div className="font-medium text-gray-800 flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" />{santri.kotaAsal}</div></td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{santri.waliSiswa}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={12} /> {santri.nomorWhatsApp}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationControls
                                    currentPage={currentPageSantri}
                                    totalPages={totalPagesSantri}
                                    totalItems={sortedSantri.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPageSantri}
                                    onItemsPerPageChange={setItemsPerPage}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================
                    TAB 2: TAMPILAN DATA KELAS
                ============================================= */}
                {tabAktif === 'KELAS' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 md:max-w-sm w-full">
                                <input type="text" placeholder="Cari nama kelas..." value={kataKunciKelas} onChange={(e) => setKataKunciKelas(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                            <button onClick={() => setIsModalKelasBuka(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                <Plus size={18} /> Tambah Kelas
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Nama Kelas {getSortIcon(sortConfigKelas, 'nama')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalSantri', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Total Santri {getSortIcon(sortConfigKelas, 'totalSantri')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('wali', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Walikelas {getSortIcon(sortConfigKelas, 'wali')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingKelas ? (
                                            <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data kelas...</td></tr>
                                        ) : currentKelas.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Data kelas tidak ditemukan.</td></tr>
                                        ) : currentKelas.map((kelas) => (
                                            <tr key={kelas.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-black text-lg text-gray-800">Kelas {kelas.nama}</td>
                                                <td className="px-6 py-4"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold">{kelas.totalSantri} Santri</span></td>
                                                <td className="px-6 py-4 font-medium text-gray-700">{kelas.wali !== '-' ? kelas.wali : <span className="text-red-500 italic text-xs">Belum ditugaskan</span>}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationControls
                                    currentPage={currentPageKelas}
                                    totalPages={totalPagesKelas}
                                    totalItems={sortedKelas.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPageKelas}
                                    onItemsPerPageChange={setItemsPerPage}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tambah/Import disembunyikan untuk ringkasnya (Gunakan yang dari versi sebelumnya) */}
            {/* Modal Tambah Santri */}
            {isModalSantriBuka && (<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalSantriBuka(false)}><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}><div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50"><h3 className="font-bold text-gray-800 text-lg">Tambah Data Santri</h3><button onClick={() => setIsModalSantriBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button></div><div className="p-6 space-y-4"><div><label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap Santri <span className="text-red-500">*</span></label><input type="text" value={formSantri.nama} onChange={(e) => setFormSantri({ ...formSantri, nama: e.target.value })} placeholder="Nama sesuai ijazah" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-1.5">Kelas <span className="text-red-500">*</span></label><select value={formSantri.kelas_id} onChange={(e) => setFormSantri({ ...formSantri, kelas_id: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"><option value="" disabled>-- Pilih Kelas --</option>{dataKelas.map(k => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}</select></div><div><label className="block text-sm font-bold text-gray-700 mb-1.5">Jenis Kelamin</label><select value={formSantri.gender} onChange={(e) => setFormSantri({ ...formSantri, gender: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div></div><div className="pt-2 border-t border-gray-100"><label className="block text-sm font-bold text-gray-700 mb-1.5">Kota Asal</label><input type="text" value={formSantri.kota} onChange={(e) => setFormSantri({ ...formSantri, kota: e.target.value })} placeholder="Contoh: Cirebon" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" /><label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Orang Tua / Wali</label><input type="text" value={formSantri.namaWali} onChange={(e) => setFormSantri({ ...formSantri, namaWali: e.target.value })} placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" /><label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor WhatsApp Wali <span className="text-red-500">*</span></label><input type="text" value={formSantri.waWali} onChange={(e) => setFormSantri({ ...formSantri, waWali: e.target.value })} placeholder="Contoh: 081234567890" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" /></div></div><div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"><button onClick={() => setIsModalSantriBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button><button onClick={handleSimpanSantri} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</button></div></div></div>)}

            {/* Modal Import Excel */}
            {isModalImportBuka && (<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }}><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}><div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50"><h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileSpreadsheet className="text-emerald-600" size={20} /> Impor Data Santri</h3><button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button></div><div className="p-6"><div className="mb-6"><h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 1: Unduh Format Standar</h4><p className="text-xs text-gray-500 mb-3">Kolom wajib diisi: <strong>Nama, Jenis Kelamin, Asal Kota, Kelas, Nama Wali, Nomor WhatsApp</strong>.</p><button onClick={unduhTemplateExcel} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition-colors"><Download size={18} /> Unduh Template Excel (.xlsx)</button></div><div><h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 2: Unggah File Excel</h4><input className="hidden" id="file-upload" type="file" accept=".xlsx, .xls" onChange={(e) => setFileExcel(e.target.files[0])} /><label htmlFor="file-upload" className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group"><div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={28} className={fileExcel ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"} /></div><p className="text-sm font-bold text-gray-700 mb-1">{fileExcel ? fileExcel.name : 'Klik untuk memilih file'}</p>{!fileExcel && <p className="text-xs text-gray-500">Mendukung format .xlsx atau .xls</p>}</label></div></div><div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"><button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button><button onClick={handleProsesImport} disabled={!fileExcel || isImporting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{isImporting ? 'Memproses...' : 'Mulai Impor'}</button></div></div></div>)}

            {/* Modal Tambah Kelas */}
            {isModalKelasBuka && (<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalKelasBuka(false)}><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}><div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50"><h3 className="font-bold text-gray-800 text-lg">Tambah Kelas</h3><button onClick={() => setIsModalKelasBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button></div><div className="p-6"><label className="block text-sm font-bold text-gray-700 mb-1.5">Nama / Kode Kelas <span className="text-red-500">*</span></label><input type="text" value={formKelas.nama} onChange={(e) => setFormKelas({ nama: e.target.value })} placeholder="Contoh: 10A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold uppercase" /><p className="text-[11px] text-gray-500 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">💡 <strong>Catatan:</strong> Untuk menugaskan Walikelas pada kelas ini, silakan atur melalui halaman <strong>Manajemen Pengguna</strong>.</p></div><div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"><button onClick={() => setIsModalKelasBuka(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button><button onClick={handleSimpanKelas} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button></div></div></div>)}
        </>
    );
};

export default MasterData;