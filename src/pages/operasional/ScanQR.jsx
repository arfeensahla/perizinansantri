import React, { useState, useEffect, useContext, useRef } from 'react';
import { Search, CheckCircle, XCircle, Camera, User, Clock, ShieldCheck, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';
import { Html5Qrcode } from 'html5-qrcode';

const ScanQR = ({ menuContext }) => {
    const { user } = useContext(AuthContext);

    const [scanMode, setScanMode] = useState('camera');
    const [manualCode, setManualCode] = useState('');

    const [scanStatus, setScanStatus] = useState('idle');
    const [scanResult, setScanResult] = useState(null);

    const html5QrCodeRef = useRef(null);

    const isPosKesantrian = menuContext?.includes('Kesantrian');
    const posName = isPosKesantrian ? 'Pos Kesantrian (Tahap 1)' : 'Pos Keamanan Gerbang (Tahap 2)';

    // ==========================================
    // MESIN KAMERA & SCANNER OTOMATIS
    // ==========================================
    useEffect(() => {
        if (scanMode === 'camera' && scanStatus === 'idle') {
            const startCamera = async () => {
                try {
                    html5QrCodeRef.current = new Html5Qrcode("qr-reader-container");

                    await html5QrCodeRef.current.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                                html5QrCodeRef.current.stop().then(() => {
                                    processQRCodeAndAutoSave(decodedText);
                                }).catch(console.error);
                            }
                        },
                        (errorMessage) => { /* Abaikan error pencarian tiap frame */ }
                    );
                } catch (err) {
                    console.error("Kamera gagal diakses:", err);
                }
            };

            const timer = setTimeout(startCamera, 300);

            return () => {
                clearTimeout(timer);
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().catch(console.error);
                }
            };
        }
    }, [scanMode, scanStatus]);

    const handleClear = () => {
        setScanStatus('idle');
        setScanResult(null);
        setManualCode('');
    };

    useEffect(() => {
        handleClear();
    }, [menuContext]);

    // ==========================================
    // PROSES AUTO-VALIDASI & AUTO-SAVE
    // ==========================================
    const handleSearchQR = (e) => {
        if (e) e.preventDefault();
        processQRCodeAndAutoSave(manualCode);
    };

    const processQRCodeAndAutoSave = async (codeToProcess) => {
        if (!codeToProcess || !codeToProcess.trim()) return;

        const cleanCode = codeToProcess.replace(/[\r\n\s]+/g, '').trim().toUpperCase();
        setManualCode(cleanCode);
        setScanStatus('scanning');
        setScanResult(null);

        try {
            let izinData = null;
            const { data: dataKode } = await supabase
                .from('perizinan')
                .select('*, santri(nama_lengkap, kelas(nama_kelas))')
                .eq('kode_izin', cleanCode)
                .maybeSingle();

            if (dataKode) {
                izinData = dataKode;
            } else {
                const { data: dataFallback } = await supabase
                    .from('perizinan')
                    .select('*, santri(nama_lengkap, kelas(nama_kelas))')
                    .order('created_at', { ascending: false })
                    .limit(300);

                if (dataFallback) {
                    izinData = dataFallback.find(item =>
                        (item.kode_izin && item.kode_izin.toUpperCase() === cleanCode) ||
                        (item.id && item.id.toUpperCase().startsWith(cleanCode)) ||
                        (item.id && item.id.toUpperCase().includes(cleanCode))
                    );
                }
            }

            if (!izinData) {
                setScanResult({ errorMessage: `Data tidak ditemukan untuk kode: [ ${cleanCode} ]. Pastikan QR valid.` });
                setScanStatus('error');
                return;
            }

            // --- LOGIKA VALIDASI SOP ---
            let actionType = '';
            let errorMessage = '';

            if (izinData.status === 'MENUNGGU_PERSETUJUAN') errorMessage = 'Izin belum disetujui oleh Sekretaris Mudir. Tahan santri di Pos.';
            else if (izinData.status === 'DITOLAK') errorMessage = 'Pengajuan izin ini DITOLAK. Santri dilarang keluar.';
            else if (izinData.status === 'DIBATALKAN') errorMessage = 'Pengajuan izin ini telah DIBATALKAN.';
            else if (izinData.status === 'SELESAI') errorMessage = 'Izin ini sudah kedaluwarsa atau telah berstatus SELESAI.';

            if (!errorMessage) {
                if (izinData.status === 'DISETUJUI') {
                    if (isPosKesantrian) {
                        if (izinData.waktu_scan_kesantrian) errorMessage = 'Santri ini sudah melakukan scan keberangkatan di Pos Kesantrian.';
                        else actionType = 'CHECK_OUT_KESANTRIAN';
                    } else {
                        if (!izinData.waktu_scan_kesantrian) errorMessage = 'PELANGGARAN ALUR: Santri belum lapor di Pos Kesantrian tahap 1.';
                        else if (izinData.waktu_berangkat_aktual) errorMessage = 'Santri sudah tercatat keluar gerbang sebelumnya.';
                        else actionType = 'CHECK_OUT_SECURITY';
                    }
                } else if (izinData.status === 'DI_LUAR' || izinData.status === 'TERLAMBAT') {
                    if (!isPosKesantrian) {
                        if (izinData.waktu_scan_security_kembali) errorMessage = 'Santri sudah scan masuk gerbang sebelumnya.';
                        else actionType = 'CHECK_IN_SECURITY';
                    } else {
                        if (!izinData.waktu_scan_security_kembali) errorMessage = 'PELANGGARAN ALUR: Santri masuk tanpa melewati scan Gerbang Depan.';
                        else actionType = 'CHECK_IN_KESANTRIAN';
                    }
                }
            }

            if (errorMessage) {
                setScanResult({ errorMessage });
                setScanStatus('error');
                return;
            }

            // ====================================================
            // PROSES AUTO-UPDATE KE DATABASE
            // ====================================================
            const waktuSekarang = new Date().toISOString();
            let updatePayload = {};
            let auditAksi = '';
            let auditKeterangan = '';

            switch (actionType) {
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

            // EKSEKUSI UPDATE PERIZINAN
            const { error: updateErr } = await supabase
                .from('perizinan')
                .update(updatePayload)
                .eq('id', izinData.id);

            if (updateErr) {
                setScanResult({ errorMessage: `GAGAL UPDATE DATABASE! Detail: ${updateErr.message}. Harap jalankan SQL RLS Policy di Supabase.` });
                setScanStatus('error');
                return;
            }

            // EKSEKUSI AUDIT LOG (Dibuat Non-Blocking agar jika gagal tidak merusak layar hijau)
            if (user && user.id) {
                const { error: auditErr } = await supabase.from('audit_log').insert([{
                    user_id: user.id,
                    aksi: auditAksi,
                    tabel_terdampak: 'perizinan',
                    data_id: izinData.id,
                    keterangan: auditKeterangan
                }]);
                if (auditErr) console.error("Gagal simpan audit log:", auditErr);
            }

            // SEMUA SUKSES -> Tampilkan Kartu Hijau
            setScanResult({
                id: izinData.id,
                kode: izinData.kode_izin || izinData.id.substring(0, 8).toUpperCase(),
                santri: izinData.santri?.nama_lengkap || 'Unknown',
                kelas: izinData.santri?.kelas?.nama_kelas || '-',
                jenis: izinData.jenis_izin,
                statusIzin: actionType.includes('CHECK_OUT_SECURITY') ? 'DI_LUAR' : (actionType.includes('KESANTRIAN') && actionType.includes('IN') ? 'SELESAI' : izinData.status),
                batasWaktu: izinData.batas_waktu ? new Date(izinData.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-',
            });
            setScanStatus('success_auto');

        } catch (err) {
            console.error(err);
            setScanResult({ errorMessage: `Terjadi kesalahan internal sistem: ${err.message}` });
            setScanStatus('error');
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

            {/* AREA PEMINDAI (SCANNER & FORM) */}
            {scanStatus === 'idle' || scanStatus === 'scanning' ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-6">
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
                            <div className="aspect-square bg-gray-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center shadow-inner border border-gray-800">
                                <div id="qr-reader-container" className="w-full h-full object-cover"></div>
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_3px_rgba(16,185,129,0.7)] animate-[scan_2.5s_ease-in-out_infinite] z-10 pointer-events-none"></div>

                                {scanStatus === 'scanning' && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                                        <Loader2 size={46} className="text-emerald-400 animate-spin mb-4" />
                                        <p className="text-white font-black text-sm tracking-widest uppercase">Menyimpan...</p>
                                    </div>
                                )}
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
                                </div>
                                <button
                                    type="submit"
                                    disabled={scanStatus === 'scanning' || !manualCode}
                                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {scanStatus === 'scanning' ? <><Loader2 size={18} className="animate-spin" /> Memeriksa Data...</> : <><Search size={18} /> Validasi Kode</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}

            {/* AREA HASIL PEMINDAIAN: OTOMATIS SUKSES TERSIMPAN */}
            {scanStatus === 'success_auto' && scanResult && (
                <div className="bg-white rounded-3xl shadow-xl border border-emerald-200 overflow-hidden animate-fade-in-down">
                    <div className="bg-emerald-500 px-6 py-8 text-center text-white relative shadow-inner">
                        <CheckCircle size={64} className="mx-auto mb-3 text-white drop-shadow-md" />
                        <h3 className="text-2xl font-black tracking-wide drop-shadow-sm">BERHASIL DIREKAM!</h3>
                        <p className="text-emerald-50 text-xs font-bold tracking-widest uppercase mt-1">Sistem Otomatis Tersinkronisasi</p>
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
                                <span className="text-gray-500">Status Terbaru:</span>
                                <span className="font-black text-emerald-600 tracking-wide">{scanResult.statusIzin}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
                                <span className="text-gray-500 flex items-center gap-1"><Clock size={14} /> Batas Waktu:</span>
                                <span className="font-mono font-bold text-gray-800 text-right">{scanResult.batasWaktu}</span>
                            </div>
                        </div>

                        <div className="pt-3">
                            <button onClick={handleClear} className="w-full py-4 text-white font-black bg-gray-800 rounded-xl shadow-lg hover:bg-gray-900 transition-all flex justify-center items-center gap-2">
                                <Camera size={20} /> Pindai QR Santri Berikutnya
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
                                {scanResult?.errorMessage}
                            </p>
                        </div>
                        <button onClick={handleClear} className="w-full py-4 text-white font-bold bg-gray-800 rounded-xl shadow-md hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
                            Pindai Ulang Kode Lain
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                #qr-reader-container video {
                    object-fit: cover !important;
                    border-radius: 1rem !important;
                }
                #qr-reader-container {
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default ScanQR;