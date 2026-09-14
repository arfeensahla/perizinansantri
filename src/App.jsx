import React, { useState, useEffect, createContext, useContext } from 'react';
import { Users, LayoutDashboard, LogOut, Menu, X, FileText } from 'lucide-react';
import { supabase } from './services/supabaseClient';

// Import Komponen Halaman yang sudah dipecah
import LoginPage from './pages/auth/LoginPage';
import ManajemenUser from './pages/admin/ManajemenUser';

// Export AuthContext agar bisa dibaca oleh file lain (terutama LoginPage)
export const AuthContext = createContext(null);

// =====================================================================
// KOMPONEN PLACEHOLDER (Untuk menu yang belum dibangun)
// =====================================================================
const HalamanKosong = ({ judul }) => (
    <div className="p-6 text-center text-gray-500 animate-fade-in-down flex flex-col items-center justify-center h-full min-h-[60vh]">
        <FileText size={48} className="mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2 text-gray-600">{judul}</h2>
        <p>Panel ini sedang dalam tahap pembangunan (Sesuai PRD V3).</p>
    </div>
);

// =====================================================================
// BUNGKUSAN LAYOUT UTAMA & ROUTING DINAMIS
// =====================================================================
const MainLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeMenu, setActiveMenu] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    // Routing Daftar Menu Sesuai PRD V3
    const getMenusByRole = (role) => {
        switch (role) {
            case 'ADMIN': return ['Dashboard', 'Manajemen User', 'Master Data', 'Semua Izin', 'Audit Log'];
            case 'WALIKELAS': return ['Dashboard', 'Kelas Saya', 'Ajukan Izin', 'Perpanjangan'];
            case 'SEKRETARIS_MUDIR': return ['Dashboard', 'Persetujuan Izin', 'Monitoring'];
            case 'KESANTRIAN': return ['Dashboard', 'Scan Pos Kesantrian'];
            case 'SECURITY': return ['Dashboard', 'Scan Pos Gerbang'];
            case 'KLINIK': return ['Dashboard', 'Pengajuan Medis'];
            default: return [];
        }
    };

    const menus = getMenusByRole(user?.role);

    // Otomatis memilih menu pertama yang tersedia saat login
    useEffect(() => {
        if (menus.length > 0 && !menus.includes(activeMenu)) {
            // Arahkan Admin ke Manajemen User dulu, role lain ke menu pertama
            setActiveMenu(user?.role === 'ADMIN' ? menus[1] : menus[0]);
        }
    }, [user, menus, activeMenu]);

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* --- SIDEBAR KIRI --- */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-emerald-800 text-lg">Sistem Perizinan</h1>
                        <p className="text-xs text-gray-500">PPM Al-Islam (V3.0)</p>
                    </div>
                    <button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 flex flex-col h-[calc(100%-73px)]">
                    <div className="bg-emerald-50 p-3 rounded-lg mb-6 border border-emerald-100">
                        <p className="text-xs text-gray-500">Login sebagai:</p>
                        <p className="font-bold text-emerald-800">{user.name}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-emerald-200 text-emerald-800 text-[10px] font-black rounded uppercase tracking-wider">
                            {user.role}
                        </span>
                    </div>

                    <nav className="space-y-1 flex-1 overflow-y-auto">
                        {menus.map((menu) => (
                            <button
                                key={menu}
                                onClick={() => {
                                    setActiveMenu(menu);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === menu
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {menu === 'Manajemen User' ? <Users size={18} /> : <LayoutDashboard size={18} />}
                                {menu}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-4 border-t mt-4">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                            <LogOut size={18} /> Keluar
                        </button>
                    </div>
                </div>
            </div>

            {/* --- AREA KONTEN KANAN --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="md:hidden bg-white border-b p-4 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 p-1 bg-gray-100 rounded-md">
                        <Menu size={24} />
                    </button>
                    <h2 className="font-bold text-gray-800">{activeMenu}</h2>
                </div>

                <main className="flex-1 overflow-y-auto bg-gray-50/50">
                    {/* Router Penentu Konten Utama */}
                    {activeMenu === 'Manajemen User' ? <ManajemenUser /> : <HalamanKosong judul={activeMenu} />}
                </main>
            </div>

            {/* Overlay background saat sidebar mobile terbuka */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}
        </div>
    );
};

// =====================================================================
// APP UTAMA
// =====================================================================
export default function App() {
    const [user, setUser] = useState(null);

    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            {!user ? <LoginPage /> : <MainLayout />}
        </AuthContext.Provider>
    );
}