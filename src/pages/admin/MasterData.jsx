import React, { useState, useEffect } from 'react';
import { Database, Users, GraduationCap, Search, Plus, Edit, Trash2, FileSpreadsheet, X, UploadCloud, Download, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const MasterData = () => {
    const [tabAktif, setTabAktif] = useState('SANTRI');

    // --- State Manajemen Santri ---
    const [kataKunciSantri, setKataKunciSantri] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [isModalSantriBuka, setIsModalSantriBuka] = useState(false);
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);

    // --- State Manajemen Kelas ---
    const [kataKunciKelas, setKataKunciKelas] = useState('');
    const [isModalKelasBuka, setIsModalKelasBuka] = useState(false);

    // --- State Database (Supabase) ---
    const [dataKelas, setDataKelas] = useState([]);
    const [dataSantri, setDataSantri] = useState([]);
    const [isLoadingKelas, setIsLoadingKelas] = useState(true);
    const [isLoadingSantri, setIsLoadingSantri] = useState(true);

    // ==========================================
    // STATE FORM WRITE (TAMBAH DATA)
    // ==========================================
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Kelas
    const [formKelas, setFormKelas] = useState({ nama: '' });

    // Form Santri
    const [formSantri, setFormSantri] = useState({
        nama: '', kelas_id: '', gender: 'Laki-laki', kota: '', namaWali: '', waWali: ''
    });

    // --- Fetch Data saat halaman dimuat ---
    useEffect(() => {
        fetchDataKelas();
        fetchDataSantri();
    }, []);

    const fetchDataKelas = async () => {
        setIsLoadingKelas(true);
        try {
            const { data, error } = await supabase
                .from('kelas')
                .select(`id, nama_kelas, users!kelas_wali_kelas_id_fkey(nama_lengkap), santri(id)`)
                .order('nama_kelas', { ascending: true });

            if (error) throw error;

            const formatted = data.map(k => ({
                id: k.id,
                nama: k.nama_kelas,
                wali: k.users ? k.users.nama_lengkap : '-',
                totalSantri: k.santri ? k.santri.length : 0
            }));

            setDataKelas(formatted);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
        } finally {
            setIsLoadingKelas(false);
        }
    };

    const fetchDataSantri = async () => {
        setIsLoadingSantri(true);
        try {
            const { data, error } = await supabase
                .from('santri')
                .select(`id, nama_lengkap, jenis_kelamin, kota_asal, nama_wali, nomor_wa_wali, kelas(nama_kelas)`)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;

            const formatted = data.map(s => ({
                id: s.id,
                nama: s.nama_lengkap,
                gender: s.jenis_kelamin,
                kotaAsal: s.kota_asal,
                kelas: s.kelas ? s.kelas.nama_kelas : '-',
                waliSiswa: s.nama_wali,
                nomorWhatsApp: s.nomor_wa_wali
            }));

            setDataSantri(formatted);
        } catch (error) {
            console.error("Gagal mengambil data santri:", error);
        } finally {
            setIsLoadingSantri(false);
        }
    };

    // ==========================================
    // FUNGSI WRITE (SIMPAN KE DATABASE)
    // ==========================================
    const handleSimpanKelas = async () => {
        if (!formKelas.nama.trim()) return alert("Nama kelas tidak boleh kosong!");

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('kelas')
                .insert([{ nama_kelas: formKelas.nama.trim().toUpperCase() }]);

            if (error) throw error;

            alert("Data kelas berhasil ditambahkan!");
            setIsModalKelasBuka(false);
            setFormKelas({ nama: '' }); // Reset form
            fetchDataKelas(); // Segarkan tabel
        } catch (error) {
            console.error("Error simpan kelas:", error);
            alert("Gagal menyimpan data kelas. Pastikan nama kelas belum ada.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSimpanSantri = async () => {
        if (!formSantri.nama.trim() || !formSantri.kelas_id || !formSantri.waWali.trim()) {
            return alert("Mohon lengkapi Nama, Kelas, dan Nomor WA!");
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('santri')
                .insert([{
                    nama_lengkap: formSantri.nama.trim(),
                    kelas_id: formSantri.kelas_id,
                    jenis_kelamin: formSantri.gender,
                    kota_asal: formSantri.kota.trim(),
                    nama_wali: formSantri.namaWali.trim(),
                    nomor_wa_wali: formSantri.waWali.trim(),
                    status_asrama: 'DI_PONDOK'
                }]);

            if (error) throw error;

            alert("Data santri berhasil ditambahkan!");
            setIsModalSantriBuka(false);
            setFormSantri({ nama: '', kelas_id: '', gender: 'Laki-laki', kota: '', namaWali: '', waWali: '' }); // Reset form
            fetchDataSantri(); // Segarkan tabel
        } catch (error) {
            console.error("Error simpan santri:", error);
            alert("Gagal menyimpan data santri.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Filter Logika ---
    const santriTampil = dataSantri.filter(s => {
        const matchKata = s.nama.toLowerCase().includes(kataKunciSantri.toLowerCase()) ||
            s.kotaAsal.toLowerCase().includes(kataKunciSantri.toLowerCase());
        const matchKelas = filterKelas === 'SEMUA' || s.kelas === filterKelas;
        return matchKata && matchKelas;
    });

    const kelasTampil = dataKelas.filter(k =>
        k.nama.toLowerCase().includes(kataKunciKelas.toLowerCase()) ||
        k.wali.toLowerCase().includes(kataKunciKelas.toLowerCase())
    );

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                {/* --- HEADER --- */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Database className="text-emerald-600" />
                            Master Data
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Pusat pengelolaan data referensi kelas dan santri pondok pesantren.</p>
                    </div>
                    <button
                        onClick={() => { tabAktif === 'SANTRI' ? fetchDataSantri() : fetchDataKelas() }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm hidden md:block"
                    >
                        Segarkan Data
                    </button>
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
                                    <input type="text" placeholder="Cari Nama Santri atau Kota Asal..." value={kataKunciSantri} onChange={(e) => setKataKunciSantri(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700">
                                    <option value="SEMUA">Semua Kelas</option>
                                    {dataKelas.map(k => <option key={k.id} value={k.nama}>Kelas {k.nama}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setIsModalImportBuka(true)} className="flex-1 md:flex-none bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <FileSpreadsheet size={18} /> Impor Data
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
                                            <th className="px-6 py-4">Nama Lengkap Santri</th>
                                            <th className="px-6 py-4">Kelas & Jenis Kelamin</th>
                                            <th className="px-6 py-4">Kota Asal</th>
                                            <th className="px-6 py-4">Kontak Orang Tua / Wali</th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingSantri ? (
                                            <tr><td colSpan="5" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data santri...</td></tr>
                                        ) : santriTampil.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data santri tidak ditemukan.</td></tr>
                                        ) : santriTampil.map((santri) => (
                                            <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4"><div className="font-bold text-gray-900 text-base">{santri.nama}</div></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-black">Kelas {santri.kelas}</span>
                                                        <span className={`text-[11px] font-bold ${santri.gender === 'Laki-laki' ? 'text-blue-600' : 'text-pink-600'}`}>{santri.gender}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-800 flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" />{santri.kotaAsal}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{santri.waliSiswa}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={12} /> {santri.nomorWhatsApp}</div>
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
                    TAB 2: TAMPILAN DATA KELAS
                ============================================= */}
                {tabAktif === 'KELAS' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 md:max-w-sm w-full">
                                <input type="text" placeholder="Cari nama kelas..." value={kataKunciKelas} onChange={(e) => setKataKunciKelas(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
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
                                        {isLoadingKelas ? (
                                            <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data kelas...</td></tr>
                                        ) : kelasTampil.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Data kelas tidak ditemukan.</td></tr>
                                        ) : kelasTampil.map((kelas) => (
                                            <tr key={kelas.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-black text-lg text-gray-800">Kelas {kelas.nama}</td>
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
            </div>

            {/* =========================================
                MODALS
            ============================================= */}

            {/* 1. Modal Tambah Santri Manual */}
            {isModalSantriBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalSantriBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Tambah Data Santri</h3>
                            <button onClick={() => setIsModalSantriBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap Santri <span className="text-red-500">*</span></label>
                                <input type="text" value={formSantri.nama} onChange={(e) => setFormSantri({ ...formSantri, nama: e.target.value })} placeholder="Nama sesuai ijazah" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Kelas <span className="text-red-500">*</span></label>
                                    <select value={formSantri.kelas_id} onChange={(e) => setFormSantri({ ...formSantri, kelas_id: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="" disabled>-- Pilih Kelas --</option>
                                        {dataKelas.map(k => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Jenis Kelamin</label>
                                    <select value={formSantri.gender} onChange={(e) => setFormSantri({ ...formSantri, gender: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Kota Asal</label>
                                <input type="text" value={formSantri.kota} onChange={(e) => setFormSantri({ ...formSantri, kota: e.target.value })} placeholder="Contoh: Cirebon" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />

                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Orang Tua / Wali</label>
                                <input type="text" value={formSantri.namaWali} onChange={(e) => setFormSantri({ ...formSantri, namaWali: e.target.value })} placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />

                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor WhatsApp Wali <span className="text-red-500">*</span></label>
                                <input type="text" value={formSantri.waWali} onChange={(e) => setFormSantri({ ...formSantri, waWali: e.target.value })} placeholder="Contoh: 081234567890" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalSantriBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanSantri} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal Tambah Kelas */}
            {isModalKelasBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalKelasBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Tambah Kelas</h3>
                            <button onClick={() => setIsModalKelasBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama / Kode Kelas <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formKelas.nama}
                                onChange={(e) => setFormKelas({ nama: e.target.value })}
                                placeholder="Contoh: 10A"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold uppercase"
                            />
                            <p className="text-[11px] text-gray-500 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                💡 <strong>Catatan:</strong> Untuk menugaskan Walikelas pada kelas ini, silakan atur melalui halaman <strong>Manajemen Pengguna</strong>.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalKelasBuka(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanKelas} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MasterData;