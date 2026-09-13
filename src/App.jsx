import React, { useState, useEffect, createContext, useContext } from 'react';
import { Home, FileText, LogOut, Menu, X } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const AuthContext = createContext(null);

const LoginPage = () => {
    const { login } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-down">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
                    <FileText size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">PPM Al-Islam</h2>
                <p className="mt-2 text-sm text-gray-600">Sistem Perizinan Santri Non-Jumat (Fase 1)</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <div className="mb-6 text-center text-sm text-gray-500">
                        Karena ini Fase 1, Anda bisa masuk tanpa password.
                    </div>
                    <button
                        onClick={() => login({ nama: 'Administrator', role: 'ADMIN' })}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        Masuk Simulasi
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardMock = () => {
    // Memindahkan State Supabase ke dalam Dashboard
    const [statusKoneksi, setStatusKoneksi] = useState('Menghubungkan ke Supabase...');
  
    useEffect(() => {
        const cekKoneksi = async () => {
            try {
                const { data, error } = await supabase.from('classes').select('class_name');
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    const namaKelas = data.map(k => k.class_name).join(', ');
                    setStatusKoneksi(`✅ Terhubung! Menemukan kelas: ${namaKelas}`);
                } else {
                    setStatusKoneksi(`✅ Terhubung! (Koneksi sukses, tapi data disembunyikan oleh sistem keamanan RLS)`);
                }
            } catch (error) {
                setStatusKoneksi(`❌ Gagal terhubung: ${error.message}`);
            }
        };

        cekKoneksi();
    }, []);

    return (
        <div className="animate-fade-in-down">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Simulasi</h2>
            <p className="text-gray-500 mb-6">Pondasi antarmuka berhasil dibangun!</p>

            <div className="p-8 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl text-center">
                <h3 className="text-lg font-bold text-emerald-800 mb-2">Tampilan Berhasil! 🎉</h3>
                <p className="text-emerald-700 font-medium">
                    Jika Anda melihat halaman ini, berarti React dan Tailwind CSS sudah berjalan dengan sempurna di laptop baru Anda.
                </p>
                
                {/* Kotak Status Database dimunculkan di sini */}
                <div className="mt-6 p-4 bg-emerald-100 text-emerald-800 rounded-md font-medium text-center shadow-sm border border-emerald-200">
                    Status Database: <br/> {statusKoneksi}
                </div>
            </div>
        </div>
    );
};

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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
                    <h1 className="font-bold text-xl text-emerald-700 leading-tight">Sistem Perizinan<br/><span className="text-sm text-gray-500 font-normal">PPM Al-Islam</span></h1>
                </div>

                <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="mb-6 px-4 py-3 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
                        <p className="text-gray-500">Masuk sebagai:</p>
                        <p className="font-bold text-emerald-800">{user?.nama}</p>
                    </div>

                    <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left bg-emerald-50 text-emerald-700 font-medium transition-colors">
                        <Home size={20} /> <span>Dashboard</span>
                    </button>
                </div>

                <div className="p-4 border-t">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-red-600 hover:bg-red-50 font-medium transition-colors">
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