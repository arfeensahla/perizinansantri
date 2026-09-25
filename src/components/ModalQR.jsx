import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { XSquare, Download, ShieldCheck, User, Clock, MapPin } from 'lucide-react';

const ModalQR = ({ isOpen, onClose, dataIzin }) => {
    if (!isOpen || !dataIzin) return null;

    // Fungsi untuk mengunduh QR Code sebagai gambar PNG
    const unduhQRCode = () => {
        const canvas = document.getElementById('qr-canvas-izin');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `Surat_Izin_${dataIzin.nama.replace(/\s+/g, '_')}_${dataIzin.kode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up relative" onClick={e => e.stopPropagation()}>
                {/* Header Kartu */}
                <div className="bg-emerald-600 px-6 py-6 text-center text-white relative shadow-inner">
                    <button onClick={onClose} className="absolute top-4 right-4 text-emerald-100 hover:text-white transition-colors">
                        <XSquare size={24} />
                    </button>
                    <ShieldCheck size={48} className="mx-auto mb-2 text-emerald-100 drop-shadow-md" />
                    <h3 className="text-xl font-black tracking-widest uppercase">Pass Izin Santri</h3>
                    <p className="text-emerald-100 text-xs font-medium mt-1">Pondok Pesantren Modern Al-Islam</p>
                </div>

                <div className="p-6 flex flex-col items-center">
                    {/* Area QR Code */}
                    <div className="bg-white p-3 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] mb-5 border-2 border-emerald-50">
                        <QRCodeCanvas
                            id="qr-canvas-izin"
                            value={dataIzin.kode} // Value yang akan discan oleh kamera
                            size={180}
                            level={"H"}
                            includeMargin={true}
                            fgColor={"#064e3b"} // Warna hijau gelap emerald-900
                        />
                    </div>
                    <div className="font-mono text-lg font-black text-emerald-700 tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100 mb-6">
                        {dataIzin.kode}
                    </div>

                    {/* Detail Informasi */}
                    <div className="w-full space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-3">
                            <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="font-bold text-gray-900">{dataIzin.nama}</div>
                                <div className="text-xs text-gray-500 font-medium">Kelas {dataIzin.kelas}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                            <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Batas Waktu</div>
                                <div className="font-semibold text-gray-800">{dataIzin.batasWaktu}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Tujuan / Faskes</div>
                                <div className="font-semibold text-gray-800">{dataIzin.tujuan || 'Tidak dicantumkan'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button onClick={unduhQRCode} className="w-full py-3 text-white font-bold bg-emerald-600 rounded-xl shadow-md hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
                        <Download size={18} /> Unduh Tiket QR
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalQR;