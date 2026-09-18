import React, { useState } from 'react';
import { FileText, Search, Download, Printer, Filter, Eye, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

const SemuaIzin = () => {
    // --- State Filters ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [filterJenis, setFilterJenis] = useState('SEMUA');
    const [filterStatus, setFilterStatus] = useState('SEMUA');

    // State Modal Detail
    const [isModalDetailBuka, setIsModalDetailBuka] = useState(false);
    const [selectedIzin, setSelectedIzin] = useState(null);

    // --- Data Dummy Riwayat Izin ---
    const [riwayatIzin] = useState([
        { id: 'IZN-001', tanggal: '16 Sep 2026', jam: '08:15', nama: 'Ahmad Muzakki', nis: '260011', kelas: '7A', jenis: 'PULANG_WALI', alasan: 'Hajatan keluarga di kampung', batasTenggat: '18 Sep 2026, 17:00', waktuKembali: '-', status: 'BERJALAN', disetujuiOleh: 'Sekretaris Mudir' },
        { id: 'IZN-002', tanggal: '15 Sep 2026', jam: '10:00', nama: 'Faisal Rahman', nis: '260012', kelas: '8B', jenis: 'RUJUK_INAP_KLINIK', alasan: 'Gejala Typus, rawat inap RSUD', batasTenggat: '17 Sep 2026, 12:00', waktuKembali: '-', status: 'TERLAMBAT', disetujuiOleh: 'Sekretaris Mudir' },
        { id: 'IZN-003', tanggal: '14 Sep 2026', jam: '14:30', nama: 'Zaid bin Tsabit', nis: '260013', kelas: '9A', jenis: 'PP_WALI', alasan: 'Beli kacamata baru', batasTenggat: '14 Sep 2026, 17:30', waktuKembali: '14 Sep 2026, 17:15', status: 'SELESAI_TEPAT', disetujuiOleh: 'Ust. Zulfikar (Walikelas)' },
        { id: 'IZN-004', tanggal: '14 Sep 2026', jam: '09:00', nama: 'Umar Al-Faruq', nis: '260014', kelas: '7C', jenis: 'PP_WALI', alasan: 'Urus KTP ke Disdukcapil', batasTenggat: '14 Sep 2026, 15:00', waktuKembali: '14 Sep 2026, 16:30', status: 'SELESAI_TERLAMBAT', disetujuiOleh: 'Sekretaris Mudir' },
        { id: 'IZN-005', tanggal: '16 Sep 2026', jam: '11:00', nama: 'Tariq bin Ziyad', nis: '260015', kelas: '9B', jenis: 'PULANG_WALI', alasan: 'Acara tidak mendesak', batasTenggat: '-', waktuKembali: '-', status: 'DITOLAK', disetujuiOleh: 'Sekretaris Mudir' },
    ]);

    // --- Helper UI Badge ---
    const getStatusBadge = (status) => {
        switch (status) {
            case 'BERJALAN': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-black"><Clock size={12} /> DI LUAR</span>;
            case 'TERLAMBAT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-black animate-pulse"><AlertTriangle size={12} /> TERLAMBAT</span>;
            case 'SELESAI_TEPAT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black"><CheckCircle size={12} /> SELESAI (TEPAT)</span>;
            case 'SELESAI_TERLAMBAT': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black"><AlertTriangle size={12} /> SELESAI (TELAT)</span>;
            case 'DITOLAK': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-md text-[10px] font-black"><XCircle size={12} /> DITOLAK</span>;
            default: return null;
        }
    };

    // Logika Filter Data
    const dataTampil = riwayatIzin.filter(item => {
        const matchKata = item.nama.toLowerCase().includes(kataKunci.toLowerCase()) || item.nis.includes(kataKunci) || item.id.toLowerCase().includes(kataKunci.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || item.kelas === filterKelas;
        const matchJenis = filterJenis === 'SEMUA' || item.jenis === filterJenis;
        const matchStatus = filterStatus === 'SEMUA' || item.status.includes(filterStatus);

        return matchKata && matchKelas && matchJenis && matchStatus;
    });

    const bukaModalDetail = (data) => {
        setSelectedIzin(data);
        setIsModalDetailBuka(true);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-emerald-600" />
                        Rekapitulasi Izin
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Master tabel seluruh riwayat perizinan santri.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-800 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                        <Printer size={18} /> Cetak Laporan
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                        <Download size={18} /> Export Excel
                    </button>
                </div>
            </div>

            {/* --- FILTER ADVANCED --- */}
            <div className="bg-white p-5 rounded-t-2xl border border-gray-200 border-b-0 space-y-4">
                {/* Baris 1: Pencarian & Rentang Waktu */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Cari Nama / NIS / ID Izin..."
                            value={kataKunci}
                            onChange={(e) => setKataKunci(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 md:max-w-md">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mx-2">Tgl:</span>
                        <input type="date" className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full" title="Tanggal Awal" />
                        <span className="text-gray-300">-</span>
                        <input type="date" className="bg-transparent border-none focus:ring-0 text-sm text-gray-700 w-full" title="Tanggal Akhir" />
                    </div>
                </div>

                {/* Baris 2: Filter Dropdowns */}
                <div className="flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-4">
                    <div className="flex-1 flex items-center gap-3">
                        <Filter className="text-gray-400 hidden md:block" size={18} />
                        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                            <option value="SEMUA">-- Semua Kelas --</option>
                            <option value="7A">Kelas 7A</option>
                            <option value="7B">Kelas 7B</option>
                            <option value="8A">Kelas 8A</option>
                            <option value="9A">Kelas 9A</option>
                        </select>
                        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                            <option value="SEMUA">-- Semua Jenis Izin --</option>
                            <option value="PULANG_WALI">Pulang (Walisantri)</option>
                            <option value="PP_WALI">Keluar (Walisantri)</option>
                            <option value="RUJUK_INAP_KLINIK">Rawat Inap / Pulang (Medis)</option>
                            <option value="RUJUK_PP_KLINIK">Rujuk Keluar (Medis)</option>
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                            <option value="SEMUA">-- Semua Status --</option>
                            <option value="BERJALAN">Sedang Berjalan / Di Luar</option>
                            <option value="SELESAI">Selesai (Tepat & Telat)</option>
                            <option value="TERLAMBAT">Terlambat (Belum Kembali)</option>
                            <option value="DITOLAK">Ditolak</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[1000px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Waktu Ajuan</th>
                                <th className="px-6 py-4">Data Santri</th>
                                <th className="px-6 py-4">Jenis & Alasan</th>
                                <th className="px-6 py-4">Tenggat Waktu</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataTampil.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Tidak ada riwayat perizinan yang sesuai kriteria.</td></tr>
                            ) : dataTampil.map((izin) => (
                                <tr key={izin.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{izin.tanggal}</div>
                                        <div className="text-xs text-gray-500">{izin.jam} WIB</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{izin.nama}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Kelas {izin.kelas} • NIS: {izin.nis}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[11px] font-black text-emerald-700 tracking-wider mb-1">{izin.jenis.replace(/_/g, ' ')}</div>
                                        <div className="text-xs text-gray-700 truncate max-w-[200px]" title={izin.alasan}>{izin.alasan}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {izin.status === 'DITOLAK' ? (
                                            <span className="text-gray-400 italic text-xs">-</span>
                                        ) : (
                                            <>
                                                <div className={`font-mono font-bold ${izin.status.includes('TERLAMBAT') ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {izin.batasTenggat.split(', ')[0]}
                                                </div>
                                                <div className="text-xs text-gray-500">{izin.batasTenggat.split(', ')[1]} WIB</div>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(izin.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => bukaModalDetail(izin)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 rounded-lg shadow-sm text-xs font-bold transition-all"
                                        >
                                            <Eye size={14} /> Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL DETAIL IZIN --- */}
            {isModalDetailBuka && selectedIzin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                Detail Riwayat
                                <span className="text-xs font-mono font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{selectedIzin.id}</span>
                            </h3>
                            <button onClick={() => setIsModalDetailBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><XCircle size={20} /></button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h4 className="font-black text-xl text-gray-900">{selectedIzin.nama}</h4>
                                    <p className="text-sm text-gray-500">Kelas {selectedIzin.kelas} • NIS {selectedIzin.nis}</p>
                                </div>
                                <div>{getStatusBadge(selectedIzin.status)}</div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Jenis Izin</span>
                                    <p className="font-semibold text-gray-800">{selectedIzin.jenis.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alasan / Kepentingan</span>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedIzin.alasan}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tenggat Waktu</span>
                                        <p className="font-mono font-bold text-gray-800">{selectedIzin.batasTenggat}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Waktu Kembali (Gerbang)</span>
                                        <p className="font-mono font-bold text-gray-800">{selectedIzin.waktuKembali}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Disetujui / Diview Oleh</span>
                                    <p className="font-semibold text-emerald-700">{selectedIzin.disetujuiOleh}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsModalDetailBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemuaIzin;