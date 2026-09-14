import React, { useState } from 'react';
import { Shield } from 'lucide-react';

const ManajemenUser = () => {
    // Data dummy sementara sebelum disambung ke tabel profiles Supabase
    const [daftarUser] = useState([
        { id: '1', nama: 'Super Admin', email: 'admin@alislam.com', role: 'ADMIN', status: 'Aktif' },
        { id: '2', nama: 'Ust. Ahmad', email: 'ahmad.wali@alislam.com', role: 'WALIKELAS', status: 'Aktif' },
        { id: '3', nama: 'Sekretaris Mudir', email: 'sekretaris@alislam.com', role: 'SEKRETARIS_MUDIR', status: 'Aktif' },
        { id: '4', nama: 'Pos Kesantrian', email: 'kesantrian@alislam.com', role: 'KESANTRIAN', status: 'Aktif' },
        { id: '5', nama: 'Pos Gerbang Satpam', email: 'security@alislam.com', role: 'SECURITY', status: 'Aktif' },
        { id: '6', nama: 'Klinik Pusat', email: 'klinik@alislam.com', role: 'KLINIK', status: 'Aktif' },
    ]);

    return (
        <div className="animate-fade-in-down p-2 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-emerald-600" />
                        Manajemen User & Role
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola akses sistem untuk seluruh staf PPM Al-Islam.</p>
                </div>
                <button className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                    + Tambah User Baru
                </button>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 w-1/4">Nama User</th>
                                <th className="px-6 py-3 w-1/4">Email / Login</th>
                                <th className="px-6 py-3 w-1/6">Role Sistem</th>
                                <th className="px-6 py-3 w-1/6">Status</th>
                                <th className="px-6 py-3 text-right w-1/6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daftarUser.map((user) => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{user.nama}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'WALIKELAS' ? 'bg-blue-100 text-blue-800' :
                                                    user.role === 'SEKRETARIS_MUDIR' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-3 py-1 border border-blue-200 rounded-md bg-blue-50">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManajemenUser;