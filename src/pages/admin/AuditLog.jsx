import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ShieldCheck, UserPlus, KeyRound, CheckSquare, XSquare, Scan, Database, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const AuditLog = () => {
    const [kataKunci, setKataKunci] = useState('');
    const [filterModul, setFilterModul] = useState('SEMUA');
    const [filterRole, setFilterRole] = useState('SEMUA');

    // State Database
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Mengambil Data dari Supabase ---
    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            // Join ke tabel users untuk mengambil nama aktor dan role-nya
            const { data, error } = await supabase
                .from('audit_log')
                .select(`
                    id,
                    aksi,
                    tabel_terdampak,
                    keterangan,
                    created_at,
                    users ( nama_lengkap, role )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format data untuk disesuaikan dengan UI
            const formattedData = data.map(item => ({
                id: item.id.substring(0, 8).toUpperCase(), // Pakai UUID pendek sebagai ID Log UI
                waktu: formatWaktuLengkap(item.created_at),
                aktor: item.users ? item.users.nama_lengkap : 'Sistem / Anonim',
                role: item.users ? item.users.role : 'SISTEM',
                modul: item.tabel_terdampak ? item.tabel_terdampak.toUpperCase() : 'UMUM',
                aksi: item.aksi,
                deskripsi: item.keterangan
            }));

            setLogs(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data audit log:", error);
            setErrorMsg("Gagal memuat rekam jejak dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Helper Format Waktu ---
    const formatWaktuLengkap = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${tanggal}, ${jam}`;
    };

    // --- Helper Icon & Warna Berdasarkan Modul / Aksi ---
    const getAksiVisual = (aksi) => {
        const aksiUpper = aksi.toUpperCase();
        if (aksiUpper.includes('LOGIN')) return { icon: <KeyRound size={14} />, color: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (aksiUpper.includes('SETUJUI') || aksiUpper.includes('APPROVE')) return { icon: <CheckSquare size={14} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (aksiUpper.includes('TOLAK') || aksiUpper.includes('BATAL')) return { icon: <XSquare size={14} />, color: 'bg-red-50 text-red-700 border-red-200' };
        if (aksiUpper.includes('TAMBAH') || aksiUpper.includes('BUAT')) return { icon: <UserPlus size={14} />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
        if (aksiUpper.includes('SCAN')) return { icon: <Scan size={14} />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (aksiUpper.includes('IMPORT')) return { icon: <Database size={14} />, color: 'bg-gray-100 text-gray-700 border-gray-300' };
        return { icon: <ShieldCheck size={14} />, color: 'bg-gray-100 text-gray-700 border-gray-200' }; // Default
    };

    // Filter Logika
    const dataTampil = logs.filter(log => {
        const matchKata = log.aktor.toLowerCase().includes(kataKunci.toLowerCase()) || log.deskripsi.toLowerCase().includes(kataKunci.toLowerCase());

        // Cek secara longgar untuk modul karena nama tabel mungkin sedikit berbeda dengan opsi dropdown
        const matchModul = filterModul === 'SEMUA' || log.modul.includes(filterModul) || filterModul.includes(log.modul);
        const matchRole = filterRole === 'SEMUA' || log.role === filterRole;

        return matchKata && matchModul && matchRole;
    });

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-emerald-600" />
                        Audit Log Sistem
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Rekam jejak aktivitas pengguna untuk transparansi dan keamanan sistem.</p>
                </div>
                <button onClick={fetchLogs} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm hidden md:block">
                    Segarkan Data
                </button>
            </div>

            {/* --- FILTER TOOLBAR --- */}
            <div className="bg-white p-5 rounded-t-2xl border border-gray-200 border-b-0 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Cari nama aktor atau deskripsi aktivitas..."
                            value={kataKunci}
                            onChange={(e) => setKataKunci(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 md:w-auto w-full">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-1">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 w-full md:w-40"
                            >
                                <option value="SEMUA">Semua Aktor</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                                <option value="WALIKELAS">Walikelas</option>
                                <option value="KLINIK">Klinik Pusat</option>
                                <option value="SECURITY">Security</option>
                                <option value="KESANTRIAN">Kesantrian</option>
                            </select>
                        </div>

                        <select
                            value={filterModul}
                            onChange={(e) => setFilterModul(e.target.value)}
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 md:w-56"
                        >
                            <option value="SEMUA">Semua Modul Sistem</option>
                            <option value="SISTEM">Keamanan / Login</option>
                            <option value="PERIZINAN">Alur Perizinan</option>
                            <option value="USERS">Manajemen Pengguna</option>
                            <option value="SANTRI">Master Data Santri</option>
                            <option value="RIWAYAT_SCAN">Operasional (Gerbang)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABEL LOG --- */}
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 w-56">Catatan Waktu</th>
                                <th className="px-6 py-4 w-56">Pengguna & Hak Akses</th>
                                <th className="px-6 py-4 w-40 text-center">Modul / Tindakan</th>
                                <th className="px-6 py-4">Deskripsi Aktivitas</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[13px]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-gray-500 font-sans">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
                                        Memuat rekam jejak...
                                    </td>
                                </tr>
                            ) : errorMsg ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-red-500 font-sans font-bold">{errorMsg}</td></tr>
                            ) : dataTampil.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-sans">Tidak ada rekam jejak aktivitas yang ditemukan.</td></tr>
                            ) : dataTampil.map((log) => {
                                const visual = getAksiVisual(log.aksi);
                                return (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800 font-bold">{log.waktu.split(', ')[0]}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{log.waktu.split(', ')[1]} WIB</div>
                                        </td>
                                        <td className="px-6 py-4 font-sans">
                                            <div className="font-bold text-gray-900">{log.aktor}</div>
                                            <div className="text-[10px] font-black tracking-widest text-gray-400 mt-0.5">{log.role.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg font-sans font-bold text-[10px] uppercase tracking-wide ${visual.color}`}>
                                                {visual.icon}
                                                {log.aksi.replace(/_/g, ' ')}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1.5 tracking-wider font-bold">{log.modul.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 leading-relaxed font-sans text-sm">
                                            {log.deskripsi}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Catatan Kaki */}
            <div className="mt-4 flex items-start gap-2 px-2 text-xs text-gray-500">
                <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                <p>Data rekam jejak bersifat <i>read-only</i> (hanya baca). Sesuai kebijakan keamanan sistem, Super Admin sekalipun tidak dapat mengubah atau menghapus rekam jejak aktivitas ini.</p>
            </div>
        </div>
    );
};

export default AuditLog;