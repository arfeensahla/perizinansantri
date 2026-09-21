import React, { useState } from 'react';
import { Users, Search, Filter, CheckCircle, Clock, AlertTriangle, History, MapPin, Phone } from 'lucide-react';

const KelasSaya = () => {
    // --- State Pencarian & Filter ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterStatus, setFilterStatus] = useState('SEMUA');

    // --- Data Dummy (Terisolasi khusus Kelas 7A, Tanpa Nomor Induk & Tanpa Singkatan) ---
    const [santri7A] = useState([
        { id: 'S-001', nama: 'Ahmad Muzakki', kotaAsal: 'Cirebon', nomorWhatsApp: '081234567890', statusAktif: 'DI_LUAR', jenisIzin: 'PULANG_MENGINAP_WALI', batasTenggat: '21 September 2026, 17:00 WIB' },
        { id: 'S-002', nama: 'Bintang Pratama', kotaAsal: 'Kuningan', nomorWhatsApp: '081298765432', statusAktif: 'DI_PONDOK', jenisIzin: '-', batasTenggat: '-' },
        { id: 'S-003', nama: 'Chairil Anwar', kotaAsal: 'Majalengka', nomorWhatsApp: '085612341234', statusAktif: 'DI_PONDOK', jenisIzin: '-', batasTenggat: '-' },
        { id: 'S-004', nama: 'Dimas Anggara', kotaAsal: 'Indramayu', nomorWhatsApp: '081345678901', statusAktif: 'TERLAMBAT', jenisIzin: 'PULANG_PERGI_WALI', batasTenggat: '20 September 2026, 15:00 WIB' },
        { id: 'S-005', nama: 'Eka Saputra', kotaAsal: 'Cirebon', nomorWhatsApp: '087812345678', statusAktif: 'DI_LUAR', jenisIzin: 'RUJUK_INAP_KLINIK', batasTenggat: '22 September 2026, 12:00 WIB' },
    ]);

    // --- Hitung Statistik ---
    const totalSantri = santri7A.length;
    const totalDiPondok = santri7A.filter(s => s.statusAktif === 'DI_PONDOK').length;
    const totalDiLuar = santri7A.filter(s => s.statusAktif === 'DI_LUAR').length;
    const totalTerlambat = santri7A.filter(s => s.statusAktif === 'TERLAMBAT').length;

    // --- Logika Filter Data ---
    const dataTampil = santri7A.filter(santri => {
        const matchKata = santri.nama.toLowerCase().includes(kataKunci.toLowerCase()) || santri.kotaAsal.toLowerCase().includes(kataKunci.toLowerCase());
        const matchStatus = filterStatus === 'SEMUA' || santri.statusAktif === filterStatus;
        return matchKata && matchStatus;
    });

    // --- Helper Visual Status ---
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{jenis.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-700 font-mono">Batas: {batas}</span>
                </div>
            );
        } else if (status === 'TERLAMBAT') {
            return (
                <div className="flex flex-col items-start gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse">
                        <AlertTriangle size={12} /> TERLAMBAT KEMBALI
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{jenis.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-red-600 font-mono font-bold">Batas: {batas}</span>
                </div>
            );
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-emerald-600" />
                    Pantauan Kelas Saya (7A)
                </h2>
                <p className="text-gray-500 text-sm mt-1">Monitoring status absensi perizinan khusus santri perwalian Anda.</p>
            </div>

            {/* --- STATISTIK KILAT --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Santri</span>
                    <div className="text-2xl font-black text-gray-800">{totalSantri} <span className="text-sm font-medium text-gray-500">Santri</span></div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Di Pondok</span>
                    <div className="text-2xl font-black text-emerald-800">{totalDiPondok} <span className="text-sm font-medium text-emerald-600/70">Santri</span></div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Sedang Izin</span>
                    <div className="text-2xl font-black text-blue-800">{totalDiLuar} <span className="text-sm font-medium text-blue-600/70">Santri</span></div>
                </div>
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 relative z-10">Terlambat</span>
                    <div className="text-2xl font-black text-red-800 relative z-10">{totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></div>
                    {totalTerlambat > 0 && <AlertTriangle className="absolute -right-2 -bottom-2 text-red-200 opacity-50 w-16 h-16 transform -rotate-12" />}
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

                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-1 md:w-80 w-full">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-full"
                    >
                        <option value="SEMUA">Semua Status</option>
                        <option value="DI_PONDOK">Hanya Di Pondok</option>
                        <option value="DI_LUAR">Sedang Izin Keluar/Pulang</option>
                        <option value="TERLAMBAT">Terlambat Kembali</option>
                    </select>
                </div>
            </div>

            {/* --- TABEL DATA KELAS --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Informasi Santri (7A)</th>
                                <th className="px-6 py-4">Asal Kota & Kontak Wali</th>
                                <th className="px-6 py-4">Status & Waktu Kembali</th>
                                <th className="px-6 py-4 text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataTampil.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Tidak ada data santri yang sesuai dengan kriteria penyaringan.</td></tr>
                            ) : dataTampil.map((santri) => (
                                <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">{santri.nama}</div>
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
                                        {getStatusUI(santri.statusAktif, santri.jenisIzin, santri.batasTenggat)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all"
                                            title="Lihat Riwayat Lengkap"
                                        >
                                            <History size={14} /> Riwayat Izin
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-400 mt-4 px-2">
                * Tombol <b>Riwayat Izin</b> akan membuka catatan historis seluruh perizinan santri tersebut sejak awal tahun ajaran.
            </p>
        </div>
    );
};

export default KelasSaya;