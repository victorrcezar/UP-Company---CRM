
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Typewriter Effect State
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  const navigate = useNavigate();
  
  const FULL_TEXT = "por trás dos Resultados.";

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Typewriter Logic
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= FULL_TEXT.length) {
        setDisplayedText(FULL_TEXT.slice(0, index));
        index++;
      } else {
        setIsTypingComplete(true);
        clearInterval(timer);
      }
    }, 100); // Velocidade da digitação
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
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
    <div className="min-h-screen bg-[#020617] relative flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- BACKGROUND DINÂMICO --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          {/* Grid Pattern Sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
          
          {/* Orbs de Luz (Mais suaves e integrados) */}
          <div className="absolute top-[-10%] left-[-10%] w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-blue-600/30 rounded-full blur-[60px] md:blur-[100px] animate-pulse mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-purple-600/20 rounded-full blur-[60px] md:blur-[100px] animate-pulse mix-blend-screen animation-delay-2000"></div>
          <div className="absolute top-[40%] left-[40%] w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-emerald-500/10 rounded-full blur-[40px] md:blur-[80px] animate-pulse mix-blend-screen animation-delay-4000"></div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center justify-items-center lg:justify-items-stretch">
        
        {/* Lado Esquerdo (Texto & Branding) */}
        {/* Mobile: Aparece PRIMEIRO (order-first) e centralizado. Desktop: Alinhado à esquerda. */}
        <div className="text-center lg:text-left space-y-4 md:space-y-6 order-first flex flex-col items-center lg:items-start max-w-lg lg:max-w-none">
            
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                A Estratégia <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                    {displayedText}
                </span>
                <span className={`inline-block w-1 h-6 sm:h-8 lg:h-12 ml-1 bg-blue-400 align-middle ${isTypingComplete ? 'animate-pulse' : 'animate-none'}`}></span>
            </h1>
            
            <p className="text-slate-400 text-sm sm:text-lg font-medium max-w-md mx-auto lg:mx-0 leading-relaxed animate-slide-up px-4 lg:px-0" style={{ animationDelay: '2s' }}>
                Potencialize seu time comercial. Centralize leads, automatize processos e escale suas vendas com a inteligência do UP! CRM.
            </p>

            {/* Ícones de feature - Escondidos em mobile muito pequeno para limpar a tela, visíveis em tablet/desktop */}
            <div className="hidden sm:flex items-center gap-4 md:gap-8 pt-2 md:pt-4 text-slate-500 text-xs md:text-sm font-semibold animate-fade-in justify-center lg:justify-start" style={{ animationDelay: '2.5s' }}>
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-500" /> Alta Performance
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-500" /> Dados Seguros
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-500" /> Suporte 24/7
                </div>
            </div>
        </div>

        {/* Lado Direito (Card de Login Glassmorphism) */}
        <div className="w-full max-w-md mx-auto animate-scale-up duration-700">
            <div className="relative group">
                {/* Glow Effect atrás do card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative w-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                    
                    {/* Header do Card */}
                    <div className="p-6 md:p-8 pb-0 text-center">
                        <div className="mb-4 md:mb-6 relative flex justify-center">
                            {/* Logo Maior e Transparente com Glow */}
                            <div className="relative z-10">
                                <img 
                                    src="https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png" 
                                    alt="UP!" 
                                    className="h-20 md:h-24 object-contain filter drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all"
                                />
                            </div>
                            {/* Brilho decorativo atrás da logo */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 rounded-full blur-xl"></div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">UP! CRM</h2>
                        <p className="text-slate-400 text-xs md:text-sm mt-2 font-medium tracking-wide">Acesse sua área de gestão estratégica.</p>
                    </div>

                    {/* Formulário */}
                    <div className="p-6 md:p-8">
                        <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="group/input">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 group-focus-within/input:text-blue-400 transition-colors">E-mail</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group/input">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 group-focus-within/input:text-blue-400 transition-colors">Senha</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                        </div>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
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
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>ACESSAR SISTEMA <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer do Card */}
                    <div className="bg-slate-950/30 p-4 text-center border-t border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            UP! Company © 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
