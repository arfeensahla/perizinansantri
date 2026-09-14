import React, { useState } from 'react';
import { Users, QrCode, Clock } from 'lucide-react';

const KelasSaya = () => {
    // Dummy data santri khusus di kelas Walikelas yang sedang login
    const [daftarSantri] = useState([
        { id: '1', nis: 'NIS-26001', nama: 'Ahmad Muzakki', statusIzin: 'AKTIF', jenisIzin: 'PULANG_WALI', qrReady: true },
        { id: '2', nis: 'NIS-26002', nama: 'Faisal Rahman', statusIzin: 'TIDAK_ADA', jenisIzin: '-', qrReady: false },
        { id: '3', nis: 'NIS-26003', nama: 'Rifky Hidayat', statusIzin: 'MENUNGGU_APPROVAL', jenisIzin: 'PP_WALI', qrReady: false },
        { id: '4', nis: 'NIS-26004', nama: 'Zaid bin Tsabit', statusIzin: 'TERLAMBAT', jenisIzin: 'PULANG_WALI', qrReady: true },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'AKTIF': return 'bg-blue-100 text-blue-800';
            case 'MENUNGGU_APPROVAL': return 'bg-amber-100 text-amber-800';
            case 'TERLAMBAT': return 'bg-red-100 text-red-800';
            case 'TIDAK_ADA': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-emerald-600" />
                    Daftar Santri Kelas Saya
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pantau status santri, unduh QR Code, dan ajukan perpanjangan (PRD V3).</p>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Tabel dengan min-width standar PRD V3 */}
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 w-32">NIS</th>
                                <th className="px-6 py-3">Nama Santri</th>
                                <th className="px-6 py-3">Status Izin</th>
                                <th className="px-6 py-3">Jenis Izin</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daftarSantri.map((santri) => (
                                <tr key={santri.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500">{santri.nis}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{santri.nama}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[11px] font-black tracking-wide ${getStatusBadge(santri.statusIzin)}`}>
                                            {santri.statusIzin.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {santri.jenisIzin !== '-' ? (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-[11px] font-black uppercase tracking-wider">
                                                {santri.jenisIzin.replace('_', ' ')}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Tombol QR hanya muncul jika status izin sudah diapprove (qrReady) */}
                                            {santri.qrReady && (
                                                <button className="flex items-center gap-1 p-1.5 px-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors text-xs font-bold" title="Download QR">
                                                    <QrCode size={14} /> Lihat QR
                                                </button>
                                            )}
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

export default KelasSaya;