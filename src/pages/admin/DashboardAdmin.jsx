import React, { useState } from 'react';
import { LayoutDashboard, Users, UserCheck, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const DashboardAdmin = () => {
    // Dummy Data Metrik Harian (Fokus HARI INI sesuai PRD V3)
    const metrik = {
        totalSantri: 450,
        totalKelas: 12,
        izinAktifHariIni: 15,
        santriMasihDiLuar: 8,
        santriTerlambat: 2,
        menungguApproval: 3
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-600" />
                    Dashboard Administrator
                </h2>
                <p className="text-gray-500 text-sm mt-1">Ringkasan operasional dan kontrol perizinan santri HARI INI.</p>
            </div>

            {/* Baris 1: Metrik Utama (Highlight) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Izin Berjalan</p>
                        <h3 className="text-3xl font-black text-gray-800">{metrik.izinAktifHariIni}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <UserCheck size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Masih di Luar Pondok</p>
                        <h3 className="text-3xl font-black text-amber-600">{metrik.santriMasihDiLuar}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-red-600 text-xs font-bold uppercase mb-1">Terlambat Kembali</p>
                        <h3 className="text-3xl font-black text-red-700">{metrik.santriTerlambat}</h3>
                    </div>
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Baris 2: Informasi Sistem & Antrean */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Info Master Data */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Status Master Data</h3>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-3xl font-black text-emerald-600">{metrik.totalSantri}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Santri Aktif</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div>
                            <p className="text-3xl font-black text-emerald-600">{metrik.totalKelas}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Kelas Aktif</p>
                        </div>
                    </div>
                </div>

                {/* Info Antrean Approval */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <h3 className="font-bold text-gray-800 mb-2">Antrean Persetujuan Baru</h3>
                    <div className="text-4xl font-black text-purple-600 mb-2">{metrik.menungguApproval}</div>
                    <p className="text-sm text-gray-500 mb-4">Pengajuan izin menunggu proses Sekretaris Mudir.</p>
                    <button className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                        Lihat Semua Izin <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;