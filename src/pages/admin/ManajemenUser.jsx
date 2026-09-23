import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, Shield, KeyRound, X, UploadCloud, Download, FileSpreadsheet, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';

const ManajemenUser = () => {
    // --- State Management (Filter & Pencarian) ---
    const [kataKunci, setKataKunci] = useState('');
    const [filterRole, setFilterRole] = useState('SEMUA');

    // --- State Database ---
    const [users, setUsers] = useState([]);
    const [dataKelas, setDataKelas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // --- State Form & Modals ---
    const [isModalBuka, setIsModalBuka] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mode Edit vs Tambah
    const [isEditMode, setIsEditMode] = useState(false);
    const [editUserId, setEditUserId] = useState(null);

    const [formUser, setFormUser] = useState({
        nama: '', username: '', password: '', role: '', kelas_id: ''
    });

    // --- State Import Excel ---
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);
    const [fileExcel, setFileExcel] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // ==========================================
    // STATE SORTING & PAGINATION
    // ==========================================
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });

    // --- Mengambil Data ---
    useEffect(() => {
        fetchUsers();
        fetchKelas();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`id, nama_lengkap, username, role, is_active, created_at, kelas ( id, nama_kelas )`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedData = data.map(u => ({
                id: u.id,
                nama: u.nama_lengkap,
                username: u.username || u.nama_lengkap.toLowerCase().replace(/\s+/g, '').substring(0, 10),
                role: u.role,
                kelas: u.kelas && u.kelas.length > 0 ? u.kelas[0].nama_kelas : null,
                kelas_id: u.kelas && u.kelas.length > 0 ? u.kelas[0].id : '',
                status: u.is_active ? 'AKTIF' : 'NONAKTIF'
            }));

            setUsers(formattedData);
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
            setErrorMsg("Gagal memuat data pengguna dari server.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchKelas = async () => {
        try {
            const { data } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
            if (data) setDataKelas(data);
        } catch (error) { console.error(error); }
    };

    // ==========================================
    // FUNGSI CRUD (SIMPAN BARU ATAU UPDATE DATA)
    // ==========================================
    const bukaModalTambah = () => {
        setIsEditMode(false);
        setEditUserId(null);
        setFormUser({ nama: '', username: '', password: '', role: '', kelas_id: '' });
        setIsModalBuka(true);
    };

    const bukaModalEdit = (user) => {
        setIsEditMode(true);
        setEditUserId(user.id);
        setFormUser({
            nama: user.nama,
            username: user.username,
            password: '',
            role: user.role,
            kelas_id: user.kelas_id || ''
        });
        setIsModalBuka(true);
    };

    const handleSimpanUser = async () => {
        if (!formUser.nama.trim() || !formUser.role || !formUser.username.trim()) {
            return alert("Nama Lengkap, Username, dan Role wajib diisi!");
        }
        if (!isEditMode && !formUser.password) {
            return alert("Password wajib diisi untuk pengguna baru!");
        }
        if (formUser.role === 'WALIKELAS' && !formUser.kelas_id) {
            return alert("Silakan pilih penugasan kelas untuk Walikelas!");
        }

        setIsSubmitting(true);
        try {
            if (isEditMode) {
                // UPDATE DATA
                const { error: errUpdate } = await supabase
                    .from('users')
                    .update({
                        nama_lengkap: formUser.nama.trim(),
                        role: formUser.role
                    })
                    .eq('id', editUserId);

                if (errUpdate) throw errUpdate;

                // Reset kelas lama lalu pasang ke kelas baru jika Walikelas
                await supabase.from('kelas').update({ wali_kelas_id: null }).eq('wali_kelas_id', editUserId);
                if (formUser.role === 'WALIKELAS' && formUser.kelas_id) {
                    await supabase.from('kelas').update({ wali_kelas_id: editUserId }).eq('id', formUser.kelas_id);
                }

                alert("Data akun berhasil diperbarui!");
            } else {
                // CREATE DATA (Auth + Tabel Users)
                const emailSistem = `${formUser.username}@pondok.local`;
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: emailSistem,
                    password: formUser.password,
                });

                if (authError) throw authError;
                const idAuthResmi = authData.user?.id;

                if (idAuthResmi) {
                    const { error: errInsert } = await supabase.from('users').insert([{
                        id: idAuthResmi,
                        nama_lengkap: formUser.nama.trim(),
                        username: formUser.username.trim(),
                        role: formUser.role,
                        is_active: true
                    }]);

                    if (errInsert) throw errInsert;

                    if (formUser.role === 'WALIKELAS' && formUser.kelas_id) {
                        await supabase.from('kelas').update({ wali_kelas_id: idAuthResmi }).eq('id', formUser.kelas_id);
                    }
                    alert("Akun berhasil ditambahkan!");
                }
            }

            setIsModalBuka(false);
            setFormUser({ nama: '', username: '', password: '', role: '', kelas_id: '' });
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(`Gagal menyimpan akun: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHapusUser = async (id, nama, role) => {
        if (role === 'ADMIN') return alert("Super Admin tidak boleh dihapus!");
        const isConfirm = window.confirm(`Apakah Anda yakin ingin menghapus akun "${nama}" secara permanen?`);

        if (isConfirm) {
            try {
                // Menghapus dari profil publik (Supabase Auth API via client dibatasi)
                const { error } = await supabase.from('users').delete().eq('id', id);
                if (error) throw error;

                alert("Akun berhasil dihapus dari daftar.");
                fetchUsers();
            } catch (error) {
                alert("Gagal menghapus akun pengguna.");
            }
        }
    };

    // ==========================================
    // FUNGSI IMPORT EXCEL (Fuzzy Match & Auto UUID)
    // ==========================================
    const unduhTemplateExcel = () => {
        const templateData = [{
            "Nama Lengkap": "Ustadz Zulfikar",
            "Username": "zulfikar9a",
            "Password Sementara": "123456",
            "Role": "WALIKELAS",
            "Penugasan Kelas (Khusus Walikelas)": "9A"
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data User");
        XLSX.writeFile(workbook, "Template_Import_User.xlsx");
    };

    const handleProsesImport = async () => {
        if (!fileExcel) return alert("Silakan pilih file Excel terlebih dahulu!");

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) throw new Error("File Excel kosong!");

                let berhasil = 0;
                let barisGagal = 0;
                let pesanErrorAuth = new Set();

                for (const row of jsonData) {
                    const keys = Object.keys(row);
                    const keyNama = keys.find(k => String(k).toLowerCase().includes('nama'));
                    const keyRole = keys.find(k => {
                        const txt = String(k).toLowerCase();
                        return txt.includes('role') || txt.includes('akses') || txt.includes('jabatan') || txt.includes('tugas') || txt.includes('bagian') || txt.includes('posisi');
                    });
                    const keyUsername = keys.find(k => String(k).toLowerCase().includes('user'));
                    const keyPassword = keys.find(k => String(k).toLowerCase().includes('pass'));
                    const keyKelas = keys.find(k => {
                        const txt = String(k).toLowerCase();
                        return txt.includes('kelas') || txt.includes('penugasan');
                    });

                    const namaLengkap = keyNama ? row[keyNama] : '';
                    const usernameMentah = keyUsername ? String(row[keyUsername]).replace(/\s+/g, '') : (namaLengkap ? namaLengkap.toLowerCase().replace(/\s+/g, '').substring(0, 10) : '');
                    const passwordMentah = keyPassword ? String(row[keyPassword]) : '123456';
                    let roleMentah = keyRole ? String(row[keyRole]).toUpperCase().trim() : '';

                    let finalRole = '';
                    if (roleMentah.includes('WALI') || roleMentah.includes('WK')) finalRole = 'WALIKELAS';
                    else if (roleMentah.includes('SEKRETARIS') || roleMentah.includes('MUDIR')) finalRole = 'SEKRETARIS_MUDIR';
                    else if (roleMentah.includes('KLINIK') || roleMentah.includes('KESEHATAN') || roleMentah.includes('UKS') || roleMentah.includes('MEDIS')) finalRole = 'KLINIK';
                    else if (roleMentah.includes('SANTRI') || roleMentah.includes('PENGASUHAN') || roleMentah.includes('ASRAMA')) finalRole = 'KESANTRIAN';
                    else if (roleMentah.includes('SECURITY') || roleMentah.includes('SATPAM') || roleMentah.includes('GERBANG') || roleMentah.includes('KEAMANAN')) finalRole = 'SECURITY';
                    else if (roleMentah.includes('ADMIN')) finalRole = 'ADMIN';

                    if (namaLengkap && finalRole && usernameMentah) {
                        const emailSistem = `${usernameMentah}@pondok.local`;
                        const { data: authData, error: authError } = await supabase.auth.signUp({
                            email: emailSistem, password: passwordMentah,
                        });

                        if (authError) {
                            pesanErrorAuth.add(authError.message);
                            barisGagal++;
                            continue;
                        }

                        const idAuthResmi = authData.user?.id;

                        if (idAuthResmi) {
                            const { error: errInsert } = await supabase
                                .from('users')
                                .insert([{
                                    id: idAuthResmi,
                                    nama_lengkap: namaLengkap,
                                    username: usernameMentah,
                                    role: finalRole,
                                    is_active: true
                                }]);

                            if (!errInsert) {
                                berhasil++;
                                if (finalRole === 'WALIKELAS' && keyKelas) {
                                    const kelasMentah = row[keyKelas];
                                    if (kelasMentah) {
                                        const namaKelasExcel = String(kelasMentah).toUpperCase().replace('KELAS', '').replace(/\s+/g, '');
                                        const kelasMatch = dataKelas.find(k => String(k.nama_kelas).toUpperCase().replace(/\s+/g, '') === namaKelasExcel);
                                        if (kelasMatch) {
                                            await supabase.from('kelas').update({ wali_kelas_id: idAuthResmi }).eq('id', kelasMatch.id);
                                        }
                                    }
                                }
                            } else { barisGagal++; }
                        } else { barisGagal++; }
                    } else { barisGagal++; }
                }

                let pesanHasil = `Selesai! Berhasil mendaftarkan ${berhasil} akun secara penuh.`;
                if (barisGagal > 0) pesanHasil += `\n\nAda ${barisGagal} baris yang gagal diproses.`;
                if (pesanErrorAuth.size > 0) pesanHasil += `\n\nAlasan Penolakan dari Supabase Auth:\n- ${Array.from(pesanErrorAuth).join('\n- ')}`;

                alert(pesanHasil);
                setIsModalImportBuka(false);
                setFileExcel(null);
                fetchUsers();
            } catch (err) {
                console.error("Error import:", err);
                alert("Gagal memproses file Excel.");
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsArrayBuffer(fileExcel);
    };

    // ==========================================
    // LOGIKA SORTING CERDAS
    // ==========================================
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
    };

    const sortData = (data, config) => {
        return [...data].sort((a, b) => {
            if (config.key === 'role') {
                if (a.role !== b.role) return config.direction === 'asc' ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                const splitA = String(a.kelas || '').split('-');
                const splitB = String(b.kelas || '').split('-');
                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();
                let comparison = 0;
                if (gradeA !== gradeB) comparison = (typeof gradeA === 'number' && typeof gradeB === 'number') ? gradeA - gradeB : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                else comparison = (splitA[1]?.trim() || String(a.kelas || '')).localeCompare((splitB[1]?.trim() || String(b.kelas || '')));
                return config.direction === 'asc' ? comparison : -comparison;
            }
            const valA = a[config.key] || '';
            const valB = b[config.key] || '';
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    useEffect(() => { setCurrentPage(1); }, [kataKunci, filterRole]);

    // --- Alur Data (Filter -> Sort -> Paginate) ---
    const filteredUsers = users.filter(u => {
        const matchKata = u.nama.toLowerCase().includes(kataKunci.toLowerCase()) || u.username.toLowerCase().includes(kataKunci.toLowerCase());
        const matchRole = filterRole === 'SEMUA' || u.role === filterRole;
        return matchKata && matchRole;
    });

    const sortedUsers = sortData(filteredUsers, sortConfig);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const currentUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getRoleBadge = (role) => {
        const config = {
            'ADMIN': 'bg-gray-800 text-white', 'WALIKELAS': 'bg-blue-100 text-blue-700 border-blue-200', 'SEKRETARIS_MUDIR': 'bg-purple-100 text-purple-700 border-purple-200',
            'KESANTRIAN': 'bg-amber-100 text-amber-700 border-amber-200', 'SECURITY': 'bg-slate-100 text-slate-700 border-slate-200', 'KLINIK': 'bg-red-100 text-red-700 border-red-200',
        };
        return config[role] || 'bg-gray-100 text-gray-700';
    };

    // ==========================================
    // KOMPONEN PAGINATION REUSABLE
    // ==========================================
    const PaginationControls = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
        const [inputPage, setInputPage] = useState(currentPage);
        useEffect(() => { setInputPage(currentPage); }, [currentPage]);
        const handlePageSubmit = (e) => {
            if (e.key === 'Enter' || e.type === 'blur') {
                let newPage = parseInt(inputPage, 10);
                if (isNaN(newPage) || newPage < 1) newPage = 1;
                if (newPage > totalPages) newPage = totalPages;
                onPageChange(newPage);
                setInputPage(newPage);
            }
        };
        if (totalItems === 0) return null;
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        return (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium w-full md:w-auto justify-between md:justify-start">
                    <div>Menampilkan <span className="font-bold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> data</div>
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                        <span className="hidden sm:inline">Per halaman:</span>
                        <select value={itemsPerPage} onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold shadow-sm">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronLeft size={16} /></button>
                    <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                        <span className="hidden sm:inline">Halaman</span>
                        <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} title="Ketik lalu Enter" />
                        <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                    </div>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-emerald-600" /> Manajemen User</h2>
                        <p className="text-gray-500 text-sm mt-1">Kelola akun staf, guru, dan hak akses sistem.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchUsers} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hidden md:flex">
                            Segarkan Data
                        </button>
                        <button onClick={() => setIsModalImportBuka(true)} className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                            <FileSpreadsheet size={18} /> Import Excel
                        </button>
                        <button onClick={bukaModalTambah} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Plus size={18} /> Tambah Manual
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input type="text" placeholder="Cari nama atau username..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 md:w-64">
                        <option value="SEMUA">Semua Hak Akses</option>
                        <option value="ADMIN">Super Admin</option>
                        <option value="WALIKELAS">Walikelas</option>
                        <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                        <option value="KLINIK">Klinik Pusat</option>
                        <option value="KESANTRIAN">Kesantrian</option>
                        <option value="SECURITY">Security</option>
                    </select>
                </div>

                <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('nama')}>
                                        <div className="flex items-center gap-2">Informasi Pengguna {getSortIcon('nama')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('role')}>
                                        <div className="flex items-center gap-2">Username & Role {getSortIcon('role')}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('status')}>
                                        <div className="flex items-center justify-center gap-2">Status {getSortIcon('status')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                                ) : errorMsg ? (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                                ) : currentUsers.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Tidak ada pengguna yang ditemukan.</td></tr>
                                ) : currentUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 text-base">{user.nama}</div>
                                            {user.kelas && (<div className="text-xs text-emerald-600 font-bold mt-0.5">Penanggung Jawab Kelas {user.kelas}</div>)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-gray-600 mb-1.5 flex items-center gap-1.5"><Shield size={12} className="text-gray-400" /> {user.username}</div>
                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border ${getRoleBadge(user.role)}`}>{user.role.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${user.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            <span className="text-xs font-bold text-gray-700">{user.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => bukaModalEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Akun"><Edit size={16} /></button>
                                                {user.role !== 'ADMIN' && (
                                                    <button onClick={() => handleHapusUser(user.id, user.nama, user.role)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Akun"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={sortedUsers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM TAMBAH & EDIT USER --- */}
            {isModalBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {isEditMode ? 'Edit Data Pengguna' : 'Tambah Akun Baru'}
                            </h3>
                            <button onClick={() => setIsModalBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap / Instansi <span className="text-red-500">*</span></label>
                                <input type="text" value={formUser.nama} onChange={(e) => setFormUser({ ...formUser, nama: e.target.value })} placeholder="Contoh: Ustadz Budi / Pos Gerbang 1" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formUser.username}
                                        onChange={(e) => setFormUser({ ...formUser, username: e.target.value.replace(/\s+/g, '') })}
                                        disabled={isEditMode}
                                        placeholder="Tanpa spasi..."
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                {!isEditMode ? (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                                        <input type="text" value={formUser.password} onChange={(e) => setFormUser({ ...formUser, password: e.target.value })} placeholder="Minimal 6 karakter" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                        <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-400 font-medium italic">
                                            (Gunakan fitur Reset Sandi)
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Hak Akses (Role) <span className="text-red-500">*</span></label>
                                <select value={formUser.role} onChange={(e) => setFormUser({ ...formUser, role: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium">
                                    <option value="" disabled>-- Pilih Hak Akses --</option>
                                    <option value="ADMIN">Super Admin</option>
                                    <option value="WALIKELAS">Walikelas</option>
                                    <option value="SEKRETARIS_MUDIR">Sekretaris Mudir</option>
                                    <option value="KLINIK">Klinik Pusat</option>
                                    <option value="KESANTRIAN">Kesantrian</option>
                                    <option value="SECURITY">Security</option>
                                </select>
                            </div>

                            {formUser.role === 'WALIKELAS' && (
                                <div className="animate-fade-in-down p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <label className="block text-sm font-bold text-blue-800 mb-1.5">Penugasan Kelas <span className="text-red-500">*</span></label>
                                    <select value={formUser.kelas_id} onChange={(e) => setFormUser({ ...formUser, kelas_id: e.target.value })} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                        <option value="" disabled>-- Pilih Kelas --</option>
                                        {dataKelas.map(k => <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanUser} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Update Data' : 'Simpan Akun')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FORM IMPORT EXCEL --- */}
            {isModalImportBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileSpreadsheet className="text-emerald-600" size={20} /> Import Data Akun</h3>
                            <button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 1: Unduh Format Standar</h4>
                                <button onClick={unduhTemplateExcel} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition-colors"><Download size={18} /> Download Template Excel (.xlsx)</button>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 2: Unggah File Excel</h4>
                                <input className="hidden" id="file-upload-user" type="file" accept=".xlsx, .xls" onChange={(e) => setFileExcel(e.target.files[0])} />
                                <label htmlFor="file-upload-user" className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={28} className={fileExcel ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"} /></div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">{fileExcel ? fileExcel.name : 'Klik atau Seret file ke sini'}</p>
                                    {!fileExcel && <p className="text-xs text-gray-500">Mendukung format .xlsx atau .csv</p>}
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleProsesImport} disabled={!fileExcel || isImporting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {isImporting ? 'Memproses...' : 'Mulai Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManajemenUser;