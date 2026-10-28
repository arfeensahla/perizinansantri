import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, CheckSquare, XSquare, Clock, User, CalendarClock, Check, CheckCircle2, MapPin, Car, History, ArrowRight, Home, Loader2, AlertCircle, Phone, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Users, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

// --- Konfigurasi Tema ---
const THEME_CONFIG = {
    emerald: {
        bg50: 'bg-emerald-50',
        bg50_30: 'bg-emerald-50/30',
        bg50_50: 'bg-emerald-50/50',
        bg100: 'bg-emerald-100',
        text600: 'text-emerald-600',
        text700: 'text-emerald-700',
        border200: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-200',
        chartPrimary: '#10b981',
        chartSecondary: '#3b82f6'
    },
    purple: {
        bg50: 'bg-purple-50',
        bg50_30: 'bg-purple-50/30',
        bg50_50: 'bg-purple-50/50',
        bg100: 'bg-purple-100',
        text600: 'text-purple-600',
        text700: 'text-purple-700',
        border200: 'border-purple-200',
        hoverBorder: 'hover:border-purple-200',
        chartPrimary: '#a855f7',
        chartSecondary: '#f59e0b'
    }
};

// --- Komponen Custom Select ---
const CustomSelect = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[70px] border border-gray-200 rounded-lg bg-white text-gray-700 font-bold shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm h-[36px]"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[120px] right-0 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden animate-fade-in-down origin-top">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${value === option.value ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-gray-600 font-medium'}`}
                        >
                            {option.label}
                            {value === option.value && <Check size={14} className="text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Komponen Utama PersetujuanIzin ---
const PersetujuanIzin = () => {
    const { user } = useContext(AuthContext);

    // --- State Modals & Bulk ---
    const [isModalApproveBuka, setIsModalApproveBuka] = useState(false);
    const [isModalRejectBuka, setIsModalRejectBuka] = useState(false);
    const [isModalBulkBuka, setIsModalBulkBuka] = useState(false);

    const [selectedAjuan, setSelectedAjuan] = useState(null);
    const [alasanTolak, setAlasanTolak] = useState('');
    const [catatanSetuju, setCatatanSetuju] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- State Database ---
    const [antreanAjuan, setAntreanAjuan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Fetch Antrean Persetujuan dari Supabase ---
    useEffect(() => {
        fetchAntreanIzin();
    }, []);

    const fetchAntreanIzin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, alasan, tujuan, penjemput, hubungan_penjemput, 
                    waktu_berangkat, batas_waktu, status, created_at, parent_izin_id, santri_id, lampiran_url,
                    santri (
                        id, nama_lengkap, kota_asal,
                        kelas ( nama_kelas )
                    ),
                    pengaju:users!perizinan_pengaju_id_fkey ( nama_lengkap, role )
                `)
                .eq('status', 'MENUNGGU_PERSETUJUAN')
                .order('created_at', { ascending: true });

            if (error) throw error;
            const antreanAwal = data || [];

            // --- LOGIKA MULTI-LEVEL ROOT TRACING & RIWAYAT TRACK RECORD ---
            const santriIds = [...new Set(antreanAwal.map(item => item.santri_id).filter(id => id))];
            let historyData = [];

            if (santriIds.length > 0) {
                const { data: hData, error: hErr } = await supabase
                    .from('perizinan')
                    .select('id, santri_id, status, created_at, parent_izin_id, tujuan, penjemput, hubungan_penjemput, alasan, waktu_berangkat, batas_waktu, waktu_kembali_aktual, waktu_scan_security_kembali')
                    .in('santri_id', santriIds);
                if (!hErr && hData) historyData = hData;
            }

            const getRootData = (startId) => {
                let currentId = startId;
                let foundTujuan = null;
                let foundPenjemput = null;
                let foundHubungan = null;
                let foundWaktuBerangkat = null;
                let visited = new Set();

                while (currentId && !visited.has(currentId)) {
                    visited.add(currentId);
                    const currentRecord = historyData.find(x => x.id === currentId);
                    if (!currentRecord) break;

                    if (!foundTujuan && currentRecord.tujuan) foundTujuan = currentRecord.tujuan;
                    if (!foundPenjemput && currentRecord.penjemput) foundPenjemput = currentRecord.penjemput;
                    if (!foundHubungan && currentRecord.hubungan_penjemput) foundHubungan = currentRecord.hubungan_penjemput;
                    if (!foundWaktuBerangkat && currentRecord.waktu_berangkat && currentRecord.parent_izin_id === null) {
                        foundWaktuBerangkat = currentRecord.waktu_berangkat;
                    }

                    if (!foundTujuan || !foundPenjemput) {
                        const match = (currentRecord.alasan || '').match(/\[(.*?)\]/);
                        if (match) {
                            if (!foundTujuan && match[1].includes('Tujuan:')) foundTujuan = match[1].split('Tujuan:')[1].split(',')[0].trim();
                            if (!foundPenjemput && match[1].includes('Penjemput:')) foundPenjemput = match[1].split('Penjemput:')[1].split(',')[0].trim();
                            if (!foundPenjemput && match[1].includes('Pendamping PP:')) foundPenjemput = match[1].split('Pendamping PP:')[1].split(',')[0].trim() + ' (Petugas)';
                        }
                    }

                    if (foundTujuan && foundPenjemput && foundWaktuBerangkat) break;
                    currentId = currentRecord.parent_izin_id;
                }

                return { tujuan: foundTujuan, penjemput: foundPenjemput, hubungan: foundHubungan, waktuBerangkat: foundWaktuBerangkat };
            };

            // Fungsi Penghitung Riwayat Izin & Terlambat per Semester
            const hitungTrackRecord = (santriId, currentIzinId) => {
                const now = new Date();
                const tahunIni = now.getFullYear();
                const awalSemester = now.getMonth() >= 6
                    ? new Date(tahunIni, 6, 1).getTime()
                    : new Date(tahunIni, 0, 1).getTime();

                const riwayatSantri = historyData.filter(
                    h => h.santri_id === santriId &&
                        h.id !== currentIzinId &&
                        ['DISETUJUI', 'DI_LUAR', 'TERLAMBAT', 'SELESAI'].includes(h.status)
                );

                const riwayatSemesterIni = riwayatSantri.filter(
                    h => new Date(h.created_at).getTime() >= awalSemester
                );

                const totalIzinSemester = riwayatSemesterIni.filter(h => h.parent_izin_id === null).length;

                const totalTerlambat = riwayatSemesterIni.filter(h => {
                    if (h.status === 'TERLAMBAT') return true;
                    if (!h.batas_waktu) return false;

                    const batasMs = new Date(h.batas_waktu).getTime();
                    const kembaliAktualMs = h.waktu_kembali_aktual ? new Date(h.waktu_kembali_aktual).getTime() : 0;
                    const scanGerbangMs = h.waktu_scan_security_kembali ? new Date(h.waktu_scan_security_kembali).getTime() : 0;

                    if (kembaliAktualMs > batasMs || scanGerbangMs > batasMs) return true;
                    if (['DI_LUAR', 'DISETUJUI'].includes(h.status) && batasMs < now.getTime()) return true;

                    return false;
                }).length;

                return { totalIzinSemester, totalTerlambat };
            };

            // Mapping Data Final
            const formatted = antreanAwal.map(item => {
                const isPerpanjangan = item.parent_izin_id !== null;
                const tipeLabel = isPerpanjangan ? 'PERPANJANGAN' : 'IZIN BARU';

                const rootData = getRootData(item.id);
                const statsSantri = hitungTrackRecord(item.santri_id, item.id);

                let alasanBersih = item.alasan || 'Tanpa keterangan';
                let finalTujuan = rootData.tujuan;
                const finalKotaAsal = item.santri?.kota_asal || 'Cirebon';

                let rawPenjemput = rootData.penjemput;
                let rawHubungan = rootData.hubungan;

                const bracketMatch = alasanBersih.match(/\[(.*?)\]/);
                if (bracketMatch) {
                    alasanBersih = alasanBersih.replace(bracketMatch[0], '').trim();
                    if (!finalTujuan && bracketMatch[1].includes('Dirujuk Rawat Inap')) finalTujuan = 'Rujuk Rawat Inap Medis';
                }

                if (!finalTujuan) finalTujuan = item.jenis_izin.includes('KLINIK') ? 'RS/Faskes Luar' : 'Rumah/Domisili';

                // --- Pemisahan Nama Penjemput & Hubungan Penjemput ---
                let namaPenjemputBersih = rawPenjemput || '-';
                let hubunganPenjemput = rawHubungan || null;
                let kontakPendamping = null;

                if (namaPenjemputBersih !== '-') {
                    if (item.jenis_izin === 'RAWAT_JALAN_KLINIK') {
                        const hpMatch = (rawHubungan || namaPenjemputBersih)?.match(/HP\s*:\s*([\d\+\-\s]+)/i);
                        if (hpMatch) kontakPendamping = hpMatch[1].replace(/[\(\)]/g, '').trim();
                        namaPenjemputBersih = namaPenjemputBersih.split(/\(Petugas|\(HP:/i)[0].trim();
                        hubunganPenjemput = null;
                    } else {
                        const hubMatch = namaPenjemputBersih.match(/\((.*?)\)/);
                        if (hubMatch) {
                            if (!hubunganPenjemput) hubunganPenjemput = hubMatch[1].trim();
                            namaPenjemputBersih = namaPenjemputBersih.split('(')[0].trim();
                        }
                    }
                }

                let jadwalAwalText = null;
                if (isPerpanjangan) {
                    const immediateParent = historyData.find(x => x.id === item.parent_izin_id);
                    const waktuBerangkatAwal = rootData.waktuBerangkat || immediateParent?.waktu_berangkat;
                    if (waktuBerangkatAwal && immediateParent && immediateParent.batas_waktu) {
                        jadwalAwalText = `Berangkat Awal: ${new Date(waktuBerangkatAwal).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB\nTenggat Sblmnya: ${new Date(immediateParent.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB`;
                    }
                }

                let namaPengaju = 'Tidak Diketahui';
                if (item.pengaju) {
                    const roleLabel = item.pengaju.role === 'KLINIK' ? 'Klinik' : (item.pengaju.role === 'WALIKELAS' ? 'Walikelas' : item.pengaju.role);
                    namaPengaju = `${item.pengaju.nama_lengkap} (${roleLabel})`;
                }

                return {
                    id: item.id,
                    kode: item.kode_izin || item.id.substring(0, 8).toUpperCase(),
                    tipe: tipeLabel,
                    jenis: item.jenis_izin,
                    nama: item.santri?.nama_lengkap || 'Unknown',
                    kelas: item.santri?.kelas?.nama_kelas || '-',
                    pengaju: namaPengaju,
                    waktuAjuan: new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
                    alasan: alasanBersih,
                    lampiran_url: item.lampiran_url || null, // <-- Tangkap Tautan Lampiran
                    jadwalAwal: jadwalAwalText,
                    jadwalBatasBaru: item.batas_waktu,
                    jadwal: `Keberangkatan: ${new Date(item.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}\nKembali: ${item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}`,
                    penjemput: namaPenjemputBersih,
                    hubunganPenjemput: hubunganPenjemput,
                    kontakPendamping: kontakPendamping,
                    kotaAsal: finalKotaAsal,
                    kotaTujuan: finalTujuan,
                    trackRecord: statsSantri,
                    rawItem: item
                };
            });

            setAntreanAjuan(formatted);
        } catch (error) {
            console.error("Gagal memuat antrean izin:", error);
            setErrorMsg("Gagal memuat data dari server: " + (error.message || 'Silakan cek console Chrome'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Logika Checkbox (Bulk) ---
    const toggleCheck = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleCheckAll = () => {
        if (selectedIds.length === antreanAjuan.length) setSelectedIds([]);
        else setSelectedIds(antreanAjuan.map(a => a.id));
    };

    // --- Action Handlers ---
    const bukaModalApprove = (e, ajuan) => {
        e.stopPropagation();
        setSelectedAjuan(ajuan);
        setCatatanSetuju('');
        setIsModalApproveBuka(true);
    };

    const bukaModalReject = (e, ajuan) => {
        e.stopPropagation();
        setSelectedAjuan(ajuan);
        setAlasanTolak('');
        setIsModalRejectBuka(true);
    };

    // --- FUNGSI EKSEKUSI DATABASE SINGLE ---
    const handleProsesSingle = async (aksi) => {
        setIsProcessing(true);
        try {
            const isApprove = aksi === 'APPROVE';
            const isPerpanjangan = selectedAjuan.tipe === 'PERPANJANGAN';
            const catatanBersih = catatanSetuju.trim();

            let statusBaru = 'DITOLAK';
            if (isApprove) {
                statusBaru = isPerpanjangan ? 'DI_LUAR' : 'DISETUJUI';
            }

            const { error: updateErr } = await supabase
                .from('perizinan')
                .update({
                    status: statusBaru,
                    disetujui_oleh: user.id,
                    catatan_penolakan: !isApprove ? alasanTolak.trim() : null,
                    catatan_persetujuan: isApprove && catatanBersih ? catatanBersih : null
                })
                .eq('id', selectedAjuan.id);

            if (updateErr) throw updateErr;

            if (isApprove && isPerpanjangan && selectedAjuan.rawItem.parent_izin_id) {
                await supabase
                    .from('perizinan')
                    .update({ status: 'SELESAI' })
                    .eq('id', selectedAjuan.rawItem.parent_izin_id);
            }

            const infoTambahan = !isApprove
                ? `Alasan: ${alasanTolak.trim()}`
                : `${isPerpanjangan ? 'Perpanjangan aktif, izin lama otomatis ditutup. ' : ''}${catatanBersih ? 'Catatan Sekdir: ' + catatanBersih : ''}`;

            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: isApprove ? 'SETUJUI_IZIN' : 'TOLAK_IZIN',
                tabel_terdampak: 'perizinan',
                data_id: selectedAjuan.id,
                keterangan: `Sekretaris Mudir ${isApprove ? 'Menyetujui' : 'Menolak'} pengajuan ${selectedAjuan.kode} untuk ${selectedAjuan.nama}. ${infoTambahan}`.trim()
            }]);

            setAntreanAjuan(prev => prev.filter(item => item.id !== selectedAjuan.id));
            setSelectedIds(prev => prev.filter(id => id !== selectedAjuan.id));

            setIsModalApproveBuka(false);
            setIsModalRejectBuka(false);
            setCatatanSetuju('');

        } catch (error) {
            console.error("Gagal memproses perizinan:", error);
            alert("Gagal menyimpan ke database.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- FUNGSI EKSEKUSI DATABASE MASSAL (BULK) ---
    const handleProsesBulk = async () => {
        setIsProcessing(true);
        try {
            const catatanBersih = catatanSetuju.trim();

            for (const id of selectedIds) {
                const ajuan = antreanAjuan.find(a => a.id === id);
                if (!ajuan) continue;

                const isPerpanjangan = ajuan.tipe === 'PERPANJANGAN';
                const statusBaru = isPerpanjangan ? 'DI_LUAR' : 'DISETUJUI';

                await supabase
                    .from('perizinan')
                    .update({
                        status: statusBaru,
                        disetujui_oleh: user.id,
                        catatan_persetujuan: catatanBersih ? catatanBersih : null
                    })
                    .eq('id', id);

                if (isPerpanjangan && ajuan.rawItem.parent_izin_id) {
                    await supabase
                        .from('perizinan')
                        .update({ status: 'SELESAI' })
                        .eq('id', ajuan.rawItem.parent_izin_id);
                }

                await supabase.from('audit_log').insert([{
                    user_id: user.id,
                    aksi: 'SETUJUI_IZIN_MASSAL',
                    tabel_terdampak: 'perizinan',
                    data_id: id,
                    keterangan: `Sekretaris Mudir menyetujui izin ini secara massal (Bulk Approve). ${isPerpanjangan ? 'Izin perpanjangan diaktifkan, izin lama ditutup. ' : ''}${catatanBersih ? 'Catatan Sekdir: ' + catatanBersih : ''}`.trim()
                }]);
            }

            setAntreanAjuan(prev => prev.filter(item => !selectedIds.includes(item.id)));
            setSelectedIds([]);
            setCatatanSetuju('');
            setIsModalBulkBuka(false);

        } catch (error) {
            console.error("Gagal bulk approve:", error);
            alert("Sebagian pengajuan mungkin gagal diproses.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="animate-fade-in-down p-2 md:p-6 pb-28 max-w-7xl mx-auto">
                {/* --- HEADER --- */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600" />
                            Persetujuan Izin (Approval)
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Evaluasi pengajuan izin santri yang diteruskan oleh Walikelas dan Klinik.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAntreanIzin}
                            disabled={isLoading}
                            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 flex-1 md:flex-none"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : null}
                            Segarkan Data
                        </button>
                        <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
                            <Clock className="text-amber-500" size={18} />
                            <span className="text-sm font-bold text-amber-700">{antreanAjuan.length} Menunggu</span>
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                        {errorMsg}
                    </div>
                )}

                {/* --- HEADER TOOLS (Pilih Semua) --- */}
                {antreanAjuan.length > 0 && !isLoading && (
                    <div className="mb-4 flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border-2 ${selectedIds.length === antreanAjuan.length ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                                {selectedIds.length === antreanAjuan.length && <Check size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={selectedIds.length === antreanAjuan.length} onChange={toggleCheckAll} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">Pilih Semua ({antreanAjuan.length})</span>
                        </label>
                        {selectedIds.length > 0 && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{selectedIds.length} Terpilih</span>
                        )}
                    </div>
                )}

                {/* --- ANTREAN KARTU (CARD MODEL) --- */}
                {isLoading ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-1">Memuat Antrean</h3>
                        <p className="text-sm text-gray-500">Mengambil data terbaru dari server...</p>
                    </div>
                ) : antreanAjuan.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <ShieldCheck size={64} className="text-emerald-100 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-1">Antrean Bersih</h3>
                        <p className="text-sm text-gray-500">Tidak ada pengajuan izin yang menunggu persetujuan Anda saat ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {antreanAjuan.map((ajuan) => (
                            <div
                                key={ajuan.id}
                                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative cursor-pointer border-2 ${selectedIds.includes(ajuan.id) ? 'border-emerald-500' : 'border-gray-200'}`}
                                onClick={() => toggleCheck(ajuan.id)}
                            >
                                {/* Checkbox Kanan Atas */}
                                <div className="absolute top-4 right-4 z-10">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border-2 ${selectedIds.includes(ajuan.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                                        {selectedIds.includes(ajuan.id) && <Check size={16} className="text-white" />}
                                    </div>
                                </div>

                                {/* Card Header */}
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 pr-12 flex justify-between items-start">
                                    <div>
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide rounded-md border mb-1.5 ${ajuan.tipe === 'IZIN BARU' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {ajuan.tipe}
                                        </span>
                                        <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                            {ajuan.jenis.replace(/_/g, ' ')}
                                            <span className="text-[9px] font-mono font-bold bg-gray-200 text-gray-500 px-1 rounded">{ajuan.kode}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400 mt-1" title="Waktu diajukan">{ajuan.waktuAjuan}</div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1">
                                    <div className="mb-3 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 text-lg leading-tight">{ajuan.nama}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-emerald-600">Kelas {ajuan.kelas}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[11px] font-medium text-gray-500">Oleh: {ajuan.pengaju}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- PANEL RIWAYAT IZIN & TERLAMBAT SANTRI (PER SEMESTER) --- */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                                            <History size={16} className="text-slate-500 shrink-0" />
                                            <div>
                                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Riwayat Izin</span>
                                                <span className="text-xs font-black text-slate-800">
                                                    {ajuan.trackRecord.totalIzinSemester}x <span className="font-medium text-[10px] text-slate-500">(Sem. Ini)</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`border rounded-xl p-2.5 flex items-center gap-2 ${ajuan.trackRecord.totalTerlambat > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
                                            {ajuan.trackRecord.totalTerlambat > 0 ? (
                                                <AlertTriangle size={16} className="text-red-500 shrink-0 animate-pulse" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            )}
                                            <div>
                                                <span className={`block text-[9px] font-bold uppercase tracking-wider ${ajuan.trackRecord.totalTerlambat > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    Rekam Terlambat
                                                </span>
                                                <span className={`text-xs font-black ${ajuan.trackRecord.totalTerlambat > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                                                    {ajuan.trackRecord.totalTerlambat}x Terlambat
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualisasi Rute & Penjemput (Hubungan Penjemput Dipisah di Bawah Nama) */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-3">
                                        {ajuan.jenis !== 'RUJUK_INAP_KLINIK' && (
                                            <>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5 shrink-0">
                                                        <Car size={14} />
                                                        {ajuan.jenis === 'RAWAT_JALAN_KLINIK' ? 'Pendamping' : 'Penjemput'}
                                                    </div>
                                                    <div className="flex flex-col items-end text-right">
                                                        <span className="text-xs font-bold text-gray-800 leading-snug">{ajuan.penjemput}</span>
                                                        {ajuan.hubunganPenjemput && (
                                                            <span className="font-mono text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-1">
                                                                <Users size={10} className="text-gray-400" /> {ajuan.hubunganPenjemput}
                                                            </span>
                                                        )}
                                                        {ajuan.kontakPendamping && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono font-bold mt-1">
                                                                <Phone size={10} className="text-gray-400" /> {ajuan.kontakPendamping}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-px bg-gray-200/60 w-full"></div>
                                            </>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Kota Asal</span>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                                    <Home size={12} className="text-gray-400" /> {ajuan.kotaAsal}
                                                </div>
                                            </div>
                                            <div className="text-gray-300 px-2 flex-shrink-0">
                                                <ArrowRight size={14} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tujuan</span>
                                                <div className={`flex items-center gap-1 text-xs font-bold ${ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-600' : 'text-emerald-700'}`}>
                                                    <MapPin size={12} className={ajuan.kotaAsal !== ajuan.kotaTujuan ? 'text-blue-500' : 'text-emerald-500'} /> {ajuan.kotaTujuan}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alasan */}
                                    <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl mb-4 relative mt-3">
                                        <span className="absolute -top-2.5 left-3 bg-blue-100 px-1.5 rounded text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-200">Alasan Izin</span>
                                        <p className="text-sm text-gray-800 mt-1 leading-relaxed">{ajuan.alasan}</p>
                                    </div>

                                    {/* Jadwal */}
                                    <div>
                                        {ajuan.tipe === 'PERPANJANGAN' && ajuan.jadwalAwal && (
                                            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 p-2.5 rounded-t-xl border-b-0 border-dashed">
                                                <History size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-[11px] font-mono text-gray-500 leading-relaxed whitespace-pre-line">
                                                    {ajuan.jadwalAwal}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-3 ${ajuan.tipe === 'PERPANJANGAN' ? 'rounded-b-xl' : 'rounded-xl'}`}>
                                            <CalendarClock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-[11px] font-mono font-bold text-amber-800 leading-relaxed whitespace-pre-line w-full">
                                                {ajuan.tipe === 'PERPANJANGAN' && <span className="font-bold uppercase tracking-wider text-[9px] text-amber-600 block mb-0.5">Ajuan Perpanjangan Baru</span>}
                                                {ajuan.jadwal}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Indikator Lampiran (Badge Kecil) */}
                                    {ajuan.lampiran_url && (
                                        <div className="mt-3 flex justify-end">
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold">
                                                <ImageIcon size={10} /> Melampirkan Bukti Foto
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                                    <button onClick={(e) => bukaModalReject(e, ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-sm transition-all relative z-20">
                                        <XSquare size={16} /> Tolak
                                    </button>
                                    <button onClick={(e) => bukaModalApprove(e, ajuan)} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm transition-all shadow-sm relative z-20">
                                        <CheckSquare size={16} /> Setujui
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FLOATING ACTION BAR (BULK APPROVE) --- */}
            {selectedIds.length > 0 && (
                <div className="fixed top-6 left-0 right-0 z-40 px-4 animate-fade-in-down flex justify-center pointer-events-none">
                    <div className="bg-gray-900 rounded-2xl shadow-2xl p-3 pr-4 flex items-center gap-4 max-w-sm w-full border border-gray-700 pointer-events-auto">
                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 text-emerald-400 font-black">
                            {selectedIds.length}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white">Ajuan Terpilih</div>
                            <div className="text-[10px] text-gray-400">Siap disetujui massal</div>
                        </div>
                        <button
                            onClick={() => { setCatatanSetuju(''); setIsModalBulkBuka(true); }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <CheckCircle2 size={16} /> Setujui Semua
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Approve Single (Dengan Penampil Foto) */}
            {isModalApproveBuka && selectedAjuan && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalApproveBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-emerald-50 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><CheckSquare size={20} /></div>
                            <h3 className="font-bold text-emerald-900 text-lg">Konfirmasi Persetujuan</h3>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4">Anda yakin ingin menyetujui pengajuan izin ini? Data persetujuan akan langsung tercatat di sistem Security (Satpam).</p>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Santri:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.nama} <span className="font-normal text-gray-500">({selectedAjuan.kelas})</span></span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tipe:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.tipe}</span>
                                </div>

                                {/* --- RINGKASAN RIWAYAT IZIN & TERLAMBAT PER SEMESTER DI MODAL APPROVE --- */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200/80">
                                    <span className="text-gray-500 text-xs">Riwayat Izin (Semester Ini):</span>
                                    <span className="font-bold text-gray-800 text-xs">
                                        {selectedAjuan.trackRecord.totalIzinSemester}x Izin
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-xs">Riwayat Terlambat (Semester Ini):</span>
                                    <span className={`font-black text-xs px-2 py-0.5 rounded ${selectedAjuan.trackRecord.totalTerlambat > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {selectedAjuan.trackRecord.totalTerlambat}x Terlambat
                                    </span>
                                </div>

                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    <span className="text-gray-500 text-xs block mb-1 font-bold">{selectedAjuan.tipe === 'PERPANJANGAN' ? 'Waktu Diperpanjang Menjadi:' : 'Batas Waktu Kepulangan:'}</span>
                                    <span className="font-mono text-sm font-bold text-emerald-700 block whitespace-pre-line">{selectedAjuan.jadwalBatasBaru ? new Date(selectedAjuan.jadwalBatasBaru).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-'}</span>
                                </div>
                            </div>

                            {/* --- PREVIEW FOTO LAMPIRAN (JIKA ADA) --- */}
                            {selectedAjuan.lampiran_url && (
                                <div className="mb-4">
                                    <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-emerald-600" /> Foto Bukti Lampiran
                                    </span>
                                    <a href={selectedAjuan.lampiran_url} target="_blank" rel="noreferrer" className="block border border-gray-200 rounded-xl overflow-hidden hover:border-emerald-400 transition-colors group">
                                        <img src={selectedAjuan.lampiran_url} alt="Lampiran" className="w-full h-40 object-cover bg-gray-100 group-hover:opacity-90 transition-opacity" />
                                        <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-500 font-bold border-t border-gray-200 group-hover:text-emerald-600 group-hover:bg-emerald-50">
                                            Klik gambar untuk memperbesar
                                        </div>
                                    </a>
                                </div>
                            )}

                            {/* --- INPUT CATATAN PERSETUJUAN (OPSIONAL) --- */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Catatan Tambahan <span className="text-gray-400 font-normal lowercase">(opsional)</span>
                                </label>
                                <textarea
                                    value={catatanSetuju}
                                    onChange={(e) => setCatatanSetuju(e.target.value)}
                                    rows="2"
                                    placeholder="Contoh: Disetujui, wajib kembali tepat waktu sebelum Maghrib (Kosongkan jika tidak ada)..."
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                                ></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalApproveBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Batal</button>
                            <button onClick={() => handleProsesSingle('APPROVE')} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center min-w-[100px] disabled:opacity-50 shadow-sm">
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Setujui Izin'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Reject Single */}
            {isModalRejectBuka && selectedAjuan && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalRejectBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-red-50 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-red-200 text-red-700 flex items-center justify-center"><XSquare size={20} /></div>
                            <h3 className="font-bold text-red-900 text-lg">Tolak Pengajuan</h3>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-4 text-sm">
                                Menolak pengajuan <span className="font-bold text-gray-900">{selectedAjuan.nama}</span>.
                            </div>

                            {/* --- PREVIEW FOTO LAMPIRAN (JIKA ADA) DI MODAL TOLAK --- */}
                            {selectedAjuan.lampiran_url && (
                                <div className="mb-4">
                                    <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-red-500" /> Foto Bukti Lampiran
                                    </span>
                                    <a href={selectedAjuan.lampiran_url} target="_blank" rel="noreferrer" className="block border border-gray-200 rounded-xl overflow-hidden hover:border-red-400 transition-colors group">
                                        <img src={selectedAjuan.lampiran_url} alt="Lampiran" className="w-full h-24 object-cover bg-gray-100" />
                                        <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-500 font-bold border-t border-gray-200 group-hover:text-red-600 group-hover:bg-red-50">Lihat penuh</div>
                                    </a>
                                </div>
                            )}

                            <textarea
                                required
                                value={alasanTolak}
                                onChange={(e) => setAlasanTolak(e.target.value)}
                                rows="3"
                                placeholder="Wajib mengisi alasan penolakan untuk walikelas/klinik..."
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                autoFocus
                            ></textarea>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalRejectBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl disabled:opacity-50">Batal</button>
                            <button onClick={() => handleProsesSingle('REJECT')} disabled={isProcessing || !alasanTolak.trim()} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl flex items-center justify-center min-w-[100px] ${!alasanTolak.trim() ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm'}`}>
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Tolak Izin'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Bulk Approve */}
            {isModalBulkBuka && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalBulkBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-center gap-3 bg-emerald-600 text-white text-center">
                            <CheckCircle2 size={24} />
                            <h3 className="font-bold text-lg">Persetujuan Massal</h3>
                        </div>
                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100 shadow-inner">
                                <span className="text-3xl font-black">{selectedIds.length}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">Anda akan menyetujui <b className="text-emerald-700 text-base">{selectedIds.length} pengajuan izin</b> secara bersamaan.</p>

                            <div className="text-left mb-4">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Catatan Tambahan Massal <span className="text-gray-400 font-normal lowercase">(opsional)</span>
                                </label>
                                <textarea
                                    value={catatanSetuju}
                                    onChange={(e) => setCatatanSetuju(e.target.value)}
                                    rows="2"
                                    placeholder="Catatan ini akan dilampirkan ke seluruh izin yang dipilih (Kosongkan jika tidak ada)..."
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                                ></textarea>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-left">
                                <AlertCircle className="text-amber-500 flex-shrink-0" size={16} />
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">Pastikan Anda telah membaca sekilas alasan setiap ajuan (termasuk melihat foto lampiran jika ada) sebelum menyetujuinya secara massal. Tindakan ini akan dicatat di log audit.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalBulkBuka(false)} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Periksa Kembali</button>
                            <button onClick={handleProsesBulk} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-emerald-400 hover:bg-emerald-500 rounded-xl transition-colors flex items-center justify-center min-w-[150px] shadow-sm disabled:opacity-50 gap-2">
                                {isProcessing ? <Loader2 size={18} className="animate-spin text-gray-900" /> : <><CheckCircle2 size={16} /> Ya, Setujui Semua</>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PersetujuanIzin;