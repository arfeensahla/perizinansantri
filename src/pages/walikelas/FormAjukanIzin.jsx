import React, { useState } from 'react';
import { UserPlus, Send, Info, Calendar, Clock } from 'lucide-react';

const FormAjukanIzin = () => {
    // State Form
    const [jenisIzin, setJenisIzin] = useState('PULANG_WALI');
    const [hubungan, setHubungan] = useState('');
    const [statusSubmit, setStatusSubmit] = useState(null);

    // Dummy daftar santri khusus kelas yang diampu (Sesuai PRD V3 Bab 17)
    const [daftarSantri] = useState([
        { id: '1', nama: 'Ahmad Muzakki', kelas: '7A - Tarbiyah' },
        { id: '2', nama: 'Faisal Rahman', kelas: '7A - Tarbiyah' },
        { id: '3', nama: 'Rifky Hidayat', kelas: '7A - Tarbiyah' },
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatusSubmit('loading');
        // Simulasi pengiriman data ke server
        setTimeout(() => {
            setStatusSubmit('sukses');
            setTimeout(() => setStatusSubmit(null), 4000); // Reset notifikasi setelah 4 detik
        }, 1500);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="text-emerald-600" />
                    Ajukan Izin Santri
                </h2>
                <p className="text-gray-500 text-sm mt-1">Isi formulir pengajuan izin khusus dari Walisantri (Sesuai PRD V3).</p>
            </div>

            {/* Notifikasi Sukses */}
            {statusSubmit === 'sukses' && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in-down">
                    <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
                    <div>
                        <span className="font-bold block">Berhasil Diajukan!</span>
                        <span className="text-sm">Pengajuan izin masuk dalam antrean. Menunggu screening dari Sekretaris Mudir.</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <Info size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-gray-800">Formulir Data Perizinan</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* BAGIAN 1: IDENTITAS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Santri <span className="text-red-500">*</span></label>
                            <select required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                                <option value="">-- Pilih Santri di Kelas Anda --</option>
                                {daftarSantri.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Izin <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={jenisIzin}
                                onChange={(e) => setJenisIzin(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                                <option value="PULANG_WALI">Pulang Beberapa Hari</option>
                                <option value="PP_WALI">Keluar Pulang-Pergi (PP)</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* BAGIAN 2: DETAIL KEPERLUAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Keperluan Izin <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="Contoh: Menghadiri pernikahan kakak" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tujuan Izin <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="Contoh: Brebes, Jawa Tengah" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* BAGIAN 3: WAKTU & PENJEMPUT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Waktu Keluar */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Waktu Keluar/Penjemputan <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="datetime-local" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                        </div>

                        {/* Waktu Kembali (Dinamis Sesuai PRD V3 7.1 & 7.2) */}
                        {jenisIzin === 'PULANG_WALI' ? (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Kembali <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type="date" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Jam Kembali (Hari yang Sama) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type="time" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                            </div>
                        )}

                        {/* Data Penjemput */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Penjemput <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="Nama lengkap penjemput" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Hubungan Penjemput <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={hubungan}
                                onChange={(e) => setHubungan(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                                <option value="">-- Pilih Hubungan --</option>
                                <option value="Ayah">Ayah</option>
                                <option value="Ibu">Ibu</option>
                                <option value="Kakak Kandung">Kakak Kandung</option>
                                <option value="Adik Kandung">Adik Kandung</option>
                                <option value="Kakek">Kakek</option>
                                <option value="Nenek">Nenek</option>
                                <option value="Paman">Paman</option>
                                <option value="Bibi">Bibi</option>
                                <option value="Lainnya">Lainnya...</option>
                            </select>

                            {/* Kondisional jika memilih 'Lainnya' (Sesuai PRD V3 7.1) */}
                            {hubungan === 'Lainnya' && (
                                <input
                                    type="text"
                                    required
                                    placeholder="Sebutkan hubungan spesifik..."
                                    className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                                />
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={statusSubmit === 'loading'}
                            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
                        >
                            <Send size={18} />
                            {statusSubmit === 'loading' ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Izin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormAjukanIzin;