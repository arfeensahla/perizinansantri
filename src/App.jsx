import React, { useState, useEffect, createContext, useContext } from 'react';
import { Home, FileText, LogOut, Menu, X, Users, ClipboardList, UserPlus, Send } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const AuthContext = createContext(null);

const LoginPage = () => {
    const { login } = useContext(AuthContext);

    // State baru untuk form Login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pesanError, setPesanError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setPesanError('');

        try {
            // 1. Tembus gerbang keamanan utama Supabase (Auth)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            // 2. Jika sukses tembus, ambil nama lengkap & role dari tabel profiles
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('nama_lengkap, role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // 3. Buka sistem dan bawa datanya ke dalam Dashboard!
            login({
                nama: profileData.nama_lengkap,
                role: profileData.role
            });

        } catch (error) {
            setPesanError('Gagal masuk: Periksa kembali email dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-down">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
                    <FileText size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">PPM Al-Islam</h2>
                <p className="mt-2 text-sm text-gray-600">Sistem Perizinan Santri Non-Jumat</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    {/* Form Login Asli */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {pesanError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 font-medium text-center">
                                {pesanError}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="admin@alislam.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-70 transition-colors"
                        >
                            {isLoading ? 'Memeriksa Data...' : 'Masuk Sistem'}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

const DashboardMock = () => {
    const { user } = useContext(AuthContext);
    const [statusKoneksi, setStatusKoneksi] = useState('Menghubungkan ke Supabase...');
    const [stats, setStats] = useState({ kelas: 0, santri: 0, log: 0 });

    // State baru khusus untuk tabel Wali Kelas
    const [izinKembaliHariIni, setIzinKembaliHariIni] = useState([]);

    useEffect(() => {
        const fetchStatistik = async () => {
            try {
                const { count: jumlahKelas } = await supabase.from('classes').select('*', { count: 'exact', head: true });
                const { count: jumlahSantri } = await supabase.from('students').select('*', { count: 'exact', head: true });
                setStats(prev => ({ ...prev, kelas: jumlahKelas || 0, santri: jumlahSantri || 0 }));
                setStatusKoneksi(`✅ Database Aktif! Mengambil data terkini...`);
            } catch (error) {
                setStatusKoneksi(`❌ Gagal memuat statistik: ${error.message}`);
            }
        };

        const fetchIzinWaliKelas = async () => {
            try {
                // Mengambil data izin hari ini, digabung dengan nama santri dan kelasnya
                const { data, error } = await supabase
                    .from('permits')
                    .select(`
                        id, permit_code, source, permit_type, status, return_due_date,
                        students ( name, classes ( class_name ) )
                    `)
                    .eq('return_due_date', new Date().toISOString().split('T')[0]); // Filter khusus HARI INI

                if (error) throw error;
                setIzinKembaliHariIni(data || []);
                setStatusKoneksi(`✅ Data perizinan berhasil dimuat!`);
            } catch (error) {
                setStatusKoneksi(`❌ Gagal memuat izin: ${error.message}`);
            }
        };

        // Panggil fungsi sesuai jabatan
        if (user?.role === 'ADMIN') {
            fetchStatistik();
        } else if (user?.role === 'WALIKELAS') {
            fetchIzinWaliKelas();
        }
    }, [user]);

    return (
        <div className="animate-fade-in-down">
            <h2 className="text-2xl font-bold text-gray-800">
                Dashboard {user?.role === 'ADMIN' ? 'Administrator' :
                    user?.role === 'WALIKELAS' ? 'Wali Kelas' :
                        user?.role === 'KESANTRIAN' ? 'Kesantrian' :
                            user?.role === 'SECURITY' ? 'Security' : 'Utama'}
            </h2>
            <p className="text-gray-500 mb-6">Selamat datang kembali, {user?.nama}!</p>

            {/* Tampilan ADMIN */}
            {user?.role === 'ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Total Santri</h4>
                        <p className="text-2xl font-black text-emerald-600">{stats.santri}</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Total Kelas</h4>
                        <p className="text-2xl font-black text-emerald-600">{stats.kelas}</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Log Hari Ini</h4>
                        <p className="text-2xl font-black text-emerald-600">{stats.log}</p>
                    </div>
                </div>
            )}

            {/* Tampilan WALI KELAS */}
            {user?.role === 'WALIKELAS' && (
                <div className="bg-white border rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-blue-50">
                        <h3 className="text-lg font-bold text-blue-800">Santri Harus Kembali Hari Ini</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Nama Santri</th>
                                    <th className="px-6 py-3">Kelas</th>
                                    <th className="px-6 py-3">Jenis Izin</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {izinKembaliHariIni.length > 0 ? (
                                    izinKembaliHariIni.map((izin) => (
                                        <tr key={izin.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{izin.students?.name}</td>
                                            <td className="px-6 py-4">{izin.students?.classes?.class_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                                    {izin.permit_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                                                    HARUS KEMBALI
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            Belum ada data santri yang harus kembali hari ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Status Koneksi Default */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl inline-block shadow-sm">
                <span className="text-emerald-800 font-bold text-sm">{statusKoneksi}</span>
            </div>
        </div>
    );
};

// --- KOMPONEN BARU: Form Ajukan Izin (Full Dinamis) ---
const FormAjukanIzin = () => {
    const [jenisIzin, setJenisIzin] = useState('PULANG_WALI');
    const [alasan, setAlasan] = useState('');
    const [statusSubmit, setStatusSubmit] = useState(null);

    // 1. Tambahan state untuk daftar santri asli dan pilihan Anda
    const [daftarSantri, setDaftarSantri] = useState([]);
    const [selectedSantriId, setSelectedSantriId] = useState('');

    // 2. Mengambil data santri asli dari Supabase saat form dibuka
    useEffect(() => {
        const fetchSantri = async () => {
            const { data } = await supabase.from('students').select('id, name');
            if (data) setDaftarSantri(data);
        };
        fetchSantri();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mencegah kirim data kalau santrinya lupa dipilih
        if (!selectedSantriId) {
            alert("Silakan pilih santri terlebih dahulu!");
            return;
        }

        setStatusSubmit('loading');

        try {
            // 3. Masukkan data menggunakan ID santri yang BENAR-BENAR dipilih!
            const { error } = await supabase.from('permits').insert([
                {
                    permit_code: 'IZN-' + Math.floor(Math.random() * 10000),
                    student_id: selectedSantriId, // <-- Ini kuncinya!
                    source: 'WALI_SANTRI',
                    permit_type: jenisIzin,
                    purpose: alasan,
                    status: 'APPROVED',
                    return_due_date: new Date().toISOString().split('T')[0]
                }
            ]);

            if (error) throw error;

            setStatusSubmit('sukses');
            setAlasan('');
            setSelectedSantriId(''); // Reset pilihan setelah sukses
        } catch (error) {
            alert("Gagal menyimpan data: " + error.message);
            setStatusSubmit(null);
        }
    };

    return (
        <div className="animate-fade-in-down max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ajukan Izin Santri</h2>

            {statusSubmit === 'sukses' && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between shadow-sm animate-fade-in-down">
                    <span className="font-bold">✅ Pengajuan izin berhasil direkam sistem!</span>
                    <button onClick={() => setStatusSubmit(null)} className="text-emerald-600 hover:text-emerald-800">
                        <X size={20} />
                    </button>
                </div>
            )}

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Santri</label>
                        {/* 4. Dropdown sekarang menampilkan data asli dari database */}
                        <select
                            value={selectedSantriId}
                            onChange={(e) => setSelectedSantriId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        >
                            <option value="">-- Pilih Santri --</option>
                            {daftarSantri.map((santri) => (
                                <option key={santri.id} value={santri.id}>
                                    {santri.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Izin</label>
                        <select
                            value={jenisIzin}
                            onChange={(e) => setJenisIzin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        >
                            <option value="PULANG_WALI">Pulang Bersama Wali (PULANG_WALI)</option>
                            <option value="KEGIATAN_LUAR">Kegiatan Luar Pondok (KEGIATAN_LUAR)</option>
                            <option value="SAKIT">Sakit / Rawat Inap (SAKIT)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alasan / Keperluan</label>
                        <textarea
                            rows="3"
                            required
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Tuliskan alasan izin secara detail..."
                        ></textarea>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={statusSubmit === 'loading'}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-75"
                        >
                            <Send size={18} />
                            {statusSubmit === 'loading' ? 'Memproses Data...' : 'Ajukan Izin Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- KOMPONEN BARU: Daftar Santri (Kelas Saya) ---
const HalamanKelasSaya = () => {
    const [daftarSantri, setDaftarSantri] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDaftarSantri = async () => {
            try {
                // Menarik data santri beserta nama kelasnya
                const { data, error } = await supabase
                    .from('students')
                    .select('student_code, name, classes(class_name)');

                if (error) throw error;
                setDaftarSantri(data || []);
            } catch (error) {
                console.error("Gagal memuat data santri:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDaftarSantri();
    }, []);

    return (
        <div className="animate-fade-in-down">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Daftar Santri Kelas</h2>
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">NIS</th>
                                <th className="px-6 py-3">Nama Lengkap</th>
                                <th className="px-6 py-3">Kelas</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        Memuat data santri...
                                    </td>
                                </tr>
                            ) : (
                                daftarSantri.map((santri, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-gray-500">{santri.student_code}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{santri.name}</td>
                                        <td className="px-6 py-4">{santri.classes?.class_name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                                                MUKIM
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN BARU: Rekap Semua Izin (Khusus Admin) ---
const HalamanSemuaIzin = () => {
    const [semuaIzin, setSemuaIzin] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSemuaIzin = async () => {
            try {
                // Mengambil seluruh data izin tanpa difilter tanggalnya
                const { data, error } = await supabase
                    .from('permits')
                    .select(`
                        id, permit_code, permit_type, purpose, status, return_due_date,
                        students ( name, classes ( class_name ) )
                    `)
                    .order('created_at', { ascending: false }); // Urutkan dari yang paling baru

                if (error) throw error;
                setSemuaIzin(data || []);
            } catch (error) {
                console.error("Gagal memuat semua izin:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSemuaIzin();
    }, []);

    return (
        <div className="animate-fade-in-down">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Rekap Semua Izin Santri</h2>
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Kode / Tanggal Kembali</th>
                                <th className="px-6 py-3">Nama Santri</th>
                                <th className="px-6 py-3">Jenis Izin</th>
                                <th className="px-6 py-3">Alasan</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Memuat data perizinan...</td>
                                </tr>
                            ) : semuaIzin.length > 0 ? (
                                semuaIzin.map((izin) => (
                                    <tr key={izin.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs text-gray-500 mb-1">{izin.permit_code}</div>
                                            <div className="font-bold text-gray-800">{izin.return_due_date}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{izin.students?.name}</div>
                                            <div className="text-xs text-gray-500">{izin.students?.classes?.class_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                                {izin.permit_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={izin.purpose}>
                                            {izin.purpose}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                                {izin.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada riwayat perizinan di sistem.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN BARU: Master Data (Khusus Admin) ---
const HalamanMasterData = () => {
    const [daftarKelas, setDaftarKelas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKelas = async () => {
            try {
                // Menarik data master kelas dari database
                const { data, error } = await supabase
                    .from('classes')
                    .select('*')
                    .order('class_name', { ascending: true });

                if (error) throw error;
                setDaftarKelas(data || []);
            } catch (error) {
                console.error("Gagal memuat master data:", error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchKelas();
    }, []);

    return (
        <div className="animate-fade-in-down">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Master Data Kelas</h2>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors">
                    + Tambah Kelas Baru
                </button>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden max-w-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 w-20">ID</th>
                                <th className="px-6 py-3">Nama Kelas</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">Memuat data kelas...</td>
                                </tr>
                            ) : daftarKelas.length > 0 ? (
                                daftarKelas.map((kelas, index) => (
                                    <tr key={kelas.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 text-lg">{kelas.class_name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs px-3 py-1 border border-emerald-200 rounded-md bg-emerald-50">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">Belum ada data kelas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- PROPS LAYOUT DIPERBARUI ---
const Layout = ({ children, activeMenu, setActiveMenu }) => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    // Daftar Menu Khusus ADMIN
    const menuAdmin = [
        { label: 'Dashboard', icon: <Home size={20} /> },
        { label: 'Master Data', icon: <Users size={20} /> },
        { label: 'Semua Izin', icon: <ClipboardList size={20} /> },
    ];

    // Daftar Menu Khusus WALI KELAS
    const menuWalikelas = [
        { label: 'Dashboard', icon: <Home size={20} /> },
        { label: 'Ajukan Izin', icon: <UserPlus size={20} /> },
        { label: 'Kelas Saya', icon: <Users size={20} /> },
    ];

    // Pilih menu sesuai jabatan
    const menuAktif = user?.role === 'ADMIN' ? menuAdmin :
        user?.role === 'WALIKELAS' ? menuWalikelas :
            [{ label: 'Dashboard', icon: <Home size={20} /> }]; // Default

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <div className="md:hidden bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div className="font-bold text-emerald-700 flex items-center gap-2">
                    <FileText size={20} /> Al-Islam Permit
                </div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-xl md:shadow-none`}>
                <div className="p-6 border-b hidden md:block">
                    <h1 className="font-bold text-xl text-emerald-700 leading-tight">Sistem Perizinan<br /><span className="text-sm text-gray-500 font-normal">PPM Al-Islam</span></h1>
                </div>

                <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="mb-6 px-4 py-3 bg-emerald-50 rounded-lg text-sm border border-emerald-100 shadow-sm">
                        <p className="text-gray-500">Masuk sebagai:</p>
                        <p className="font-bold text-emerald-800 text-lg truncate">{user?.nama}</p>
                        <p className="inline-block px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded mt-1">
                            {user?.role}
                        </p>
                    </div>

                    {/* Menampilkan Menu Secara Dinamis */}
                    <div className="space-y-1">
                        {menuAktif.map((item, index) => (
                            <button
                                key={index}
                                // SAAT DIKLIK, STATE MENU BERUBAH
                                onClick={() => { setActiveMenu(item.label); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeMenu === item.label
                                    ? 'bg-emerald-50 text-emerald-700' // Menu aktif diberi warna hijau
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                                    }`}
                            >
                                {item.icon} <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-red-600 hover:bg-red-50 font-medium transition-colors">
                        <LogOut size={20} /> <span>Keluar</span>
                    </button>
                </div>
            </div>

            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            <div className="flex-1 overflow-y-auto h-screen">
                <main className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

// --- APP UTAMA (ROUTING) ---
export default function App() {
    const [user, setUser] = useState(null);
    // State pusat untuk mengatur halaman mana yang sedang terbuka
    const [activeMenu, setActiveMenu] = useState('Dashboard');

    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            {!user ? <LoginPage /> : (
                <Layout activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
                    {/* Logika Routing Sederhana */}
                    {activeMenu === 'Dashboard' && <DashboardMock />}
                    {activeMenu === 'Ajukan Izin' && <FormAjukanIzin />}
                    {activeMenu === 'Kelas Saya' && <HalamanKelasSaya />}
                    {activeMenu === 'Semua Izin' && <HalamanSemuaIzin />}
                    {activeMenu === 'Master Data' && <HalamanMasterData />}

                    {/* Halaman Placeholder untuk menu lainnya */}
                    {['Master Data', 'Semua Izin'].includes(activeMenu) && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-fade-in-down">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-gray-500 mb-2">Halaman {activeMenu}</h3>
                            <p>Modul ini akan kita bangun di sesi berikutnya!</p>
                        </div>
                    )}
                </Layout>
            )}
        </AuthContext.Provider>
    );
}