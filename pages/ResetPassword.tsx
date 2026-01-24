
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

const ResetPassword = () => {
  const { verifyResetCode, confirmReset, logout } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
      // Garante que o usuário está deslogado para evitar conflitos de sessão
      logout();

      // Tenta extrair o oobCode de múltiplos lugares possíveis na URL
      const getOobCode = () => {
          // 1. Tenta pegar da query string principal (ex: domain.com/?oobCode=xyz#/reset)
          const rootParams = new URLSearchParams(window.location.search);
          const rootCode = rootParams.get('oobCode');
          if (rootCode) return rootCode;

          // 2. Tenta pegar da hash query string (ex: domain.com/#/reset?oobCode=xyz)
          const hashParts = window.location.hash.split('?');
          if (hashParts.length > 1) {
              const hashParams = new URLSearchParams(hashParts[1]);
              return hashParams.get('oobCode');
          }
          return null;
      };

      const foundCode = getOobCode();
      if (foundCode) {
          setCode(foundCode);
          validateCode(foundCode);
      } else {
          setVerifying(false);
          setError('Link de redefinição inválido ou incompleto.');
      }
  }, []);

  const validateCode = async (c: string) => {
      setVerifying(true);
      const email = await verifyResetCode(c);
      setVerifying(false);
      
      if (email) {
          setUserEmail(email);
      } else {
          setError('Este link de recuperação expirou ou já foi utilizado. Por favor, solicite um novo.');
          setCode(null); // Invalida o código no state
      }
  };

  const handleGoToLogin = () => {
      // IMPORTANTE: Redirecionamento forçado via window.location para limpar 
      // a query string (?oobCode=...) da URL. Se usarmos apenas navigate(), 
      // o App.tsx continuará detectando o modo de reset e impedirá o login.
      window.location.href = window.location.origin + window.location.pathname;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!code) {
          setError('Código de validação não encontrado.');
          return;
      }

      // Sanitização: Remove espaços em branco antes de validar/enviar
      // Isso é CRUCIAL para evitar que "senha123 " (com espaço) seja salva
      // e o usuário tente logar com "senha123" e receba erro.
      const cleanPassword = password.trim();
      const cleanConfirm = confirmPassword.trim();

      if (cleanPassword.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres.');
          return;
      }

      if (cleanPassword !== cleanConfirm) {
          setError('As senhas não coincidem.');
          return;
      }

      setLoading(true);
      const errorCode = await confirmReset(code, cleanPassword);
      setLoading(false);

      if (errorCode === null) {
          setSuccess(true);
          // Redireciona automaticamente após 3 segundos
          setTimeout(handleGoToLogin, 3000);
      } else {
          switch (errorCode) {
              case 'auth/expired-action-code':
                  setError('Este link expirou. Por favor, solicite uma nova redefinição de senha.');
                  break;
              case 'auth/invalid-action-code':
                  setError('Este link é inválido ou já foi utilizado.');
                  break;
              case 'auth/user-disabled':
                  setError('O usuário associado a este link foi desativado.');
                  break;
              case 'auth/user-not-found':
                  setError('Usuário não encontrado.');
                  break;
              case 'auth/weak-password':
                  setError('A senha escolhida é muito fraca. Tente uma senha mais complexa.');
                  break;
              default:
                  setError('Ocorreu um erro ao redefinir a senha. Tente novamente ou solicite um novo link.');
          }
      }
  };

  // TELA DE SUCESSO
  if (success) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center animate-scale-up">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-6">
                    <CheckCircle2 size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Senha Atualizada!</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Sua senha foi alterada com sucesso. A senha antiga foi invalidada.
                </p>
                <button 
                    onClick={handleGoToLogin}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                    Ir para Login Agora
                </button>
            </div>
        </div>
      );
  }

  // TELA DE VERIFICAÇÃO (LOADING INICIAL)
  if (verifying) {
      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="text-blue-500 animate-spin" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Validando Link de Segurança...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative flex items-center justify-center p-4 font-sans overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="p-8 pb-0 text-center">
                    <img 
                        src="https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png" 
                        alt="UP!" 
                        className="h-16 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Nova Senha</h2>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Defina sua nova credencial de acesso.</p>
                </div>

                <div className="p-8">
                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-6 rounded-xl flex flex-col items-center gap-3 mb-6 animate-shake text-center">
                            <AlertCircle size={32} className="mb-2" /> 
                            <span className="text-sm">{error}</span>
                            <button
                                type="button" 
                                onClick={handleGoToLogin}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Voltar para Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {userEmail && (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-lg">
                                        <Mail size={16} className="text-blue-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conta Identificada</p>
                                        <p className="text-sm text-white font-medium truncate">{userEmail}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nova Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                                        placeholder="Repita a senha"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || !userEmail}
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Redefinir Senha</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResetPassword;
