import React, { useState, useEffect, useCallback } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate, 
  useLocation
} from 'react-router-dom';
import {
  Activity, 
  Lock, 
  User, 
  Crown, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Cpu,
  Globe2
} from 'lucide-react';
import { User as UserType } from './types';
import { I18nProvider, useI18n } from './i18n';

// Import our beautifully modularized pages
import { DashboardPage } from './pages/DashboardPage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Simple direct HTTP fetch helper to communicate with our Express background container
const api = {
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server request failed');
    }
    return res.json();
  },
  post: async (url: string, body: any) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server request failed');
    }
    return res.json();
  }
};

function InnerApp() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [globalNotification, setGlobalNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { lang, setLanguage, t } = useI18n();

  // Trigger temporary notification banner
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setGlobalNotification({ message, type });
    setTimeout(() => {
      setGlobalNotification(null);
    }, 4500);
  }, []);

  // Fetch verified profile from Backend if token exists
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingUser(false);
      return;
    }
    try {
      const data = await api.get('/api/user/me');
      if (data && data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error('Failed to load profile from active token.', e);
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Logouts of the application
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    showNotification(lang === 'ru' ? 'Вы успешно вышли из системы.' : 'Logged out successfully.', 'info');
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 font-mono text-xs">{lang === 'ru' ? 'Запуск алгоритмов сканера...' : 'Initializing scan algorithms...'}</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        globalNotification={globalNotification} 
        setGlobalNotification={setGlobalNotification} 
        showNotification={showNotification} 
        onRefreshUser={fetchProfile}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} showNotification={showNotification} />} />
          <Route path="/market/:id" element={<MarketDetailPage currentUser={currentUser} showNotification={showNotification} />} />
          <Route path="/pricing" element={<PricingPage currentUser={currentUser} onRefreshUser={fetchProfile} showNotification={showNotification} />} />
          <Route path="/login" element={<LoginPage currentUser={currentUser} onLoginSuccess={fetchProfile} showNotification={showNotification} />} />
          <Route path="/signup" element={<SignupPage currentUser={currentUser} onSignupSuccess={fetchProfile} showNotification={showNotification} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <InnerApp />
    </I18nProvider>
  );
}

// -----------------------------------------------------
// GLOBAL LAYOUT CONTAINER
// -----------------------------------------------------
interface LayoutProps {
  children: React.ReactNode;
  currentUser: UserType | null;
  onLogout: () => void;
  globalNotification: { message: string; type: 'success' | 'error' | 'info' } | null;
  setGlobalNotification: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'info' } | null>>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshUser: () => void;
}

function Layout({ children, currentUser, onLogout, globalNotification, setGlobalNotification, showNotification, onRefreshUser }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLanguage, t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0b0f19] text-gray-100 selection:bg-emerald-500 selection:text-black">
      
      {/* GLOBAL NOTIFICATION FLASHER */}
      {globalNotification && (
        <div id="toast" className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${
          globalNotification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' : 
          globalNotification.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' : 
          'bg-slate-900/90 border-slate-700 text-slate-205'
        } transition-all duration-300 animate-slide-down`}>
          {globalNotification.type === 'success' && <CheckCircle className="text-emerald-400 w-5 h-5" />}
          {globalNotification.type === 'error' && <XCircle className="text-rose-400 w-5 h-5" />}
          {globalNotification.type === 'info' && <Bell className="text-slate-400 w-5 h-5" />}
          <span className="text-xs font-semibold">{globalNotification.message}</span>
        </div>
      )}

      {/* STICKY TOP HEADER */}
      <header id="app-header" className="sticky top-0 z-40 bg-[#0e1626]/90 backdrop-blur-md border-b border-gray-800/80 px-4 md:px-8 py-3.5 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/10 overflow-hidden">
              <Activity className="w-5 h-5 text-black" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <span className="font-semibold text-sm md:text-base text-white tracking-tight block">Polymarket Scanner</span>
              <span className="text-[9.5px] text-emerald-400 font-mono tracking-widest block uppercase leading-none mt-0.5">Liquidity Monitor</span>
            </div>
          </Link>

          {/* Central Auth Guided Navigation */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-gray-900/40 p-1 rounded-xl border border-gray-850">
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition ${
                  location.pathname === '/dashboard' || location.pathname.startsWith('/market')
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('nav.scanner')}
              </Link>
              <Link 
                to="/pricing" 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition ${
                  location.pathname === '/pricing'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                {t('nav.pricing')}
              </Link>
            </nav>
          )}

          {/* Right Action Button Control Controls */}
          <div className="flex items-center gap-3">
            
            {/* Language switch button */}
            <button
              onClick={() => setLanguage(lang === 'ru' ? 'en' : 'ru')}
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на Русский'}
              className="px-2.5 py-1.5 hover:bg-gray-800 text-[10px] font-mono rounded-lg text-slate-300 font-bold border border-gray-850 hover:text-white transition flex items-center gap-1 shrink-0 uppercase"
            >
              <Globe2 className="w-3.5 h-3.5" />
              {lang === 'en' ? 'RU' : 'EN'}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 shrink-0">
                
                {/* User Info Bar and Tier Selector Badge */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-slate-300 font-semibold">{currentUser.email}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {currentUser.subscription_tier === 'pro' ? (
                      <span className="inline-flex items-center gap-1 text-[9.5px] bg-yellow-950/80 text-yellow-405 font-bold px-2 py-0.5 rounded-full border border-yellow-800/50 animate-pulse">
                        <Crown className="w-3 h-3 text-yellow-400" />
                        PRO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full border border-slate-800">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulated Quick Toggler */}
                <button 
                  onClick={async () => {
                    if (currentUser.subscription_tier === 'free') {
                      await api.post('/api/user/upgrade-intent', { email: currentUser.email });
                      onRefreshUser();
                      showNotification(
                        lang === 'ru' 
                          ? 'PRO статус успешно активирован в песочнице!' 
                          : 'Upgraded to simulation PRO plan instantly for sandbox testing!', 
                        'success'
                      );
                    } else {
                      showNotification(
                        lang === 'ru' 
                          ? 'У вас уже активен PRO статус.' 
                          : 'You are already PRO. Clear local storage to reset state.', 
                        'info'
                      );
                    }
                  }}
                  title={lang === 'ru' ? 'Включить PRO режим для тестирования' : 'Simulate Upgrade Key Toggle'}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold transition flex items-center gap-1.5 ${
                    currentUser.subscription_tier === 'free' 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-350 border border-amber-500/35 animate-pulse' 
                      : 'bg-[#152e42]/60 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  {currentUser.subscription_tier === 'free' ? (lang === 'ru' ? 'Активировать PRO' : 'Simulate API PRO') : (lang === 'ru' ? 'PRO Активен' : 'PRO Active')}
                </button>

                {/* Logout Button */}
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-gray-800/80 transition"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login" className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-white transition">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-extrabold rounded-lg shadow-md hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-95 duration-150">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* TOP FREE WARNING PROMPT COMPONENT */}
      {currentUser && currentUser.subscription_tier === 'free' && (
        <div id="free-top-prompt" className="bg-gradient-to-r from-amber-950/70 via-amber-900/60 to-red-950/70 py-3 px-4 border-b border-amber-800/30 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 flex items-center justify-center p-1 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                <Crown className="w-3.5 h-3.5 animate-bounce" />
              </span>
              <p className="text-xs text-amber-200">
                {t('warningBar.freeMode')} <strong className="text-white font-semibold">{t('warningBar.limits')}</strong>
              </p>
            </div>
            <Link to="/pricing" className="bg-amber-450 hover:bg-amber-350 text-black text-[10.5px] font-extrabold px-3.5 py-1.5 text-center rounded-lg uppercase tracking-wider transition font-mono">
              {lang === 'ru' ? 'Получить PRO' : 'Upgrade to PRO'}
            </Link>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT BODY */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* DESIGN COMPLIANT FOOTER */}
      <footer id="app-footer" className="bg-black/30 border-t border-gray-900 py-8 px-4 text-center mt-12">
        <div className="max-w-7xl mx-auto space-y-3.5 text-xs">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Polymarket Liquidity Scanner MVP</p>
          <p className="text-[11px] text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {t('legal.disclaimerContent')}
          </p>
          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-500">
            <span className="hover:text-gray-300 transition cursor-pointer">{t('legal.termsTitle')}</span>
            <span className="hover:text-gray-300 transition cursor-pointer">{t('legal.privacyTitle')}</span>
            <span className="hover:text-amber-400 transition cursor-pointer font-mono font-bold">Stripe Sandbox Access</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
