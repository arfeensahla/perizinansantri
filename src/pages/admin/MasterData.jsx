import React, { useState } from 'react';
import { Database, Plus, Edit, Trash2 } from 'lucide-react';

const MasterData = () => {
    // State untuk mengatur tab mana yang sedang aktif
    const [activeTab, setActiveTab] = useState('kelas');

    // Dummy data untuk Kelas
    const [daftarKelas] = useState([
        { id: '1', level: '7', class_name: '7A - Tarbiyah', wali: 'Ust. Ahmad' },
        { id: '2', level: '8', class_name: '8B - Lughah', wali: 'Ust. Budi' },
        { id: '3', level: '9', class_name: '9A - Tahfizh', wali: 'Ust. Hasan' },
    ]);

    // Dummy data untuk Santri
    const [daftarSantri] = useState([
        { id: '1', student_code: 'NIS-26001', name: 'Ahmad Fulan', class_name: '7A - Tarbiyah', is_active: true },
        { id: '2', student_code: 'NIS-26002', name: 'Zaid bin Tsabit', class_name: '8B - Lughah', is_active: true },
        { id: '3', student_code: 'NIS-26003', name: 'Umar Al-Faruq', class_name: '9A - Tahfizh', is_active: false },
    ]);

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Database className="text-emerald-600" />
                        Master Data
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola data induk kelas dan santri PPM Al-Islam.</p>
                </div>

                {/* Tombol Aksi menyesuaikan tab yang aktif */}
                <button className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                    <Plus size={18} />
                    {activeTab === 'kelas' ? 'Tambah Kelas' : 'Tambah Santri'}
                </button>
            </div>

            {/* Navigasi Tab */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('kelas')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'kelas'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Data Kelas
                </button>
                <button
                    onClick={() => setActiveTab('santri')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'santri'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Data Santri
                </button>
            </div>

            {/* Konten Tabel Kelas */}
            {activeTab === 'kelas' && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 w-16">Tingkat</th>
                                    <th className="px-6 py-3">Nama Kelas</th>
                                    <th className="px-6 py-3">Wali Kelas</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daftarKelas.map((kelas) => (
                                    <tr key={kelas.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-700">{kelas.level}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{kelas.class_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{kelas.wali}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-2" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Konten Tabel Santri */}
            {activeTab === 'santri' && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">NIS</th>
                                    <th className="px-6 py-3">Nama Santri</th>
                                    <th className="px-6 py-3">Kelas</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daftarSantri.map((santri) => (
                                    <tr key={santri.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{santri.student_code}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{santri.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{santri.class_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${santri.is_active
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {santri.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterData;