import React, { useState, useEffect } from 'react';
import { QrCode, Search, CheckCircle, XCircle, Camera, User, Clock, ShieldCheck } from 'lucide-react';

const ScanQR = ({ menuContext }) => {
    // State untuk mode pemindaian (kamera vs manual) dan hasil scan
    const [scanMode, setScanMode] = useState('camera'); // 'camera' atau 'manual'
    const [manualCode, setManualCode] = useState('');
    const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
    const [scanResult, setScanResult] = useState(null);

    // Menentukan lokasi pos berdasarkan menu yang sedang aktif
    const isPosKesantrian = menuContext === 'Scan Pos Kesantrian';
    const posName = isPosKesantrian ? 'Pos Kesantrian (Tahap 1)' : 'Pos Gerbang (Tahap 2)';

    // Reset status jika pindah menu (dari Kesantrian ke Security atau sebaliknya)
    useEffect(() => {
        setScanStatus('idle');
        setScanResult(null);
        setManualCode('');
    }, [menuContext]);

    // Simulasi Proses Scan QR
    const handleSimulateScan = (e) => {
        e.preventDefault();
        setScanStatus('scanning');

        setTimeout(() => {
            // Simulasi logika basis data
            if (manualCode.toUpperCase() === 'IZN-9905') {
                setScanResult({
                    kode: 'IZN-9905',
                    santri: 'Ahmad Muzakki',
                    kelas: '7A',
                    jenis: 'PULANG_MENGINAP_WALI',
                    waktuKeluar: '15 September 2026, 08:00 WIB',
                    statusIzin: 'DISETUJUI',
                    isValid: true
                });
                setScanStatus('success');
            } else {
                setScanStatus('error');
            }
        }, 1200);
    };

    const handleClear = () => {
        setScanStatus('idle');
        setScanResult(null);
        setManualCode('');
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-md mx-auto">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-emerald-800 flex items-center justify-center gap-2">
                    <ShieldCheck size={28} />
                    Validasi Kode QR
                </h2>
                <p className="text-gray-500 text-sm font-bold bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full inline-block mt-2">
                    Lokasi: {posName}
                </p>
            </div>

            {/* AREA PEMINDAI (SCANNER) */}
            {scanStatus === 'idle' || scanStatus === 'scanning' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Tab Mode Pemindaian */}
                    <div className="flex border-b">
                        <button
                            onClick={() => setScanMode('camera')}
                            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${scanMode === 'camera' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Camera size={18} /> Kamera
                        </button>
                        <button
                            onClick={() => setScanMode('manual')}
                            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${scanMode === 'manual' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Search size={18} /> Input Manual
                        </button>
                    </div>

                    <div className="p-6">
                        {scanMode === 'camera' ? (
                            <div className="aspect-square bg-gray-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center">
                                {/* Simulasi Kamera Aktif */}
                                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,transparent_20%,#000_100%)]"></div>
                                <QrCode size={64} className="text-emerald-400 mb-4 animate-pulse opacity-50" />
                                <p className="text-white text-sm relative z-10 font-medium">Arahkan kamera ke Kode QR Santri</p>

                                {/* Garis Pemindai Animasi */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSimulateScan} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Masukkan Kode Izin (Manual)</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="Contoh: IZN-9905"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-center font-mono text-lg uppercase font-bold text-gray-800 tracking-wider"
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">Gunakan mode ini jika kamera gawai rusak atau Kode QR kusam.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={scanStatus === 'scanning' || !manualCode}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {scanStatus === 'scanning' ? 'Memeriksa Data...' : 'Cek Status Izin'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}

            {/* AREA HASIL PEMINDAIAN: BERHASIL */}
            {scanStatus === 'success' && scanResult && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-500 overflow-hidden animate-fade-in-down">
                    <div className="bg-emerald-500 px-6 py-8 text-center text-white relative">
                        <div className="absolute top-4 right-4 bg-white/20 px-2 py-1 rounded text-[10px] font-black tracking-wider uppercase">
                            {posName}
                        </div>
                        <CheckCircle size={64} className="mx-auto mb-3 text-white" />
                        <h3 className="text-2xl font-black">IZIN VALID</h3>
                        <p className="text-emerald-50 font-medium">Batas Waktu: {scanResult.waktuKeluar}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                <User size={24} />
                            </div>
                            <div>
                                <div className="font-black text-gray-900 text-lg">{scanResult.santri}</div>
                                <div className="text-sm text-gray-500 font-medium">Kelas {scanResult.kelas} | <span className="font-mono text-emerald-600">{scanResult.kode}</span></div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Jenis Izin:</span>
                                <span className="font-bold text-gray-800">{scanResult.jenis.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status Sistem:</span>
                                <span className="font-bold text-emerald-600">{scanResult.statusIzin}</span>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={handleClear} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleClear} className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl shadow-md hover:bg-emerald-700 transition-colors">
                                Rekam Aktivitas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AREA HASIL PEMINDAIAN: GAGAL / KEDALUWARSA */}
            {scanStatus === 'error' && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-red-500 overflow-hidden animate-fade-in-down">
                    <div className="bg-red-500 px-6 py-8 text-center text-white relative">
                        <XCircle size={64} className="mx-auto mb-3 text-white" />
                        <h3 className="text-2xl font-black">IZIN TIDAK VALID</h3>
                        <p className="text-red-100 text-sm mt-1">Kode tidak ditemukan atau sudah kedaluwarsa.</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-gray-600 mb-6 text-sm">
                            Sistem menolak Kode QR ini. Tahan santri di pos keamanan dan minta santri menghubungi Walikelas untuk memeriksa status izinnya pada sistem.
                        </p>
                        <button onClick={handleClear} className="w-full py-3 text-white font-bold bg-gray-800 rounded-xl shadow-md hover:bg-gray-900 transition-colors">
                            Pindai Ulang
                        </button>
                    </div>
                </div>
            )}

            {/* Animasi Custom CSS untuk Garis Scanner (Opsional, ditambahkan ke App.css nantinya) */}
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