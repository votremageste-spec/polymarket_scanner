import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { User } from '../types';

interface LoginPageProps {
  currentUser: User | null;
  onLoginSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const api = {
  post: async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authorization credentials failed.');
    }
    return res.json();
  }
};

export const LoginPage: React.FC<LoginPageProps> = ({ currentUser, onLoginSuccess, showNotification }) => {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorStatus(lang === 'ru' ? 'Заполните все доступные поля.' : 'Please fully populate both fields.');
      return;
    }
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      showNotification(
        lang === 'ru' ? `С возвращением, ${email}!` : `Welcome back, ${email}!`, 
        'success'
      );
      onLoginSuccess();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorStatus(err.message || 'Authorization failed.');
      showNotification(err.message || 'Error logging in', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-login-workspace" className="max-w-md w-full mx-auto my-12 bg-[#101626] border border-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 mb-3 shrink-0">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {lang === 'ru' ? 'Вход в систему аналитики' : 'Access Analytics Panel'}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {lang === 'ru' ? 'Введите ваши учетные данные для доступа к сканеру.' : 'Provide your credentials to look at real-time stats.'}
        </p>
      </div>

      {errorStatus && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-450 flex-shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="email" 
              placeholder="e.g. trader@polymarket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-650 outline-none transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">{lang === 'ru' ? 'Пароль' : 'Password'}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-800 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm h-11 rounded-xl shadow-lg shadow-emerald-500/10 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {lang === 'ru' ? 'Войти в панель приборов' : 'Sign In to Dashboard'}
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-xs text-gray-400">{lang === 'ru' ? 'Впервые на сканере?' : 'New to Scanner Platform?'} </span>
        <Link to="/signup" className="text-emerald-400 hover:text-emerald-350 text-xs font-bold underline transition">
          {lang === 'ru' ? 'Создать бесплатный аккаунт' : 'Create free account'}
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-800/60 text-center">
        <div className="inline-block bg-slate-900/40 rounded-xl p-3.5 text-[10.5px] text-gray-500 leading-normal max-w-sm text-left">
          💡 <strong className="text-slate-350 font-semibold">{lang === 'ru' ? 'Внимание:' : 'Notice:'}</strong> {lang === 'ru' ? 'Аккаунт нужен исключительно для сохранения настроек и демонстрации Pro-лимитов в рамках MVP. Финансовые средства не участвуют.' : 'An account is solely required to persist configurations and simulate PRO tier boundaries. Real financial instruments are never deployed.'}
        </div>
      </div>
    </div>
  );
};
