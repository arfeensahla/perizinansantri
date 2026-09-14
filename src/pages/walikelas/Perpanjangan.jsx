import React, { useState } from 'react';
import { Clock, CalendarPlus, History, X, Send } from 'lucide-react';

const Perpanjangan = () => {
    const [activeTab, setActiveTab] = useState('ajukan');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIzin, setSelectedIzin] = useState(null);

    // Form State
    const [batasBaru, setBatasBaru] = useState('');
    const [alasan, setAlasan] = useState('');

    // Dummy data: Hanya santri yang status izinnya AKTIF dan sudah melewati Gerbang Keluar (PRD V3 Bab 15)
    const [santriDiLuar] = useState([
        { id: '1', kode: 'IZN-9901', nama: 'Ahmad Muzakki', batasLama: '14 Sep 2026 15:00', jenis: 'PP_WALI' },
        { id: '2', kode: 'IZN-9905', nama: 'Zaid bin Tsabit', batasLama: '15 Sep 2026', jenis: 'PULANG_WALI' },
    ]);

    // Dummy data: Riwayat pengajuan perpanjangan
    const [riwayat] = useState([
        { id: '1', kode: 'IZN-9800', nama: 'Umar Al-Faruq', dari: '12 Sep', menjadi: '13 Sep', status: 'DISETUJUI' },
        { id: '2', kode: 'IZN-9855', nama: 'Faisal Rahman', dari: '13 Sep', menjadi: '15 Sep', status: 'MENUNGGU' },
    ]);

    const handleBukaModal = (izin) => {
        setSelectedIzin(izin);
        setIsModalOpen(true);
    };

    const handleSubmitExtension = (e) => {
        e.preventDefault();
        alert(`Pengajuan perpanjangan untuk ${selectedIzin.nama} berhasil dikirim ke Sekretaris Mudir.`);
        setIsModalOpen(false);
        setBatasBaru('');
        setAlasan('');
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarPlus className="text-emerald-600" />
                    Perpanjangan Izin
                </h2>
                <p className="text-gray-500 text-sm mt-1">Ajukan perpanjangan waktu untuk santri yang sedang berada di luar pondok.</p>
            </div>

            {/* Navigasi Tab */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('ajukan')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ajukan' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Clock size={16} /> Santri di Luar
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'riwayat' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={16} /> Riwayat Pengajuan
                </button>
            </div>

            {/* Tab: Ajukan Perpanjangan */}
            {activeTab === 'ajukan' && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Data Santri & Izin</th>
                                    <th className="px-6 py-3">Batas Waktu Saat Ini</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {santriDiLuar.map((santri) => (
                                    <tr key={santri.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{santri.nama}</div>
                                            <div className="text-xs text-gray-500 font-mono">{santri.kode} | {santri.jenis}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600">{santri.batasLama}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleBukaModal(santri)}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold rounded-lg text-xs transition-colors"
                                            >
                                                Ajukan Extension
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Riwayat */}
            {activeTab === 'riwayat' && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Kode Izin</th>
                                    <th className="px-6 py-3">Santri</th>
                                    <th className="px-6 py-3">Perubahan Batas</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riwayat.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-gray-500">{item.kode}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{item.nama}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.dari} &rarr; <span className="font-bold text-gray-900">{item.menjadi}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wide ${item.status === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Form Perpanjangan */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-down p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-emerald-50">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                <Clock size={18} /> Ajukan Perpanjangan
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-emerald-500 hover:text-emerald-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitExtension} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border text-sm mb-4">
                                <p className="text-gray-500">Santri: <strong className="text-gray-800">{selectedIzin?.nama}</strong></p>
                                <p className="text-gray-500">Batas Saat Ini: <strong className="text-red-600">{selectedIzin?.batasLama}</strong></p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Batas Waktu Baru <span className="text-red-500">*</span></label>
                                {/* Input dinamis: Date atau Time tergantung jenis izin (PRD V3) */}
                                <input
                                    type={selectedIzin?.jenis === 'PP_WALI' ? 'time' : 'date'}
                                    required
                                    value={batasBaru}
                                    onChange={(e) => setBatasBaru(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Alasan Keterlambatan/Perpanjangan <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows="3"
                                    value={alasan}
                                    onChange={(e) => setAlasan(e.target.value)}
                                    placeholder="Jelaskan alasan wali santri mengajukan perpanjangan..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                    <Send size={16} /> Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Perpanjangan;