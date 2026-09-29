import React, { useState, useEffect } from 'react';
import { History, ArrowRightFromLine, ArrowLeftToLine, Search, Loader2, ShieldCheck, ClipboardCheck, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const RiwayatScan = ({ menuContext }) => {
    const isPosKesantrian = menuContext?.includes('Kesantrian');

    const [tabAktif, setTabAktif] = useState('KELUAR');
    const [kataKunci, setKataKunci] = useState('');

    const getTodayString = () => new Date().toISOString().split('T')[0];
    const [tanggalPilih, setTanggalPilih] = useState(getTodayString());

    const [isLoading, setIsLoading] = useState(true);
    const [riwayatData, setRiwayatData] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // --- STATE PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchRiwayatScan();
    }, [tabAktif, menuContext, tanggalPilih]);

    // Reset halaman ke 1 jika tab, tanggal, atau kata kunci berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [tabAktif, kataKunci, tanggalPilih, itemsPerPage]);

    const fetchRiwayatScan = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const targetDate = new Date(tanggalPilih);
            targetDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(targetDate);
            nextDate.setDate(targetDate.getDate() + 1);

            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, jenis_izin, status, 
                    waktu_scan_kesantrian,
                    waktu_berangkat_aktual, 
                    waktu_scan_security_kembali,
                    waktu_kembali_aktual,
                    batas_waktu,
                    santri ( nama_lengkap, kelas (nama_kelas) )
                `)
                .in('status', ['DISETUJUI', 'DI_LUAR', 'TERLAMBAT', 'SELESAI']);

            if (error) throw error;

            const actionsToFetch = isPosKesantrian
                ? ['SCAN_KELUAR_KESANTRIAN', 'SCAN_KEMBALI_KESANTRIAN']
                : ['SCAN_KELUAR_GERBANG', 'SCAN_KEMBALI_GERBANG', 'SCAN_KEMBALI_GERBANG_MEDIS'];

            let auditData = [];
            try {
                const { data: auditLogData } = await supabase
                    .from('audit_log')
                    .select('data_id, aksi, users(nama_lengkap)')
                    .gte('created_at', targetDate.toISOString())
                    .lt('created_at', nextDate.toISOString())
                    .in('aksi', actionsToFetch);

                if (auditLogData) auditData = auditLogData;
            } catch (err) {
                console.log("Audit log join terganggu, menggunakan fallback nama.", err);
            }

            const petugasMap = {};
            auditData.forEach(log => {
                const namaPetugas = log.users?.nama_lengkap || 'Petugas';
                if (log.aksi.includes('KELUAR')) {
                    petugasMap[`${log.data_id}-keluar`] = namaPetugas;
                } else if (log.aksi.includes('KEMBALI')) {
                    petugasMap[`${log.data_id}-masuk`] = namaPetugas;
                }
            });

            const targetDateStr = targetDate.toDateString();
            let formattedHistory = [];

            data.forEach(item => {
                const nama = item.santri?.nama_lengkap || 'Unknown';
                const kelas = item.santri?.kelas?.nama_kelas || '-';

                const waktuKeluar = isPosKesantrian ? item.waktu_scan_kesantrian : item.waktu_berangkat_aktual;
                const waktuMasuk = isPosKesantrian ? item.waktu_kembali_aktual : item.waktu_scan_security_kembali;

                if (tabAktif === 'KELUAR' && waktuKeluar) {
                    const tglKeluar = new Date(waktuKeluar);
                    if (tglKeluar.toDateString() === targetDateStr) {
                        let badgeStatus = 'VALID';
                        if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') badgeStatus = 'VALID (Rujukan Medis)';

                        formattedHistory.push({
                            id: `${item.id}-keluar`,
                            waktuRaw: tglKeluar.getTime(),
                            waktu: tglKeluar.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                            nama,
                            kelas,
                            jenis: item.jenis_izin,
                            tipe: 'KELUAR',
                            status: badgeStatus,
                            petugas: petugasMap[`${item.id}-keluar`] || (isPosKesantrian ? 'Tim Kesantrian' : 'Sistem Gerbang')
                        });
                    }
                }

                if (tabAktif === 'MASUK' && waktuMasuk) {
                    const tglMasuk = new Date(waktuMasuk);
                    if (tglMasuk.toDateString() === targetDateStr) {
                        const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                        const isTerlambat = tglMasuk.getTime() > batasWaktuMs;

                        let badgeStatus = isTerlambat ? 'TERLAMBAT' : 'TEPAT_WAKTU';
                        if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') badgeStatus = 'VALID (Rujukan Medis)';

                        formattedHistory.push({
                            id: `${item.id}-masuk`,
                            waktuRaw: tglMasuk.getTime(),
                            waktu: tglMasuk.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                            nama,
                            kelas,
                            jenis: item.jenis_izin,
                            tipe: 'MASUK',
                            status: badgeStatus,
                            petugas: petugasMap[`${item.id}-masuk`] || (isPosKesantrian ? 'Tim Kesantrian' : 'Sistem Gerbang')
                        });
                    }
                }
            });

            formattedHistory.sort((a, b) => b.waktuRaw - a.waktuRaw);
            setRiwayatData(formattedHistory);

        } catch (error) {
            console.error("Gagal menarik data riwayat:", error);
            setErrorMsg("Gagal memuat buku mutasi digital.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIKA FILTER & PAGINATION DATA TAMPIL ---
    const dataFiltered = riwayatData.filter(item =>
        item.nama.toLowerCase().includes(kataKunci.toLowerCase()) ||
        item.kelas.toLowerCase().includes(kataKunci.toLowerCase()) ||
        item.petugas.toLowerCase().includes(kataKunci.toLowerCase())
    );

    const totalPages = Math.ceil(dataFiltered.length / itemsPerPage) || 1;
    const currentData = dataFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatTanggalTampil = () => {
        const dateObj = new Date(tanggalPilih);
        const formatStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return tanggalPilih === getTodayString() ? `HARI INI • ${formatStr}` : formatStr;
    };

    // --- KOMPONEN KONTROL PAGINATION COMPACT ---
    const PaginationCompact = () => {
        if (dataFiltered.length === 0) return null;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, dataFiltered.length);

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-3 mt-4 shadow-sm gap-3">
                <div className="text-[11px] text-gray-500 font-medium w-full flex justify-between sm:justify-start items-center gap-3">
                    <span>Tampil: <strong className="text-gray-900">{startItem}-{endItem}</strong> dr <strong className="text-gray-900">{dataFiltered.length}</strong></span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-gray-700 rounded p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value={10}>10 Baris</option>
                        <option value={25}>25 Baris</option>
                        <option value={50}>50 Baris</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-gray-700 w-16 text-center">
                        Hal {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-md mx-auto">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
                    {isPosKesantrian ? <ClipboardCheck size={28} className="text-amber-600" /> : <History size={28} className="text-gray-700" />}
                    {isPosKesantrian ? 'Riwayat Kesantrian' : 'Riwayat Gerbang'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    {isPosKesantrian ? 'Catatan mutasi & pengecekan Pos Kesantrian.' : 'Buku mutasi digital Pos Keamanan.'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">{formatTanggalTampil()}</p>
            </div>

            {/* Toolbar Pencarian & Filter Tanggal */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari santri, kelas, petugas..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 shadow-sm text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm flex items-center min-w-max relative hover:border-emerald-300 transition-colors">
                    <Calendar size={16} className="text-emerald-600 mr-2" />
                    <input
                        type="date"
                        value={tanggalPilih}
                        onChange={(e) => setTanggalPilih(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 w-full p-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* Tab Navigasi */}
            <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
                <button
                    onClick={() => setTabAktif('KELUAR')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'KELUAR' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ArrowRightFromLine size={18} /> SCAN KELUAR
                </button>
                <button
                    onClick={() => setTabAktif('MASUK')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'MASUK' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ArrowLeftToLine size={18} /> SCAN MASUK
                </button>
            </div>

            {/* List Riwayat */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : errorMsg ? (
                    <div className="text-center py-6 bg-red-50 text-red-600 rounded-xl border border-red-200 font-bold text-sm">
                        {errorMsg}
                    </div>
                ) : currentData.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-medium px-4">
                        Belum ada data pindaian {tabAktif.toLowerCase()} yang sesuai.
                    </div>
                ) : (
                    currentData.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col items-center justify-center w-14 border-r border-gray-100 pr-4">
                                <span className="text-sm font-black text-gray-800">{item.waktu}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">WIB</span>
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 leading-tight">{item.nama}</h4>
                                <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
                                    Kelas {item.kelas} <span className="mx-1 text-gray-300">•</span> {item.jenis.replace(/_/g, ' ')}
                                </div>

                                <div className="mt-2.5 flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black tracking-wider uppercase ${item.status === 'VALID' || item.status === 'TEPAT_WAKTU'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : item.status.includes('Rujukan')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status.replace(/_/g, ' ')}
                                    </span>

                                    <span className={`text-[10px] font-medium flex items-center gap-1.5 ${isPosKesantrian ? 'text-amber-700' : 'text-gray-500'}`}>
                                        {isPosKesantrian ? <ClipboardCheck size={12} className="text-amber-500" /> : <ShieldCheck size={12} className="text-gray-400" />}
                                        {item.petugas}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls dipanggil di bawah daftar */}
            <PaginationCompact />

        </div>
    );
};

export default RiwayatScan;