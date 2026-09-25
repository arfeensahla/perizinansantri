import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { XSquare, Download, ShieldCheck, Loader2, Phone } from 'lucide-react';
import { toPng } from 'html-to-image';

const ModalQR = ({ isOpen, onClose, dataIzin }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen || !dataIzin) return null;

    // --- FUNGSI DOWNLOAD KARTU ---
    const unduhTiketUtuh = async () => {
        const element = document.getElementById('tiket-izin-digital');
        if (!element) return;

        setIsDownloading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const dataUrl = await toPng(element, {
                cacheBust: true,
                pixelRatio: 2, // Kualitas HD saat di-zoom
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `E-Pass_${(dataIzin.nama || 'Santri').replace(/\s+/g, '_')}_${dataIzin.kode || 'QR'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Gagal membuat gambar tiket:", err);
            alert("Terjadi kesalahan teknis saat memproses gambar. Detail: " + (err.message || err));
        } finally {
            setIsDownloading(false);
        }
    };

    // --- LOGIKA PENARIKAN DATA ---
    const kategori = (dataIzin.jenis || dataIzin.jenis_izin || '-').replace(/_/g, ' ');
    const tujuan = dataIzin.tujuan || '-';
    const alasan = dataIzin.alasan || '-';
    let berangkat = dataIzin.waktuBerangkat || dataIzin.waktuBerangkatLengkap || '-';
    let kembali = dataIzin.batasWaktu || dataIzin.batasTenggat || '-';

    // Singkat nama bulan agar kotak jadwal tidak kepanjangan
    const shortMonth = (str) => {
        if (!str || str === '-') return '-';
        return str.replace('Januari', 'Jan').replace('Februari', 'Feb').replace('Maret', 'Mar').replace('April', 'Apr').replace('Agustus', 'Agt').replace('September', 'Sep').replace('Oktober', 'Okt').replace('November', 'Nov').replace('Desember', 'Des');
    };

    berangkat = shortMonth(berangkat.replace(' WIB', ''));
    kembali = shortMonth(kembali.replace(' WIB', ''));

    // Logika Spesifik Penjemput / Pendamping
    const isRujukInap = dataIzin.jenis === 'RUJUK_INAP_KLINIK';
    const isRawatJalan = dataIzin.jenis === 'RAWAT_JALAN_KLINIK';

    let namaPenjemput = dataIzin.penjemput || '-';
    let hpPendamping = null;

    if (isRawatJalan && namaPenjemput !== '-') {
        const hpMatch = namaPenjemput.match(/HP\s*:\s*([\d\+\-\s]+)/i);
        if (hpMatch) {
            hpPendamping = hpMatch[1].replace(/[\(\)]/g, '').trim();
        }
        namaPenjemput = namaPenjemput.split('(')[0].trim();
    }

    return createPortal(
        // KUNCI RESPONSIVE: overflow-auto memungkinkan scroll area modal jika layarnya sempit
        <div className="fixed inset-0 z-[99999] flex overflow-auto bg-gray-900/80 backdrop-blur-sm p-4" onClick={onClose}>

            {/* m-auto menengahkan elemen. flex-shrink-0 MELARANG elemen menyusut meskipun layar HP kecil */}
            <div className="m-auto flex-shrink-0 flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>

                <div className="flex justify-end mb-2 w-[460px]">
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
                        <XSquare size={24} />
                    </button>
                </div>

                {/* --- AREA TIKET: DIKUNCI MATI DI w-[460px] --- */}
                <div id="tiket-izin-digital" className="bg-white w-[460px] relative border border-emerald-200 rounded-[2rem] overflow-hidden shadow-2xl">

                    {/* Header Horizontal */}
                    <div className="bg-emerald-700 px-6 py-5 flex items-center justify-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-10 -mb-10 pointer-events-none"></div>

                        <ShieldCheck size={38} className="text-emerald-100 drop-shadow-md flex-shrink-0 relative z-10" />
                        <div className="text-left relative z-10">
                            <h2 className="text-xl font-black text-white tracking-widest uppercase drop-shadow-sm leading-none mb-1">E-Pass Izin Santri</h2>
                            <p className="text-emerald-100 text-[10px] font-bold tracking-widest uppercase">Pondok Pesantren Modern Al-Islam</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Baris Nama & Kode Izin */}
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                            <div className="pr-4 flex-1">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Santri</span>
                                <div className="font-black text-gray-900 text-2xl leading-tight break-words">{dataIzin.nama}</div>
                                <div className="font-bold text-gray-500 text-sm mt-1">Kelas {dataIzin.kelas}</div>
                            </div>
                            <div className="inline-block px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl font-mono text-base font-black tracking-widest shadow-inner flex-shrink-0">
                                {dataIzin.kode}
                            </div>
                        </div>

                        {/* Baris Utama: Detail Kiri & QR Kanan */}
                        <div className="flex gap-5">

                            {/* KOLOM KIRI: Informasi Detail */}
                            <div className="flex-1 space-y-4 flex flex-col justify-between">

                                <div className="grid grid-cols-2 gap-3">
                                    <div className={isRujukInap ? 'col-span-2' : ''}>
                                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kategori Izin</span>
                                        <span className="font-bold text-emerald-700 text-xs leading-snug block pr-2">{kategori}</span>
                                    </div>

                                    {!isRujukInap && (
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {isRawatJalan ? 'Pendamping' : 'Penjemput'}
                                            </span>
                                            <span className="font-bold text-gray-800 text-xs leading-snug block line-clamp-2" title={namaPenjemput}>{namaPenjemput}</span>
                                            {hpPendamping && (
                                                <span className="font-mono text-[10px] text-gray-500 font-bold block mt-1 flex items-center gap-1">
                                                    <Phone size={10} className="text-gray-400" /> {hpPendamping}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tujuan / Faskes</span>
                                    <span className="font-bold text-gray-800 text-xs leading-snug line-clamp-2">{tujuan}</span>
                                </div>

                                <div>
                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alasan Keluar</span>
                                    <span className="font-medium text-gray-600 italic text-xs leading-snug line-clamp-3">"{alasan}"</span>
                                </div>

                                {/* Kotak Jadwal */}
                                <div className="grid grid-cols-2 gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 shadow-sm mt-1">
                                    <div>
                                        <span className="block text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Waktu Keluar</span>
                                        <span className="font-bold text-gray-800 text-[11px] leading-tight">{berangkat}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Batas Kembali</span>
                                        <span className="font-bold text-gray-800 text-[11px] leading-tight">{kembali}</span>
                                    </div>
                                </div>
                            </div>

                            {/* KOLOM KANAN: QR Code */}
                            <div className="w-[130px] flex-shrink-0 flex flex-col items-center justify-center border-l-2 border-dashed border-gray-200 pl-5 pb-1">
                                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-3">
                                    <QRCodeSVG
                                        id="qr-canvas-raw"
                                        value={dataIzin.kode}
                                        size={105}
                                        level={"H"}
                                        fgColor={"#064e3b"}
                                    />
                                </div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed mt-auto">
                                    Dokumen Sah<br />Sistem Al-Islam
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
                {/* --- AKHIR AREA TIKET --- */}

                <div className="mt-5 w-[460px]">
                    <button
                        onClick={unduhTiketUtuh}
                        disabled={isDownloading}
                        className="w-full py-4 text-white font-black text-sm bg-emerald-600 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:bg-emerald-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <><Download size={22} /> Unduh E-Pass (PNG)</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalQR;