import React, { useState } from 'react';
import { Activity, Search, Filter } from 'lucide-react';

const AuditLog = () => {
    // Dummy data mewakili event yang diwajibkan dalam PRD V3 Bab 27
    const [logData] = useState([
        { id: '1', waktu: '14 Sep 2026 08:15', aktor: 'Ust. Ahmad (WALIKELAS)', event: 'CREATE_PERMIT', detail: 'Membuat izin IZN-9901 untuk Ahmad Fulan' },
        { id: '2', waktu: '14 Sep 2026 08:30', aktor: 'Sekretaris Mudir (SEKRETARIS)', event: 'APPROVE/REJECT', detail: 'APPROVED izin IZN-9901' },
        { id: '3', waktu: '14 Sep 2026 09:05', aktor: 'Pos Kesantrian (KESANTRIAN)', event: 'SCAN', detail: 'Tahap 1 Sukses (Exit Check) - IZN-9901' },
        { id: '4', waktu: '14 Sep 2026 14:00', aktor: 'Ust. Budi (WALIKELAS)', event: 'EXTENSION', detail: 'Mengajukan perpanjangan IZN-9902 dari 16:00 menjadi 18:00' },
        { id: '5', waktu: '14 Sep 2026 14:10', aktor: 'Super Admin (ADMIN)', event: 'CANCEL/CORRECTION', detail: 'Koreksi typo nama santri (Zaid bin Tsabit)' },
        { id: '6', waktu: '14 Sep 2026 14:15', aktor: 'Klinik Pusat (KLINIK)', event: 'LOGIN', detail: 'Berhasil masuk ke sistem' },
    ]);

    // Fungsi warna badge event dinamis untuk memudahkan Admin memindai layar
    const getEventBadge = (event) => {
        switch (event) {
            case 'CREATE_PERMIT': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'APPROVE/REJECT': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'SCAN': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'EXTENSION': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'CANCEL/CORRECTION': return 'bg-red-100 text-red-800 border-red-200';
            case 'LOGIN': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-emerald-600" />
                        Audit Log Sistem
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Rekam jejak seluruh aktivitas pengguna di dalam sistem (PRD V3).</p>
                </div>
            </div>

            {/* Baris Filter & Pencarian */}
            <div className="flex flex-col md:flex-row justify-end gap-4 mb-6">
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Cari aktor, event, atau detail..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <Filter size={18} /> Filter Event
                </button>
            </div>

            {/* Tabel Data Log */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 w-48">Waktu (WIB)</th>
                                <th className="px-6 py-3 w-64">Aktor Pengguna</th>
                                <th className="px-6 py-3 w-48">Jenis Event</th>
                                <th className="px-6 py-3">Detail Aktivitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logData.map((log) => (
                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        {log.waktu}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {log.aktor}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wider border ${getEventBadge(log.event)}`}>
                                            {log.event}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {log.detail}
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

export default AuditLog;