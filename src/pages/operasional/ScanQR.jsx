import React, { useState, useEffect, useContext } from 'react';
import { QrCode, Search, CheckCircle, XCircle, Camera, User, Clock, ShieldCheck, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const ScanQR = ({ menuContext }) => {
    const { user } = useContext(AuthContext);

    // --- State Form & Mode ---
    const [scanMode, setScanMode] = useState('camera'); // DIUBAH: Default langsung ke mode Kamera
    const [manualCode, setManualCode] = useState('');

    // --- State Proses ---
    const [scanStatus, setScanStatus] = useState('idle');
    const [scanResult, setScanResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const isPosKesantrian = menuContext?.includes('Kesantrian');
    const posName = isPosKesantrian ? 'Pos Kesantrian (Tahap 1)' : 'Pos Keamanan Gerbang (Tahap 2)';

    // Fungsi dideklarasikan di ATAS agar aman dipanggil oleh useEffect
    const handleClear = () => {
        setScanStatus('idle');
        setScanResult(null);
        setManualCode('');
        setIsProcessing(false);
    };

    useEffect(() => {
        handleClear();
    }, [menuContext]);

    // --- 1. PROSES PENCARIAN & VALIDASI (READ) ---
    const handleSearchQR = async (e) => {
        if (e) e.preventDefault();
        if (!manualCode.trim()) return;

        setScanStatus('scanning');
        setScanResult(null);

        try {
            const cleanCode = manualCode.trim().toUpperCase();

            // Ambil data izin beserta relasi santri
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, status, batas_waktu,
                    waktu_scan_kesantrian, waktu_berangkat_aktual, 
                    waktu_scan_security_kembali, waktu_kembali_aktual,
                    santri ( nama_lengkap, kelas ( nama_kelas ) )
                `)
                .eq('kode_izin', cleanCode)
                .single();

            // Jika kode fiktif / salah ketik
            if (error || !data) {
                setScanResult({ errorMessage: 'Kode QR/Izin tidak ditemukan di dalam database.' });
                setScanStatus('error');
                return;
            }

            // --- LOGIKA VALIDASI ALUR SOP (MESIN KECERDASAN) ---
            let actionType = '';
            let errorMessage = '';

            // Cek Kunci Status Utama
            if (data.status === 'MENUNGGU_PERSETUJUAN') errorMessage = 'Izin belum disetujui oleh Sekretaris Mudir. Tahan santri di Pos.';
            else if (data.status === 'DITOLAK') errorMessage = 'Pengajuan izin ini DITOLAK. Santri dilarang keluar.';
            else if (data.status === 'SELESAI') errorMessage = 'Izin ini sudah kedaluwarsa atau telah berstatus SELESAI.';

            // Validasi Alur Keberangkatan & Kepulangan jika status aktif
            if (!errorMessage) {
                if (data.status === 'DISETUJUI') {
                    // --- FASE KEBERANGKATAN ---
                    if (isPosKesantrian) {
                        if (data.waktu_scan_kesantrian) errorMessage = 'Santri ini sudah melakukan scan keberangkatan di Pos Kesantrian.';
                        else actionType = 'CHECK_OUT_KESANTRIAN';
                    } else {
                        // Pos Gerbang
                        if (!data.waktu_scan_kesantrian) errorMessage = 'PELANGGARAN ALUR: Santri belum lapor di Pos Kesantrian tahap 1.';
                        else if (data.waktu_berangkat_aktual) errorMessage = 'Santri sudah tercatat keluar gerbang sebelumnya.';
                        else actionType = 'CHECK_OUT_SECURITY';
                    }
                } else if (data.status === 'DI_LUAR' || data.status === 'TERLAMBAT') {
                    // --- FASE KEPULANGAN ---
                    if (!isPosKesantrian) {
                        // Pos Gerbang
                        if (data.waktu_scan_security_kembali) errorMessage = 'Santri sudah scan masuk gerbang sebelumnya.';
                        else actionType = 'CHECK_IN_SECURITY';
                    } else {
                        // Pos Kesantrian (Tutup Izin)
                        if (!data.waktu_scan_security_kembali) errorMessage = 'PELANGGARAN ALUR: Santri masuk tanpa melewati scan Gerbang Depan.';
                        else actionType = 'CHECK_IN_KESANTRIAN';
                    }
                }
            }

            // Lempar error jika melanggar alur
            if (errorMessage) {
                setScanResult({ errorMessage });
                setScanStatus('error');
                return;
            }

            // Lolos Validasi -> Tampilkan Kartu Informasi
            setScanResult({
                id: data.id,
                kode: data.kode_izin,
                santri: data.santri?.nama_lengkap || 'Unknown',
                kelas: data.santri?.kelas?.nama_kelas || '-',
                jenis: data.jenis_izin,
                statusIzin: data.status,
                batasWaktu: data.batas_waktu ? new Date(data.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-',
                actionType: actionType
            });
            setScanStatus('success');

        } catch (err) {
            console.error(err);
            setScanResult({ errorMessage: 'Terjadi kesalahan jaringan saat memvalidasi kode.' });
            setScanStatus('error');
        }
    };

    // --- 2. PROSES UPDATE KE DATABASE (WRITE) ---
    const handleRekamAktivitas = async () => {
        if (!scanResult || !scanResult.id) return;
        setIsProcessing(true);

        try {
            const waktuSekarang = new Date().toISOString();
            let updatePayload = {};
            let auditAksi = '';
            let auditKeterangan = '';

            // Tentukan Field Supabase mana yang diisi berdasarkan jenis Action
            switch (scanResult.actionType) {
                case 'CHECK_OUT_KESANTRIAN':
                    updatePayload = { waktu_scan_kesantrian: waktuSekarang };
                    auditAksi = 'SCAN_KELUAR_KESANTRIAN';
                    auditKeterangan = `Keberangkatan: Scan tahap 1 di Kesantrian.`;
                    break;
                case 'CHECK_OUT_SECURITY':
                    updatePayload = { waktu_berangkat_aktual: waktuSekarang, status: 'DI_LUAR' };
                    auditAksi = 'SCAN_KELUAR_GERBANG';
                    auditKeterangan = `Keberangkatan: Scan tahap 2 di Gerbang. Santri resmi DI LUAR.`;
                    break;
                case 'CHECK_IN_SECURITY':
                    updatePayload = { waktu_scan_security_kembali: waktuSekarang };
                    auditAksi = 'SCAN_KEMBALI_GERBANG';
                    auditKeterangan = `Kepulangan: Scan tahap 1 masuk Gerbang.`;
                    break;
                case 'CHECK_IN_KESANTRIAN':
                    updatePayload = { waktu_kembali_aktual: waktuSekarang, status: 'SELESAI' };
                    auditAksi = 'SCAN_KEMBALI_KESANTRIAN';
                    auditKeterangan = `Kepulangan: Scan tahap 2 lapor Kesantrian. Status izin SELESAI.`;
                    break;
                default:
                    throw new Error("Aksi tidak dikenali");
            }

            // Eksekusi Update Tabel Perizinan
            const { error: updateErr } = await supabase
                .from('perizinan')
                .update(updatePayload)
                .eq('id', scanResult.id);

            if (updateErr) throw updateErr;

            // Catat Log Audit Penjaga Pos
            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: auditAksi,
                tabel_terdampak: 'perizinan',
                data_id: scanResult.id,
                keterangan: auditKeterangan
            }]);

            // Bersihkan Layar Setelah Sukses
            alert('Aktivitas berhasil direkam ke sistem!');
            handleClear();

        } catch (error) {
            console.error("Gagal merekam aktivitas:", error);
            alert("Sistem gagal merekam aktivitas. Coba lagi.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Label Tombol Dinamis berdasarkan Action
    const getButtonLabel = (actionType) => {
        switch (actionType) {
            case 'CHECK_OUT_KESANTRIAN': return 'Validasi Keberangkatan (Tahap 1)';
            case 'CHECK_OUT_SECURITY': return 'Validasi Keluar Gerbang (Tahap 2)';
            case 'CHECK_IN_SECURITY': return 'Validasi Masuk Gerbang (Tahap 1)';
            case 'CHECK_IN_KESANTRIAN': return 'Selesaikan Izin (Tahap Terakhir)';
            default: return 'Rekam Aktivitas';
        }
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-md mx-auto">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-emerald-800 flex items-center justify-center gap-2">
                    <ShieldCheck size={28} />
                    Validasi Kode QR
                </h2>
                <p className={`text-sm font-bold py-1.5 px-4 rounded-full inline-flex items-center gap-2 mt-3 shadow-sm border ${isPosKesantrian ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    <MapPin size={14} /> Lokasi: {posName}
                </p>
            </div>

            {/* AREA PEMINDAI (SCANNER) */}
            {scanStatus === 'idle' || scanStatus === 'scanning' ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Tab Mode Pemindaian */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setScanMode('camera')}
                            className={`flex-1 py-3.5 text-sm font-bold flex justify-center items-center gap-2 transition-all ${scanMode === 'camera' ? 'bg-white text-emerald-700 border-b-2 border-emerald-500 shadow-[0_2px_0_0_#10b981]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Camera size={18} /> Kamera
                        </button>
                        <button
                            onClick={() => setScanMode('manual')}
                            className={`flex-1 py-3.5 text-sm font-bold flex justify-center items-center gap-2 transition-all ${scanMode === 'manual' ? 'bg-white text-emerald-700 border-b-2 border-emerald-500 shadow-[0_2px_0_0_#10b981]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Search size={18} /> Input Manual
                        </button>
                    </div>

                    <div className="p-6">
                        {scanMode === 'camera' ? (
                            <div className="aspect-square bg-gray-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
                                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,transparent_20%,#000_100%)]"></div>
                                <QrCode size={64} className="text-emerald-400 mb-4 animate-pulse opacity-50" />
                                <p className="text-gray-300 text-sm relative z-10 font-medium tracking-wide">Arahkan kamera ke Kode QR</p>
                                {/* Garis Pemindai Animasi */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.5)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSearchQR} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kode Izin (Ketik Manual)</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="Contoh: IZN-XYZ12"
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-center font-mono text-xl uppercase font-black text-gray-800 tracking-widest transition-all shadow-inner bg-gray-50"
                                        autoComplete="off"
                                    />
                                    <p className="text-xs text-gray-500 mt-3 text-center font-medium leading-relaxed">
                                        Fitur ini digunakan jika kamera gawai rusak atau QR code pada kartu identitas santri pudar/kotor.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={scanStatus === 'scanning' || !manualCode}
                                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {scanStatus === 'scanning' ? <><Loader2 size={18} className="animate-spin" /> Memeriksa Database...</> : <><Search size={18} /> Cek Status Izin</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}

            {/* AREA HASIL PEMINDAIAN: BERHASIL (SOP VALID) */}
            {scanStatus === 'success' && scanResult && (
                <div className="bg-white rounded-3xl shadow-xl border border-emerald-200 overflow-hidden animate-fade-in-down">
                    <div className="bg-emerald-500 px-6 py-8 text-center text-white relative shadow-inner">
                        <div className="absolute top-4 left-4 bg-white/20 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border border-white/20">
                            {posName}
                        </div>
                        <CheckCircle size={64} className="mx-auto mb-3 text-white drop-shadow-md" />
                        <h3 className="text-2xl font-black tracking-wide drop-shadow-sm">AKSES DITERIMA</h3>
                        <p className="text-emerald-50 text-sm font-medium mt-1">Kode Sesuai dengan Alur SOP</p>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 flex-shrink-0">
                                <User size={28} />
                            </div>
                            <div>
                                <div className="font-black text-gray-900 text-xl leading-tight">{scanResult.santri}</div>
                                <div className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                                    Kelas {scanResult.kelas} <span className="text-gray-300">|</span> <span className="font-mono font-bold text-emerald-600">{scanResult.kode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Jenis Izin:</span>
                                <span className="font-bold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 text-[11px] uppercase tracking-wider">{scanResult.jenis.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status Sistem:</span>
                                <span className="font-black text-emerald-600 tracking-wide">{scanResult.statusIzin}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
                                <span className="text-gray-500 flex items-center gap-1"><Clock size={14} /> Batas Waktu:</span>
                                <span className="font-mono font-bold text-gray-800 text-right">{scanResult.batasWaktu}</span>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button onClick={handleClear} disabled={isProcessing} className="w-full sm:w-1/3 py-3 text-gray-600 font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                                Batal
                            </button>
                            <button onClick={handleRekamAktivitas} disabled={isProcessing} className="w-full sm:w-2/3 py-3 text-gray-900 font-black bg-emerald-400 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:bg-emerald-500 hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:text-white transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> {getButtonLabel(scanResult.actionType)}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AREA HASIL PEMINDAIAN: GAGAL / MELANGGAR SOP */}
            {scanStatus === 'error' && (
                <div className="bg-white rounded-3xl shadow-xl border border-red-200 overflow-hidden animate-fade-in-down">
                    <div className="bg-red-500 px-6 py-8 text-center text-white relative shadow-inner">
                        <XCircle size={64} className="mx-auto mb-3 text-white drop-shadow-md" />
                        <h3 className="text-2xl font-black tracking-wide drop-shadow-sm">AKSES DITOLAK</h3>
                    </div>
                    <div className="p-6 text-center">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                            <p className="text-red-800 font-bold text-sm leading-relaxed">
                                {scanResult?.errorMessage || 'Kode tidak ditemukan atau sudah kedaluwarsa.'}
                            </p>
                        </div>
                        <p className="text-gray-500 mb-6 text-xs font-medium px-4">
                            Sistem menolak aksi pemindaian ini. Tahan santri di area pos dan minta santri melaporkan hal ini ke Walikelas untuk memeriksa status izinnya.
                        </p>
                        <button onClick={handleClear} className="w-full py-3.5 text-white font-bold bg-gray-800 rounded-xl shadow-md hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
                            Pindai Ulang Kode Lain
                        </button>
                    </div>
                </div>
            )}

            {/* Animasi Custom CSS untuk Garis Scanner */}
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default ScanQR;