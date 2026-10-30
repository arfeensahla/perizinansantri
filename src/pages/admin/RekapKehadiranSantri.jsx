import React, { useState, useEffect, useRef } from 'react';
import { Users, Home, Map, Search, Loader2, BarChart2, ShieldCheck, ChevronUp, ChevronDown, Download, UsersRound, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { toPng } from 'html-to-image';

const RekapKehadiranSantri = () => {
    // State Navigasi Tab
    const [activeTab, setActiveTab] = useState('KEHADIRAN'); // 'KEHADIRAN' atau 'DEMOGRAFI'

    // State Data
    const [dataKelas, setDataKelas] = useState([]);
    const [dataDemografi, setDataDemografi] = useState(null);
    const [globalStats, setGlobalStats] = useState({ total: 0, dalam: 0, luar: 0 });

    // State UI
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'namaKelas', direction: 'asc' });

    // Ref untuk area yang akan diexport ke PNG
    const tabelDemografiRef = useRef(null);

    useEffect(() => {
        fetchDataRekap();
    }, []);

    const fetchDataRekap = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // 1. Ambil data Kelas
            const { data: kelasData, error: kelasErr } = await supabase
                .from('kelas')
                .select('id, nama_kelas, users!kelas_wali_kelas_id_fkey(nama_lengkap)');
            if (kelasErr) throw kelasErr;

            // 2. Ambil data Santri (TERMASUK jenis_kelamin)
            const { data: santriData, error: santriErr } = await supabase
                .from('santri')
                .select('id, nama_lengkap, kelas_id, jenis_kelamin');
            if (santriErr) throw santriErr;

            // 3. Ambil data perizinan berjalan
            const { data: izinData, error: izinErr } = await supabase
                .from('perizinan')
                .select('santri_id')
                .in('status', ['DI_LUAR', 'TERLAMBAT']);
            if (izinErr) throw izinErr;

            const santriDiLuarSet = new Set(izinData.map(izin => izin.santri_id));

            // --- PROSES DATA KEHADIRAN (TAB 1) ---
            let totalGlobal = 0;
            let luarGlobal = 0;

            const rekapPerKelas = kelasData.map(k => {
                const santriDiKelas = santriData.filter(s => s.kelas_id === k.id);
                const totalSantri = santriDiKelas.length;
                const totalDiLuar = santriDiKelas.filter(s => santriDiLuarSet.has(s.id)).length;
                const totalDiDalam = totalSantri - totalDiLuar;

                totalGlobal += totalSantri;
                luarGlobal += totalDiLuar;

                return {
                    id: k.id,
                    namaKelas: k.nama_kelas,
                    waliKelas: k.users?.nama_lengkap || 'Belum Diatur',
                    total: totalSantri,
                    dalam: totalDiDalam,
                    luar: totalDiLuar,
                    persentaseDalam: totalSantri === 0 ? 0 : Math.round((totalDiDalam / totalSantri) * 100)
                };
            });

            setGlobalStats({ total: totalGlobal, luar: luarGlobal, dalam: totalGlobal - luarGlobal });
            setDataKelas(rekapPerKelas);

            // --- PROSES DATA DEMOGRAFI L/P (TAB 2) ---
            const stats = {
                'VII': { L: 0, P: 0 },
                'VIII': { L: 0, P: 0 },
                'IX': { L: 0, P: 0 },
                'X': { L: 0, P: 0 },
                'XI': { L: 0, P: 0 },
                'XII': { L: 0, P: 0 }
            };

            // Buat map kelas untuk pencarian cepat
            const kelasMap = {};
            kelasData.forEach(k => { kelasMap[k.id] = k.nama_kelas; });

            santriData.forEach(santri => {
                const namaKelasLengkap = kelasMap[santri.kelas_id] || '';
                // Asumsi format kelas "VII-A", ambil bagian sebelum strip
                const gradeBase = namaKelasLengkap.split('-')[0].trim().toUpperCase();

                const isPerempuan = santri.jenis_kelamin?.toLowerCase() === 'perempuan';

                if (stats[gradeBase]) {
                    if (isPerempuan) stats[gradeBase].P++;
                    else stats[gradeBase].L++;
                }
            });

            setDataDemografi(stats);

        } catch (error) {
            console.error("Gagal memuat rekap:", error);
            setErrorMsg("Gagal menarik data dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIKA EXPORT KE PNG ---
    const handleExportPNG = async () => {
        if (!tabelDemografiRef.current) return;
        setIsExporting(true);
        try {
            // Gunakan html-to-image dengan background putih bersih
            const dataUrl = await toPng(tabelDemografiRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });

            const link = document.createElement('a');
            const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
            link.download = `Demografi_Santri_${dateStr}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Gagal mengekspor gambar:', err);
            alert('Terjadi kesalahan saat mengekspor gambar.');
        } finally {
            setIsExporting(false);
        }
    };

    // --- LOGIKA SORTING & FILTER TABEL KEHADIRAN ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
    };

    const sortedData = [...dataKelas].sort((a, b) => {
        if (sortConfig.key === 'namaKelas') {
            const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
            const splitA = String(a.namaKelas || '').split('-');
            const splitB = String(b.namaKelas || '').split('-');
            const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
            const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

            let comparison = 0;
            if (gradeA !== gradeB) {
                comparison = (typeof gradeA === 'number' && typeof gradeB === 'number') ? gradeA - gradeB : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
            } else {
                comparison = String(a.namaKelas || '').localeCompare(String(b.namaKelas || ''));
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredData = sortedData.filter(k =>
        k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- RENDER TAB DEMOGRAFI (DESAIN MODERN & RESPONSIVE) ---
    const renderTabDemografi = () => {
        if (isLoading || !dataDemografi) return <div className="p-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" /> Memuat data...</div>;

        // Kalkulasi Total
        const totalSMP_L = dataDemografi['VII'].L + dataDemografi['VIII'].L + dataDemografi['IX'].L;
        const totalSMP_P = dataDemografi['VII'].P + dataDemografi['VIII'].P + dataDemografi['IX'].P;
        const totalSMP = totalSMP_L + totalSMP_P;

        const totalSMA_L = dataDemografi['X'].L + dataDemografi['XI'].L + dataDemografi['XII'].L;
        const totalSMA_P = dataDemografi['X'].P + dataDemografi['XI'].P + dataDemografi['XII'].P;
        const totalSMA = totalSMA_L + totalSMA_P;

        const grandTotal_L = totalSMP_L + totalSMA_L;
        const grandTotal_P = totalSMP_P + totalSMA_P;
        const grandTotal = totalSMP + totalSMA;

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        return (
            <div className="animate-fade-in flex flex-col items-center w-full">

                {/* Petunjuk Scroll Khusus di HP */}
                <div className="w-full text-center md:hidden mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200/60 px-4 py-1.5 rounded-full animate-pulse">
                        Geser tabel <ArrowRight size={12} className="text-emerald-500" />
                    </span>
                </div>

                {/* Pembungkus Scroll Horizontal */}
                <div className="w-full overflow-x-auto pb-4">
                    {/* Area Preview yang akan difoto (Lebar minimum ditetapkan agar tidak gepeng saat didownload) */}
                    <div
                        ref={tabelDemografiRef}
                        className="w-full min-w-[600px] max-w-4xl bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 relative mx-auto"
                    >
                        {/* Header Laporan */}
                        <div className="mb-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                <UsersRound size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Demografi Santri Aktif</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1">Pondok Pesantren Modern Al-Islam • {dateStr}</p>
                        </div>

                        {/* Tabel Demografi Modern */}
                        <div className="w-full rounded-2xl overflow-hidden border border-gray-200">
                            <table className="w-full text-center text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-black tracking-wider">
                                        <th className="py-4 px-6 text-left w-1/4">Unit / Angkatan</th>
                                        <th className="py-4 px-6 text-blue-600 w-1/4">Laki-laki (L)</th>
                                        <th className="py-4 px-6 text-pink-600 w-1/4">Perempuan (P)</th>
                                        <th className="py-4 px-6 text-gray-800 w-1/4">Jumlah Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {/* BARIS SMP */}
                                    {['VII', 'VIII', 'IX'].map(grade => (
                                        <tr key={grade} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-6 text-left font-bold">{grade}</td>
                                            <td className="py-3 px-6 font-medium">{dataDemografi[grade].L}</td>
                                            <td className="py-3 px-6 font-medium">{dataDemografi[grade].P}</td>
                                            <td className="py-3 px-6 font-bold text-gray-900">{dataDemografi[grade].L + dataDemografi[grade].P}</td>
                                        </tr>
                                    ))}
                                    {/* SUBTOTAL SMP */}
                                    <tr className="bg-emerald-50/60 font-bold text-emerald-900 border-y-2 border-emerald-100">
                                        <td className="py-4 px-6 text-left uppercase tracking-wider text-xs font-black">Total SMP</td>
                                        <td className="py-4 px-6 text-base">{totalSMP_L}</td>
                                        <td className="py-4 px-6 text-base">{totalSMP_P}</td>
                                        <td className="py-4 px-6 text-lg text-emerald-700">{totalSMP}</td>
                                    </tr>

                                    {/* BARIS SMA */}
                                    {['X', 'XI', 'XII'].map(grade => (
                                        <tr key={grade} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-6 text-left font-bold mt-2">{grade}</td>
                                            <td className="py-3 px-6 font-medium">{dataDemografi[grade].L}</td>
                                            <td className="py-3 px-6 font-medium">{dataDemografi[grade].P}</td>
                                            <td className="py-3 px-6 font-bold text-gray-900">{dataDemografi[grade].L + dataDemografi[grade].P}</td>
                                        </tr>
                                    ))}
                                    {/* SUBTOTAL SMA */}
                                    <tr className="bg-blue-50/60 font-bold text-blue-900 border-y-2 border-blue-100">
                                        <td className="py-4 px-6 text-left uppercase tracking-wider text-xs font-black">Total SMA</td>
                                        <td className="py-4 px-6 text-base">{totalSMA_L}</td>
                                        <td className="py-4 px-6 text-base">{totalSMA_P}</td>
                                        <td className="py-4 px-6 text-lg text-blue-700">{totalSMA}</td>
                                    </tr>

                                    {/* BARIS GRAND TOTAL */}
                                    <tr className="bg-gray-900 text-white font-black">
                                        <td className="py-5 px-6 text-left uppercase tracking-widest text-sm">Grand Total</td>
                                        <td className="py-5 px-6 text-lg">{grandTotal_L}</td>
                                        <td className="py-5 px-6 text-lg">{grandTotal_P}</td>
                                        <td className="py-5 px-6 text-2xl text-emerald-400">{grandTotal}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi di luar area yang difoto */}
                <div className="mt-4 md:mt-8 flex gap-4">
                    <button
                        onClick={handleExportPNG}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                        {isExporting ? 'Memproses Gambar...' : 'Download PNG Laporan'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* Header Utama */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="text-emerald-600" /> Pusat Data Santri
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau kehadiran operasional dan statistik demografi santri.</p>
                </div>
                <button onClick={fetchDataRekap} className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : null}
                    Segarkan Data
                </button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {/* TAB NAVIGASI */}
            <div className="flex items-center gap-2 bg-gray-200/50 p-1.5 rounded-2xl mb-6 w-full max-w-md mx-auto md:mx-0">
                <button
                    onClick={() => setActiveTab('KEHADIRAN')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'KEHADIRAN' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ShieldCheck size={16} /> Kehadiran
                </button>
                <button
                    onClick={() => setActiveTab('DEMOGRAFI')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'DEMOGRAFI' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UsersRound size={16} /> Demografi
                </button>
            </div>

            {/* AREA KONTEN TAB */}
            {activeTab === 'KEHADIRAN' ? (
                <div className="animate-fade-in">
                    {/* Statistik Global Kehadiran */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
                            <div>
                                <p className="text-blue-600 text-[11px] font-black uppercase tracking-widest mb-1">Total Santri Aktif</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-800">{isLoading ? '-' : globalStats.total}</span>
                                    <span className="text-sm font-medium text-gray-500">Orang</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Users size={28} /></div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
                            <div>
                                <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Di Dalam Pondok</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-800">{isLoading ? '-' : globalStats.dalam}</span>
                                    <span className="text-sm font-medium text-gray-500">Orang</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Home size={28} /></div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 opacity-50"></div>
                            <div>
                                <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-1">Di Luar Pondok</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-800">{isLoading ? '-' : globalStats.luar}</span>
                                    <span className="text-sm font-medium text-gray-500">Orang</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"></div>
                        </div>
                    </div>

                    {/* Area Tabel Detail Kehadiran Kelas */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-600" /> Rincian per Kelas
                            </h3>
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari kelas atau wali..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[700px]">
                                <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                    <tr>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('namaKelas')}>
                                            <div className="flex items-center gap-2">Kelas {getSortIcon('namaKelas')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('waliKelas')}>
                                            <div className="flex items-center gap-2">Walikelas {getSortIcon('waliKelas')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('total')}>
                                            <div className="flex items-center justify-center gap-2">Total Santri {getSortIcon('total')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('dalam')}>
                                            <div className="flex items-center justify-center gap-2">Di Dalam {getSortIcon('dalam')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('luar')}>
                                            <div className="flex items-center justify-center gap-2">Di Luar {getSortIcon('luar')}</div>
                                        </th>
                                        <th className="px-6 py-4">Status Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data rekapitulasi...</td></tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada data kelas yang sesuai pencarian.</td></tr>
                                    ) : filteredData.map((kelas) => (
                                        <tr key={kelas.id} className="border-b hover:bg-emerald-50/30 transition-colors">
                                            <td className="px-6 py-4 font-black text-gray-900">{kelas.namaKelas}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{kelas.waliKelas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-800">{kelas.total}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-black text-xs">
                                                    {kelas.dalam}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded font-black text-xs ${kelas.luar > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {kelas.luar}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex" title={`${kelas.persentaseDalam}% di dalam`}>
                                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${kelas.persentaseDalam}%` }}></div>
                                                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${100 - kelas.persentaseDalam}%` }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                // TAB DEMOGRAFI
                renderTabDemografi()
            )}
        </div>
    );
};

export default RekapKehadiranSantri;