import React, { useState } from 'react';
import { LayoutDashboard, Home, Map, AlertTriangle, CalendarX2, CheckCircle, AlertCircle } from 'lucide-react';

// --- Komponen SVG Donut Chart Minimalis ---
// Ditambahkan prop 'showKlinik' agar kita bisa menyembunyikan legenda Klinik di Izin Keluar
const MinimalistDonut = ({ dataWali, dataKlinik = 0, label, title, icon: Icon, color, showKlinik = true }) => {
    const total = dataWali + dataKlinik;
    const pctWali = total === 0 ? 0 : (dataWali / total) * 100;
    const pctKlinik = total === 0 ? 0 : (dataKlinik / total) * 100;

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-${color}-200 transition-colors`}>
            <div className={`px-5 py-4 bg-${color}-50/50 border-b border-gray-50 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-700 rounded-lg`}><Icon size={18} /></div>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izin Berjalan</span>
            </div>

            <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                        {pctWali > 0 && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color === 'emerald' ? '#10b981' : '#a855f7'} strokeWidth="4" strokeDasharray={`${pctWali}, 100`} />}
                        {pctKlinik > 0 && showKlinik && <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${pctKlinik}, 100`} strokeDashoffset={`-${pctWali}`} />}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-800 leading-none">{total}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{label}</span>
                    </div>
                </div>
                <div className="space-y-4 min-w-[120px]">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full bg-${color}-500`}></div><span className="text-sm font-semibold text-gray-600">Walisantri</span></div>
                        <span className="text-lg font-black text-gray-900">{dataWali}</span>
                    </div>
                    {/* Render data Klinik HANYA JIKA showKlinik = true */}
                    {showKlinik && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-sm font-semibold text-gray-600">Klinik</span></div>
                            <span className="text-lg font-black text-gray-900">{dataKlinik}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardKesantrian = () => {
    // Data Dummy Khusus Kesantrian
    const data = {
        antrean: {
            pulangWali: 8,
            pulangKlinik: 2, // Ditambahkan kembali untuk Izin Pulang (Inap/Pulang Sakit)
            keluarWali: 12
        },
        berjalan: {
            pulangWali: 45,
            pulangKlinik: 5, // Ditambahkan kembali untuk Izin Pulang
            keluarWali: 15   // Murni Wali, tanpa Klinik
        }
    };

    // Tabel Pengawasan Izin Pulang (Kini mencakup Wali + Klinik Inap)
    const [santriPulang] = useState([
        { id: '1', nama: 'Ahmad Muzakki', kelas: '7A', walikelas: 'Ust. Fulan', jenis: 'PULANG_WALI', batasTanggal: '16 Sep 2026', batasJam: '17:00', status: 'HARI_INI' },
        { id: '2', nama: 'Faisal Rahman', kelas: '8B', walikelas: 'Ust. Budi', jenis: 'RUJUK_INAP_KLINIK', batasTanggal: '16 Sep 2026', batasJam: '12:00', status: 'HARI_INI' },
        { id: '3', nama: 'Zaid bin Tsabit', kelas: '9A', walikelas: 'Ust. Zulfikar', jenis: 'PULANG_WALI', batasTanggal: '14 Sep 2026', batasJam: '15:00', status: 'LEWAT_HARI' }
    ]);

    // Tabel Pengawasan Izin Keluar (Murni Wali, santri rujuk PP tidak ada di sini)
    const [santriKeluar] = useState([
        { id: '4', nama: 'Umar Al-Faruq', kelas: '7C', walikelas: 'Ust. Hasan', jenis: 'PP_WALI', batasTanggal: '16 Sep 2026', batasJam: '17:00', statusWaktu: 'AMAN' },
        { id: '6', nama: 'Tariq bin Ziyad', kelas: '9B', walikelas: 'Ust. Usman', jenis: 'PP_WALI', batasTanggal: '16 Sep 2026', batasJam: '12:00', statusWaktu: 'TERLAMBAT' },
    ]);

    const TabelPengawasan = ({ judul, deskripsi, icon: Icon, color, dataSantri, tipe }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6`}>
            <div className={`px-6 py-5 border-b bg-${color}-50/30 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-lg`}><Icon size={20} /></div>
                    <div><h3 className="font-bold text-gray-800">{judul}</h3><p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p></div>
                </div>
                <span className={`px-3 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full border border-${color}-200`}>{dataSantri.length} Santri</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-4">Data Santri & Izin</th>
                            <th className="px-6 py-4">Walikelas</th>
                            <th className="px-6 py-4">Batas Tenggat</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataSantri.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Aman. Tidak ada data santri.</td></tr>
                        ) : dataSantri.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama} <span className="text-gray-400 font-normal">({santri.kelas})</span></div>
                                    <div className="text-xs text-gray-500 mt-1">{santri.jenis.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">{santri.walikelas}</td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${(tipe === 'pulang' && santri.status === 'LEWAT_HARI') || (tipe === 'keluar' && santri.statusWaktu === 'TERLAMBAT') ? 'text-red-600' : 'text-gray-900'}`}>{santri.batasTanggal}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam} WIB</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {tipe === 'pulang' ? (
                                        santri.status === 'LEWAT_HARI' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded border border-red-200 text-xs font-black shadow-sm animate-pulse"><AlertTriangle size={12} /> MELEWATI HARI</span>
                                        ) : (
                                            <span className="inline-flex px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-bold tracking-wide">HARI INI</span>
                                        )
                                    ) : (
                                        santri.statusWaktu === 'TERLAMBAT' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded border border-red-200 text-xs font-black shadow-sm animate-pulse"><AlertTriangle size={12} /> TERLAMBAT</span>
                                        ) : santri.statusWaktu === 'SEGERA_KEMBALI' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded border border-amber-200 text-xs font-bold shadow-sm"><AlertCircle size={12} /> SEGERA KEMBALI</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 text-xs font-bold shadow-sm"><CheckCircle size={12} /> AMAN</span>
                                        )
                                    )}
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
                    Dashboard Kesantrian
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pemantauan volume pergerakan santri di gerbang dan informasi antrean sistem.</p>
            </div>

            <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Informasi Pengajuan (Proses Approval)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        {/* Menjumlahkan Izin Pulang (Wali + Klinik) */}
                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Pulang</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.antrean.pulangWali + data.antrean.pulangKlinik}</span><span className="text-sm font-medium text-gray-500">Ajuan</span></div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Home size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        {/* Izin Keluar hanya Wali */}
                        <p className="text-purple-600 text-[11px] font-black uppercase tracking-widest mb-1">Izin Keluar (Wali)</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.antrean.keluarWali}</span><span className="text-sm font-medium text-gray-500">Ajuan</span></div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Map size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Statistik Santri di Luar</h3></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Donut Izin Pulang (showKlinik = true) */}
                <MinimalistDonut
                    dataWali={data.berjalan.pulangWali}
                    dataKlinik={data.berjalan.pulangKlinik}
                    showKlinik={true}
                    label="Di Luar" title="Volume Izin Pulang" icon={Home} color="emerald"
                />

                {/* Donut Izin Keluar (showKlinik = false, hanya passing dataWali) */}
                <MinimalistDonut
                    dataWali={data.berjalan.keluarWali}
                    dataKlinik={0}
                    showKlinik={false}
                    label="Di Luar" title="Volume Izin Keluar" icon={Map} color="purple"
                />
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Arus Balik</h3></div>
            {/* Tabel Izin Pulang mencakup Klinik */}
            <TabelPengawasan judul="Pantauan Arus Izin Pulang" deskripsi="Santri yang diekspektasikan masuk gerbang (termasuk rawat inap/pulang sakit)." icon={Home} color="emerald" dataSantri={santriPulang} tipe="pulang" />

            {/* Tabel Izin Keluar murni Wali */}
            <TabelPengawasan judul="Pantauan Arus Izin Keluar" deskripsi="Santri izin keluar singkat yang akan kembali ke gerbang (Non-Medis)." icon={Map} color="purple" dataSantri={santriKeluar} tipe="keluar" />
        </div>
    );
};

export default DashboardKesantrian;