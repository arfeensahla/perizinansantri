import React, { useState, useEffect, createContext, useContext } from 'react';
import {
    Users, LogOut, FileText, Database, ClipboardList,
    Activity, UserPlus, Clock, ClipboardCheck, Eye,
    Scan, PlusSquare, Home, QrCode, History
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
import StatusPengajuan from './pages/walikelas/StatusPengajuan'; // Sudah ter-import
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    // 1. TAMBAH KE DAFTAR MENU WALIKELAS
    const getMenusByRole = (role) => {
        switch (role) {
            case 'ADMIN': return ['Dashboard', 'Manajemen User', 'Master Data', 'Semua Izin', 'Audit Log'];
            case 'WALIKELAS': return ['Dashboard', 'Kelas Saya', 'Ajukan Izin', 'Perpanjangan Izin', 'Status Pengajuan']; // <-- Ditambahkan di sini
            case 'SEKRETARIS_MUDIR': return ['Dashboard', 'Persetujuan Izin', 'Monitoring'];
            case 'KESANTRIAN': return ['Dashboard', 'Scan Pos Kesantrian', 'Monitoring Kesantrian'];
            case 'SECURITY': return ['Scan Pos Gerbang', 'Riwayat Scan'];
            case 'KLINIK': return ['Dashboard', 'Pengajuan Medis', 'Status Rujukan'];
            default: return [];
        }
    };

    const menus = getMenusByRole(user?.role);

    // Otomatis memilih menu pertama saat login
    useEffect(() => {
        if (menus.length > 0 && !menus.includes(activeMenu)) {
            setActiveMenu(menus[0]);
        }
    }, [user, menus, activeMenu]);

    // 2. PEMETAAN IKON MENU UNTUK STATUS PENGAJUAN
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
            case 'Status Pengajuan': return <History size={size} />; // <-- Ditambahkan di sini
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

    // 3. LABEL SINGKAT UNTUK NAVIGASI BAWAH
    const getShortLabel = (menu) => {
        if (menu === 'Dashboard') return 'Beranda';
        if (menu === 'Manajemen User') return 'User';
        if (menu === 'Master Data') return 'Data';
        if (menu === 'Semua Izin') return 'Semua Izin';
        if (menu === 'Audit Log') return 'Log';
        if (menu === 'Kelas Saya') return 'Kelas';
        if (menu === 'Ajukan Izin' || menu === 'Pengajuan Medis') return 'Ajukan';
        if (menu === 'Status Pengajuan') return 'Status'; // <-- Ditambahkan di sini
        if (menu === 'Persetujuan Izin') return 'Setujui';
        if (menu === 'Scan Pos Kesantrian' || menu === 'Scan Pos Gerbang') return 'Scan QR';
        if (menu === 'Monitoring Kesantrian') return 'Monitoring';
        if (menu === 'Riwayat Scan') return 'Riwayat';
        return menu;
    };

    // 4. LOGIKA PERPINDAHAN HALAMAN (RENDER CONTENT)
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
                case 'Status Pengajuan': return <StatusPengajuan />; // <-- Ditambahkan di sini
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
            }
        }
        if (user?.role === 'SECURITY') {
            switch (activeMenu) {
                case 'Scan Pos Gerbang': return <ScanQR menuContext="Scan Pos Gerbang" />;
                case 'Riwayat Scan': return <RiwayatScan />;
            }
        }
        if (user?.role === 'KLINIK') {
            switch (activeMenu) {
                case 'Dashboard': return <DashboardKlinik />;
                case 'Pengajuan Medis': return <PengajuanMedis />;
                case 'Status Rujukan': return <StatusPengajuanMedis />;
            }
        }

        // Jika tidak ada menu yang cocok, kembalikan ke Halaman Kosong
        return <HalamanKosong judul={activeMenu} />;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">

            {/* --- HEADER APLIKASI (NATIVE APP STYLE) --- */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-lg">
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

                {/* Tombol Logout */}
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

            {/* --- BOTTOM NAVIGATION BAR (SELALU MUNCUL) --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40 pb-safe">
                <div className="flex justify-around items-center h-16 max-w-3xl mx-auto px-1 sm:px-4">
                    {menus.map((menu) => {
                        const isActive = activeMenu === menu;
                        return (
                            <button
                                key={menu}
                                onClick={() => setActiveMenu(menu)}
                                className="relative flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-emerald-500 transition-colors px-1"
                            >
                                {/* Indikator Aktif Atas */}
                                {isActive && <div className="absolute top-0 w-8 sm:w-12 h-1 bg-emerald-500 rounded-b-full shadow-[0_2px_4px_rgba(16,185,129,0.4)]"></div>}

                                {/* Ikon Menu */}
                                <div className={`mt-1 transition-all duration-300 ${isActive ? 'text-emerald-600 transform -translate-y-1' : ''}`}>
                                    {getMenuIcon(menu, isActive)}
                                </div>

                                {/* Label Text */}
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

export default function App() {
    const [user, setUser] = useState(null);
    return (
        <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
            {!user ? <LoginPage /> : <MainLayout />}
        </AuthContext.Provider>
    );
}