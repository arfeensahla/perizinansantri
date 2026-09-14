import React, { useState } from 'react';
import { Eye, AlertCircle, Clock, MapPin, XOctagon } from 'lucide-react';

const Monitoring = () => {
    // Dummy Data Metrik
    const metrik = {
        izinAktif: 24,
        terlambat: 3,
        qrKadaluarsa: 2, // PRD V3 Bab 13: QR belum dipakai tapi lewat deadline
    };

    // Dummy Data Tabel Monitoring (Fokus pada isu operasional)
    const [dataMonitoring] = useState([
        { id: '1', kode: 'IZN-9903', santri: 'Faisal Rahman', kelas: '7B', status: 'TERLAMBAT', info: 'Batas: 14 Sep 13:00' },
        { id: '2', kode: 'IZN-9901', santri: 'Ahmad Muzakki', kelas: '7A', status: 'AKTIF (Di Luar)', info: 'Pos Gerbang Selesai' },
        { id: '3', kode: 'IZN-9899', santri: 'Umar Al-Faruq', kelas: '9A', status: 'KADALUARSA', info: 'Belum scan tahap 1' },
    ]);

    const getStatusBadge = (status) => {
        if (status.includes('TERLAMBAT')) return 'bg-red-100 text-red-800 border-red-200';
        if (status.includes('AKTIF')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (status.includes('KADALUARSA')) return 'bg-gray-200 text-gray-700 border-gray-300';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Eye className="text-emerald-600" />
                    Monitoring Perizinan
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pantau pergerakan santri, keterlambatan, dan status QR Code operasional.</p>
            </div>

            {/* Kartu Metrik Isu Operasional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-blue-600 text-xs font-bold uppercase mb-1">Izin Berjalan</p>
                        <h3 className="text-2xl font-black text-gray-800">{metrik.izinAktif} Santri</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <MapPin size={20} />
                    </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-red-600 text-xs font-bold uppercase mb-1">Terlambat Kembali</p>
                        <h3 className="text-2xl font-black text-red-700">{metrik.terlambat} Santri</h3>
                    </div>
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-xs font-bold uppercase mb-1">QR Kadaluarsa</p>
                        <h3 className="text-2xl font-black text-gray-700">{metrik.qrKadaluarsa} Pengajuan</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center">
                        <XOctagon size={20} />
                    </div>
                </div>
            </div>

            {/* Tabel Sorotan Data Monitoring */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <Clock size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-gray-800">Sorotan Status Operasional</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="text-xs text-gray-500 uppercase bg-white border-b">
                            <tr>
                                <th className="px-6 py-3 w-32">Kode Izin</th>
                                <th className="px-6 py-3">Nama Santri & Kelas</th>
                                <th className="px-6 py-3">Status Saat Ini</th>
                                <th className="px-6 py-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataMonitoring.map((data) => (
                                <tr key={data.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500 text-xs">{data.kode}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{data.santri}</div>
                                        <div className="text-xs text-gray-500">{data.kelas}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(data.status)}`}>
                                            {data.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                                        {data.info}
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