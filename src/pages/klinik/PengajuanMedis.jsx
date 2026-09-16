import React, { useState } from 'react';
import { PlusSquare, Send, Info, Activity, Clock, MapPin } from 'lucide-react';

const PengajuanMedis = () => {
    const [statusSubmit, setStatusSubmit] = useState(null);
    const [jenisIzin, setJenisIzin] = useState('RUJUK_PP_KLINIK');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatusSubmit('loading');
        setTimeout(() => {
            setStatusSubmit('sukses');
            setTimeout(() => setStatusSubmit(null), 4000);
        }, 1500);
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 max-w-4xl mx-auto pb-24">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <PlusSquare className="text-emerald-600" />
                    Pengajuan Izin Medis
                </h2>
                <p className="text-gray-500 text-sm mt-1">Formulir rujukan medis dan rawat inap khusus otoritas Klinik Pusat.</p>
            </div>

            {statusSubmit === 'sukses' && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3 shadow-sm">
                    <Activity className="mt-0.5 text-emerald-600" size={20} />
                    <div>
                        <span className="font-bold block">Rujukan Berhasil Diajukan!</span>
                        <span className="text-sm">Menunggu persetujuan darurat dari Sekretaris Mudir.</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-red-50 flex items-center gap-2">
                    <Info size={18} className="text-red-600" />
                    <h3 className="font-bold text-red-800">Formulir Rujukan & Medis</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* BAGIAN 1: IDENTITAS & JENIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pencarian Santri <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="Ketik Nama atau NIS..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Kategori Izin Medis <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={jenisIzin}
                                onChange={(e) => setJenisIzin(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                                <option value="RUJUK_PP_KLINIK">Rujuk RS (Pulang-Pergi)</option>
                                <option value="RUJUK_INAP_KLINIK">Rawat Inap RS / Klinik Luar</option>
                                <option value="PULANG_SAKIT">Pulang ke Rumah (Sakit)</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* BAGIAN 2: DIAGNOSA & LOKASI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Diagnosa Awal / Keluhan <span className="text-red-500">*</span></label>
                            <textarea required rows="2" placeholder="Contoh: Gejala typus, demam tinggi 3 hari..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Fasilitas Kesehatan Tujuan <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="text" required placeholder="Contoh: RSUD Cirebon" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Petugas Pendamping <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="Nama petugas klinik yang mendampingi" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* BAGIAN 3: WAKTU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Waktu Keberangkatan <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="datetime-local" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                        </div>

                        {/* Waktu Kembali Dinamis */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {jenisIzin === 'RUJUK_PP_KLINIK' ? 'Estimasi Jam Kembali' : 'Estimasi Tanggal Kembali'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={jenisIzin === 'RUJUK_PP_KLINIK' ? 'time' : 'date'}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={statusSubmit === 'loading'}
                            className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
                        >
                            <Send size={18} />
                            {statusSubmit === 'loading' ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Medis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PengajuanMedis;