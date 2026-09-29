import React, { useState, useContext } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { login } = useContext(AuthContext);

    const DUMMY_DOMAIN = '@pondok.local';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const inputBersih = username.trim().toLowerCase();
            const emailBehindTheScenes = inputBersih.includes('@')
                ? inputBersih
                : `${inputBersih}${DUMMY_DOMAIN}`;

            // 1. Cek Kredensial Login
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: emailBehindTheScenes,
                password: password,
            });

            if (authError) throw authError;

            // 2. Ambil data profil HANYA kolom yang dibutuhkan agar lebih ringan
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, is_active, role, nama_lengkap')
                .eq('id', authData.user.id)
                .single();

            if (userError) throw userError;

            // Validasi Blokir Akun
            if (!userData.is_active) {
                supabase.auth.signOut(); // Keluarkan paksa di background
                throw new Error("Akun Anda telah dinonaktifkan oleh Administrator.");
            }

            // ==========================================
            // OPTIMASI TURBO: "FIRE AND FORGET"
            // Kita hilangkan 'await' agar aplikasi tidak menunggu proses nulis log ini selesai.
            // ==========================================
            supabase.from('audit_log').insert([{
                user_id: userData.id,
                aksi: 'LOGIN',
                tabel_terdampak: 'SISTEM',
                keterangan: `${userData.role.replace(/_/g, ' ')} ${userData.nama_lengkap} berhasil masuk ke sistem.`
            }]).then(); // .then() digunakan untuk mengeksekusi tanpa memblokir layar

            // 3. Masukkan data ke Global State -> Layar langsung loncat ke Dashboard!
            login({
                id: userData.id,
                name: userData.nama_lengkap,
                role: userData.role
            });

        } catch (error) {
            console.error("Login Error:", error);
            if (error.message.includes('Invalid login credentials')) {
                setErrorMsg('Gagal masuk: Periksa kembali username dan password Anda.');
            } else {
                setErrorMsg(error.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
            }
            setIsLoading(false); // Matikan loading hanya jika error
        }
        // Note: setIsLoading(false) dihilangkan dari finally agar loading terus berputar mulus sampai layar berganti
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Banner */}
                <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8"></div>

                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
                        <ShieldCheck size={32} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black text-white relative z-10">Sistem Perizinan</h1>
                    <p className="text-emerald-100 mt-1 font-medium relative z-10">PPM Al-Islam (V3.0)</p>
                </div>

                <div className="p-8">
                    {/* Pesan Error */}
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-100 animate-fade-in">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Input Username */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Contoh: admin atau walikelas7a"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all outline-none"
                                />
                                <User size={18} className="absolute left-4 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all outline-none"
                                />
                                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* Tombol Login */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2 mt-4
                                ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5'}`
                            }
                        >
                            {isLoading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
                            ) : (
                                'Masuk ke Sistem'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;