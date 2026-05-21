import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, AlertTriangle, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { User as UserType } from '../types';

interface SignupPageProps {
  currentUser: UserType | null;
  onSignupSuccess: () => void;
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
      throw new Error(err.error || 'Registration failed.');
    }
    return res.json();
  }
};

export const SignupPage: React.FC<SignupPageProps> = ({ currentUser, onSignupSuccess, showNotification }) => {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [agreeChecked, setAgreeChecked] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorStatus(lang === 'ru' ? 'Пожалуйста, заполните полностью все поля.' : 'All fields must be completely filled out.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorStatus(lang === 'ru' ? 'Введенные пароли не совпадают.' : 'Mismatching passwords parsed. Try again.');
      return;
    }
    if (!agreeChecked) {
      setErrorStatus(lang === 'ru' ? 'Вы должны согласиться с предупреждением.' : 'Confirmation of Terms consent is required.');
      return;
    }
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await api.post('/api/auth/register', { email, password });
      localStorage.setItem('token', data.token);
      showNotification(
        lang === 'ru' ? `Профиль успешно создан: ${email}!` : `Account created for ${email}! Welcome.`, 
        'success'
      );
      onSignupSuccess();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorStatus(err.message || 'Signup issue occurred');
      showNotification(err.message || 'Signup issue occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-signup-workspace" className="max-w-md w-full mx-auto my-12 bg-[#101626] border border-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 mb-3 shrink-0">
          <User className="w-6 h-6 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {lang === 'ru' ? 'Регистрация в сканере' : 'Create Free Scanner Profile'}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {lang === 'ru' ? 'Получите постоянный мониторинг лучших объемов и сигналов Polymarket.' : 'Get instant access to top Polymarket statistics and signals.'}
        </p>
      </div>

      {errorStatus && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-450 flex-shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="email" 
              placeholder="e.g. polymarket-guru@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition"
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
              placeholder={lang === 'ru' ? 'Минимум 6 символов' : 'Min. 6 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">{lang === 'ru' ? 'Подтвердите пароль' : 'Confirm Password'}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="password" 
              placeholder={lang === 'ru' ? 'Повторите пароль' : 'Repeat your password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0b0f19] border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition"
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-2.5 py-1">
          <input 
            type="checkbox" 
            id="agreeTerms"
            checked={agreeChecked}
            onChange={(e) => setAgreeChecked(e.target.checked)}
            className="mt-1 accent-cyan-500 shrink-0"
          />
          <label htmlFor="agreeTerms" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer select-none">
            {lang === 'ru' 
              ? 'Я подтверждаю, что этот аналитический трекер — демонстрационный MVP. Цифровые кошельки не подключаются.' 
              : 'I agree with the Disclaimer stating that all metrics and volumes are simulated for informational demonstration purposes.'
            }
          </label>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-sm h-11 rounded-xl shadow-lg shadow-cyan-500/15 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {lang === 'ru' ? 'Создать бесплатный профиль' : 'Create Free Scanner Profile'}
              <Check className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-xs text-gray-400">{lang === 'ru' ? 'Уже зарегистрированы?' : 'Already registered?'} </span>
        <Link to="/login" className="text-cyan-400 hover:text-cyan-350 text-xs font-bold underline transition">
          {lang === 'ru' ? 'Войти в аккаунт' : 'Log in instead'}
        </Link>
      </div>
    </div>
  );
};
