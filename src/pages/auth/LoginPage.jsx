import React, { useState, useContext } from 'react';
import { FileText } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { AuthContext } from '../../App'; // Mengambil context dari App.jsx

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pesanError, setPesanError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setPesanError('');
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (authError) throw authError;

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('nama_lengkap, role')
                .eq('id', authData.user.id)
                .single();
            if (profileError) throw profileError;

            login({
                name: profileData.nama_lengkap,
                role: profileData.role
            });
        } catch (error) {
            setPesanError('Gagal masuk: Periksa kembali email dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-down">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
                    <FileText size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">PPM Al-Islam</h2>
                <p className="mt-2 text-sm text-gray-600">Sistem Perizinan Santri Non-Jumat (V3)</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {pesanError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 font-medium text-center">
                                {pesanError}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" placeholder="admin@alislam.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-70 transition-colors">
                            {isLoading ? 'Memeriksa Data...' : 'Masuk Sistem'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;