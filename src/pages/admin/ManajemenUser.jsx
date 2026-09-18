import React, { useState } from 'react';
import { Users, Search, Plus, Edit, Trash2, Shield, KeyRound, X, UploadCloud, Download, FileSpreadsheet } from 'lucide-react';

const ManajemenUser = () => {
    // --- State Management ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterRole, setFilterRole] = useState('SEMUA');

    // State Modals
    const [isModalBuka, setIsModalBuka] = useState(false);
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);

    const [formRole, setFormRole] = useState('');

    // --- Data Dummy ---
    const [users] = useState([
        { id: 1, nama: 'Super Admin', username: 'admin', role: 'ADMIN', status: 'AKTIF' },
        { id: 2, nama: 'Ust. Zulfikar', username: 'zulfikar9a', role: 'WALIKELAS', kelas: '9A', status: 'AKTIF' },
        { id: 3, nama: 'Ust. Fulan', username: 'fulan7a', role: 'WALIKELAS', kelas: '7A', status: 'AKTIF' },
        { id: 4, nama: 'Ust. Budi (Klinik)', username: 'klinikpusat', role: 'KLINIK', status: 'AKTIF' },
        { id: 5, nama: 'Pos Kesantrian', username: 'kesantrian1', role: 'KESANTRIAN', status: 'AKTIF' },
        { id: 6, nama: 'Sekretaris Mudir', username: 'sekretaris', role: 'SEKRETARIS_MUDIR', status: 'AKTIF' },
        { id: 7, nama: 'Pos Gerbang Depan', username: 'satpam1', role: 'SECURITY', status: 'AKTIF' },
    ]);

    const dataTampil = users.filter(u => {
        const matchKata = u.nama.toLowerCase().includes(kataKunci.toLowerCase()) || u.username.toLowerCase().includes(kataKunci.toLowerCase());
        const matchRole = filterRole === 'SEMUA' || u.role === filterRole;
        return matchKata && matchRole;
    });

    const getRoleBadge = (role) => {
        const config = {
            'ADMIN': 'bg-gray-800 text-white',
            'WALIKELAS': 'bg-blue-100 text-blue-700 border-blue-200',
            'SEKRETARIS_MUDIR': 'bg-purple-100 text-purple-700 border-purple-200',
            'KESANTRIAN': 'bg-amber-100 text-amber-700 border-amber-200',
            'SECURITY': 'bg-slate-100 text-slate-700 border-slate-200',
            'KLINIK': 'bg-red-100 text-red-700 border-red-200',
        };
        return config[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER DENGAN TOMBOL IMPORT --- */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-emerald-600" />
                        Manajemen User
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola akun staf, guru, dan hak akses sistem.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalImportBuka(true)}
                        className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <FileSpreadsheet size={18} /> Import Excel
                    </button>
                    <button
                        onClick={() => { setFormRole(''); setIsModalBuka(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Tambah Manual
                    </button>
                </div>
            </div>

            {/* --- TOOLBAR PENCARIAN & FILTER --- */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Cari nama atau username..."
                        value={kataKunci}
                        onChange={(e) => setKataKunci(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 md:w-64"
                >
                    <option value="SEMUA">Semua Hak Akses</option>
                    <option value="ADMIN">Super Admin</option>
                    <option value="WALIKELAS">Walikelas</option>
                    <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                    <option value="KLINIK">Klinik Pusat</option>
                    <option value="KESANTRIAN">Kesantrian</option>
                    <option value="SECURITY">Security</option>
                </select>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4">Informasi Pengguna</th>
                                <th className="px-6 py-4">Username & Role</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataTampil.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Tidak ada pengguna yang ditemukan.</td></tr>
                            ) : dataTampil.map((user) => (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">{user.nama}</div>
                                        {user.kelas && (
                                            <div className="text-xs text-emerald-600 font-bold mt-0.5">Penanggung Jawab Kelas {user.kelas}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-gray-600 mb-1.5 flex items-center gap-1.5">
                                            <Shield size={12} className="text-gray-400" /> {user.username}
                                        </div>
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border ${getRoleBadge(user.role)}`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                                        <span className="text-xs font-bold text-gray-700">Aktif</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Akun"><Edit size={16} /></button>
                                            <button className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Password"><KeyRound size={16} /></button>
                                            {user.role !== 'ADMIN' && (
                                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Akun"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM TAMBAH USER (MANUAL) --- */}
            {isModalBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Tambah Akun Baru</h3>
                            <button onClick={() => setIsModalBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap / Instansi</label>
                                <input type="text" placeholder="Contoh: Ust. Budi / Pos Gerbang 1" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
                                    <input type="text" placeholder="Tanpa spasi..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password Sementara</label>
                                    <input type="text" placeholder="Min. 6 karakter" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Hak Akses (Role)</label>
                                <select
                                    value={formRole}
                                    onChange={(e) => setFormRole(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                >
                                    <option value="" disabled>-- Pilih Hak Akses --</option>
                                    <option value="ADMIN">Super Admin</option>
                                    <option value="WALIKELAS">Walikelas</option>
                                    <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                                    <option value="KLINIK">Klinik Pusat</option>
                                    <option value="KESANTRIAN">Kesantrian</option>
                                    <option value="SECURITY">Security</option>
                                </select>
                            </div>

                            {formRole === 'WALIKELAS' && (
                                <div className="animate-fade-in-down p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <label className="block text-sm font-bold text-blue-800 mb-1.5">Penugasan Kelas <span className="text-red-500">*</span></label>
                                    <select className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                        <option value="" disabled>-- Pilih Kelas Master --</option>
                                        <option value="7A">Kelas 7A</option>
                                        <option value="8B">Kelas 8B</option>
                                        <option value="9A">Kelas 9A</option>
                                    </select>
                                    <p className="text-[11px] text-blue-600 mt-2">Walikelas hanya dapat memantau dan menyetujui izin santri dari kelas ini.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => setIsModalBuka(false)} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm">Simpan Akun</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FORM IMPORT EXCEL --- */}
            {isModalImportBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FileSpreadsheet className="text-emerald-600" size={20} /> Import Data Akun
                            </h3>
                            <button onClick={() => setIsModalImportBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Langkah 1: Download Format */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 1: Unduh Format Standar</h4>
                                <p className="text-xs text-gray-500 mb-3">Pastikan Anda mengisi data sesuai kolom (Nama, Username, Password, Role, Kelas) di dalam file Excel ini.</p>
                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition-colors">
                                    <Download size={18} /> Download Template Excel (.xlsx)
                                </button>
                            </div>

                            {/* Langkah 2: Upload File */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 2: Unggah File Excel</h4>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={28} className="text-gray-400 group-hover:text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">Klik atau Seret file ke sini</p>
                                    <p className="text-xs text-gray-500">Mendukung format .xlsx atau .csv (Maks. 5MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalImportBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => setIsModalImportBuka(false)} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm opacity-50 cursor-not-allowed">
                                Mulai Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManajemenUser;