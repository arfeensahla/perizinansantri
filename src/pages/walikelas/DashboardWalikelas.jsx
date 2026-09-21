import React, { useState } from 'react';
import { LayoutDashboard, Home, Map, Clock, AlertTriangle, MessageCircle } from 'lucide-react';

// --- Komponen SVG Donut Chart Minimalis ---
const MinimalistDonut = ({ dataWali, dataKlinik, label, title, icon: Icon, color }) => {
    const total = dataWali + dataKlinik;
    const pctWali = total === 0 ? 0 : (dataWali / total) * 100;
    const pctKlinik = total === 0 ? 0 : (dataKlinik / total) * 100;

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-${color}-200 transition-colors`}>
            <div className={`px-5 py-4 bg-${color}-50/50 border-b border-gray-50 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-700 rounded-lg`}>
                        <Icon size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izin Berjalan</span>
            </div>

            <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        {pctWali > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${pctWali}, 100`} />}
                        {pctKlinik > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${pctKlinik}, 100`} strokeDashoffset={`-${pctWali}`} />}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-800 leading-none">{total}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{label}</span>
                    </div>
                </div>

                <div className="space-y-4 min-w-[120px]">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-sm font-semibold text-gray-600">Walisantri</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataWali}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-semibold text-gray-600">Klinik</span>
                        </div>
                        <span className="text-lg font-black text-gray-900">{dataKlinik}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardWalikelas = () => {
    // Data Khusus Kelas 7A
    const namaKelas = "7A";
    const data = {
        menungguPersetujuan: { pulang: 2, keluar: 1, perpanjangan: 0 },
        berjalan: { pulang: { wali: 3, klinik: 0 }, keluar: { wali: 1, klinik: 1 } }
    };

    // Filter Santri hanya untuk kelas 7A (Izin Pulang Menginap) - Tanpa NIS
    const [santriPulang] = useState([
        { id: 'S-001', nama: 'Ahmad Muzakki', waliSiswa: 'Bapak Ridwan', jenis: 'PULANG_MENGINAP_WALI', batasTanggal: '21 September 2026', batasJam: '17:00', status: 'DI_LUAR' },
        { id: 'S-002', nama: 'Ibrahim Hafidz', waliSiswa: 'Ibu Nisa', jenis: 'PULANG_MENGINAP_WALI', batasTanggal: '19 September 2026', batasJam: '15:00', status: 'TERLAMBAT' }, // Lewat hari
    ]);

    // Filter Santri hanya untuk kelas 7A (Izin Pulang Pergi) - Tanpa NIS
    const [santriKeluar] = useState([
        { id: 'S-003', nama: 'Yusuf Maulana', waliSiswa: 'Bapak Hasan', jenis: 'PULANG_PERGI_WALI', batasTanggal: '21 September 2026', batasJam: '17:00', status: 'DI_LUAR' },
        { id: 'S-004', nama: 'Daffa Rizki', waliSiswa: 'Ibu Sarah', jenis: 'RAWAT_JALAN_KLINIK', batasTanggal: '21 September 2026', batasJam: '12:00', status: 'TERLAMBAT' }, // Lewat jam
    ]);

    const handleWAOrtu = (waliSiswa, santri) => {
        alert(`Membuka WhatsApp Web untuk mengirim pesan ke ${waliSiswa} (Orang Tua):\n\n"Assalamu'alaikum Bapak/Ibu, mohon maaf mengingatkan bahwa ananda ${santri} tenggat waktu izinnya hampir/sudah habis. Mohon agar segera kembali ke pondok pesantren."`);
    };

    // Komponen Reusable untuk Tabel Wajib Kembali yang Disederhanakan
    const TabelPengawasan = ({ judul, deskripsi, icon: Icon, color, dataSantri }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6`}>
            <div className={`px-6 py-5 border-b bg-${color}-50/30 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-lg`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{judul}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full border border-${color}-200`}>
                    {dataSantri.length} Santri
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-4">Nama Santri & Jenis Izin</th>
                            <th className="px-6 py-4">Wali Santri (Orang Tua)</th>
                            <th className="px-6 py-4">Batas Tenggat</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataSantri.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Aman. Tidak ada santri kelas {namaKelas} di daftar ini.</td></tr>
                        ) : dataSantri.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 uppercase">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">{santri.waliSiswa}</td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${santri.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-900'}`}>
                                        {santri.batasTanggal}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam} WIB</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {santri.status === 'TERLAMBAT' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded border border-red-200 text-xs font-black shadow-sm animate-pulse">
                                            <AlertTriangle size={12} /> TERLAMBAT
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-bold tracking-wide shadow-sm">
                                            <Clock size={12} /> DI LUAR
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleWAOrtu(santri.waliSiswa, santri.nama)}
                                        className="inline-flex items-center justify-center w-9 h-9 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 rounded-lg shadow-sm transition-all"
                                        title={`Kirim WA ke ${santri.waliSiswa} (Orang Tua)`}
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-600" />
                    Dashboard Walikelas (Kelas {namaKelas})
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pantau khusus pengajuan dan kepulangan santri kelas Anda.</p>
            </div>

            <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Menunggu Persetujuan Sekretaris</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Menginap</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{data.menungguPersetujuan.pulang}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Home size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-purple-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang Pergi</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{data.menungguPersetujuan.keluar}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors"><Map size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all cursor-pointer">
                    <div>
                        <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-1">Perpanjangan Waktu</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{data.menungguPersetujuan.perpanjangan}</span>
                            <span className="text-sm font-medium text-gray-500">Ajuan</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Santri Kelas {namaKelas} di Luar</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <MinimalistDonut dataWali={data.berjalan.pulang.wali} dataKlinik={data.berjalan.pulang.klinik} label="Di Luar" title="Pulang Menginap" icon={Home} color="emerald" />
                <MinimalistDonut dataWali={data.berjalan.keluar.wali} dataKlinik={data.berjalan.keluar.klinik} label="Di Luar" title="Pulang Pergi" icon={Map} color="purple" />
            </div>

            <div className="mb-2 mt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Santri Kelas {namaKelas}</h3>
            </div>
            <TabelPengawasan judul="Pantauan Pulang Menginap" deskripsi="Santri kelas Anda yang wajib kembali dari rumah hari ini." icon={Home} color="emerald" dataSantri={santriPulang} />
            <TabelPengawasan judul="Pantauan Pulang Pergi" deskripsi="Santri kelas Anda yang keluar sementara hari ini." icon={Map} color="purple" dataSantri={santriKeluar} />
        </div>
    );
};

export default DashboardWalikelas;