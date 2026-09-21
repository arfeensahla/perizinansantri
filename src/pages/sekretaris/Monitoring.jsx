import React, { useState } from 'react';
import { Activity, Search, Filter, AlertTriangle, Clock, MapPin, User, CheckCircle } from 'lucide-react';

const Monitoring = () => {
    // --- State Pencarian & Filter ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterStatus, setFilterStatus] = useState('TERLAMBAT');
    const [filterKelas, setFilterKelas] = useState('SEMUA');

    // --- Data Dummy Global (Tanpa Singkatan & Kamus Standar) ---
    const [dataSantriLuar] = useState([
        { id: 1, nomorInduk: '260032', nama: 'Dimas Anggara', kelas: '7A', walikelas: 'Ustadz Zulfikar', hpWalikelas: '081234567890', jenisIzin: 'PULANG_PERGI_WALI', tujuan: 'Cirebon', batasWaktu: '21 September 2026, 09:00 WIB', status: 'TERLAMBAT', durasiTelat: '1 Jam 55 Menit' },
        { id: 2, nomorInduk: '250114', nama: 'Tariq bin Ziyad', kelas: '8B', walikelas: 'Ustadz Mahmud', hpWalikelas: '081987654321', jenisIzin: 'PULANG_MENGINAP_WALI', tujuan: 'Bandung', batasWaktu: '20 September 2026, 17:00 WIB', status: 'TERLAMBAT', durasiTelat: '17 Jam 55 Menit' },
        { id: 3, nomorInduk: '240089', nama: 'Zaid bin Tsabit', kelas: '9A', walikelas: 'Ustadz Hasan', hpWalikelas: '085612345678', jenisIzin: 'RUJUK_INAP_KLINIK', tujuan: 'Rumah Sakit Majalengka', batasWaktu: '23 September 2026, 12:00 WIB', status: 'DI_LUAR', durasiTelat: '-' },
        { id: 4, nomorInduk: '260011', nama: 'Ahmad Muzakki', kelas: '7A', walikelas: 'Ustadz Zulfikar', hpWalikelas: '081234567890', jenisIzin: 'PULANG_MENGINAP_WALI', tujuan: 'Kuningan', batasWaktu: '22 September 2026, 15:00 WIB', status: 'DI_LUAR', durasiTelat: '-' },
        { id: 5, nomorInduk: '250055', nama: 'Fathan Mubin', kelas: '8A', walikelas: 'Ustadz Anwar', hpWalikelas: '081345678901', jenisIzin: 'PULANG_PERGI_WALI', tujuan: 'Cirebon', batasWaktu: '21 September 2026, 15:00 WIB', status: 'DI_LUAR', durasiTelat: '-' },
    ]);

    // --- Hitung Statistik ---
    const totalDiLuar = dataSantriLuar.length;
    const totalTerlambat = dataSantriLuar.filter(s => s.status === 'TERLAMBAT').length;
    const totalAman = totalDiLuar - totalTerlambat;

    // --- Logika Filter Data ---
    const dataTampil = dataSantriLuar.filter(santri => {
        const matchKata = santri.nama.toLowerCase().includes(kataKunci.toLowerCase()) || santri.nomorInduk.includes(kataKunci) || santri.walikelas.toLowerCase().includes(kataKunci.toLowerCase());
        const matchStatus = filterStatus === 'SEMUA' || santri.status === filterStatus;
        const matchKelas = filterKelas === 'SEMUA' || santri.kelas.startsWith(filterKelas);
        return matchKata && matchStatus && matchKelas;
    });

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-emerald-600" />
                    Radar Keterlambatan
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pantau seluruh santri dari semua kelas yang belum kembali ke pondok pesantren.</p>
            </div>

            {/* --- STATISTIK RADAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total di Luar</div>
                        <div className="text-2xl font-black text-gray-800">{totalDiLuar} <span className="text-sm font-medium text-gray-500">Santri</span></div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Status Aman</div>
                        <div className="text-2xl font-black text-emerald-800">{totalAman} <span className="text-sm font-medium text-emerald-600/70">Santri</span></div>
                    </div>
                </div>

                <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center relative z-10">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-sm font-bold text-red-700 uppercase tracking-wider mb-0.5">Terlambat Kembali</div>
                        <div className="text-2xl font-black text-red-800">{totalTerlambat} <span className="text-sm font-medium text-red-600/70">Santri</span></div>
                    </div>
                    {totalTerlambat > 0 && <AlertTriangle className="absolute -right-4 -bottom-4 text-red-200 opacity-40 w-24 h-24 transform -rotate-12" />}
                </div>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari Santri, Nomor Induk, atau Nama Walikelas..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>

                <div className="flex gap-3 md:w-auto w-full">
                    <div className="flex-1 md:w-36 flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-1">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={filterKelas}
                            onChange={(e) => setFilterKelas(e.target.value)}
                            className="px-2 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-full"
                        >
                            <option value="SEMUA">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                        </select>
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex-1 md:w-56 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700"
                    >
                        <option value="SEMUA">Semua Status</option>
                        <option value="TERLAMBAT">Hanya Terlambat</option>
                        <option value="DI_LUAR">Masih Aman (Di Luar)</option>
                    </select>
                </div>
            </div>

            {/* --- TABEL DATA GLOBAL --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[850px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Data Santri & Kategori</th>
                                <th className="px-6 py-4">Tujuan Izin</th>
                                <th className="px-6 py-4">Status & Waktu Tenggat</th>
                                <th className="px-6 py-4 text-right">Informasi Walikelas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataTampil.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <CheckCircle size={48} className="mb-3 opacity-20 text-emerald-500" />
                                            <p className="text-base font-bold text-gray-600">Alhamdulillah, Radar Bersih!</p>
                                            <p className="text-sm mt-1">Tidak ada santri yang sesuai dengan saringan pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : dataTampil.map((santri) => (
                                <tr key={santri.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                                                {santri.kelas}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-base">{santri.nama}</div>
                                                <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                                                    {santri.jenisIzin.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700">
                                            <MapPin size={12} className="text-gray-400" /> {santri.tujuan}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {santri.status === 'TERLAMBAT' ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black tracking-wide animate-pulse">
                                                    <AlertTriangle size={12} /> MELEWATI BATAS ({santri.durasiTelat})
                                                </span>
                                                <span className="text-[11px] font-mono font-bold text-red-600">Batas: {santri.batasWaktu}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black tracking-wide">
                                                    <Clock size={12} /> SEDANG IZIN
                                                </span>
                                                <span className="text-[11px] font-mono text-gray-600">Batas: {santri.batasWaktu}</span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm font-bold text-gray-800">{santri.walikelas}</div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">Kontak: {santri.hpWalikelas}</div>
                                        </div>
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

export default Monitoring;