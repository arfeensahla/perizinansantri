import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Home, Map, Clock, AlertTriangle, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// --- Komponen SVG Donut Chart Minimalis ---
const MinimalistDonut = ({ dataWali, dataKlinik, label, title, icon: Icon, color }) => {
    const total = dataWali + dataKlinik;
    const pctWali = total === 0 ? 0 : (dataWali / total) * 100;
    const pctKlinik = total === 0 ? 0 : (dataKlinik / total) * 100;

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-${color}-200 transition-colors`}>
            <div className={`px-5 py-4 bg-${color}-50/50 border-b border-gray-50 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-700 rounded-lg`}>
                        <Icon size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izin Berjalan</span>
            </div>

            <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        {pctWali > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${pctWali}, 100`} />}
                        {pctKlinik > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${pctKlinik}, 100`} strokeDashoffset={`-${pctWali}`} />}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-800 leading-none">{total}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{label}</span>
                    </div>
                </div>

                <div className="space-y-4 min-w-[120px]">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-sm font-semibold text-gray-600">Walisantri</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataWali}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-semibold text-gray-600">Klinik</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataKlinik}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardAdmin = () => {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);

    // State Statistik
    const [stats, setStats] = useState({
        antrean: { pulang: 0, keluar: 0, perpanjangan: 0 },
        berjalan: { pulang: { wali: 0, klinik: 0 }, keluar: { wali: 0, klinik: 0 } }
    });

    // State Tabel Pengawasan
    const [santriPulang, setSantriPulang] = useState([]);
    const [santriKeluar, setSantriKeluar] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Mengambil perizinan yang sedang aktif (menunggu atau sedang di luar)
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, batas_waktu, status, parent_izin_id,
                    santri (
                        nama_lengkap,
                        kelas (
                            nama_kelas,
                            users!kelas_wali_kelas_id_fkey ( nama_lengkap )
                        )
                    )
                `)
                .in('status', ['MENUNGGU_PERSETUJUAN', 'DI_LUAR', 'TERLAMBAT']);

            if (error) throw error;

            let tempStats = {
                antrean: { pulang: 0, keluar: 0, perpanjangan: 0 },
                berjalan: { pulang: { wali: 0, klinik: 0 }, keluar: { wali: 0, klinik: 0 } }
            };
            let listPulang = [];
            let listKeluar = [];

            // Memproses data mentah menjadi statistik dan baris tabel
            data.forEach(item => {
                const isMenginap = item.jenis_izin === 'PULANG_MENGINAP_WALI' || item.jenis_izin === 'RUJUK_INAP_KLINIK';
                const isPergi = item.jenis_izin === 'PULANG_PERGI_WALI' || item.jenis_izin === 'RAWAT_JALAN_KLINIK';

                // 1. Hitung Antrean
                if (item.status === 'MENUNGGU_PERSETUJUAN') {
                    if (item.parent_izin_id) {
                        tempStats.antrean.perpanjangan++;
                    } else if (isMenginap) {
                        tempStats.antrean.pulang++;
                    } else if (isPergi) {
                        tempStats.antrean.keluar++;
                    }
                }

                // 2. Hitung Santri Berjalan & Masukkan ke Tabel Pengawasan
                if (item.status === 'DI_LUAR' || item.status === 'TERLAMBAT') {
                    // Update Donut Chart Stats
                    if (item.jenis_izin === 'PULANG_MENGINAP_WALI') tempStats.berjalan.pulang.wali++;
                    if (item.jenis_izin === 'RUJUK_INAP_KLINIK') tempStats.berjalan.pulang.klinik++;
                    if (item.jenis_izin === 'PULANG_PERGI_WALI') tempStats.berjalan.keluar.wali++;
                    if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') tempStats.berjalan.keluar.klinik++;

                    // Format objek santri untuk tabel
                    const objSantri = {
                        id: item.kode_izin || item.id,
                        nama: item.santri?.nama_lengkap || 'Tidak Diketahui',
                        kelas: item.santri?.kelas?.nama_kelas || '-',
                        walikelas: item.santri?.kelas?.users?.nama_lengkap || 'Belum Diatur',
                        jenis: item.jenis_izin,
                        batasTanggal: formatTanggal(item.batas_waktu),
                        batasJam: formatJam(item.batas_waktu),
                        status: item.status
                    };

                    if (isMenginap) listPulang.push(objSantri);
                    if (isPergi) listKeluar.push(objSantri);
                }
            });

            // Set state dengan data terformat
            setStats(tempStats);

            // Urutkan tabel: yang TERLAMBAT berada di paling atas
            const sortByStatus = (a, b) => (a.status === 'TERLAMBAT' ? -1 : 1);
            setSantriPulang(listPulang.sort(sortByStatus));
            setSantriKeluar(listKeluar.sort(sortByStatus));

        } catch (error) {
            console.error("Gagal mengambil data dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper Waktu
    const formatTanggal = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const formatJam = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const handleWAWalikelas = (walikelas, santri) => {
        if (walikelas === 'Belum Diatur') {
            alert("Walikelas untuk santri ini belum diatur di sistem.");
            return;
        }
        alert(`Membuka WhatsApp Web untuk mengirim pesan ke ${walikelas}:\n\n"Assalamu'alaikum ${walikelas}, mohon diingatkan santri atas nama ${santri}, tenggat waktu izinnya hampir atau sudah habis."`);
    };

    // Komponen Reusable untuk Tabel Wajib Kembali
    const TabelPengawasan = ({ judul, deskripsi, icon: Icon, color, dataSantri }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6`}>
            <div className={`px-6 py-5 border-b bg-${color}-50/30 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-lg`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{judul}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full border border-${color}-200`}>
                    {dataSantri.length} Santri
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-4">Data Santri & Izin</th>
                            <th className="px-6 py-4">Walikelas</th>
                            <th className="px-6 py-4">Batas Tenggat</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                        ) : dataSantri.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Aman. Tidak ada santri di daftar ini.</td></tr>
                        ) : dataSantri.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama} <span className="text-gray-400 font-normal">({santri.kelas})</span></div>
                                    <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">{santri.walikelas}</td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${santri.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-900'}`}>
                                        {santri.batasTanggal}
                                    </div>
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
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleWAWalikelas(santri.walikelas, santri.nama)}
                                        className="inline-flex items-center justify-center w-9 h-9 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 rounded-lg shadow-sm transition-all"
                                        title={`Kirim WA ke ${santri.walikelas}`}
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-600" />
                        Dashboard Administrator
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Ringkasan operasional dan pengawasan pengembalian santri.</p>
                </div>
                <button onClick={fetchDashboardData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm hidden md:block">
                    Segarkan Data
                </button>
            </div>

            {/* --- LAPISAN 1: KELOMPOK ANTREAN --- */}
            <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Menunggu Persetujuan</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Menginap</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">
                                {isLoading ? '-' : stats.antrean.pulang}
                            </span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Home size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-purple-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Pergi</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">
                                {isLoading ? '-' : stats.antrean.keluar}
                            </span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <Map size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-1">Perpanjangan Waktu</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">
                                {isLoading ? '-' : stats.antrean.perpanjangan}
                            </span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Clock size={22} />
                    </div>
                </div>
            </div>

            {/* --- LAPISAN 2: DIAGRAM DONAT --- */}
            <div className="mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Statistik Santri di Luar</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <MinimalistDonut
                    dataWali={stats.berjalan.pulang.wali}
                    dataKlinik={stats.berjalan.pulang.klinik}
                    label="Di Luar"
                    title="Proporsi Pulang Menginap"
                    icon={Home}
                    color="emerald"
                />
                <MinimalistDonut
                    dataWali={stats.berjalan.keluar.wali}
                    dataKlinik={stats.berjalan.keluar.klinik}
                    label="Di Luar"
                    title="Proporsi Pulang Pergi"
                    icon={Map}
                    color="purple"
                />
            </div>

            {/* --- LAPISAN 3: TABEL PENGAWASAN --- */}
            <div className="mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Wajib Kembali</h3>
            </div>

            <TabelPengawasan
                judul="Pantauan Pulang Menginap"
                deskripsi="Santri pulang ke rumah atau rawat inap RS yang harus kembali hari ini."
                icon={Home}
                color="emerald"
                dataSantri={santriPulang}
            />

            <TabelPengawasan
                judul="Pantauan Pulang Pergi"
                deskripsi="Santri izin keluar singkat yang terpantau aktif hari ini."
                icon={Map}
                color="purple"
                dataSantri={santriKeluar}
            />
        </div>
    );
};

export default DashboardAdmin;