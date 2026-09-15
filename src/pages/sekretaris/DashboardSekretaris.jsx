import React, { useState } from 'react';
import { LayoutDashboard, ClipboardCheck, Clock, UserCheck, AlertTriangle, ArrowRight, Eye } from 'lucide-react';

const DashboardSekretaris = () => {
    // Dummy Data Metrik Harian Sekretaris Mudir
    const metrik = {
        antreanBaru: 5,
        antreanPerpanjangan: 2,
        izinAktifHariIni: 24,
        kasusKritis: 1 // Contoh: Santri terlambat/QR kadaluarsa yang butuh atensi
    };

    // Dummy Data Cuplikan Antrean Mendesak
    const [antreanMendesak] = useState([
        { id: '1', jenis: 'IZIN BARU', santri: 'Ahmad Muzakki', kelas: '7A', waktu: 'Keluar: 08:00 WIB' },
        { id: '2', jenis: 'PERPANJANGAN', santri: 'Rifky Hidayat', kelas: '8B', waktu: 'Batas Baru: 18:00 WIB' },
    ]);

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-600" />
                    Dashboard Sekretaris Mudir
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pusat kontrol screening dan persetujuan perizinan santri.</p>
            </div>

            {/* Kartu Metrik Utama */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
                    <div className="text-purple-600 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <ClipboardCheck size={14} /> Antrean Baru
                    </div>
                    <div className="text-3xl font-black text-gray-800">{metrik.antreanBaru}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                    <div className="text-amber-600 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <Clock size={14} /> Perpanjangan
                    </div>
                    <div className="text-3xl font-black text-gray-800">{metrik.antreanPerpanjangan}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                    <div className="text-blue-600 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <UserCheck size={14} /> Izin Aktif
                    </div>
                    <div className="text-3xl font-black text-gray-800">{metrik.izinAktifHariIni}</div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
                    <div className="text-red-600 text-[10px] md:text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} /> Kasus Kritis
                    </div>
                    <div className="text-3xl font-black text-red-600">{metrik.kasusKritis}</div>
                </div>
            </div>

            {/* Dua Kolom untuk Shortcut Pekerjaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Panel Kiri: Antrean Mendesak */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Perlu Tindakan Cepat</h3>
                    </div>
                    <div className="p-0 flex-1">
                        {antreanMendesak.map((item, index) => (
                            <div key={item.id} className={`p-4 flex justify-between items-center ${index !== antreanMendesak.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div>
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider mb-1 ${item.jenis === 'IZIN BARU' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {item.jenis}
                                    </span>
                                    <h4 className="font-bold text-gray-800">{item.santri} <span className="text-gray-500 font-normal text-sm">({item.kelas})</span></h4>
                                    <p className="text-xs text-gray-500 mt-1">{item.waktu}</p>
                                </div>
                                <button className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors">
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t bg-gray-50 text-center">
                        <button className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                            Buka Semua Antrean
                        </button>
                    </div>
                </div>

                {/* Panel Kanan: Akses Cepat */}
                <div className="bg-white border rounded-xl shadow-sm p-5 flex flex-col justify-center">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Akses Cepat Operasional</h3>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <ClipboardCheck size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800">Mode Bulk Approval</div>
                                    <div className="text-xs text-gray-500">Setujui banyak izin sekaligus</div>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-gray-400 group-hover:text-emerald-500" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Eye size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800">Pantau Keterlambatan</div>
                                    <div className="text-xs text-gray-500">Lihat santri yang belum kembali</div>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSekretaris;