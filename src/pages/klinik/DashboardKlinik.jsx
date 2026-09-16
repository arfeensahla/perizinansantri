import React, { useState } from 'react';
import { PlusSquare, Activity, MapPin, Clock, CalendarX2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const DashboardKlinik = () => {
    const data = {
        antrean: {
            inap: 2, // Menunggu setuju (Pulang Sakit/Rawat Inap)
            pp: 3    // Menunggu setuju (Rujuk Keluar Jam)
        },
        berjalan: {
            inap: 5, // Sedang Rawat Inap/Pulang
            pp: 8    // Sedang Rujuk Keluar Sementara
        }
    };

    const [santriInap] = useState([
        { id: '1', nama: 'Faisal Rahman', kelas: '8B', diagnosa: 'Gejala Typus', jenis: 'RUJUK_INAP_KLINIK', batasTanggal: '16 Sep 2026', batasJam: '12:00', status: 'HARI_INI' },
        { id: '2', nama: 'Zaid bin Tsabit', kelas: '9A', diagnosa: 'Pemulihan DBD', jenis: 'PULANG_SAKIT', batasTanggal: '14 Sep 2026', batasJam: '15:00', status: 'LEWAT_HARI' },
    ]);

    const [santriRujuk] = useState([
        { id: '3', nama: 'Ali Imran', kelas: '8A', diagnosa: 'Cek Gigi (RSUD)', jenis: 'RUJUK_PP_KLINIK', batasTanggal: '16 Sep 2026', batasJam: '15:00', statusWaktu: 'SEGERA_KEMBALI' },
    ]);

    const TabelMedis = ({ judul, deskripsi, icon: Icon, dataSantri, tipe }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6`}>
            <div className={`px-6 py-5 border-b bg-red-50/30 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-red-100 text-red-600 rounded-lg`}><Icon size={20} /></div>
                    <div><h3 className="font-bold text-gray-800">{judul}</h3><p className="text-xs text-gray-500 mt-0.5">{deskripsi}</p></div>
                </div>
                <span className={`px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200`}>{dataSantri.length} Pasien</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-4">Nama Pasien & Kelas</th>
                            <th className="px-6 py-4">Diagnosa / Alasan</th>
                            <th className="px-6 py-4">Batas Kembali</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataSantri.map((santri) => (
                            <tr key={santri.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{santri.nama}</div>
                                    <div className="text-xs text-gray-500 mt-1">Kelas {santri.kelas} • <span className="font-mono">{santri.jenis}</span></div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700">{santri.diagnosa}</td>
                                <td className="px-6 py-4">
                                    <div className={`font-mono font-bold ${(tipe === 'inap' && santri.status === 'LEWAT_HARI') || (tipe === 'pp' && santri.statusWaktu === 'TERLAMBAT') ? 'text-red-600' : 'text-gray-900'}`}>{santri.batasTanggal}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{santri.batasJam} WIB</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {tipe === 'inap' ? (
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
                    <PlusSquare className="text-red-600" />
                    Dashboard Klinik Pusat
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pemantauan pasien santri yang dirawat di luar atau dirujuk ke RS.</p>
            </div>

            {/* --- BARIS 1: ANTREAN MENUNGGU PERSETUJUAN --- */}
            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Menunggu Persetujuan Sekretaris</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                    <div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">Antrean Rujuk / Pulang Sakit</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.antrean.inap}</span><span className="text-sm font-medium text-gray-500">Ajuan Baru</span></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center"><Activity size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div>
                        <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">Antrean Rujuk Keluar (PP)</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.antrean.pp}</span><span className="text-sm font-medium text-gray-500">Ajuan Baru</span></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center"><MapPin size={22} /></div>
                </div>
            </div>

            {/* --- BARIS 2: PASIEN AKTIF DI LUAR --- */}
            <div className="mb-2 mt-6"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Status Pasien Saat Ini</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-300 transition-all bg-gradient-to-r from-white to-red-50/30">
                    <div>
                        <p className="text-red-600 text-[11px] font-black uppercase tracking-widest mb-1">Pasien Rawat Inap / Pulang</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.berjalan.inap}</span><span className="text-sm font-medium text-gray-500">Sedang Di Luar</span></div>
                    </div>
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><Activity size={22} /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all bg-gradient-to-r from-white to-blue-50/30">
                    <div>
                        <p className="text-blue-600 text-[11px] font-black uppercase tracking-widest mb-1">Pasien Rujukan (PP)</p>
                        <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-gray-800">{data.berjalan.pp}</span><span className="text-sm font-medium text-gray-500">Sedang Di Luar</span></div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><MapPin size={22} /></div>
                </div>
            </div>

            <div className="mb-2 mt-4"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Pengawasan Pasien Rujukan</h3></div>
            <TabelMedis judul="Pasien Rawat Inap / Pulang Sakit" deskripsi="Santri yang dirawat inap di luar pondok atau dipulangkan." icon={Activity} dataSantri={santriInap} tipe="inap" />
            <TabelMedis judul="Pasien Rujukan (Pulang-Pergi)" deskripsi="Santri yang sedang berobat keluar dan wajib kembali hari ini." icon={MapPin} dataSantri={santriRujuk} tipe="pp" />
        </div>
    );
};

export default DashboardKlinik;