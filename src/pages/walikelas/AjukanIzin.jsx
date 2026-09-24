import React, { useState, useEffect, useContext } from 'react';
import { Send, User, CalendarClock, FileText, AlertCircle, Info, Clock, CheckCircle, Users, Loader2, MapPin, Search, ChevronDown } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const AjukanIzin = () => {
    const { user } = useContext(AuthContext);

    // --- State Form ---
    const [santriTerpilih, setSantriTerpilih] = useState('');
    const [santriTerpilihObj, setSantriTerpilihObj] = useState(null);

    const [searchSantri, setSearchSantri] = useState('');
    const [isDropdownSantriBuka, setIsDropdownSantriBuka] = useState(false);

    const [jenisIzin, setJenisIzin] = useState('');
    const [penjemput, setPenjemput] = useState('');
    const [hubunganPenjemput, setHubunganPenjemput] = useState('');
    const [hubunganLainnya, setHubunganLainnya] = useState('');

    // STATE BARU: Tujuan
    const [tujuan, setTujuan] = useState('');
    const [alasan, setAlasan] = useState('');

    const [mulaiTanggal, setMulaiTanggal] = useState('');
    const [mulaiJam, setMulaiJam] = useState('');
    const [batasTanggal, setBatasTanggal] = useState('');
    const [batasJam, setBatasJam] = useState('');

    // --- State Database ---
    const [namaKelas, setNamaKelas] = useState('-');
    const [daftarSantri, setDaftarSantri] = useState([]);
    const [isLoadingSantri, setIsLoadingSantri] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Ambil Data Kelas & Santri Perwalian ---
    useEffect(() => {
        if (user && user.id) {
            fetchDataPerwalian();
        }
    }, [user]);

    const fetchDataPerwalian = async () => {
        setIsLoadingSantri(true);
        setErrorMsg('');
        try {
            const { data: kelasData, error: kelasErr } = await supabase
                .from('kelas')
                .select('id, nama_kelas')
                .eq('wali_kelas_id', user.id)
                .single();

            if (kelasErr) throw kelasErr;

            if (kelasData) {
                setNamaKelas(kelasData.nama_kelas);
                const { data: santriData, error: santriErr } = await supabase
                    .from('santri')
                    .select('id, nama_lengkap, status_asrama, kelas (nama_kelas)')
                    .eq('kelas_id', kelasData.id)
                    .order('nama_lengkap', { ascending: true });

                if (santriErr) throw santriErr;

                // Tambahkan field dummy trackRecord agar struktur sama persis dgn panel lain
                const formattedSantri = (santriData || []).map(s => ({
                    ...s,
                    kelas: s.kelas?.nama_kelas || kelasData.nama_kelas,
                    trackRecord: { totalIzinBulanIni: 0, totalTerlambat: 0 }
                }));

                setDaftarSantri(formattedSantri);
            }
        } catch (error) {
            console.error("Gagal mengambil data perwalian:", error);
            setErrorMsg("Gagal memuat daftar santri kelas Anda.");
        } finally {
            setIsLoadingSantri(false);
        }
    };

    const santriTampil = daftarSantri.filter(s =>
        s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase())
    );

    // --- Proses Simpan Ajuan Izin ke Supabase ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validasi ekstra untuk 'tujuan'
        if (!santriTerpilih || !jenisIzin || !penjemput || !tujuan || !alasan || !mulaiTanggal || !mulaiJam) {
            return alert("Mohon lengkapi semua formulir pengajuan izin dengan benar.");
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const detailPenjemput = hubunganPenjemput === 'Lainnya' ? hubunganLainnya : hubunganPenjemput;

            const waktuBerangkatIso = new Date(`${mulaiTanggal}T${mulaiJam}:00`).toISOString();
            let batasWaktuIso = null;
            if (jenisIzin === 'PULANG_PERGI_WALI') {
                const jamBatas = batasJam ? batasJam : '23:59';
                batasWaktuIso = new Date(`${mulaiTanggal}T${jamBatas}:00`).toISOString();
            } else {
                const tglBatas = batasTanggal ? batasTanggal : mulaiTanggal;
                const jamBatas = batasJam ? batasJam : '17:00';
                batasWaktuIso = new Date(`${tglBatas}T${jamBatas}:00`).toISOString();
            }

            const kodeUnik = `IZN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // 1. Simpan ke database dengan memetakan kolom `tujuan`, `penjemput`, dan `hubungan_penjemput` secara bersih
            const { data: izinData, error: izinErr } = await supabase
                .from('perizinan')
                .insert([{
                    kode_izin: kodeUnik,
                    santri_id: santriTerpilih,
                    jenis_izin: jenisIzin,
                    alasan: alasan, // Alasan sekarang murni hanya narasi (tanpa bracket)
                    tujuan: tujuan, // Disimpan ke kolom baru
                    penjemput: penjemput,
                    hubungan_penjemput: detailPenjemput,
                    waktu_berangkat: waktuBerangkatIso,
                    batas_waktu: batasWaktuIso,
                    status: 'MENUNGGU_PERSETUJUAN',
                    pengaju_id: user.id
                }])
                .select()
                .single();

            if (izinErr) throw izinErr;

            await supabase.from('audit_log').insert([{
                user_id: user.id,
                aksi: 'AJUKAN_IZIN',
                tabel_terdampak: 'perizinan',
                data_id: izinData.id,
                keterangan: `Walikelas ${user.name} mengajukan izin (${jenisIzin.replace(/_/g, ' ')}) untuk santri ${santriTerpilihObj?.nama_lengkap || 'Santri'} tujuan ${tujuan}.`
            }]);

            setIsSuccess(true);
        } catch (error) {
            console.error("Gagal mengirim ajuan izin:", error);
            setErrorMsg("Gagal mengirim ajuan izin ke server: " + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPenuh = () => {
        setIsSuccess(false);
        setSantriTerpilih(''); setSantriTerpilihObj(null); setSearchSantri('');
        setJenisIzin(''); setPenjemput(''); setTujuan(''); setAlasan('');
        setHubunganPenjemput(''); setHubunganLainnya('');
        setMulaiTanggal(''); setMulaiJam(''); setBatasTanggal(''); setBatasJam('');
    };

    return (
        <div className="animate-fade-in-down p-2 md:p-6 pb-24 max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Send className="text-emerald-600" /> Ajukan Izin Santri
                </h2>
                <p className="text-gray-500 text-sm mt-1">Formulir pengajuan izin khusus untuk santri perwalian Anda (Kelas {namaKelas}).</p>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold mb-6">
                    {errorMsg}
                </div>
            )}

            {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-emerald-800 mb-2">Pengajuan Berhasil Dikirim!</h3>
                    <p className="text-emerald-600 text-sm mb-6">Ajuan izin sedang diteruskan ke Sekretaris Mudir untuk proses persetujuan.</p>
                    <button onClick={resetPenuh} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">
                        Ajukan Izin Lainnya
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {isDropdownSantriBuka && <div className="fixed inset-0 z-10" onClick={() => setIsDropdownSantriBuka(false)}></div>}

                    <div className="bg-blue-50/50 border-b border-blue-100 p-4 flex items-start gap-3 relative z-0">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <strong>Standar Operasional (SOP):</strong> Pengajuan ini akan masuk ke antrean <b>Sekretaris Mudir</b>. Santri tidak diperkenankan menuju Pos Kesantrian sebelum status izin disetujui.
                        </div>
                    </div>

                    <div className="p-6 space-y-6 relative z-20">
                        {/* 1. Pilih Santri & Penjemput */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <User size={16} className="text-emerald-600" /> Nama Santri
                                </label>
                                <div className="relative">
                                    <div onClick={() => setIsDropdownSantriBuka(!isDropdownSantriBuka)} className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm transition-all cursor-pointer flex justify-between items-center ${isDropdownSantriBuka ? 'border-emerald-500 ring-2 ring-emerald-100 bg-white' : 'border-gray-200 hover:border-emerald-300'}`}>
                                        {isLoadingSantri ? (
                                            <div className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin text-emerald-500" /> Memuat data...</div>
                                        ) : santriTerpilihObj ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{santriTerpilihObj.nama_lengkap}</span>
                                                <span className="text-[10px] text-gray-500 uppercase mt-0.5">Kelas {santriTerpilihObj.kelas}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-- Cari Nama Santri --</span>
                                        )}
                                        {!isLoadingSantri && <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownSantriBuka ? 'rotate-180' : ''}`} />}
                                    </div>
                                    {isDropdownSantriBuka && !isLoadingSantri && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down">
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <div className="relative">
                                                    <input type="text" placeholder="Ketik untuk mencari..." value={searchSantri} onChange={(e) => setSearchSantri(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" autoFocus />
                                                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-1">
                                                {santriTampil.map(santri => (
                                                    <div key={santri.id} onClick={() => { setSantriTerpilih(santri.id); setSantriTerpilihObj(santri); setIsDropdownSantriBuka(false); setSearchSantri(''); }} className="p-3 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 flex justify-between items-center">
                                                        <div>
                                                            <div className="font-bold text-gray-800">{santri.nama_lengkap}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Kelas {santri.kelas}</div>
                                                        </div>
                                                        {santri.status_asrama === 'DI_LUAR' && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded-full uppercase border border-purple-200">Di Luar</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {santriTerpilihObj && santriTerpilihObj.status_asrama === 'DI_LUAR' && (
                                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 p-3 rounded-xl animate-fade-in">
                                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-700 leading-relaxed font-medium">
                                            <b>Perhatian:</b> Santri ini terpantau sedang berada di luar (izin aktif). Pastikan kembali status kepulangannya.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Users size={16} className="text-emerald-600" /> Nama Penjemput
                                </label>
                                <input required type="text" value={penjemput} onChange={(e) => setPenjemput(e.target.value)} placeholder="Contoh: Bapak Haryanto" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all h-[46px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 relative z-0">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hubungan Penjemput</label>
                                <select required value={hubunganPenjemput} onChange={(e) => { setHubunganPenjemput(e.target.value); if (e.target.value !== 'Lainnya') setHubunganLainnya(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all h-[46px]">
                                    <option value="" disabled>-- Pilih Hubungan --</option>
                                    <option value="Ayah">Ayah</option>
                                    <option value="Ibu">Ibu</option>
                                    <option value="Kakak Kandung">Kakak Kandung</option>
                                    <option value="Adik Kandung">Adik Kandung</option>
                                    <option value="Kakek">Kakek</option>
                                    <option value="Nenek">Nenek</option>
                                    <option value="Paman">Paman</option>
                                    <option value="Bibi">Bibi</option>
                                    <option value="Lainnya">Lainnya...</option>
                                </select>
                            </div>
                            {hubunganPenjemput === 'Lainnya' ? (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Sebutkan Hubungan <span className="text-red-500">*</span></label>
                                    <input required type="text" value={hubunganLainnya} onChange={(e) => setHubunganLainnya(e.target.value)} placeholder="Contoh: Sopir Keluarga, Tetangga..." className="w-full px-4 py-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm transition-all h-[46px]" />
                                </div>
                            ) : <div></div>}
                        </div>

                        {/* 2. Jenis Izin, Tujuan & Alasan */}
                        <div className="border-t border-gray-100 pt-6 relative z-0">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><FileText size={16} className="text-purple-600" /> Kategori Izin, Tujuan & Alasan</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'PULANG_MENGINAP_WALI' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200'}`}>
                                    <input type="radio" name="jenisIzin" value="PULANG_MENGINAP_WALI" onChange={(e) => { setJenisIzin(e.target.value); setBatasTanggal(''); }} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Izin Pulang (Menginap)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Menginap di rumah / luar asrama.</div>
                                    </div>
                                    {jenisIzin === 'PULANG_MENGINAP_WALI' && <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />}
                                </label>
                                <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all ${jenisIzin === 'PULANG_PERGI_WALI' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200'}`}>
                                    <input type="radio" name="jenisIzin" value="PULANG_PERGI_WALI" onChange={(e) => setJenisIzin(e.target.value)} className="hidden" required />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">Izin Keluar (Pulang Pergi)</div>
                                        <div className="text-[11px] text-gray-500 mt-1">Kembali di hari yang sama.</div>
                                    </div>
                                    {jenisIzin === 'PULANG_PERGI_WALI' && <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />}
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> Kota / Alamat Tujuan <span className="text-red-500">*</span></label>
                                <input required type="text" value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="Contoh: Kuningan / Jakarta / Hajatan di Tegal" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm transition-all" />
                            </div>

                            <textarea required value={alasan} onChange={(e) => setAlasan(e.target.value)} rows="3" placeholder="Jelaskan alasan izin secara rinci..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all resize-none"></textarea>
                        </div>

                        {/* 3. Rentang Waktu Perizinan */}
                        <div className="border-t border-gray-100 pt-6 relative z-0">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4"><CalendarClock size={16} className="text-amber-600" /> Jadwal Perizinan</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3">Waktu Keberangkatan</label>
                                    <div className="space-y-3">
                                        <input required type="date" value={mulaiTanggal} onChange={(e) => setMulaiTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        <div className="relative">
                                            <input required type="time" value={mulaiJam} onChange={(e) => setMulaiJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                                    <label className="block text-[11px] font-black text-amber-700 uppercase tracking-wider mb-3">Batas Waktu Kembali</label>
                                    <div className="space-y-3">
                                        {jenisIzin === 'PULANG_PERGI_WALI' ? (
                                            <div className="w-full px-4 py-2.5 bg-amber-100/50 border border-amber-200/50 rounded-lg text-sm text-amber-800 font-medium flex items-center h-[42px]">
                                                {mulaiTanggal ? `Di hari yang sama (${mulaiTanggal})` : 'Sama dengan tanggal keberangkatan'}
                                            </div>
                                        ) : (
                                            <input required type="date" value={batasTanggal} onChange={(e) => setBatasTanggal(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                        )}
                                        <div className="relative">
                                            <input required type="time" value={batasJam} onChange={(e) => setBatasJam(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between relative z-0">
                        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle size={14} /> Pastikan data yang dimasukkan sudah benar.
                        </div>
                        <button type="submit" disabled={isSubmitting || !santriTerpilih} className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${isSubmitting || !santriTerpilih ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memproses...</>
                            ) : (
                                <><Send size={16} /> Kirim Pengajuan</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AjukanIzin;