import React, { useState, useEffect, createContext, useContext } from 'react';
import { Home, FileText, LogOut, Menu, X, Users, ClipboardList, UserPlus } from 'lucide-react';
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

    // 1. State baru untuk menyimpan angka statistik
    const [stats, setStats] = useState({ kelas: 0, santri: 0, log: 0 });

    useEffect(() => {
        const fetchStatistik = async () => {
            try {
                // Tarik jumlah kelas
                const { count: jumlahKelas, error: errorKelas } = await supabase
                    .from('classes')
                    .select('*', { count: 'exact', head: true });
                if (errorKelas) throw errorKelas;

                // Tarik jumlah santri
                const { count: jumlahSantri, error: errorSantri } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true });
                if (errorSantri) throw errorSantri;

                // Perbarui state untuk kelas DAN santri sekaligus
                setStats(prev => ({
                    ...prev,
                    kelas: jumlahKelas || 0,
                    santri: jumlahSantri || 0
                }));
                setStatusKoneksi(`✅ Database Aktif! Mengambil data terkini...`);

            } catch (error) {
                setStatusKoneksi(`❌ Gagal memuat statistik: ${error.message}`);
            }
        };

        // Hanya jalankan pencarian statistik jika yang login adalah ADMIN
        if (user?.role === 'ADMIN') {
            fetchStatistik();
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

            {user?.role === 'ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Total Santri</h4>
                        <p className="text-2xl font-black text-emerald-600">{stats.santri}</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Total Kelas</h4>
                        {/* 3. Angkanya dipasang di sini secara otomatis */}
                        <p className="text-2xl font-black text-emerald-600">{stats.kelas}</p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500">Log Hari Ini</h4>
                        <p className="text-2xl font-black text-emerald-600">{stats.log}</p>
                    </div>
                </div>
            )}

            {user?.role === 'WALIKELAS' && (
                <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl mb-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Santri Harus Kembali Hari Ini</h3>
                    <p className="text-blue-700">Tabel monitoring santri akan muncul di sini.</p>
                </div>
            )}

            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center shadow-sm">
                <p className="text-emerald-700 font-medium">
                    Infrastruktur Autentikasi dan Routing Role sudah berjalan sempurna.
                </p>
                <div className="mt-4 p-3 bg-white text-emerald-800 rounded-md font-bold text-sm inline-block shadow-sm">
                    {statusKoneksi}
                </div>
            </div>
        </div>
    );
};

const Layout = ({ children }) => {
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
                                onClick={() => setSidebarOpen(false)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${index === 0
                                    ? 'bg-emerald-50 text-emerald-700' // Menu pertama (Dashboard) dibuat aktif
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

export default function App() {
    const [user, setUser] = useState(null);

    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            {!user ? <LoginPage /> : <Layout><DashboardMock /></Layout>}
        </AuthContext.Provider>
    );
}