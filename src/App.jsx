import React, { useState, useEffect, createContext, useContext } from 'react';
import {
    Users, LayoutDashboard, LogOut, Menu, X, FileText,
    Database, ClipboardList, Activity, UserPlus, Clock,
    ClipboardCheck, Eye, Scan, Shield, PlusSquare, Lock, Home, QrCode
} from 'lucide-react';
import { supabase } from './services/supabaseClient';

// Import Komponen Halaman
import LoginPage from './pages/auth/LoginPage';
import ManajemenUser from './pages/admin/ManajemenUser';
import MasterData from './pages/admin/MasterData';
import SemuaIzin from './pages/admin/SemuaIzin';
import AuditLog from './pages/admin/AuditLog';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardWalikelas from './pages/walikelas/DashboardWalikelas';
import FormAjukanIzin from './pages/walikelas/FormAjukanIzin';
import KelasSaya from './pages/walikelas/KelasSaya';
import Perpanjangan from './pages/walikelas/Perpanjangan';
import PersetujuanIzin from './pages/sekretaris/PersetujuanIzin';
import Monitoring from './pages/sekretaris/Monitoring'; // <-- Tambahan Baru

export const AuthContext = createContext(null);

// =====================================================================
// KOMPONEN PLACEHOLDER
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

    // Flag Penentu Layout
    const isAdmin = user?.role === 'ADMIN';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    // Daftar Menu Sesuai PRD V3
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

    useEffect(() => {
        if (menus.length > 0 && !menus.includes(activeMenu)) {
            setActiveMenu(menus[0]);
        }
    }, [user, menus, activeMenu]);

    // Icon Mapping
    const getMenuIcon = (menu, isActive) => {
        const size = isActive ? 24 : 20;
        switch (menu) {
            case 'Dashboard': return <Home size={size} />;
            case 'Manajemen User': return <Users size={size} />;
            case 'Master Data': return <Database size={size} />;
            case 'Semua Izin': return <ClipboardList size={size} />;
            case 'Audit Log': return <Activity size={size} />;
            case 'Kelas Saya': return <Users size={size} />;
            case 'Ajukan Izin': return <UserPlus size={size} />;
            case 'Perpanjangan': return <Clock size={size} />;
            case 'Persetujuan Izin': return <ClipboardCheck size={size} />;
            case 'Monitoring': return <Eye size={size} />;
            case 'Scan Pos Kesantrian': return <QrCode size={size} />;
            case 'Scan Pos Gerbang': return <Shield size={size} />;
            case 'Pengajuan Medis': return <PlusSquare size={size} />;
            default: return <FileText size={size} />;
        }
    };

    // Label Singkat untuk Menu Bawah
    const getShortLabel = (menu) => {
        if (menu === 'Dashboard') return 'Beranda';
        if (menu === 'Kelas Saya') return 'Kelas';
        if (menu === 'Ajukan Izin') return 'Ajukan';
        if (menu === 'Persetujuan Izin') return 'Setujui';
        if (menu === 'Scan Pos Kesantrian' || menu === 'Scan Pos Gerbang') return 'Scan QR';
        return menu;
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* --- SIDEBAR (Untuk Admin atau Pengaturan Akun) --- */}
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
                    <div className="bg-emerald-50 p-4 rounded-xl mb-6 border border-emerald-100 text-center">
                        <div className="w-16 h-16 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">Login sebagai:</p>
                        <p className="font-bold text-emerald-900 leading-tight">{user.name}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                            {user.role.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <nav className="space-y-1 flex-1 overflow-y-auto">
                        {/* Menu Samping Hanya Untuk ADMIN */}
                        {isAdmin && menus.map((menu) => (
                            <button
                                key={menu}
                                onClick={() => { setActiveMenu(menu); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeMenu === menu
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {getMenuIcon(menu, activeMenu === menu)}
                                {menu}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-4 border-t mt-4 space-y-2">
                        <button
                            onClick={() => { setActiveMenu('Ganti Password'); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors"
                        >
                            <Lock size={18} /> Ganti Password
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
                        >
                            <LogOut size={18} /> Keluar Sistem
                        </button>
                    </div>
                </div>
            </div>

            {/* --- AREA KONTEN UTAMA --- */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header Mobile */}
                <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-700 p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
                            <Menu size={22} />
                        </button>
                        <h2 className="font-bold text-gray-900 text-lg">{activeMenu}</h2>
                    </div>
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>

                <main className={`flex-1 overflow-y-auto bg-gray-50/50 ${!isAdmin ? 'pb-24' : ''}`}>
                    {/* Halaman Admin */}
                    {activeMenu === 'Dashboard' && user?.role === 'ADMIN' && <DashboardAdmin />}
                    {activeMenu === 'Manajemen User' && <ManajemenUser />}
                    {activeMenu === 'Master Data' && <MasterData />}
                    {activeMenu === 'Semua Izin' && <SemuaIzin />}
                    {activeMenu === 'Audit Log' && <AuditLog />}

                    {/* Halaman Walikelas */}
                    {activeMenu === 'Dashboard' && user?.role === 'WALIKELAS' && <DashboardWalikelas />}
                    {activeMenu === 'Ajukan Izin' && <FormAjukanIzin />}
                    {activeMenu === 'Kelas Saya' && <KelasSaya />}
                    {activeMenu === 'Perpanjangan' && <Perpanjangan />}

                    {/* Halaman Sekretaris Mudir */}
                    {activeMenu === 'Dashboard' && user?.role === 'SEKRETARIS_MUDIR' && <HalamanKosong judul="Dashboard Sekretaris" />}
                    {activeMenu === 'Persetujuan Izin' && <PersetujuanIzin />}
                    {activeMenu === 'Monitoring' && <Monitoring />}

                    {/* Placeholder */}
                    {!['Manajemen User', 'Master Data', 'Semua Izin', 'Audit Log', 'Ajukan Izin', 'Kelas Saya', 'Perpanjangan', 'Persetujuan Izin', 'Monitoring'].includes(activeMenu) &&
                        !(activeMenu === 'Dashboard' && (user?.role === 'ADMIN' || user?.role === 'WALIKELAS' || user?.role === 'SEKRETARIS_MUDIR')) && (
                            <HalamanKosong judul={activeMenu} />
                        )}
                </main>

                {/* --- BOTTOM NAVIGATION (MENU BAWAH KHUSUS HP/NON-ADMIN) --- */}
                {!isAdmin && (
                    <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40 pb-safe">
                        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
                            {menus.map((menu) => {
                                const isActive = activeMenu === menu;
                                return (
                                    <button
                                        key={menu}
                                        onClick={() => setActiveMenu(menu)}
                                        className="relative flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-emerald-500 transition-colors"
                                    >
                                        {isActive && <div className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full"></div>}
                                        <div className={`mt-1 transition-all duration-300 ${isActive ? 'text-emerald-600 transform -translate-y-1' : ''}`}>
                                            {getMenuIcon(menu, isActive)}
                                        </div>
                                        <span className={`text-[10px] mt-1 transition-all ${isActive ? 'text-emerald-700 font-bold' : 'font-medium'}`}>
                                            {getShortLabel(menu)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            {!user ? <LoginPage /> : <MainLayout />}
        </AuthContext.Provider>
    );
}