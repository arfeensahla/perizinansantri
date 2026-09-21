import React, { useState } from 'react';
import { Database, Users, GraduationCap, Search, Plus, Edit, Trash2, FileSpreadsheet, X, UploadCloud, Download, Phone, MapPin } from 'lucide-react';

const MasterData = () => {
    // --- State Navigasi Tab ---
    const [tabAktif, setTabAktif] = useState('SANTRI');

    // --- State Manajemen Santri ---
    const [kataKunciSantri, setKataKunciSantri] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [isModalSantriBuka, setIsModalSantriBuka] = useState(false);
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);

    // --- State Manajemen Kelas ---
    const [kataKunciKelas, setKataKunciKelas] = useState('');
    const [isModalKelasBuka, setIsModalKelasBuka] = useState(false);

    // --- Data Dummy Kelas (Tanpa Singkatan) ---
    const [dataKelas] = useState([
        { id: 1, nama: '7A', wali: 'Ustadz Fulan', totalSantri: 32 },
        { id: 2, nama: '7B', wali: '-', totalSantri: 30 },
        { id: 3, nama: '8A', wali: 'Ustadz Mahmud', totalSantri: 28 },
        { id: 4, nama: '8B', wali: 'Ustadz Budi', totalSantri: 34 },
        { id: 5, nama: '9A', wali: 'Ustadz Zulfikar', totalSantri: 35 },
    ]);

    // --- Data Dummy Santri (Tanpa Singkatan) ---
    const [dataSantri] = useState([
        { id: 1, nomorInduk: '260011', nama: 'Ahmad Muzakki', gender: 'Laki-laki', kotaAsal: 'Cirebon', kelas: '7A', waliSiswa: 'Bapak Ridwan', nomorWhatsApp: '081234567890' },
        { id: 2, nomorInduk: '260012', nama: 'Faisal Rahman', gender: 'Laki-laki', kotaAsal: 'Bandung', kelas: '8B', waliSiswa: 'Ibu Nisa', nomorWhatsApp: '081298765432' },
        { id: 3, nomorInduk: '260013', nama: 'Zaid bin Tsabit', gender: 'Laki-laki', kotaAsal: 'Jakarta', kelas: '9A', waliSiswa: 'Bapak Hasan', nomorWhatsApp: '085612341234' },
        { id: 4, nomorInduk: '260014', nama: 'Aisyah Putri', gender: 'Perempuan', kotaAsal: 'Tegal', kelas: '7C', waliSiswa: 'Ibu Sarah', nomorWhatsApp: '081345678901' },
        { id: 5, nomorInduk: '260015', nama: 'Tariq bin Ziyad', gender: 'Laki-laki', kotaAsal: 'Kuningan', kelas: '9B', waliSiswa: 'Bapak Usman', nomorWhatsApp: '087812345678' },
    ]);

    // --- Filter Logika ---
    const santriTampil = dataSantri.filter(s => {
        const matchKata = s.nama.toLowerCase().includes(kataKunciSantri.toLowerCase()) ||
            s.nomorInduk.includes(kataKunciSantri) ||
            s.kotaAsal.toLowerCase().includes(kataKunciSantri.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || s.kelas === filterKelas;
        return matchKata && matchKelas;
    });

    const kelasTampil = dataKelas.filter(k =>
        k.nama.toLowerCase().includes(kataKunciKelas.toLowerCase()) || k.wali.toLowerCase().includes(kataKunciKelas.toLowerCase())
    );

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-emerald-600" />
                    Master Data
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pusat pengelolaan data referensi kelas dan santri pondok pesantren.</p>
            </div>

            {/* --- TAB NAVIGASI --- */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
                <button
                    onClick={() => setTabAktif('SANTRI')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'SANTRI' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={18} /> Data Santri
                </button>
                <button
                    onClick={() => setTabAktif('KELAS')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'KELAS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <GraduationCap size={18} /> Data Kelas
                </button>
            </div>

            {/* =========================================
                TAB 1: TAMPILAN DATA SANTRI
            ============================================= */}
            {tabAktif === 'SANTRI' && (
                <div className="animate-fade-in">
                    <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                            <div className="relative flex-1 md:max-w-xs">
                                <input type="text" placeholder="Cari Nama / Nomor Induk / Kota..." value={kataKunciSantri} onChange={(e) => setKataKunciSantri(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700">
                                <option value="SEMUA">Semua Kelas</option>
                                {dataKelas.map(k => <option key={k.id} value={k.nama}>Kelas {k.nama}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button onClick={() => setIsModalImportBuka(true)} className="flex-1 md:flex-none bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                                <FileSpreadsheet size={18} /> Import Data
                            </button>
                            <button onClick={() => setIsModalSantriBuka(true)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                <Plus size={18} /> Tambah Santri
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[850px]">
                                <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4">Data Santri</th>
                                        <th className="px-6 py-4">Kelas & Jenis Kelamin</th>
                                        <th className="px-6 py-4">Kota Asal</th>
                                        <th className="px-6 py-4">Kontak Orang Tua / Wali</th>
                                        <th className="px-6 py-4 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {santriTampil.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data santri tidak ditemukan.</td></tr>
                                    ) : santriTampil.map((santri) => (
                                        <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{santri.nama}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 font-mono">Nomor Induk: {santri.nomorInduk}</div>
                                            </td>
                                            {/* GABUNGAN KELAS & GENDER */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-black">
                                                        Kelas {santri.kelas}
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${santri.gender === 'Laki-laki' ? 'text-blue-600' : 'text-pink-600'}`}>
                                                        {santri.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* KOLOM KOTA ASAL */}
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800 flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    {santri.kotaAsal}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{santri.waliSiswa}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={12} /> {santri.nomorWhatsApp}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sunting Santri"><Edit size={16} /></button>
                                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Santri"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                TAB 2: TAMPILAN DATA KELAS
            ============================================= */}
            {tabAktif === 'KELAS' && (
                <div className="animate-fade-in">
                    <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 md:max-w-sm w-full">
                            <input type="text" placeholder="Cari nama kelas atau walikelas..." value={kataKunciKelas} onChange={(e) => setKataKunciKelas(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                        <button onClick={() => setIsModalKelasBuka(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Plus size={18} /> Tambah Kelas
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4">Nama Kelas</th>
                                        <th className="px-6 py-4">Total Santri</th>
                                        <th className="px-6 py-4">Walikelas (Penanggung Jawab)</th>
                                        <th className="px-6 py-4 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kelasTampil.map((kelas) => (
                                        <tr key={kelas.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                            <td className="px-6 py-4 font-black text-lg text-gray-800">{kelas.nama}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold">{kelas.totalSantri} Santri</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-700">
                                                {kelas.wali !== '-' ? kelas.wali : <span className="text-red-500 italic text-xs">Belum ditugaskan di Manajemen Pengguna</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODALS (Pop-ups)
            ============================================= */}

            {/* 1. Modal Tambah Santri Manual */}
            {isModalSantriBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Tambah Data Santri</h3>
                            <button onClick={() => setIsModalSantriBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor Induk Santri</label>
                                    <input type="text" placeholder="Masukkan Nomor Induk" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Kelas</label>
                                    <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="" disabled selected>-- Pilih Kelas --</option>
                                        {dataKelas.map(k => <option key={k.id} value={k.nama}>Kelas {k.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap Santri</label>
                                <input type="text" placeholder="Nama sesuai ijazah atau akta kelahiran" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Jenis Kelamin</label>
                                    <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Kota Asal</label>
                                    <input type="text" placeholder="Contoh: Cirebon" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Orang Tua / Wali</label>
                                <input type="text" placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor WhatsApp Wali</label>
                                <input type="text" placeholder="Contoh: 081234567890" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalSantriBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => setIsModalSantriBuka(false)} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm">Simpan Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal Import Excel Santri */}
            {isModalImportBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FileSpreadsheet className="text-emerald-600" size={20} /> Import Data Santri
                            </h3>
                            <button onClick={() => setIsModalImportBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 1: Unduh Format Standar</h4>
                                <p className="text-xs text-gray-500 mb-3">Kolom wajib diisi: <strong>Nomor Induk, Nama, Jenis Kelamin, Asal Kota, Kelas, Nama Wali, Nomor WhatsApp</strong>.</p>
                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition-colors">
                                    <Download size={18} /> Unduh Template Excel (.xlsx)
                                </button>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 2: Unggah File Excel</h4>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={28} className="text-gray-400 group-hover:text-emerald-500" /></div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">Klik atau Seret file ke sini</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalImportBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => setIsModalImportBuka(false)} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm opacity-50 cursor-not-allowed">Mulai Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Modal Tambah Kelas */}
            {isModalKelasBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Tambah Kelas</h3>
                            <button onClick={() => setIsModalKelasBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama / Kode Kelas</label>
                            <input type="text" placeholder="Contoh: 10A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold" />
                            <p className="text-[11px] text-gray-500 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                💡 <strong>Catatan:</strong> Untuk menugaskan Walikelas pada kelas ini, silakan atur melalui halaman <strong>Manajemen Pengguna</strong>.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalKelasBuka(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={() => setIsModalKelasBuka(false)} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterData;