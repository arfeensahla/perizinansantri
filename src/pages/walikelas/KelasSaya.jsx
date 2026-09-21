import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, CheckCircle, Clock, AlertTriangle, History, MapPin, Phone, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient'; // Pastikan path ini sesuai

const KelasSaya = () => {
    const [kataKunci, setKataKunci] = useState('');
    const [filterStatus, setFilterStatus] = useState('SEMUA');

    // State untuk menampung data asli dari database
    const [dataSantri, setDataSantri] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Mengambil data saat halaman pertama kali dimuat
    useEffect(() => {
        fetchDataSantri();
    }, []);

    const fetchDataSantri = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // Menarik data dari tabel santri sekaligus join dengan tabel kelas
            const { data, error } = await supabase
                .from('santri')
                .select(`
                    id,
                    nama_lengkap,
                    kota_asal,
                    nomor_wa_wali,
                    status_asrama,
                    kelas ( nama_kelas )
                `)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;

            // Format data dari Supabase agar sesuai dengan kebutuhan tampilan UI
            const formattedData = data.map(item => ({
                id: item.id,
                nama: item.nama_lengkap,
                kelas: item.kelas?.nama_kelas || '-',
                kotaAsal: item.kota_asal,
                nomorWhatsApp: item.nomor_wa_wali,
                statusAktif: item.status_asrama,
                // Untuk sementara data izin kita kosongkan sampai tabel perizinan terhubung
                jenisIzin: '-',
                batasTenggat: '-'
            }));

            setDataSantri(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data santri:", error);
            setErrorMsg("Gagal memuat data santri dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Hitung Statistik ---
    const totalSantri = dataSantri.length;
    const totalDiPondok = dataSantri.filter(s => s.statusAktif === 'DI_PONDOK').length;
    const totalDiLuar = dataSantri.filter(s => s.statusAktif === 'DI_LUAR').length;
    const totalTerlambat = dataSantri.filter(s => s.statusAktif === 'TERLAMBAT').length;

    // --- Logika Filter Data ---
    const dataTampil = dataSantri.filter(santri => {
        const matchKata = santri.nama.toLowerCase().includes(kataKunci.toLowerCase()) || santri.kotaAsal.toLowerCase().includes(kataKunci.toLowerCase());
        const matchStatus = filterStatus === 'SEMUA' || santri.statusAktif === filterStatus;
        return matchKata && matchStatus;
    });

    const getStatusUI = (status, jenis, batas) => {
        if (status === 'DI_PONDOK') {
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black tracking-wide">
                        <CheckCircle size={12} /> DI PONDOK PESANTREN
                    </span>
                </div>
            );
        } else if (status === 'DI_LUAR') {
            return (
                <div className="flex flex-col items-start gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide">
                        <Clock size={12} /> SEDANG IZIN DI LUAR
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-emerald-600" />
                        Pantauan Data Santri
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Data terhubung langsung secara real-time dengan Supabase.</p>
                </div>
                <button onClick={fetchDataSantri} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                    Segarkan Data
                </button>
            </div>

            {/* --- STATISTIK KILAT --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Santri</span>
                    <div className="text-2xl font-black text-gray-800">{isLoading ? '...' : totalSantri} <span className="text-sm font-medium text-gray-500">Santri</span></div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Di Pondok</span>
                    <div className="text-2xl font-black text-emerald-800">{isLoading ? '...' : totalDiPondok} <span className="text-sm font-medium text-emerald-600/70">Santri</span></div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Sedang Izin</span>
                    <div className="text-2xl font-black text-blue-800">{isLoading ? '...' : totalDiLuar} <span className="text-sm font-medium text-blue-600/70">Santri</span></div>
                </div>
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 relative z-10">Terlambat</span>
                    <div className="text-2xl font-black text-red-800 relative z-10">{isLoading ? '...' : totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></div>
                </div>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari Nama Santri atau Kota Asal..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>

            {/* --- TABEL DATA KELAS --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Informasi Santri</th>
                                <th className="px-6 py-4">Asal Kota & Kontak Wali</th>
                                <th className="px-6 py-4">Status Asrama</th>
                                <th className="px-6 py-4 text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data dari database...</td></tr>
                            ) : errorMsg ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                            ) : dataTampil.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Tidak ada data santri yang ditemukan.</td></tr>
                            ) : dataTampil.map((santri) => (
                                <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">{santri.nama}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 font-bold uppercase tracking-wider">Kelas {santri.kelas}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                                            <MapPin size={14} className="text-gray-400" /> {santri.kotaAsal}
                                        </div>
                                        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                            <Phone size={12} /> {santri.nomorWhatsApp}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusUI(santri.statusAktif)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all">
                                            <History size={14} /> Riwayat Izin
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KelasSaya;