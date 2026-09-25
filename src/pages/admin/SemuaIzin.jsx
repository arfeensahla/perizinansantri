import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Search, Download, Printer, Filter, Eye, CheckCircle, AlertTriangle, Clock, XCircle, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, QrCode } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';
import ModalQR from '../../components/ModalQR';

const SemuaIzin = () => {
    // --- State Filters ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [filterJenis, setFilterJenis] = useState('SEMUA');
    const [filterStatus, setFilterStatus] = useState('AKTIF');
    const [tanggalAwal, setTanggalAwal] = useState('');
    const [tanggalAkhir, setTanggalAkhir] = useState('');

    // --- State Database ---
    const [riwayatIzin, setRiwayatIzin] = useState([]);
    const [dataKelas, setDataKelas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // --- State Modal Detail & QR ---
    const [isModalDetailBuka, setIsModalDetailBuka] = useState(false);
    const [selectedIzin, setSelectedIzin] = useState(null);

    const [isModalQRBuka, setIsModalQRBuka] = useState(false);
    const [selectedIzinQR, setSelectedIzinQR] = useState(null);

    // ==========================================
    // STATE SORTING & PAGINATION
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // --- Mengambil Data ---
    useEffect(() => {
        fetchRiwayatIzin();
        fetchKelas();
    }, []);

    const fetchKelas = async () => {
        try {
            const { data, error } = await supabase.from('kelas').select('nama_kelas');
            if (error) throw error;

            let formatted = data.map(k => k.nama_kelas);

            formatted.sort((a, b) => {
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                const splitA = String(a || '').split('-');
                const splitB = String(b || '').split('-');
                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                if (gradeA !== gradeB) {
                    return (typeof gradeA === 'number' && typeof gradeB === 'number')
                        ? gradeA - gradeB
                        : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                }
                return (splitA[1]?.trim() || a).localeCompare((splitB[1]?.trim() || b));
            });

            setDataKelas(formatted);
        } catch (error) {
            console.error("Gagal mengambil data kelas untuk filter:", error);
        }
    };

    const fetchRiwayatIzin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id,
                    kode_izin,
                    waktu_berangkat,
                    batas_waktu,
                    waktu_kembali_aktual,
                    jenis_izin,
                    alasan,
                    tujuan,
                    penjemput,
                    hubungan_penjemput,
                    status,
                    created_at,
                    santri (
                        nama_lengkap,
                        kelas ( nama_kelas )
                    ),
                    users!perizinan_disetujui_oleh_fkey ( nama_lengkap )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data.map(item => {
                let alasanBersih = item.alasan || '';
                let finalTujuan = item.tujuan;
                let finalPenjemput = item.penjemput ? (item.hubungan_penjemput ? `${item.penjemput} (${item.hubungan_penjemput})` : item.penjemput) : '-';

                // Parsing Legacy untuk memastikan format lama tetap terbaca di QR
                const bracketMatch = alasanBersih.match(/\[(.*?)\]/);
                if (bracketMatch) {
                    const extraInfo = bracketMatch[1];
                    alasanBersih = alasanBersih.replace(bracketMatch[0], '').trim();
                    if (!finalTujuan && extraInfo.includes('Tujuan:')) finalTujuan = extraInfo.split('Tujuan:')[1].split(',')[0].trim();
                    if (finalPenjemput === '-' && extraInfo.includes('Penjemput:')) finalPenjemput = extraInfo.split('Penjemput:')[1].split(',')[0].trim();
                    if (finalPenjemput === '-' && extraInfo.includes('Pendamping PP:')) finalPenjemput = extraInfo.split('Pendamping PP:')[1].split(',')[0].trim() + ' (Petugas)';
                    if (!finalTujuan && extraInfo.includes('Dirujuk Rawat Inap')) finalTujuan = 'Rujuk Rawat Inap Medis';
                }

                if (!finalTujuan) finalTujuan = item.jenis_izin.includes('KLINIK') ? 'RS/Faskes Luar' : 'Rumah/Domisili';

                return {
                    id: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                    created_at: item.created_at,
                    tanggal: formatTanggal(item.created_at),
                    jam: formatJam(item.created_at),
                    nama: item.santri ? item.santri.nama_lengkap : 'Santri Terhapus',
                    kelas: item.santri && item.santri.kelas ? item.santri.kelas.nama_kelas : '-',
                    jenis: item.jenis_izin,
                    alasan: alasanBersih,
                    tujuan: finalTujuan,
                    penjemput: finalPenjemput,
                    waktuBerangkatLengkap: formatWaktuLengkap(item.waktu_berangkat),
                    batasTenggat: formatWaktuLengkap(item.batas_waktu),
                    waktuKembali: formatWaktuLengkap(item.waktu_kembali_aktual),
                    status: item.status,
                    disetujuiOleh: item.users ? item.users.nama_lengkap : 'Belum Disetujui'
                };
            });

            setRiwayatIzin(formattedData);
        } catch (error) {
            console.error("Gagal mengambil riwayat izin:", error);
            setErrorMsg("Gagal memuat data dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const formatJam = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };
    const formatWaktuLengkap = (dateString) => {
        if (!dateString) return '-';
        return `${formatTanggal(dateString)}, ${formatJam(dateString)} WIB`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'MENUNGGU_PERSETUJUAN': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black"><Clock size={12} /> MENUNGGU</span>;
            case 'DISETUJUI': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black"><CheckCircle size={12} /> DISETUJUI</span>;
            case 'DI_LUAR': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-black"><Clock size={12} /> DI LUAR</span>;
            case 'TERLAMBAT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black animate-pulse"><AlertTriangle size={12} /> TERLAMBAT</span>;
            case 'SELESAI': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black"><CheckCircle size={12} /> SELESAI</span>;
            case 'DITOLAK': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-md text-[10px] font-black"><XCircle size={12} /> DITOLAK</span>;
            case 'DIBATALKAN': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[10px] font-black"><XCircle size={12} /> DIBATALKAN</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-[10px] font-black">{status}</span>;
        }
    };

    // ==========================================
    // LOGIKA CETAK & EKSPOR
    // ==========================================
    const handleCetak = () => {
        window.print();
    };

    const handleEksporExcel = () => {
        if (sortedData.length === 0) {
            return alert("Tidak ada data untuk diekspor!");
        }

        const dataEkspor = sortedData.map(izin => ({
            "ID Izin": izin.id,
            "Tanggal Ajuan": izin.tanggal,
            "Jam Ajuan": `${izin.jam} WIB`,
            "Nama Santri": izin.nama,
            "Kelas": izin.kelas,
            "Jenis Izin": izin.jenis.replace(/_/g, ' '),
            "Alasan": izin.alasan,
            "Batas Tenggat": izin.batasTenggat,
            "Waktu Kembali": izin.waktuKembali,
            "Status": izin.status,
            "Disetujui Oleh": izin.disetujuiOleh
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataEkspor);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Izin");
        XLSX.writeFile(workbook, `Rekapitulasi_Izin_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

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
            if (config.key === 'kelas' || config.key === 'nama') {
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                const splitA = String(a.kelas || '').split('-');
                const splitB = String(b.kelas || '').split('-');

                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                let comparison = 0;
                if (config.key === 'kelas') {
                    if (gradeA !== gradeB) comparison = (typeof gradeA === 'number' && typeof gradeB === 'number') ? gradeA - gradeB : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                    else comparison = (splitA[1]?.trim() || String(a.kelas)).localeCompare((splitB[1]?.trim() || String(b.kelas)));
                } else {
                    comparison = String(a.nama).localeCompare(String(b.nama));
                }
                return config.direction === 'asc' ? comparison : -comparison;
            }

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

    useEffect(() => { setCurrentPage(1); }, [kataKunci, filterKelas, filterJenis, filterStatus, tanggalAwal, tanggalAkhir]);

    // ==========================================
    // LOGIKA FILTER DENGAN MODE AKTIF
    // ==========================================
    const filteredData = riwayatIzin.filter(item => {
        const matchKata = item.nama.toLowerCase().includes(kataKunci.toLowerCase()) || item.id.toLowerCase().includes(kataKunci.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || item.kelas === filterKelas;
        const matchJenis = filterJenis === 'SEMUA' || item.jenis === filterJenis;

        let matchStatus = false;
        if (filterStatus === 'SEMUA') {
            matchStatus = true;
        } else if (filterStatus === 'AKTIF') {
            matchStatus = ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DI_LUAR', 'TERLAMBAT'].includes(item.status);
        } else {
            matchStatus = item.status === filterStatus;
        }

        let matchTanggal = true;
        if (tanggalAwal || tanggalAkhir) {
            const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
            if (tanggalAwal && tanggalAkhir) {
                const start = new Date(tanggalAwal).setHours(0, 0, 0, 0);
                const end = new Date(tanggalAkhir).setHours(0, 0, 0, 0);
                matchTanggal = itemDate >= start && itemDate <= end;
            } else if (tanggalAwal) {
                matchTanggal = itemDate >= new Date(tanggalAwal).setHours(0, 0, 0, 0);
            } else if (tanggalAkhir) {
                matchTanggal = itemDate <= new Date(tanggalAkhir).setHours(0, 0, 0, 0);
            }
        }

        return matchKata && matchKelas && matchJenis && matchStatus && matchTanggal;
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

    // --- Action Handlers Modal ---
    const bukaModalDetail = (data) => {
        setSelectedIzin(data);
        setIsModalDetailBuka(true);
    };

    const bukaModalQR = (izin) => {
        setSelectedIzinQR({
            kode: izin.id,
            nama: izin.nama,
            kelas: izin.kelas,
            jenis: izin.jenis,
            alasan: izin.alasan,
            tujuan: izin.tujuan,
            penjemput: izin.penjemput,
            waktuBerangkat: izin.waktuBerangkatLengkap, // Data komplit baru
            batasWaktu: izin.batasTenggat
        });
        setIsModalQRBuka(true);
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="text-emerald-600" />
                            Rekapitulasi Izin
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Master tabel seluruh riwayat perizinan santri.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchRiwayatIzin} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hidden md:flex">
                            Segarkan Data
                        </button>

                        <button onClick={handleCetak} className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                            <Printer size={18} /> Cetak
                        </button>

                        <button onClick={handleEksporExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Download size={18} /> Ekspor Excel
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-t-2xl border border-gray-200 border-b-0 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Cari Nama Santri atau ID Izin..."
                                value={kataKunci}
                                onChange={(e) => setKataKunci(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 md:max-w-md">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mx-2">Tanggal:</span>
                            <input
                                type="date"
                                value={tanggalAwal}
                                onChange={(e) => setTanggalAwal(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full"
                                title="Tanggal Awal"
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="date"
                                value={tanggalAkhir}
                                onChange={(e) => setTanggalAkhir(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full"
                                title="Tanggal Akhir"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-4">
                        <div className="flex-1 flex items-center gap-3">
                            <Filter className="text-gray-400 hidden md:block" size={18} />

                            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="SEMUA">-- Semua Kelas --</option>
                                {dataKelas.map(kelas => (
                                    <option key={kelas} value={kelas}>Kelas {kelas}</option>
                                ))}
                            </select>

                            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="SEMUA">-- Semua Jenis Izin --</option>
                                <option value="PULANG_MENGINAP_WALI">Pulang Menginap (Walisantri)</option>
                                <option value="PULANG_PERGI_WALI">Pulang Pergi (Walisantri)</option>
                                <option value="RUJUK_INAP_KLINIK">Rujuk Rawat Inap (Klinik)</option>
                                <option value="RAWAT_JALAN_KLINIK">Rujuk Rawat Jalan (Klinik)</option>
                            </select>

                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="AKTIF">Semua Izin Aktif</option>
                                <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
                                <option value="DISETUJUI">Disetujui (Belum Berangkat)</option>
                                <option value="DI_LUAR">Sedang Berjalan (Di Luar)</option>
                                <option value="TERLAMBAT">Terlambat (Melewati Batas)</option>
                                <option value="SELESAI">Selesai (Sudah Kembali)</option>
                                <option value="DITOLAK">Ditolak</option>
                                <option value="DIBATALKAN">Dibatalkan</option>
                                <option value="SEMUA">Tampilkan Semua Riwayat</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table id="tabel-cetak" className="w-full text-sm text-left min-w-[1000px]">
                            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                                        <div className="flex items-center gap-2">Waktu Ajuan {getSortIcon('created_at')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                        <div className="flex items-center gap-2">Data Santri {getSortIcon('nama')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('jenis')}>
                                        <div className="flex items-center gap-2">Kategori & Alasan {getSortIcon('jenis')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batasTenggat')}>
                                        <div className="flex items-center gap-2">Batas Tenggat {getSortIcon('batasTenggat')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('status')}>
                                        <div className="flex items-center justify-center gap-2">Status {getSortIcon('status')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-right print:hidden">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                                            Memuat rekapitulasi izin...
                                        </td>
                                    </tr>
                                ) : errorMsg ? (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                                ) : currentData.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Tidak ada riwayat perizinan yang sesuai kriteria pencarian.</td></tr>
                                ) : currentData.map((izin) => (
                                    <tr key={izin.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{izin.tanggal}</div>
                                            <div className="text-xs text-gray-500">{izin.jam} WIB</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{izin.nama}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Kelas {izin.kelas}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-black text-emerald-700 tracking-wider mb-1">{izin.jenis.replace(/_/g, ' ')}</div>
                                            <div className="text-xs text-gray-700 truncate max-w-[200px]" title={izin.alasan}>{izin.alasan}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {izin.status === 'DITOLAK' || izin.status === 'DIBATALKAN' ? (
                                                <span className="text-gray-400 italic text-xs">-</span>
                                            ) : (
                                                <>
                                                    <div className={`font-mono font-bold ${izin.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-800'}`}>
                                                        {izin.batasTenggat.split(', ')[0]}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{izin.batasTenggat.split(', ')[1]}</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(izin.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right print:hidden">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* TOMBOL LIHAT QR MUNCUL KHUSUS STATUS AKTIF (DISETUJUI / DI LUAR / TERLAMBAT) */}
                                                {['DISETUJUI', 'DI_LUAR', 'TERLAMBAT'].includes(izin.status) && (
                                                    <button
                                                        onClick={() => bukaModalQR(izin)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-sm text-xs font-bold transition-all"
                                                        title="Lihat Tiket QR"
                                                    >
                                                        <QrCode size={14} /> E-Pass
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => bukaModalDetail(izin)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all"
                                                >
                                                    <Eye size={14} /> Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="print:hidden">
                            <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={sortedData.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL KARTU IZIN DIGITAL (QR CODE) --- */}
            <ModalQR
                isOpen={isModalQRBuka}
                onClose={() => setIsModalQRBuka(false)}
                dataIzin={selectedIzinQR}
            />

            {/* --- MODAL DETAIL IZIN (MENGGUNAKAN CREATE PORTAL STANDAR BAKU) --- */}
            {isModalDetailBuka && selectedIzin && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsModalDetailBuka(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                                Rincian Perizinan
                                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{selectedIzin.id}</span>
                            </h3>
                            <button onClick={() => setIsModalDetailBuka(false)} className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h4 className="font-black text-xl text-gray-900">{selectedIzin.nama}</h4>
                                    <p className="text-sm font-bold text-emerald-700 mt-0.5">Kelas {selectedIzin.kelas}</p>
                                </div>
                                <div>{getStatusBadge(selectedIzin.status)}</div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kategori Izin</span>
                                    <p className="font-bold text-gray-800">{selectedIzin.jenis.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alasan / Kepentingan Dasar</span>
                                    <p className="text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100 italic">{selectedIzin.alasan}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Batas Tenggat Waktu</span>
                                        <p className="font-mono font-bold text-gray-800 text-xs">{selectedIzin.batasTenggat}</p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Waktu Kembali Aktual</span>
                                        <p className="font-mono font-bold text-gray-800 text-xs">{selectedIzin.waktuKembali}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pihak Pemberi Persetujuan</span>
                                    <p className="font-bold text-emerald-700">{selectedIzin.disetujuiOleh}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end flex-shrink-0">
                            <button onClick={() => setIsModalDetailBuka(false)} className="px-6 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-colors shadow-sm">
                                Tutup Jendela
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* CSS KHUSUS UNTUK CETAK (PRINT) */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #tabel-cetak, #tabel-cetak * {
                        visibility: visible;
                    }
                    #tabel-cetak {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
};

export default SemuaIzin;