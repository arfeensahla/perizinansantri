import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Database, Users, GraduationCap, Search, Plus, Edit, Trash2, FileSpreadsheet, X, UploadCloud, Download, Phone, MapPin, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckSquare, History, FileText, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';

const MasterData = () => {
    const [tabAktif, setTabAktif] = useState('SANTRI');

    // --- State Search & Filter ---
    const [kataKunciSantri, setKataKunciSantri] = useState('');
    const [filterKelas, setFilterKelas] = useState('SEMUA');
    const [kataKunciKelas, setKataKunciKelas] = useState('');

    // --- State Database ---
    const [dataKelas, setDataKelas] = useState([]);
    const [dataSantri, setDataSantri] = useState([]);
    const [listWalikelas, setListWalikelas] = useState([]);
    const [isLoadingKelas, setIsLoadingKelas] = useState(true);
    const [isLoadingSantri, setIsLoadingSantri] = useState(true);

    // --- State Modals & Form ---
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Santri
    const [isModalSantriBuka, setIsModalSantriBuka] = useState(false);
    const [isEditSantriMode, setIsEditSantriMode] = useState(false);
    const [editSantriId, setEditSantriId] = useState(null);
    const [formSantri, setFormSantri] = useState({ nama: '', kelas_id: '', gender: 'Laki-laki', kota: '', namaWali: '', waWali: '' });

    // Modal Riwayat Perizinan Santri (Admin View)
    const [isModalRiwayatBuka, setIsModalRiwayatBuka] = useState(false);
    const [santriPilihan, setSantriPilihan] = useState(null);
    const [riwayatSantri, setRiwayatSantri] = useState([]);
    const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);

    // Form Kelas
    const [isModalKelasBuka, setIsModalKelasBuka] = useState(false);
    const [isEditKelasMode, setIsEditKelasMode] = useState(false);
    const [editKelasId, setEditKelasId] = useState(null);
    const [formKelas, setFormKelas] = useState({ nama: '', wali_kelas_id: '' });

    // STATE Penugasan Massal (Bulk Assign)
    const [isModalBulkBuka, setIsModalBulkBuka] = useState(false);
    const [bulkData, setBulkData] = useState([]);

    // Import Excel
    const [isModalImportBuka, setIsModalImportBuka] = useState(false);
    const [fileExcel, setFileExcel] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // --- State Sorting & Pagination ---
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPageSantri, setCurrentPageSantri] = useState(1);
    const [sortConfigSantri, setSortConfigSantri] = useState({ key: 'nama', direction: 'asc' });
    const [currentPageKelas, setCurrentPageKelas] = useState(1);
    const [sortConfigKelas, setSortConfigKelas] = useState({ key: 'nama', direction: 'asc' });

    // --- Fetch Data ---
    useEffect(() => {
        fetchDataKelas();
        fetchDataSantri();
        fetchListWalikelas();
    }, []);

    const fetchListWalikelas = async () => {
        try {
            const { data } = await supabase.from('users').select('id, nama_lengkap').eq('role', 'WALIKELAS').eq('is_active', true).order('nama_lengkap');
            if (data) setListWalikelas(data);
        } catch (error) { console.error(error); }
    };

    const fetchDataKelas = async () => {
        setIsLoadingKelas(true);
        try {
            const { data, error } = await supabase.from('kelas').select(`id, nama_kelas, wali_kelas_id, users!kelas_wali_kelas_id_fkey(nama_lengkap), santri(id)`);
            if (error) throw error;

            let formatted = data.map(k => ({
                id: k.id,
                nama: k.nama_kelas,
                wali_kelas_id: k.wali_kelas_id || '',
                wali: k.users ? k.users.nama_lengkap : '-',
                totalSantri: k.santri ? k.santri.length : 0
            }));

            // --- LOGIKA PENGURUTAN ROMAWI UNTUK DROPDOWN ---
            formatted.sort((a, b) => {
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                const splitA = String(a.nama || '').split('-');
                const splitB = String(b.nama || '').split('-');

                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                if (gradeA !== gradeB) {
                    return (typeof gradeA === 'number' && typeof gradeB === 'number')
                        ? gradeA - gradeB
                        : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                }
                return (splitA[1]?.trim() || a.nama).localeCompare((splitB[1]?.trim() || b.nama), undefined, { numeric: true });
            });

            setDataKelas(formatted);
        } catch (error) { console.error(error); } finally { setIsLoadingKelas(false); }
    };

    const fetchDataSantri = async () => {
        setIsLoadingSantri(true);
        try {
            // 1. Ambil seluruh data santri urut abjad
            const { data, error } = await supabase
                .from('santri')
                .select(`id, nama_lengkap, jenis_kelamin, kota_asal, nama_wali, nomor_wa_wali, kelas_id, kelas(nama_kelas)`)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;

            // 2. Ambil riwayat perizinan pada semester berjalan untuk menghitung rekam jejak
            const now = new Date();
            const tahunIni = now.getFullYear();
            // Semester Ganjil: Juli (6) s/d Desember (11) | Semester Genap: Januari (0) s/d Juni (5)
            const awalSemesterDate = now.getMonth() >= 6
                ? new Date(tahunIni, 6, 1)
                : new Date(tahunIni, 0, 1);

            const { data: izinSemesterData, error: izinErr } = await supabase
                .from('perizinan')
                .select('id, santri_id, status, created_at, parent_izin_id, batas_waktu, waktu_kembali_aktual, waktu_scan_security_kembali')
                .gte('created_at', awalSemesterDate.toISOString())
                .in('status', ['DISETUJUI', 'DI_LUAR', 'TERLAMBAT', 'SELESAI']);

            const listIzin = (!izinErr && izinSemesterData) ? izinSemesterData : [];
            const nowMs = now.getTime();

            // Kelompokkan statistik per santri_id agar pemrosesan cepat
            const statsMap = {};
            listIzin.forEach(h => {
                if (!statsMap[h.santri_id]) {
                    statsMap[h.santri_id] = { totalIzinSemester: 0, totalTerlambat: 0 };
                }

                // Hanya hitung izin utama (bukan perpanjangan)
                if (h.parent_izin_id === null) {
                    statsMap[h.santri_id].totalIzinSemester += 1;
                }

                // Cek keterlambatan
                let isLate = false;
                if (h.status === 'TERLAMBAT') {
                    isLate = true;
                } else if (h.batas_waktu) {
                    const batasMs = new Date(h.batas_waktu).getTime();
                    const kembaliAktualMs = h.waktu_kembali_aktual ? new Date(h.waktu_kembali_aktual).getTime() : 0;
                    const scanGerbangMs = h.waktu_scan_security_kembali ? new Date(h.waktu_scan_security_kembali).getTime() : 0;

                    if (kembaliAktualMs > batasMs || scanGerbangMs > batasMs) isLate = true;
                    else if (['DI_LUAR', 'DISETUJUI'].includes(h.status) && batasMs < nowMs) isLate = true;
                }

                if (isLate) {
                    statsMap[h.santri_id].totalTerlambat += 1;
                }
            });

            setDataSantri(data.map(s => {
                const track = statsMap[s.id] || { totalIzinSemester: 0, totalTerlambat: 0 };
                return {
                    id: s.id,
                    nama: s.nama_lengkap,
                    gender: s.jenis_kelamin,
                    kotaAsal: s.kota_asal,
                    kelas: s.kelas ? s.kelas.nama_kelas : '-',
                    kelas_id: s.kelas_id || '',
                    waliSiswa: s.nama_wali,
                    nomorWhatsApp: s.nomor_wa_wali,
                    totalIzinSemester: track.totalIzinSemester,
                    totalTerlambat: track.totalTerlambat
                };
            }));
        } catch (error) { console.error(error); } finally { setIsLoadingSantri(false); }
    };

    // --- FUNGSI TARIK RIWAYAT PERIZINAN PER SANTRI (UNTUK MODAL ADMIN) ---
    const bukaModalRiwayat = async (santri) => {
        setSantriPilihan(santri);
        setIsModalRiwayatBuka(true);
        setIsLoadingRiwayat(true);

        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id,
                    kode_izin,
                    jenis_izin,
                    alasan,
                    batas_waktu,
                    waktu_kembali_aktual,
                    status,
                    created_at,
                    catatan_persetujuan,
                    catatan_penolakan,
                    users!perizinan_disetujui_oleh_fkey ( nama_lengkap )
                `)
                .eq('santri_id', santri.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const waktuSekarangMs = new Date().getTime();

            const formattedRiwayat = (data || []).map(item => {
                let computedStatus = item.status;
                const batasWaktuMs = item.batas_waktu ? new Date(item.batas_waktu).getTime() : 0;
                if (['DI_LUAR', 'DISETUJUI'].includes(item.status) && batasWaktuMs > 0 && batasWaktuMs < waktuSekarangMs) {
                    computedStatus = 'TERLAMBAT';
                }

                return {
                    id: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                    tanggalAjuan: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    jenis: item.jenis_izin,
                    alasan: item.alasan,
                    catatan_persetujuan: item.catatan_persetujuan,
                    catatan_penolakan: item.catatan_penolakan,
                    batasTenggat: item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
                    waktuKembali: item.waktu_kembali_aktual ? new Date(item.waktu_kembali_aktual).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum Kembali',
                    status: computedStatus,
                    disetujuiOleh: item.users ? item.users.nama_lengkap : 'Sistem'
                };
            });

            setRiwayatSantri(formattedRiwayat);
        } catch (error) {
            console.error("Gagal memuat riwayat izin santri:", error);
            setRiwayatSantri([]);
        } finally {
            setIsLoadingRiwayat(false);
        }
    };

    const getStatusBadgeIzin = (status) => {
        switch (status) {
            case 'MENUNGGU_PERSETUJUAN': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">MENUNGGU</span>;
            case 'DISETUJUI': return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">DISETUJUI</span>;
            case 'DI_LUAR': return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">DI LUAR</span>;
            case 'TERLAMBAT': return <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold">TERLAMBAT</span>;
            case 'SELESAI': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">SELESAI</span>;
            case 'DITOLAK': return <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold">DITOLAK</span>;
            case 'DIBATALKAN': return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 rounded text-[10px] font-bold">DIBATALKAN</span>;
            default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-bold">{status}</span>;
        }
    };

    // ==========================================
    // FUNGSI PENUGASAN MASSAL (BULK ASSIGN)
    // ==========================================
    const bukaModalBulk = () => {
        const sorted = sortData([...dataKelas], { key: 'nama', direction: 'asc' });
        setBulkData(sorted.map(k => ({ id: k.id, nama: k.nama, wali_kelas_id: k.wali_kelas_id })));
        setIsModalBulkBuka(true);
    };

    const handleBulkChange = (kelasId, newWaliId) => {
        setBulkData(prev => prev.map(k => k.id === kelasId ? { ...k, wali_kelas_id: newWaliId } : k));
    };

    const handleSimpanBulk = async () => {
        setIsSubmitting(true);
        try {
            const promises = bulkData.map(k =>
                supabase.from('kelas').update({ wali_kelas_id: k.wali_kelas_id || null }).eq('id', k.id)
            );
            await Promise.all(promises);

            alert("Penugasan massal berhasil disimpan!");
            setIsModalBulkBuka(false);
            fetchDataKelas();
        } catch (error) {
            alert("Gagal menyimpan penugasan massal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // FUNGSI CRUD KELAS (SATUAN)
    // ==========================================
    const bukaModalTambahKelas = () => {
        setIsEditKelasMode(false);
        setEditKelasId(null);
        setFormKelas({ nama: '', wali_kelas_id: '' });
        setIsModalKelasBuka(true);
    };

    const bukaModalEditKelas = (kelas) => {
        setIsEditKelasMode(true);
        setEditKelasId(kelas.id);
        setFormKelas({ nama: kelas.nama, wali_kelas_id: kelas.wali_kelas_id || '' });
        setIsModalKelasBuka(true);
    };

    const handleSimpanKelas = async () => {
        if (!formKelas.nama.trim()) return alert("Nama kelas tidak boleh kosong!");
        setIsSubmitting(true);
        try {
            const payload = {
                nama_kelas: formKelas.nama.trim().toUpperCase(),
                wali_kelas_id: formKelas.wali_kelas_id || null
            };

            if (isEditKelasMode) {
                const { error } = await supabase.from('kelas').update(payload).eq('id', editKelasId);
                if (error) throw error;
                alert("Data Kelas dan Penugasan Walikelas berhasil diperbarui!");
            } else {
                const { error } = await supabase.from('kelas').insert([payload]);
                if (error) throw error;
                alert("Kelas baru berhasil ditambahkan!");
            }
            setIsModalKelasBuka(false);
            fetchDataKelas();
        } catch (error) {
            alert("Gagal menyimpan data kelas. Nama kelas mungkin sudah ada.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHapusKelas = async (id, nama, total) => {
        if (total > 0) return alert(`Tidak bisa menghapus kelas ${nama} karena masih memiliki ${total} santri aktif. Harap pindahkan santrinya terlebih dahulu.`);
        if (window.confirm(`Yakin ingin menghapus Kelas ${nama}?`)) {
            try {
                const { error } = await supabase.from('kelas').delete().eq('id', id);
                if (error) throw error;
                fetchDataKelas();
            } catch (err) { alert("Gagal menghapus kelas."); }
        }
    };

    // ==========================================
    // FUNGSI CRUD SANTRI
    // ==========================================
    const bukaModalTambahSantri = () => {
        setIsEditSantriMode(false);
        setEditSantriId(null);
        setFormSantri({ nama: '', kelas_id: '', gender: 'Laki-laki', kota: '', namaWali: '', waWali: '' });
        setIsModalSantriBuka(true);
    };

    const bukaModalEditSantri = (santri) => {
        setIsEditSantriMode(true);
        setEditSantriId(santri.id);
        setFormSantri({
            nama: santri.nama, kelas_id: santri.kelas_id, gender: santri.gender,
            kota: santri.kotaAsal, namaWali: santri.waliSiswa, waWali: santri.nomorWhatsApp
        });
        setIsModalSantriBuka(true);
    };

    const handleSimpanSantri = async () => {
        if (!formSantri.nama.trim() || !formSantri.kelas_id || !formSantri.waWali.trim()) return alert("Nama, Kelas, dan Nomor WA wajib diisi!");
        setIsSubmitting(true);
        try {
            const payload = {
                nama_lengkap: formSantri.nama.trim(), kelas_id: formSantri.kelas_id, jenis_kelamin: formSantri.gender,
                kota_asal: formSantri.kota.trim(), nama_wali: formSantri.namaWali.trim(), nomor_wa_wali: formSantri.waWali.trim(), status_asrama: 'DI_PONDOK'
            };

            if (isEditSantriMode) {
                const { error } = await supabase.from('santri').update(payload).eq('id', editSantriId);
                if (error) throw error;
                alert("Data Santri berhasil diperbarui!");
            } else {
                const { error } = await supabase.from('santri').insert([payload]);
                if (error) throw error;
                alert("Santri baru berhasil ditambahkan!");
            }
            setIsModalSantriBuka(false);
            fetchDataSantri();
            fetchDataKelas();
        } catch (error) { alert("Gagal menyimpan data santri."); } finally { setIsSubmitting(false); }
    };

    const handleHapusSantri = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus data Santri "${nama}" secara permanen?`)) {
            try {
                const { error } = await supabase.from('santri').delete().eq('id', id);
                if (error) throw error;
                fetchDataSantri();
                fetchDataKelas();
            } catch (err) { alert("Gagal menghapus data santri."); }
        }
    };

    // ==========================================
    // FUNGSI IMPORT EXCEL SANTRI
    // ==========================================
    const unduhTemplateExcel = () => {
        const templateData = [{ "Nama": "Ahmad Muzakki", "Jenis Kelamin": "Laki-laki", "Asal Kota": "Cirebon", "Kelas": "7A", "Nama Wali": "Bapak Ridwan", "Nomor WhatsApp": "081234567890" }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
        XLSX.writeFile(workbook, "Template_Import_Santri.xlsx");
    };

    const handleProsesImport = async () => {
        if (!fileExcel) return alert("Pilih file Excel!");
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
                if (jsonData.length === 0) throw new Error("File kosong");

                const dataToInsert = [];
                let barisGagal = 0;

                jsonData.forEach((row) => {
                    const cleanRow = {};
                    for (const key in row) cleanRow[String(key).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()] = row[key];

                    const nama = cleanRow['NAMA'] || cleanRow['NAMASANTRI'] || cleanRow['NAMALENGKAP'];
                    const kelasExcel = String(cleanRow['KELAS'] || '').toUpperCase().replace('KELAS', '').replace(/\s+/g, '');
                    const kelasMatch = dataKelas.find(k => String(k.nama).toUpperCase().replace(/\s+/g, '') === kelasExcel);

                    if (nama && kelasMatch) {
                        dataToInsert.push({
                            nama_lengkap: nama, kelas_id: kelasMatch.id, jenis_kelamin: String(cleanRow['JENISKELAMIN'] || '').toUpperCase().includes('P') ? 'Perempuan' : 'Laki-laki',
                            kota_asal: cleanRow['ASALKOTA'] || cleanRow['KOTA'] || '-', nama_wali: cleanRow['NAMAWALI'] || cleanRow['ORANGTUA'] || '-', nomor_wa_wali: String(cleanRow['NOMORWHATSAPP'] || cleanRow['NOWA'] || '-'), status_asrama: 'DI_PONDOK'
                        });
                    } else { barisGagal++; }
                });

                if (dataToInsert.length > 0) {
                    const { error } = await supabase.from('santri').insert(dataToInsert);
                    if (error) throw error;
                    alert(`Berhasil mengimpor ${dataToInsert.length} santri! ${barisGagal > 0 ? `(${barisGagal} dilewati)` : ''}`);
                    setIsModalImportBuka(false); setFileExcel(null); fetchDataSantri(); fetchDataKelas();
                } else alert("Tidak ada data valid. Pastikan penulisan Kelas sesuai dengan Master Data.");
            } catch (err) { alert("Gagal memproses Excel."); } finally { setIsImporting(false); }
        };
        reader.readAsArrayBuffer(fileExcel);
    };

    // ==========================================
    // LOGIKA SORTING CERDAS (DIPERKUAT)
    // ==========================================
    const handleSort = (key, config, setConfig) => {
        let direction = 'asc';
        if (config.key === key && config.direction === 'asc') direction = 'desc';
        setConfig({ key, direction });
    };

    const getSortIcon = (config, key) => {
        if (config.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={16} /></div>;
        return config.direction === 'asc' ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />;
    };

    const sortData = (data, config) => {
        return [...data].sort((a, b) => {
            // Pengurutan khusus untuk kolom Rekam Jejak Semester
            if (config.key === 'totalIzinSemester') {
                const diffIzin = (a.totalIzinSemester || 0) - (b.totalIzinSemester || 0);
                if (diffIzin !== 0) return config.direction === 'asc' ? diffIzin : -diffIzin;

                const diffLate = (a.totalTerlambat || 0) - (b.totalTerlambat || 0);
                if (diffLate !== 0) return config.direction === 'asc' ? diffLate : -diffLate;

                return String(a.nama || '').trim().localeCompare(String(b.nama || '').trim(), 'id', { sensitivity: 'base' });
            }

            // Deteksi jika yang disortir adalah kolom kelas (di tabel santri) ATAU nama kelas (di tabel kelas)
            const isKolomKelas = config.key === 'kelas' || (config.key === 'nama' && a.totalSantri !== undefined);

            if (isKolomKelas) {
                const romanToNum = { 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };

                const strA = String(a[config.key] || '');
                const strB = String(b[config.key] || '');

                const splitA = strA.split('-');
                const splitB = strB.split('-');

                const gradeA = romanToNum[splitA[0]?.trim()] || parseInt(splitA[0]) || splitA[0]?.trim();
                const gradeB = romanToNum[splitB[0]?.trim()] || parseInt(splitB[0]) || splitB[0]?.trim();

                let comparison = 0;
                if (gradeA !== gradeB) {
                    comparison = (typeof gradeA === 'number' && typeof gradeB === 'number')
                        ? gradeA - gradeB
                        : String(gradeA).localeCompare(String(gradeB), undefined, { numeric: true });
                } else {
                    comparison = (splitA[1]?.trim() || strA).localeCompare((splitB[1]?.trim() || strB), undefined, { numeric: true });
                }

                // Jika berada di kelas yang sama (comparison === 0), otomatis urutkan sesuai abjad Nama Santri (A-Z)
                if (comparison === 0 && a.nama && b.nama) {
                    return String(a.nama).trim().localeCompare(String(b.nama).trim(), 'id', { sensitivity: 'base' });
                }

                return config.direction === 'asc' ? comparison : -comparison;
            }

            // Fallback: Pengurutan teks standar yang tidak peka huruf besar/kecil (case-insensitive)
            const valA = String(a[config.key] || '').trim();
            const valB = String(b[config.key] || '').trim();

            const textComparison = valA.localeCompare(valB, 'id', { sensitivity: 'base', numeric: true });
            if (textComparison !== 0) {
                return config.direction === 'asc' ? textComparison : -textComparison;
            }

            // Jika nilai kolom sama, urutkan berdasarkan abjad Nama Santri (A-Z)
            return String(a.nama || '').trim().localeCompare(String(b.nama || '').trim(), 'id', { sensitivity: 'base' });
        });
    };

    useEffect(() => { setCurrentPageSantri(1); }, [kataKunciSantri, filterKelas]);
    useEffect(() => { setCurrentPageKelas(1); }, [kataKunciKelas]);

    // --- Filter & Paginate ---
    const filteredSantri = dataSantri.filter(s => (s.nama.toLowerCase().includes(kataKunciSantri.toLowerCase()) || s.kotaAsal.toLowerCase().includes(kataKunciSantri.toLowerCase())) && (filterKelas === 'SEMUA' || s.kelas === filterKelas));
    const sortedSantri = sortData(filteredSantri, sortConfigSantri);
    const totalPagesSantri = Math.ceil(sortedSantri.length / itemsPerPage);
    const currentSantri = sortedSantri.slice((currentPageSantri - 1) * itemsPerPage, currentPageSantri * itemsPerPage);

    const filteredKelas = dataKelas.filter(k => k.nama.toLowerCase().includes(kataKunciKelas.toLowerCase()) || k.wali.toLowerCase().includes(kataKunciKelas.toLowerCase()));
    const sortedKelas = sortData(filteredKelas, sortConfigKelas);
    const totalPagesKelas = Math.ceil(sortedKelas.length / itemsPerPage);
    const currentKelas = sortedKelas.slice((currentPageKelas - 1) * itemsPerPage, currentPageKelas * itemsPerPage);

    // ==========================================
    // KOMPONEN PAGINATION REUSABLE
    // ==========================================
    const PaginationControls = ({ currentPage, totalPages, totalItems, onPageChange }) => {
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
                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); onPageChange(1); }} className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold shadow-sm">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                    <div className="text-xs font-medium text-gray-600 px-2 flex items-center gap-2">
                        <span className="hidden sm:inline">Halaman</span>
                        <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} onBlur={handlePageSubmit} onKeyDown={handlePageSubmit} className="w-12 px-1 py-1.5 text-center border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={1} max={totalPages} title="Ketik lalu Enter" />
                        <span>dari <span className="font-bold text-gray-900">{totalPages}</span></span>
                    </div>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Database className="text-emerald-600" /> Master Data</h2>
                        <p className="text-gray-500 text-sm mt-1">Pusat pengelolaan data referensi kelas dan santri pondok pesantren.</p>
                    </div>
                    <button onClick={() => { tabAktif === 'SANTRI' ? fetchDataSantri() : fetchDataKelas() }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors shadow-sm hidden md:block">Segarkan Data</button>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
                    <button onClick={() => setTabAktif('SANTRI')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'SANTRI' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Users size={18} /> Data Santri</button>
                    <button onClick={() => setTabAktif('KELAS')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex justify-center items-center gap-2 transition-all ${tabAktif === 'KELAS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><GraduationCap size={18} /> Data Kelas</button>
                </div>

                {tabAktif === 'SANTRI' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                                <div className="relative flex-1 md:max-w-xs">
                                    <input type="text" placeholder="Cari Nama Santri / Kota..." value={kataKunciSantri} onChange={(e) => setKataKunciSantri(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                </div>
                                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700">
                                    <option value="SEMUA">Semua Kelas</option>
                                    {dataKelas.map(k => <option key={k.id} value={k.nama}>Kelas {k.nama}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setIsModalImportBuka(true)} className="flex-1 md:flex-none bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"><FileSpreadsheet size={18} /> Impor Data</button>
                                <button onClick={bukaModalTambahSantri} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"><Plus size={18} /> Tambah Santri</button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[950px]">
                                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nama', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Nama Santri {getSortIcon(sortConfigSantri, 'nama')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('kelas', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kelas & Gender {getSortIcon(sortConfigSantri, 'kelas')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalIzinSemester', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Rekam Jejak (Semester) {getSortIcon(sortConfigSantri, 'totalIzinSemester')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('kotaAsal', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kota Asal {getSortIcon(sortConfigSantri, 'kotaAsal')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('waliSiswa', sortConfigSantri, setSortConfigSantri)}>
                                                <div className="flex items-center gap-2">Kontak Wali {getSortIcon(sortConfigSantri, 'waliSiswa')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingSantri ? (
                                            <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                                        ) : currentSantri.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Data santri tidak ditemukan.</td></tr>
                                        ) : currentSantri.map((santri) => (
                                            <tr key={santri.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4"><div className="font-bold text-gray-900 text-base">{santri.nama}</div></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-black">Kelas {santri.kelas}</span>
                                                        <span className={`text-[11px] font-bold ${santri.gender === 'Laki-laki' ? 'text-blue-600' : 'text-pink-600'}`}>{santri.gender}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {santri.totalIzinSemester}x Izin <span className="text-[10px] text-slate-400 font-normal">(Semester Ini)</span>
                                                        </span>
                                                        <span className={`text-[10px] font-black w-max px-2 py-0.5 rounded ${santri.totalTerlambat > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {santri.totalTerlambat}x Terlambat
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><div className="font-medium text-gray-800 flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" />{santri.kotaAsal}</div></td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{santri.waliSiswa}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={12} /> {santri.nomorWhatsApp}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => bukaModalRiwayat(santri)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-lg transition-colors"
                                                            title="Lihat Riwayat Izin Santri"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => bukaModalEditSantri(santri)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Data Santri"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHapusSantri(santri.id, santri.nama)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus Santri"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationControls currentPage={currentPageSantri} totalPages={totalPagesSantri} totalItems={sortedSantri.length} onPageChange={setCurrentPageSantri} />
                            </div>
                        </div>
                    </div>
                )}

                {tabAktif === 'KELAS' && (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 md:max-w-sm w-full">
                                <input type="text" placeholder="Cari nama kelas..." value={kataKunciKelas} onChange={(e) => setKataKunciKelas(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                <button onClick={bukaModalBulk} className="flex-1 md:flex-none bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                                    <CheckSquare size={18} /> Penugasan Massal
                                </button>
                                <button onClick={bukaModalTambahKelas} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    <Plus size={18} /> Tambah Kelas
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b select-none">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nama', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Nama Kelas {getSortIcon(sortConfigKelas, 'nama')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalSantri', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Total Santri {getSortIcon(sortConfigKelas, 'totalSantri')}</div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('wali', sortConfigKelas, setSortConfigKelas)}>
                                                <div className="flex items-center gap-2">Walikelas (Penanggung Jawab) {getSortIcon(sortConfigKelas, 'wali')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingKelas ? (
                                            <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" /> Memuat data...</td></tr>
                                        ) : currentKelas.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Data kelas tidak ditemukan.</td></tr>
                                        ) : currentKelas.map((kelas) => (
                                            <tr key={kelas.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-black text-lg text-gray-800">Kelas {kelas.nama}</td>
                                                <td className="px-6 py-4"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold">{kelas.totalSantri} Santri</span></td>
                                                <td className="px-6 py-4 font-medium text-gray-700">{kelas.wali !== '-' ? kelas.wali : <span className="text-red-500 italic text-xs">Belum ditugaskan</span>}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => bukaModalEditKelas(kelas)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                        <button onClick={() => handleHapusKelas(kelas.id, kelas.nama, kelas.totalSantri)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationControls currentPage={currentPageKelas} totalPages={totalPagesKelas} totalItems={sortedKelas.length} onPageChange={setCurrentPageKelas} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* Modal Riwayat Izin Santri (Admin View) */}
            {isModalRiwayatBuka && santriPilihan && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsModalRiwayatBuka(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh] border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <div>
                                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                                    <FileText className="text-emerald-600" size={20} />
                                    Riwayat Izin: {santriPilihan.nama}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Kelas {santriPilihan.kelas} • Semester Ini: <b>{santriPilihan.totalIzinSemester}x Izin</b> ({santriPilihan.totalTerlambat}x Terlambat)
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalRiwayatBuka(false)}
                                className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/40 space-y-3">
                            {isLoadingRiwayat ? (
                                <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <span className="text-sm font-medium">Memuat riwayat izin santri...</span>
                                </div>
                            ) : riwayatSantri.length === 0 ? (
                                <div className="py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    Belum ada catatan riwayat perizinan untuk santri ini.
                                </div>
                            ) : (
                                riwayatSantri.map((izin, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-2.5 hover:border-emerald-300 transition-colors">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-gray-400">#{izin.id}</span>
                                                <span className="text-xs text-gray-500">{izin.tanggalAjuan}</span>
                                            </div>
                                            <div>{getStatusBadgeIzin(izin.status)}</div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-black text-emerald-700 uppercase tracking-wide">{izin.jenis.replace(/_/g, ' ')}</div>
                                            <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100/80 italic">"{izin.alasan}"</p>
                                        </div>

                                        {izin.catatan_persetujuan && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800">
                                                <span className="font-black text-[9px] uppercase tracking-wider block mb-0.5">Catatan Persetujuan:</span>
                                                <span className="italic">"{izin.catatan_persetujuan}"</span>
                                            </div>
                                        )}

                                        {izin.status === 'DITOLAK' && izin.catatan_penolakan && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700">
                                                <span className="font-black text-[9px] uppercase tracking-wider block mb-0.5">Catatan Penolakan:</span>
                                                <span className="italic">"{izin.catatan_penolakan}"</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-gray-600 font-medium bg-gray-50/50 p-2.5 rounded-xl">
                                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Batas Tenggat</span> {izin.batasTenggat}</div>
                                            <div><span className="text-gray-400 block text-[10px] uppercase font-bold">Waktu Kembali</span> {izin.waktuKembali}</div>
                                        </div>

                                        <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-50 flex justify-between items-center">
                                            <span>Persetujuan: <strong className="text-gray-600">{izin.disetujuiOleh}</strong></span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setIsModalRiwayatBuka(false)}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl transition-colors shadow-sm"
                            >
                                Tutup Jendela
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Penugasan Massal (Bulk) */}
            {isModalBulkBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalBulkBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Penugasan Walikelas Massal</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Atur walikelas untuk seluruh kelas dalam satu tampilan yang praktis.</p>
                            </div>
                            <button onClick={() => setIsModalBulkBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                            <div className="space-y-3">
                                {bulkData.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors shadow-sm">
                                        <div className="font-bold text-gray-800 w-1/3 text-lg">Kelas {item.nama}</div>
                                        <div className="w-2/3">
                                            <select
                                                value={item.wali_kelas_id || ''}
                                                onChange={(e) => handleBulkChange(item.id, e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium cursor-pointer"
                                            >
                                                <option value="">-- Kosong (Belum Ditugaskan) --</option>
                                                {listWalikelas.map(w => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalBulkBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanBulk} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? 'Menyimpan Semua...' : 'Simpan Seluruh Penugasan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Santri (Tambah & Edit) */}
            {isModalSantriBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalSantriBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">{isEditSantriMode ? 'Edit Data Santri' : 'Tambah Santri'}</h3>
                            <button onClick={() => setIsModalSantriBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap Santri <span className="text-red-500">*</span></label><input type="text" value={formSantri.nama} onChange={(e) => setFormSantri({ ...formSantri, nama: e.target.value })} placeholder="Nama sesuai ijazah" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Kelas <span className="text-red-500">*</span></label>
                                    <select value={formSantri.kelas_id} onChange={(e) => setFormSantri({ ...formSantri, kelas_id: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="" disabled>-- Pilih Kelas --</option>{dataKelas.map(k => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Jenis Kelamin</label>
                                    <select value={formSantri.gender} onChange={(e) => setFormSantri({ ...formSantri, gender: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                        <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Kota Asal</label><input type="text" value={formSantri.kota} onChange={(e) => setFormSantri({ ...formSantri, kota: e.target.value })} placeholder="Contoh: Cirebon" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Orang Tua / Wali</label><input type="text" value={formSantri.namaWali} onChange={(e) => setFormSantri({ ...formSantri, namaWali: e.target.value })} placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor WhatsApp Wali <span className="text-red-500">*</span></label><input type="text" value={formSantri.waWali} onChange={(e) => setFormSantri({ ...formSantri, waWali: e.target.value })} placeholder="Contoh: 081234567890" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalSantriBuka(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanSantri} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : (isEditSantriMode ? 'Update Data' : 'Simpan Data')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Kelas (Tambah & Edit) */}
            {isModalKelasBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalKelasBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">{isEditKelasMode ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</h3>
                            <button onClick={() => setIsModalKelasBuka(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama / Kode Kelas <span className="text-red-500">*</span></label>
                                <input type="text" value={formKelas.nama} onChange={(e) => setFormKelas({ ...formKelas, nama: e.target.value })} placeholder="Contoh: 10A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold uppercase" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Walikelas / Pembina (Opsional)</label>
                                <select value={formKelas.wali_kelas_id} onChange={(e) => setFormKelas({ ...formKelas, wali_kelas_id: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                                    <option value="">-- Belum Ditugaskan --</option>
                                    {listWalikelas.map(w => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-2">Daftar ini mengambil data pengguna yang memiliki hak akses (role) sebagai WALIKELAS.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalKelasBuka(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleSimpanKelas} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : (isEditKelasMode ? 'Update Kelas' : 'Simpan Kelas')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Import Excel */}
            {isModalImportBuka && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileSpreadsheet className="text-emerald-600" size={20} /> Impor Data Santri</h3>
                            <button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 1: Unduh Format Standar</h4>
                                <button onClick={unduhTemplateExcel} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition-colors"><Download size={18} /> Unduh Template Excel (.xlsx)</button>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Langkah 2: Unggah File Excel</h4>
                                <input className="hidden" id="file-upload" type="file" accept=".xlsx, .xls" onChange={(e) => setFileExcel(e.target.files[0])} />
                                <label htmlFor="file-upload" className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={28} className={fileExcel ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"} /></div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">{fileExcel ? fileExcel.name : 'Klik untuk memilih file'}</p>
                                    {!fileExcel && <p className="text-xs text-gray-500">Mendukung format .xlsx atau .xls</p>}
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => { setIsModalImportBuka(false); setFileExcel(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={handleProsesImport} disabled={!fileExcel || isImporting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {isImporting ? 'Memproses...' : 'Mulai Impor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MasterData;