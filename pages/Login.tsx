
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Se o usuário já estiver logado, redireciona para o dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simular delay de rede
    await new Promise(r => setTimeout(r, 800)); 
    
    const success = await login(email, password);
    if (success) {
        navigate('/');
    } else {
        setLoading(false);
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-up-dark flex items-center justify-center p-4 font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-up-deep rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="bg-up-dark p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <img 
                src="https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png" 
                alt="UP!" 
                className="h-14 mx-auto mb-6 object-contain relative z-10 filter drop-shadow-lg"
            />
            <h2 className="text-3xl font-black text-white relative z-10 tracking-tight">UP! CRM</h2>
            <p className="text-blue-200 text-sm mt-2 relative z-10 font-medium">Acesse sua área de gestão estratégica.</p>
        </div>

        {/* Body */}
        <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-4 rounded-xl text-center border border-red-100 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">E-mail</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                placeholder="seu@email.com"
                                required
                            />
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Senha de Acesso</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-up-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-3 hover:bg-up-accent hover:text-up-dark shadow-xl shadow-up-dark/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>ENTRAR <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </div>
            </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-slate-900/50 p-6 text-center border-t border-gray-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                UP! Company &copy; {new Date().getFullYear()}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
