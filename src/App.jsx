import React, { useState, useEffect, createContext, useContext } from 'react';
import {
    Users, LogOut, FileText, Database, ClipboardList,
    Activity, UserPlus, Clock, ClipboardCheck, Eye,
    Scan, PlusSquare, Home, QrCode, History, Loader2,
    CalendarRange, ShieldCheck, ArrowRight, BookOpen, ChevronLeft // <-- ChevronLeft sudah ditambahkan di sini
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
import KelasSaya from './pages/walikelas/KelasSaya';
import AjukanIzin from './pages/walikelas/AjukanIzin';
import StatusPengajuan from './pages/walikelas/StatusPengajuan';
import PerpanjanganIzin from './pages/walikelas/PerpanjanganIzin';

import DashboardSekretaris from './pages/sekretaris/DashboardSekretaris';
import PersetujuanIzin from './pages/sekretaris/PersetujuanIzin';
import Monitoring from './pages/sekretaris/Monitoring';

import DashboardKesantrian from './pages/operasional/DashboardKesantrian';
import MonitoringKesantrian from './pages/operasional/MonitoringKesantrian';
import ScanQR from './pages/operasional/ScanQR';
import RiwayatScan from './pages/operasional/RiwayatScan';

import DashboardKlinik from './pages/klinik/DashboardKlinik';
import PengajuanMedis from './pages/klinik/PengajuanMedis';
import StatusPengajuanMedis from './pages/klinik/StatusPengajuanMedis';

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
// BUNGKUSAN LAYOUT UTAMA (MOBILE APP STYLE)
// =====================================================================
const MainLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeMenu, setActiveMenu] = useState('');

    const handleLogout = () => {
        logout();
        supabase.auth.signOut().catch(console.error);
    };

    const getMenusByRole = (role) => {
        switch (role) {
            case 'ADMIN': return ['Dashboard', 'Manajemen User', 'Master Data', 'Semua Izin', 'Audit Log'];
            case 'WALIKELAS': return ['Dashboard', 'Kelas Saya', 'Ajukan Izin', 'Perpanjangan Izin', 'Status Pengajuan'];
            case 'SEKRETARIS_MUDIR': return ['Dashboard', 'Persetujuan Izin', 'Monitoring'];
            case 'KESANTRIAN': return ['Dashboard', 'Scan Pos Kesantrian', 'Monitoring Kesantrian', 'Riwayat Scan'];
            case 'SECURITY': return ['Scan Pos Gerbang', 'Riwayat Scan'];
            case 'KLINIK': return ['Dashboard', 'Pengajuan Medis', 'Status Rujukan'];
            default: return [];
        }
    };

    const menus = getMenusByRole(user?.role);

    useEffect(() => {
        if (menus.length > 0 && !menus.includes(activeMenu)) {
            setActiveMenu(menus[0]);
        }
    }, [user, menus, activeMenu]);

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
            case 'Perpanjangan Izin': return <Clock size={size} />;
            case 'Status Pengajuan': return <History size={size} />;
            case 'Persetujuan Izin': return <ClipboardCheck size={size} />;
            case 'Monitoring': return <Eye size={size} />;
            case 'Monitoring Kesantrian': return <Eye size={size} />;
            case 'Scan Pos Kesantrian': return <QrCode size={size} />;
            case 'Scan Pos Gerbang': return <Scan size={size} />;
            case 'Riwayat Scan': return <History size={size} />;
            case 'Pengajuan Medis': return <PlusSquare size={size} />;
            case 'Status Rujukan': return <History size={size} />;
            default: return <FileText size={size} />;
        }
    };

    const getShortLabel = (menu) => {
        if (menu === 'Dashboard') return 'Beranda';
        if (menu === 'Manajemen User') return 'User';
        if (menu === 'Master Data') return 'Data';
        if (menu === 'Semua Izin') return 'Semua Izin';
        if (menu === 'Audit Log') return 'Log';
        if (menu === 'Kelas Saya') return 'Kelas';
        if (menu === 'Ajukan Izin' || menu === 'Pengajuan Medis') return 'Ajukan';
        if (menu === 'Status Pengajuan') return 'Status';
        if (menu === 'Persetujuan Izin') return 'Setujui';
        if (menu === 'Scan Pos Kesantrian' || menu === 'Scan Pos Gerbang') return 'Scan QR';
        if (menu === 'Monitoring Kesantrian') return 'Monitoring';
        if (menu === 'Riwayat Scan') return 'Riwayat';
        return menu;
    };

    const renderContent = () => {
        if (user?.role === 'ADMIN') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardAdmin />;
                case 'Manajemen User': return <ManajemenUser />;
                case 'Master Data': return <MasterData />;
                case 'Semua Izin': return <SemuaIzin />;
                case 'Audit Log': return <AuditLog />;
            }
        }
        if (user?.role === 'WALIKELAS') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardWalikelas />;
                case 'Kelas Saya': return <KelasSaya />;
                case 'Ajukan Izin': return <AjukanIzin />;
                case 'Perpanjangan Izin': return <PerpanjanganIzin />;
                case 'Status Pengajuan': return <StatusPengajuan />;
            }
        }
        if (user?.role === 'SEKRETARIS_MUDIR') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardSekretaris />;
                case 'Persetujuan Izin': return <PersetujuanIzin />;
                case 'Monitoring': return <Monitoring />;
            }
        }
        if (user?.role === 'KESANTRIAN') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardKesantrian />;
                case 'Monitoring Kesantrian': return <MonitoringKesantrian />;
                case 'Scan Pos Kesantrian': return <ScanQR menuContext="Scan Pos Kesantrian" />;
                case 'Riwayat Scan': return <RiwayatScan menuContext="Pos Kesantrian" />;
            }
        }
        if (user?.role === 'SECURITY') {
            switch (activeMenu) {
                case 'Scan Pos Gerbang': return <ScanQR menuContext="Scan Pos Gerbang" />;
                case 'Riwayat Scan': return <RiwayatScan menuContext="Security" />;
            }
        }
        if (user?.role === 'KLINIK') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardKlinik />;
                case 'Pengajuan Medis': return <PengajuanMedis />;
                case 'Status Rujukan': return <StatusPengajuanMedis />;
            }
        }
        return <HalamanKosong judul={activeMenu} />;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* --- HEADER APLIKASI --- */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-lg shadow-inner">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-gray-900 leading-none mb-1">{user?.name}</h1>
                        <div className="flex items-center">
                            <span className="text-[9px] text-emerald-700 font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {user?.role?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="Keluar Sistem"
                >
                    <LogOut size={18} />
                </button>
            </div>

            {/* --- AREA KONTEN UTAMA --- */}
            <main className="flex-1 overflow-y-auto bg-gray-50/50 pb-20">
                {renderContent()}
            </main>

            {/* --- BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40 pb-safe">
                <div className="flex justify-around items-center h-16 max-w-3xl mx-auto px-1 sm:px-4">
                    {menus.map((menu) => {
                        const isActive = activeMenu === menu;
                        return (
                            <button
                                key={menu}
                                onClick={() => setActiveMenu(menu)}
                                className="relative flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-emerald-500 transition-colors px-1 group"
                            >
                                {isActive && <div className="absolute top-0 w-8 sm:w-12 h-1 bg-emerald-500 rounded-b-full shadow-[0_2px_4px_rgba(16,185,129,0.4)]"></div>}

                                <div className={`mt-1 transition-all duration-300 ${isActive ? 'text-emerald-600 transform -translate-y-1' : 'group-hover:-translate-y-0.5 group-active:scale-95'}`}>
                                    {getMenuIcon(menu, isActive)}
                                </div>

                                <span className={`text-[9px] sm:text-[10px] mt-1 transition-all text-center leading-tight line-clamp-1 ${isActive ? 'text-emerald-700 font-bold' : 'font-medium'}`}>
                                    {getShortLabel(menu)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


// =====================================================================
// HALAMAN PORTAL LANDING PAGE (SISTEM ROUTING UTAMA)
// =====================================================================
const LandingPortal = ({ onMasukEpass }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

            {/* Background Ornaments */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="z-10 w-full max-w-4xl px-4 animate-fade-in-down">

                {/* Header & Logo */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform">
                        <BookOpen size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        Portal Perizinan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Al-Islam</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto font-medium">
                        Pusat layanan administrasi perizinan santri. Silakan pilih layanan yang ingin Anda akses.
                    </p>
                </div>

                {/* Grid Pilihan Sistem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

                    {/* CARD 1: SISTEM BARU (E-PASS REGULER) */}
                    <div
                        onClick={onMasukEpass}
                        className="group bg-white rounded-3xl p-8 border-2 border-transparent hover:border-emerald-500 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer transition-all duration-300 flex flex-col h-full transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Izin Reguler & Medis</h2>
                        <p className="text-gray-500 mb-8 relative z-10 flex-1 leading-relaxed">
                            Sistem E-Pass untuk pengajuan Izin Pulang (Menginap/PP) dan rujukan penanganan medis ke luar pondok.
                        </p>
                        <div className="flex items-center text-emerald-600 font-bold mt-auto group-hover:translate-x-2 transition-transform relative z-10">
                            Masuk Sistem E-Pass <ArrowRight size={18} className="ml-2" />
                        </div>
                    </div>

                    {/* CARD 2: SISTEM LAMA (IZIN JUMAT) */}
                    <div
                        onClick={() => window.open('https://izinjumat.vercel.app/', '_blank')}
                        className="group bg-white rounded-3xl p-8 border-2 border-transparent hover:border-blue-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer transition-all duration-300 flex flex-col h-full transform hover:-translate-y-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <CalendarRange size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Izin Khusus Jumat</h2>
                        <p className="text-gray-500 mb-8 relative z-10 flex-1 leading-relaxed">
                            Akses cepat perizinan keluarnya santri khusus pada rutinitas hari Jumat.
                        </p>
                        <div className="flex items-center text-blue-600 font-bold mt-auto group-hover:translate-x-2 transition-transform relative z-10">
                            Buka Panel Izin Jumat <ArrowRight size={18} className="ml-2" />
                        </div>
                    </div>

                </div>

                <div className="text-center mt-12 text-sm text-gray-400 font-medium">
                    &copy; 2026 Pondok Pesantren Modern Al-Islam. Hak Cipta Dilindungi.
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
};


// =====================================================================
// KOMPONEN ROOT (APP ENTRY)
// =====================================================================
export default function App() {
    const [user, setUser] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [showPortal, setShowPortal] = useState(true); // State Penentu Halaman Portal

    const fetchedUserId = React.useRef(null);

    useEffect(() => {
        const checkActiveSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserData(session.user.id);
            } else {
                setIsCheckingSession(false);
            }
        };

        checkActiveSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                if (fetchedUserId.current !== session.user.id) {
                    await fetchUserData(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                fetchedUserId.current = null;
                setUser(null);
                setShowPortal(true); // Saat logout, otomatis tendang balik ke Portal
                setIsCheckingSession(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (userId) => {
        fetchedUserId.current = userId;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('nama_lengkap, role')
                .eq('id', userId)
                .single();

            if (data) {
                setUser({
                    id: userId,
                    name: data.nama_lengkap,
                    role: data.role
                });
                setShowPortal(false); // Kalau sudah login dan sesi valid, langsung masuk ke MainLayout, bypass Portal
            }
        } catch (error) {
            console.error("Gagal memulihkan sesi user:", error);
        } finally {
            setIsCheckingSession(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
                <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
                <p className="text-sm font-bold text-emerald-600 animate-pulse uppercase tracking-widest">Menghubungkan ke Sistem...</p>
            </div>
        );
    }

    // --- ALUR ROUTING ---
    // 1. Jika User belum menentukan pilihan di Portal, tampilkan Portal.
    if (showPortal) {
        return <LandingPortal onMasukEpass={() => setShowPortal(false)} />;
    }

    // 2. Jika User memilih E-Pass tapi belum Login, tampilkan form Login.
    if (!user) {
        return (
            <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
                {/* Tombol Kembali ke Portal di halaman Login */}
                <div className="absolute top-4 left-4 z-50">
                    <button
                        onClick={() => setShowPortal(true)}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-gray-600 font-bold text-sm shadow-sm hover:bg-white hover:text-emerald-600 transition-colors border border-gray-200"
                    >
                        <ChevronLeft size={16} /> Kembali ke Portal
                    </button>
                </div>
                <LoginPage />
            </AuthContext.Provider>
        );
    }

    // 3. Jika User sudah Login, tampilkan Main Layout (Aplikasi Utama).
    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            <MainLayout />
        </AuthContext.Provider>
    );
}