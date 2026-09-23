import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Printer, Filter, Eye, CheckCircle, AlertTriangle, Clock, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const SemuaIzin = () => {
    // --- State Filters ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [filterJenis, setFilterJenis] = useState('SEMUA');
    const [filterStatus, setFilterStatus] = useState('SEMUA');

    // State Database
    const [riwayatIzin, setRiwayatIzin] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // State Modal Detail
    const [isModalDetailBuka, setIsModalDetailBuka] = useState(false);
    const [selectedIzin, setSelectedIzin] = useState(null);

    // --- Mengambil Data dari Supabase ---
    useEffect(() => {
        fetchRiwayatIzin();
    }, []);

    const fetchRiwayatIzin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // Join 3 tabel sekaligus: perizinan -> santri -> kelas, dan perizinan -> users (penyetuju)
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

            // Format data untuk disesuaikan dengan UI
            const formattedData = data.map(item => ({
                id: item.kode_izin || item.id.substring(0, 8).toUpperCase(), // Pakai kode izin, fallback ke UUID pendek
                tanggal: formatTanggal(item.created_at),
                jam: formatJam(item.created_at),
                nama: item.santri ? item.santri.nama_lengkap : 'Santri Terhapus',
                kelas: item.santri && item.santri.kelas ? item.santri.kelas.nama_kelas : '-',
                jenis: item.jenis_izin,
                alasan: item.alasan,
                batasTenggat: formatWaktuLengkap(item.batas_waktu),
                waktuKembali: formatWaktuLengkap(item.waktu_kembali_aktual),
                status: item.status,
                disetujuiOleh: item.users ? item.users.nama_lengkap : 'Belum Disetujui'
            }));

            setRiwayatIzin(formattedData);
        } catch (error) {
            console.error("Gagal mengambil riwayat izin:", error);
            setErrorMsg("Gagal memuat data dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Helper Format Waktu ---
    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatJam = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatWaktuLengkap = (dateString) => {
        if (!dateString) return '-';
        return `${formatTanggal(dateString)}, ${formatJam(dateString)}`;
    };

    // --- Helper UI Badge ---
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

    // Logika Filter Data
    const dataTampil = riwayatIzin.filter(item => {
        const matchKata = item.nama.toLowerCase().includes(kataKunci.toLowerCase()) || item.id.toLowerCase().includes(kataKunci.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || item.kelas === filterKelas;
        const matchJenis = filterJenis === 'SEMUA' || item.jenis === filterJenis;
        const matchStatus = filterStatus === 'SEMUA' || item.status === filterStatus;

        return matchKata && matchKelas && matchJenis && matchStatus;
    });

    const bukaModalDetail = (data) => {
        setSelectedIzin(data);
        setIsModalDetailBuka(true);
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                {/* --- HEADER --- */}
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
                        <button className="bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-800 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                            <Printer size={18} /> Cetak
                        </button>
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Download size={18} /> Ekspor
                        </button>
                    </div>
                </div>

                {/* --- FILTER ADVANCED --- */}
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
                            <input type="date" className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full" title="Tanggal Awal" />
                            <span className="text-gray-300">-</span>
                            <input type="date" className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full" title="Tanggal Akhir" />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-4">
                        <div className="flex-1 flex items-center gap-3">
                            <Filter className="text-gray-400 hidden md:block" size={18} />
                            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="SEMUA">-- Semua Kelas --</option>
                                <option value="7A">Kelas 7A</option>
                                <option value="7B">Kelas 7B</option>
                                <option value="8A">Kelas 8A</option>
                                <option value="8B">Kelas 8B</option>
                                <option value="9A">Kelas 9A</option>
                                <option value="9B">Kelas 9B</option>
                            </select>
                            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="SEMUA">-- Semua Jenis Izin --</option>
                                <option value="PULANG_MENGINAP_WALI">Pulang Menginap (Walisantri)</option>
                                <option value="PULANG_PERGI_WALI">Pulang Pergi (Walisantri)</option>
                                <option value="RUJUK_INAP_KLINIK">Rujuk Rawat Inap (Klinik)</option>
                                <option value="RAWAT_JALAN_KLINIK">Rujuk Rawat Jalan (Klinik)</option>
                            </select>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                <option value="SEMUA">-- Semua Status --</option>
                                <option value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</option>
                                <option value="DISETUJUI">Disetujui (Belum Berangkat)</option>
                                <option value="DI_LUAR">Sedang Berjalan (Di Luar)</option>
                                <option value="TERLAMBAT">Terlambat (Melewati Batas)</option>
                                <option value="SELESAI">Selesai (Sudah Kembali)</option>
                                <option value="DITOLAK">Ditolak</option>
                                <option value="DIBATALKAN">Dibatalkan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- TABEL DATA --- */}
                <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[1000px]">
                            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Waktu Ajuan</th>
                                    <th className="px-6 py-4">Data Santri</th>
                                    <th className="px-6 py-4">Kategori & Alasan</th>
                                    <th className="px-6 py-4">Batas Tenggat</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
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
                                ) : dataTampil.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Tidak ada riwayat perizinan yang sesuai kriteria pencarian.</td></tr>
                                ) : dataTampil.map((izin) => (
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
                                                    <div className="text-xs text-gray-500">{izin.batasTenggat.split(', ')[1]} WIB</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(izin.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => bukaModalDetail(izin)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all"
                                            >
                                                <Eye size={14} /> Lihat Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL DETAIL IZIN --- */}
            {isModalDetailBuka && selectedIzin && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsModalDetailBuka(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                Rincian Perizinan
                                <span className="text-xs font-mono font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{selectedIzin.id}</span>
                            </h3>
                            <button onClick={() => setIsModalDetailBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h4 className="font-black text-xl text-gray-900">{selectedIzin.nama}</h4>
                                    <p className="text-sm text-gray-500">Kelas {selectedIzin.kelas}</p>
                                </div>
                                <div>{getStatusBadge(selectedIzin.status)}</div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kategori Izin</span>
                                    <p className="font-semibold text-gray-800">{selectedIzin.jenis.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alasan / Kepentingan Dasar</span>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedIzin.alasan}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Batas Tenggat Waktu</span>
                                        <p className="font-mono font-bold text-gray-800">{selectedIzin.batasTenggat}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Waktu Kembali Aktual</span>
                                        <p className="font-mono font-bold text-gray-800">{selectedIzin.waktuKembali}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pihak Pemberi Persetujuan</span>
                                    <p className="font-semibold text-emerald-700">{selectedIzin.disetujuiOleh}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsModalDetailBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm">
                                Tutup Rincian
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SemuaIzin;