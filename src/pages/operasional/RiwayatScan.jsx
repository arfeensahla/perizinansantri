import React, { useState } from 'react';
import { History, ArrowRightFromLine, ArrowLeftToLine, Search, Filter } from 'lucide-react';

const RiwayatScan = () => {
    const [tabAktif, setTabAktif] = useState('KELUAR'); // 'KELUAR' atau 'MASUK'
    const [kataKunci, setKataKunci] = useState('');

    // --- Data Dummy Riwayat Security Hari Ini (Kamus Standar) ---
    const riwayat = [
        { id: 1, waktu: '08:15', nama: 'Ahmad Muzakki', kelas: '7A', jenis: 'PULANG_MENGINAP_WALI', tipe: 'KELUAR', status: 'VALID' },
        { id: 2, waktu: '08:30', nama: 'Faisal Rahman', kelas: '8B', jenis: 'RUJUK_INAP_KLINIK', tipe: 'KELUAR', status: 'VALID (Rujukan Klinik)' },
        { id: 3, waktu: '09:00', nama: 'Umar Al-Faruq', kelas: '7C', jenis: 'PULANG_PERGI_WALI', tipe: 'KELUAR', status: 'VALID' },
        { id: 4, waktu: '14:15', nama: 'Umar Al-Faruq', kelas: '7C', jenis: 'PULANG_PERGI_WALI', tipe: 'MASUK', status: 'TEPAT_WAKTU' },
        { id: 5, waktu: '15:30', nama: 'Tariq bin Ziyad', kelas: '9B', jenis: 'PULANG_PERGI_WALI', tipe: 'MASUK', status: 'TERLAMBAT' },
    ];

    // Filter data berdasarkan Tab dan Pencarian
    const dataTampil = riwayat
        .filter(item => item.tipe === tabAktif)
        .filter(item => item.nama.toLowerCase().includes(kataKunci.toLowerCase()) || item.kelas.toLowerCase().includes(kataKunci.toLowerCase()));

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-md mx-auto">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
                    <History size={28} className="text-gray-700" />
                    Riwayat Gerbang
                </h2>
                <p className="text-gray-500 text-sm mt-1">Buku mutasi digital Pos Keamanan hari ini.</p>
            </div>

            {/* Pencarian */}
            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="Cari nama atau kelas..."
                    value={kataKunci}
                    onChange={(e) => setKataKunci(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 shadow-sm"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>

            {/* Tab Navigasi */}
            <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setTabAktif('KELUAR')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'KELUAR' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ArrowRightFromLine size={18} /> SCAN KELUAR
                </button>
                <button
                    onClick={() => setTabAktif('MASUK')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'MASUK' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ArrowLeftToLine size={18} /> SCAN MASUK
                </button>
            </div>

            {/* List Riwayat */}
            <div className="space-y-3">
                {dataTampil.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                        Belum ada data pindai (scan) {tabAktif.toLowerCase()} yang sesuai.
                    </div>
                ) : (
                    dataTampil.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            {/* Indikator Waktu (Kiri) */}
                            <div className="flex flex-col items-center justify-center w-14 border-r border-gray-100 pr-4">
                                <span className="text-sm font-black text-gray-800">{item.waktu}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">WIB</span>
                            </div>

                            {/* Detail Santri (Kanan) */}
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 leading-tight">{item.nama}</h4>
                                <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
                                    Kelas {item.kelas} • {item.jenis.replace(/_/g, ' ')}
                                </div>

                                <div className="mt-2 inline-block">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black tracking-wider uppercase ${item.status === 'VALID' || item.status === 'TEPAT_WAKTU'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : item.status.includes('Rujukan')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RiwayatScan;