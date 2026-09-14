import React, { useState } from 'react';
import { Home, AlertCircle, Clock, CheckCircle2, UserX, Info } from 'lucide-react';

const DashboardWalikelas = () => {
    // Dummy metrik harian (Fokus HARI INI sesuai PRD V3)
    const metrik = {
        totalSantri: 64, // Misal gabungan santri perwalian kelas 7 & 8
        menungguApproval: 1,
        harusKembaliHariIni: 3,
        terlambat: 1
    };

    // Dummy data Tabel "Santri Harus Kembali Hari Ini" (PRD V3 Bab 16.2)
    const [izinHariIni] = useState([
        { id: '1', santri: 'Ahmad Muzakki', kelas: '7A', jenisIzin: 'PULANG_WALI', sumber: 'Walisantri', deadline: '14 Sep 2026', status: 'HARUS KEMBALI' },
        { id: '2', santri: 'Rifky Hidayat', kelas: '8B', jenisIzin: 'RUJUK_PP_KLINIK', sumber: 'Klinik', deadline: '14 Sep 2026 16:00', status: 'AKTIF' },
        { id: '3', santri: 'Faisal Rahman', kelas: '7B', jenisIzin: 'PP_WALI', sumber: 'Walisantri', deadline: '14 Sep 2026 13:00', status: 'TERLAMBAT' },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'HARUS KEMBALI': return 'bg-amber-100 text-amber-800';
            case 'AKTIF': return 'bg-blue-100 text-blue-800';
            case 'TERLAMBAT': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Home className="text-emerald-600" />
                    Dashboard Walikelas
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pantau status perizinan santri kelas Anda hari ini.</p>
            </div>

            {/* Kartu Metrik Harian */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={14} /> Santri Aktif</div>
                    <div className="text-3xl font-black text-gray-800">{metrik.totalSantri}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Clock size={14} /> Tunggu Approval</div>
                    <div className="text-3xl font-black text-blue-600">{metrik.menungguApproval}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-1"><AlertCircle size={14} /> Harus Kembali</div>
                    <div className="text-3xl font-black text-amber-500">{metrik.harusKembaliHariIni}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50 shadow-sm flex flex-col justify-between">
                    <div className="text-red-600 text-xs font-bold uppercase mb-2 flex items-center gap-1"><UserX size={14} /> Terlambat</div>
                    <div className="text-3xl font-black text-red-600">{metrik.terlambat}</div>
                </div>
            </div>

            {/* Tabel Utama PRD V3 16.2 */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <Info size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-gray-800">Santri Harus Kembali Hari Ini</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-xs text-gray-500 uppercase bg-white border-b">
                            <tr>
                                <th className="px-6 py-3">Nama Santri</th>
                                <th className="px-6 py-3">Kelas</th>
                                <th className="px-6 py-3">Jenis Izin</th>
                                <th className="px-6 py-3">Sumber</th>
                                <th className="px-6 py-3">Deadline Kembali</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {izinHariIni.map((izin) => (
                                <tr key={izin.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{izin.santri}</td>
                                    <td className="px-6 py-4 text-gray-600">{izin.kelas}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-[11px] font-black uppercase tracking-wider">
                                            {izin.jenisIzin.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{izin.sumber}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{izin.deadline}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[11px] font-black tracking-wide ${getStatusBadge(izin.status)}`}>
                                            {izin.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-emerald-600 hover:text-emerald-800 font-bold text-xs px-3 py-1.5 border border-emerald-200 rounded-md bg-emerald-50 transition-colors">
                                            Detail
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

export default DashboardWalikelas;