import React, { useState } from 'react';
import { ClipboardList, Search, Filter, Eye } from 'lucide-react';

const SemuaIzin = () => {
    // Sesuai PRD V3 Bab 17: Filter utama [ HARI INI ] dan [ SEMUA ]
    const [filterWaktu, setFilterWaktu] = useState('HARI INI');

    // Dummy data mewakili berbagai status sesuai PRD V3
    const [daftarIzin] = useState([
        { id: '1', kode: 'IZN-9901', santri: 'Ahmad Fulan', kelas: '8A', jenis: 'PULANG_WALI', deadline: '13 Sep 2026', status: 'APPROVED' },
        { id: '2', kode: 'IZN-9902', santri: 'Budi Santoso', kelas: '9B', jenis: 'RUJUK_PP_KLINIK', deadline: '13 Sep 2026 16:00', status: 'SELESAI' },
        { id: '3', kode: 'IZN-9903', santri: 'Umar Al-Faruq', kelas: '7C', jenis: 'PP_WALI', deadline: '13 Sep 2026 17:00', status: 'TERLAMBAT' },
        { id: '4', kode: 'IZN-9904', santri: 'Zaid bin Tsabit', kelas: '9A', jenis: 'PULANG_SAKIT', deadline: '12 Sep 2026', status: 'MENUNGGU_APPROVAL' },
    ]);

    // Fungsi warna badge status dinamis
    const getStatusBadge = (status) => {
        switch (status) {
            case 'SELESAI': return 'bg-emerald-100 text-emerald-800';
            case 'APPROVED': return 'bg-blue-100 text-blue-800';
            case 'TERLAMBAT': return 'bg-red-100 text-red-800';
            case 'MENUNGGU_APPROVAL': return 'bg-amber-100 text-amber-800';
            case 'KADALUARSA': return 'bg-gray-200 text-gray-700';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-emerald-600" />
                        Rekap Semua Izin
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau seluruh riwayat perizinan santri secara terpusat.</p>
                </div>
            </div>

            {/* Baris Filter & Pencarian */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                {/* Toggle Filter HARI INI vs SEMUA (Sesuai PRD V3) */}
                <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setFilterWaktu('HARI INI')}
                        className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-md transition-colors ${filterWaktu === 'HARI INI' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        HARI INI
                    </button>
                    <button
                        onClick={() => setFilterWaktu('SEMUA')}
                        className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-md transition-colors ${filterWaktu === 'SEMUA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        SEMUA
                    </button>
                </div>

                {/* Kolom Pencarian */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Cari nama atau kode izin..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
            </div>

            {/* Tabel Data (Sesuai PRD V3: min-w-*, horizontal overflow) */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Kode Izin</th>
                                <th className="px-6 py-3">Santri & Kelas</th>
                                <th className="px-6 py-3">Jenis Izin</th>
                                <th className="px-6 py-3">Batas Kembali</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daftarIzin.map((izin) => (
                                <tr key={izin.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-700 font-bold">{izin.kode}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{izin.santri}</div>
                                        <div className="text-xs text-gray-500">{izin.kelas}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-[11px] font-black tracking-wider uppercase">
                                            {izin.jenis.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-700">
                                        {izin.deadline}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide ${getStatusBadge(izin.status)}`}>
                                            {izin.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold text-xs px-3 py-1.5 border border-emerald-200 rounded-md bg-emerald-50 transition-colors">
                                            <Eye size={14} /> Detail
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

export default SemuaIzin;