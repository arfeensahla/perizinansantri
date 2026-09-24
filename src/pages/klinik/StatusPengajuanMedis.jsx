import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Stethoscope, Search, Clock, CheckCircle, AlertTriangle, XCircle, Trash2, Loader2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const StatusPengajuanMedis = () => {
    const { user } = useContext(AuthContext);

    // --- State Data ---
    const [dataPengajuan, setDataPengajuan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // --- State Filter & Search ---
    const [kataKunci, setKataKunci] = useState('');
    // DEFAULT FILTER 'AKTIF' (Standar Baku)
    const [filterStatus, setFilterStatus] = useState('AKTIF');

    // ==========================================
    // STATE SORTING & PAGINATION (STANDAR BAKU)
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'tanggal_ajuan_raw', direction: 'desc' });

    // --- State Modal Batal ---
    const [isModalBatalBuka, setIsModalBatalBuka] = useState(false);
    const [izinTerpilih, setIzinTerpilih] = useState(null);
    const [isMembatalkan, setIsMembatalkan] = useState(false);

    // --- Tarik Data ---
    useEffect(() => {
        if (user && user.id) fetchDataPengajuan();
    }, [user]);

    const fetchDataPengajuan = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // Ambil semua riwayat perizinan khusus medis
            const { data: izinData, error: izinErr } = await supabase
                .from('perizinan')
                .select(`
                    *,
                    santri ( nama_lengkap, kelas ( nama_kelas ) )
                `)
                .in('jenis_izin', ['RUJUK_INAP_KLINIK', 'RAWAT_JALAN_KLINIK'])
                .order('created_at', { ascending: false });

            if (izinErr) throw izinErr;

            // Format data untuk tabel
            const formatted = izinData.map(izin => ({
                ...izin,
                nama_santri: izin.santri ? izin.santri.nama_lengkap : 'Pasien Tidak Ditemukan',
                kelas: izin.santri?.kelas?.nama_kelas || '-',
                kode: izin.kode_izin || izin.id.substring(0, 8).toUpperCase(),
                tanggal_ajuan_raw: izin.created_at, // Untuk sorting asli
                tanggal_ajuan: new Date(izin.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
                waktu_berangkat_format: new Date(izin.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
                batas_waktu_format: izin.batas_waktu ? new Date(izin.batas_waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
                batas_waktu_raw: izin.batas_waktu // Untuk sorting asli
            }));

            setDataPengajuan(formatted);
        } catch (error) {
            console.error("Error mengambil data riwayat medis:", error);
            setErrorMsg("Gagal memuat riwayat rujukan medis.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fungsi Batal Ajuan ---
    const konfirmasiBatal = (izin) => {
        setIzinTerpilih(izin);
        setIsModalBatalBuka(true);
    };

    const handleBatalkanAjuan = async () => {
        setIsMembatalkan(true);
        try {
            const { error: updateErr } = await supabase
                .from('perizinan')
                .update({ status: 'DIBATALKAN' })
                .eq('id', izinTerpilih.id);

            if (updateErr) throw updateErr;

            // Audit Log dengan user_id dan nama user
            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: 'BATALKAN_IZIN_MEDIS',
                tabel_terdampak: 'perizinan',
                data_id: izinTerpilih.id,
                keterangan: `Petugas Klinik ${user.name} membatalkan rujukan medis (${izinTerpilih.kode}) untuk pasien ${izinTerpilih.nama_santri}.`
            }]);

            setIsModalBatalBuka(false);
            fetchDataPengajuan();
        } catch (error) {
            console.error("Gagal membatalkan ajuan medis:", error);
            alert("Terjadi kesalahan saat membatalkan rujukan.");
        } finally {
            setIsMembatalkan(false);
        }
    };

    // --- UI Helpers ---
    const getBadgeStatus = (status) => {
        switch (status) {
            case 'MENUNGGU_PERSETUJUAN': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max"><Clock size={12} /> MENUNGGU ACC</span>;
            case 'DISETUJUI': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max"><CheckCircle size={12} /> DISETUJUI</span>;
            case 'DI_LUAR': return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max">SEDANG DIRAWAT</span>;
            case 'SELESAI': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max">SELESAI</span>;
            case 'TERLAMBAT': return <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max animate-pulse"><AlertTriangle size={12} /> TERLAMBAT</span>;
            case 'DITOLAK': return <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max"><XCircle size={12} /> DITOLAK</span>;
            case 'DIBATALKAN': return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 w-max">DIBATALKAN</span>;
            default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-black">{status}</span>;
        }
    };

    // ==========================================
    // LOGIKA SORTING CERDAS
    // ==========================================
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="text-rose-600" /> : <ChevronDown size={16} className="text-rose-600" />;
    };

    const sortData = (data, config) => {
        return [...data].sort((a, b) => {
            let valA = a[config.key] || '';
            let valB = b[config.key] || '';

            // Konversi ke timestamp jika sorting tanggal
            if (config.key === 'tanggal_ajuan_raw' || config.key === 'batas_waktu_raw') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            }

            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    useEffect(() => { setCurrentPage(1); }, [kataKunci, filterStatus, itemsPerPage]);

    // ==========================================
    // ALUR DATA: FILTER -> SORT -> PAGINATE
    // ==========================================
    const filteredData = dataPengajuan.filter(item => {
        const matchKategori = item.nama_santri.toLowerCase().includes(kataKunci.toLowerCase()) || item.kode.toLowerCase().includes(kataKunci.toLowerCase());

        let matchStatus = false;
        if (filterStatus === 'SEMUA') {
            matchStatus = true;
        } else if (filterStatus === 'AKTIF') {
            // Hanya menampilkan yang masih berjalan/menunggu
            matchStatus = ['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DI_LUAR', 'TERLAMBAT'].includes(item.status);
        } else {
            matchStatus = item.status === filterStatus;
        }

        return matchKategori && matchStatus;
    });

    const sortedData = sortData(filteredData, sortConfig);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ==========================================
    // KOMPONEN PAGINATION CONTROLS
    // ==========================================
    const PaginationControls = () => {
        const [inputPage, setInputPage] = useState(currentPage);
        useEffect(() => { setInputPage(currentPage); }, [currentPage]);

        const handlePageSubmit = (e) => {
            if (e.key === 'Enter' || e.type === 'blur') {
                let newPage = parseInt(inputPage, 10);
                if (isNaN(newPage) || newPage < 1) newPage = 1;
                if (newPage > totalPages) newPage = totalPages;
                setCurrentPage(newPage);
                setInputPage(newPage);
            }
        };

        if (sortedData.length === 0) return null;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, sortedData.length);

        return (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                    <div>Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{sortedData.length}</span> data</div>
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                        <span className="hidden sm:inline">Per halaman:</span>
                        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-700 font-bold shadow-sm">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                    <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                        <span className="hidden sm:inline">Halaman</span>
                        <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} title="Ketik lalu Enter" />
                        <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                    </div>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Stethoscope className="text-rose-600" />
                        Status Rujukan Medis
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau, lacak, atau batalkan rujukan medis pasien pondok.</p>
                </div>
                <button onClick={fetchDataPengajuan} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                    Segarkan Data
                </button>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari Nama Pasien atau Kode Rujukan..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium text-gray-700 md:w-56"
                >
                    <option value="AKTIF">Semua Rujukan Aktif</option>
                    <option value="MENUNGGU_PERSETUJUAN">Menunggu ACC</option>
                    <option value="DISETUJUI">Disetujui</option>
                    <option value="DI_LUAR">Sedang Dirawat</option>
                    <option value="SELESAI">Selesai Berobat</option>
                    <option value="DIBATALKAN">Dibatalkan</option>
                    <option value="DITOLAK">Ditolak</option>
                    <option value="SEMUA">Tampilkan Semua Riwayat</option>
                </select>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-rose-50/50 border-b select-none">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-rose-100/50 transition-colors" onClick={() => handleSort('tanggal_ajuan_raw')}>
                                    <div className="flex items-center gap-2">Waktu Rujukan {getSortIcon('tanggal_ajuan_raw')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-rose-100/50 transition-colors" onClick={() => handleSort('nama_santri')}>
                                    <div className="flex items-center gap-2">Detail Pasien & Diagnosis {getSortIcon('nama_santri')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-rose-100/50 transition-colors" onClick={() => handleSort('batas_waktu_raw')}>
                                    <div className="flex items-center gap-2">Jadwal Penanganan {getSortIcon('batas_waktu_raw')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-rose-100/50 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-2">Status & Aksi {getSortIcon('status')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" /> Memuat data...</td></tr>
                            ) : errorMsg ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Tidak ada pengajuan rujukan yang sesuai.</td></tr>
                            ) : currentData.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs font-bold text-gray-400 mb-1">{item.kode}</div>
                                        <div className="text-xs text-gray-600 font-medium">{item.tanggal_ajuan}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm mb-1">{item.nama_santri}</div>
                                        <div className="text-[11px] font-black text-rose-700 uppercase tracking-wider mb-1">{item.jenis_izin.replace(/_/g, ' ')} • Kelas {item.kelas}</div>
                                        <p className="text-xs text-gray-500 line-clamp-2 max-w-xs" title={item.alasan}>"{item.alasan}"</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs space-y-1">
                                        <div><span className="text-gray-400 font-medium">Berangkat:</span><br /><span className="font-bold text-gray-700">{item.waktu_berangkat_format}</span></div>
                                        <div><span className="text-gray-400 font-medium">Batas Kembali:</span><br /><span className="font-bold text-amber-600">{item.batas_waktu_format}</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-3">
                                            {getBadgeStatus(item.status)}

                                            {/* TOMBOL BATAL HANYA MUNCUL JIKA STATUS MASIH MENUNGGU */}
                                            {item.status === 'MENUNGGU_PERSETUJUAN' && (
                                                <button
                                                    onClick={() => konfirmasiBatal(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg shadow-sm text-[11px] font-bold transition-all"
                                                >
                                                    <Trash2 size={12} /> Batalkan Rujukan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <PaginationControls />
                </div>
            </div>

            {/* --- MODAL KONFIRMASI BATAL (Sesuai Standar z-[99999]) --- */}
            {isModalBatalBuka && izinTerpilih && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => !isMembatalkan && setIsModalBatalBuka(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-red-50">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-800 text-lg">Batalkan Rujukan Medis?</h3>
                                <p className="text-xs text-red-600/80 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                Anda yakin ingin membatalkan rujukan medis untuk pasien <strong className="text-gray-900">{izinTerpilih.nama_santri}</strong> dengan kode <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">{izinTerpilih.kode}</span>?
                            </p>
                            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                Rujukan medis yang dibatalkan akan ditarik dari antrean Sekretaris Mudir dan dianggap tidak jadi berangkat.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button
                                onClick={() => setIsModalBatalBuka(false)}
                                disabled={isMembatalkan}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={handleBatalkanAjuan}
                                disabled={isMembatalkan}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isMembatalkan ? (
                                    <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                                ) : (
                                    <><Trash2 size={16} /> Ya, Batalkan</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StatusPengajuanMedis;