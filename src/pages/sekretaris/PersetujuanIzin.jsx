import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, CheckSquare, XSquare, Clock, User, CalendarClock, Check, CheckCircle2, MapPin, Car, History, ArrowRight, Home, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const PersetujuanIzin = () => {
    const { user } = useContext(AuthContext);

    // --- State Modals & Bulk ---
    const [isModalApproveBuka, setIsModalApproveBuka] = useState(false);
    const [isModalRejectBuka, setIsModalRejectBuka] = useState(false);
    const [isModalBulkBuka, setIsModalBulkBuka] = useState(false);

    const [selectedAjuan, setSelectedAjuan] = useState(null);
    const [alasanTolak, setAlasanTolak] = useState('');
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
            // Relasi ke tabel 'users' via pengaju_id diaktifkan kembali
            const { data, error } = await supabase
                .from('perizinan')
                .select(`
                    id, kode_izin, jenis_izin, alasan, penjemput, hubungan_penjemput, 
                    waktu_berangkat, batas_waktu, status, created_at, parent_izin_id,
                    santri (
                        id, nama_lengkap,
                        kelas ( nama_kelas )
                    ),
                    pengaju:users!perizinan_pengaju_id_fkey ( nama_lengkap, role )
                `)
                .eq('status', 'MENUNGGU_PERSETUJUAN')
                .order('created_at', { ascending: true }); // Antrean terlama di atas

            if (error) throw error;

            // Mapping Data
            const formatted = data.map(item => {
                const isPerpanjangan = item.parent_izin_id !== null;
                const tipeLabel = isPerpanjangan ? 'PERPANJANGAN' : 'IZIN BARU';

                let alasanBersih = item.alasan || '';
                let kotaAsal = 'Ponpes (Cirebon)';
                let kotaTujuan = item.jenis_izin.includes('KLINIK') ? 'RS/Faskes Luar' : 'Rumah/Domisili';

                // Ambil data penjemput dari Database (jika diisi)
                let finalPenjemput = item.penjemput ? (item.hubungan_penjemput ? `${item.penjemput} (${item.hubungan_penjemput})` : item.penjemput) : '-';

                // Parsing Info Tambahan (Kurung Siku) dari form Walikelas & Klinik
                const bracketMatch = alasanBersih.match(/\[(.*?)\]/);
                if (bracketMatch) {
                    const extraInfo = bracketMatch[1];
                    alasanBersih = alasanBersih.replace(bracketMatch[0], '').trim();

                    if (extraInfo.includes('Tujuan:')) {
                        kotaTujuan = extraInfo.split('Tujuan:')[1].split(',')[0].trim();
                    }
                    if (extraInfo.includes('Penjemput:') && finalPenjemput === '-') {
                        finalPenjemput = extraInfo.split('Penjemput:')[1].split(',')[0].trim();
                    }
                    // Khusus format form Klinik
                    if (extraInfo.includes('Pendamping PP:') && finalPenjemput === '-') {
                        finalPenjemput = extraInfo.split('Pendamping PP:')[1].split(',')[0].trim() + ' (Petugas)';
                    }
                    if (extraInfo.includes('Dirujuk Rawat Inap')) {
                        kotaTujuan = 'Rujuk Rawat Inap Medis';
                        if (finalPenjemput === '-') finalPenjemput = 'Petugas Klinik / Ambulans';
                    }
                }

                // Tentukan Pengaju dari relasi tabel users
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
                    pengaju: namaPengaju, // Akan tampil: "Ustadz Budi (Walikelas)" atau "Dr. Tirta (Klinik)"
                    waktuAjuan: new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
                    alasan: alasanBersih || 'Tanpa keterangan tambahan',
                    jadwalAwal: isPerpanjangan ? 'Sedang memuat data awal...' : null,
                    jadwalBatasBaru: item.batas_waktu,
                    jadwal: `Keberangkatan: ${new Date(item.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}\nKembali: ${item.batas_waktu ? new Date(item.batas_waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}`,
                    penjemput: finalPenjemput,
                    kotaAsal: kotaAsal,
                    kotaTujuan: kotaTujuan,
                    trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 },
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
        setIsModalApproveBuka(true);
    };

    const bukaModalReject = (e, ajuan) => {
        e.stopPropagation();
        setSelectedAjuan(ajuan);
        setAlasanTolak('');
        setIsModalRejectBuka(true);
    };

    // FUNGSI EKSEKUSI DATABASE
    const handleProsesSingle = async (aksi) => {
        setIsProcessing(true);
        try {
            const isApprove = aksi === 'APPROVE';
            const statusBaru = isApprove ? 'DISETUJUI' : 'DITOLAK';

            // 1. Update status tabel perizinan
            const { error: updateErr } = await supabase
                .from('perizinan')
                .update({
                    status: statusBaru,
                    disetujui_oleh: user.id,
                    catatan_penolakan: !isApprove ? alasanTolak : null
                })
                .eq('id', selectedAjuan.id);

            if (updateErr) throw updateErr;

            // 2. Tulis ke Audit Log
            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: isApprove ? 'SETUJUI_IZIN' : 'TOLAK_IZIN',
                tabel_terdampak: 'perizinan',
                data_id: selectedAjuan.id,
                keterangan: `Sekretaris Mudir ${isApprove ? 'Menyetujui' : 'Menolak'} pengajuan ${selectedAjuan.kode} untuk ${selectedAjuan.nama}. ${!isApprove ? 'Alasan: ' + alasanTolak : ''}`
            }]);

            // 3. Update UI state (hilangkan dari antrean)
            setAntreanAjuan(prev => prev.filter(item => item.id !== selectedAjuan.id));
            setSelectedIds(prev => prev.filter(id => id !== selectedAjuan.id));

            setIsModalApproveBuka(false);
            setIsModalRejectBuka(false);

        } catch (error) {
            console.error("Gagal memproses perizinan:", error);
            alert("Gagal menyimpan ke database. Coba lagi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProsesBulk = async () => {
        setIsProcessing(true);
        try {
            // Loop untuk mengupdate banyak ID sekaligus
            for (const id of selectedIds) {
                await supabase
                    .from('perizinan')
                    .update({ status: 'DISETUJUI', disetujui_oleh: user.id })
                    .eq('id', id);

                await supabase.from('audit_log').insert([{
                    user_id: user.id,
                    aksi: 'SETUJUI_IZIN_MASSAL',
                    tabel_terdampak: 'perizinan',
                    data_id: id,
                    keterangan: `Sekretaris Mudir menyetujui izin ini secara massal (Bulk Approve).`
                }]);
            }

            // Bersihkan antrean UI
            setAntreanAjuan(prev => prev.filter(item => !selectedIds.includes(item.id)));
            setSelectedIds([]);
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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600" />
                            Persetujuan Izin (Approval)
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Evaluasi pengajuan izin santri yang diteruskan oleh Walikelas dan Klinik.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                        <Clock className="text-amber-500" size={18} />
                        <span className="text-sm font-bold text-amber-700">{antreanAjuan.length} Menunggu</span>
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
                                    {/* Info Santri Utama */}
                                    <div className="mb-4 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 text-lg leading-tight">{ajuan.nama}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-emerald-600">Kelas {ajuan.kelas}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[11px] font-medium text-gray-500">Pengaju: {ajuan.pengaju}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visualisasi Penjemput & Rute */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <Car size={14} /> Penjemput
                                            </div>
                                            <div className="text-xs font-semibold text-gray-800">{ajuan.penjemput}</div>
                                        </div>
                                        <div className="h-px bg-gray-200/60 w-full"></div>
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

                                    {/* Peringatan Track Record */}
                                    {(ajuan.trackRecord.totalIzinBulanIni > 2 || ajuan.trackRecord.totalTerlambat > 0) && (
                                        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                                            <History size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                            <div className="text-[10px] text-red-700 leading-tight font-medium">
                                                <b>Perhatian:</b> Bulan ini sudah izin {ajuan.trackRecord.totalIzinBulanIni}x
                                                {ajuan.trackRecord.totalTerlambat > 0 ? ` & punya riwayat ${ajuan.trackRecord.totalTerlambat}x terlambat.` : '.'}
                                            </div>
                                        </div>
                                    )}

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
                                                    <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Jadwal Awal</span>
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
                            onClick={() => setIsModalBulkBuka(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-colors shadow-lg"
                        >
                            <CheckCircle2 size={16} /> Setujui Semua
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Approve Single */}
            {isModalApproveBuka && selectedAjuan && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !isProcessing && setIsModalApproveBuka(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-emerald-50">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><CheckSquare size={20} /></div>
                            <h3 className="font-bold text-emerald-900 text-lg">Konfirmasi Persetujuan</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Anda yakin ingin menyetujui pengajuan izin ini? Data persetujuan akan langsung tercatat di sistem Security (Satpam).</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2 mb-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Santri:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.nama} <span className="font-normal text-gray-500">({selectedAjuan.kelas})</span></span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tipe:</span>
                                    <span className="font-bold text-gray-800">{selectedAjuan.tipe}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    <span className="text-gray-500 text-xs block mb-1 font-bold">{selectedAjuan.tipe === 'PERPANJANGAN' ? 'Waktu Diperpanjang Menjadi:' : 'Batas Waktu Kepulangan:'}</span>
                                    <span className="font-mono text-sm font-bold text-emerald-700 block whitespace-pre-line">{selectedAjuan.jadwalBatasBaru ? new Date(selectedAjuan.jadwalBatasBaru).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB' : '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-red-50">
                            <div className="w-10 h-10 rounded-full bg-red-200 text-red-700 flex items-center justify-center"><XSquare size={20} /></div>
                            <h3 className="font-bold text-red-900 text-lg">Tolak Pengajuan</h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 text-sm">
                                Menolak pengajuan <span className="font-bold text-gray-900">{selectedAjuan.nama}</span>.
                            </div>
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
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100 shadow-inner">
                                <span className="text-4xl font-black">{selectedIds.length}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 leading-relaxed">Anda akan menyetujui <b className="text-emerald-700 text-base">{selectedIds.length} pengajuan izin</b> secara bersamaan.</p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 flex gap-2 text-left">
                                <AlertCircle className="text-amber-500 flex-shrink-0" size={16} />
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">Pastikan Anda telah membaca sekilas alasan setiap ajuan sebelum menyetujuinya secara massal. Tindakan ini akan dicatat di log audit.</p>
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