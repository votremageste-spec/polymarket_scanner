import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  XCircle, 
  Crown, 
  CreditCard, 
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { useI18n } from '../i18n';
import { User } from '../types';

interface PricingPageProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const api = {
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

export const PricingPage: React.FC<PricingPageProps> = ({ currentUser, onRefreshUser, showNotification }) => {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [submittingWaitlist, setSubmittingWaitlist] = useState<boolean>(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState<boolean>(false);

  const isPro = currentUser?.subscription_tier === 'pro';

  const handleUpgradeIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) {
      showNotification(lang === 'ru' ? 'Введите корректный email адрес.' : 'Please enter a valid email address.', 'error');
      return;
    }
    setSubmittingWaitlist(true);
    try {
      await api.post('/api/user/upgrade-intent', { email: waitlistEmail });
      showNotification(
        lang === 'ru'
          ? `Успешно! Доступ PRO активирован для ${waitlistEmail}`
          : `Simulated upgrade: ${waitlistEmail} is now PRO!`, 
        'success'
      );
      onRefreshUser();
      setIsWaitlistModalOpen(false);
      setWaitlistEmail('');
      navigate('/dashboard');
    } catch (err: any) {
      showNotification(err.message || 'Upgrade session failed.', 'error');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  return (
    <div id="pricing-tiers-page" className="space-y-8 max-w-4xl mx-auto my-4 px-2">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2.5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {t('pricing.headTitle')}
        </h1>
        <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
          {t('pricing.headSub')}
        </p>
      </div>

      {/* PLAN TIERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* FREE PLAN */}
        <div className="bg-[#101626]/70 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative shadow-lg">
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 bg-slate-900 text-slate-400 text-[9.5px] font-extrabold uppercase rounded-lg border border-gray-800 tracking-wider">
              {lang === 'ru' ? 'БАЗОВЫЙ ДОСТУП' : 'FREE FOR VIEWERS'}
            </span>
            <div>
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-xs text-gray-500 tracking-wide font-mono font-bold"> / {lang === 'ru' ? 'навсегда' : 'lifetime'}</span>
            </div>
            <p className="text-xs text-gray-300 leading-normal">
              {lang === 'ru' 
                ? 'Стандартные аналитические инструменты для ручного мониторинга спрэдов и прогнозов Polymarket.'
                : 'Basic analytical parameters suitable for visual evaluations of Polymarket spreads or historical price indexes.'
              }
            </p>
            
            <ul className="space-y-3.5 text-xs border-t border-gray-850 pt-5 text-slate-400 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {lang === 'ru' ? 'Лимит: 20 крупнейших рынков' : 'Limit top 20 markets loaded by size'}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {lang === 'ru' ? 'Интервал кэша: 60 секунд' : '60 seconds data refresh cache interval'}
              </li>
              <li className="flex items-center gap-2 text-gray-650 line-through">
                <XCircle className="w-4 h-4 text-rose-500/60 flex-shrink-0" />
                {t('pricing.featureTgAlerts')}
              </li>
              <li className="flex items-center gap-2 text-gray-650 line-through">
                <XCircle className="w-4 h-4 text-rose-500/60 flex-shrink-0" />
                {t('pricing.feature7dChart')}
              </li>
              <li className="flex items-center gap-2 text-gray-650 line-through">
                <XCircle className="w-4 h-4 text-rose-500/60 flex-shrink-0" />
                {t('pricing.featureCsv')}
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full mt-8 py-3 bg-slate-900 text-slate-550 border border-gray-800 text-xs font-bold rounded-xl cursor-not-allowed select-none transition"
          >
            {!isPro ? (lang === 'ru' ? 'Текущий тариф' : 'Current Active Tier') : (lang === 'ru' ? 'Неактивно' : 'Inactive')}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-[#101626] border-2 border-yellow-500 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative shadow-2xl">
          <div className="absolute -top-3 right-6 bg-yellow-500 text-black text-[9px] font-extrabold uppercase px-3 py-1 rounded-full font-mono tracking-widest leading-none shadow">
            {lang === 'ru' ? 'РЕКОМЕНДУЕМ' : 'Most Popular'}
          </div>
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 bg-yellow-950 text-yellow-500 text-[9.5px] font-extrabold uppercase rounded-lg border border-yellow-800/40 tracking-wider">
              {lang === 'ru' ? 'PRO-АНАЛИТИК' : 'PRO HIGH FREQUENCY'}
            </span>
            <div>
              <span className="text-4xl font-extrabold text-[#f1c40f]">$9</span>
              <span className="text-xs text-gray-500 tracking-wide font-mono font-bold"> / {lang === 'ru' ? 'месяц (Предзаказ)' : 'month USD (Waitlist)'}</span>
            </div>
            <p className="text-xs text-gray-300 leading-normal">
              {lang === 'ru'
                ? 'Высокочастотное отслеживание ликвидности в реальном времени для арбитража и трейдеров.'
                : 'High-frequency latency statistics tracking for active prediction volume scanners and arbitrage nodes.'
              }
            </p>
            
            <ul className="space-y-3.5 text-xs border-t border-gray-850 pt-5 text-slate-250 font-bold">
              <li className="flex items-center gap-2 text-white">
                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0 animate-pulse" />
                {lang === 'ru' ? 'Все 25+ рынков сканера' : 'Unlock all 25+ Polymarket lists (unlimited)'}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {lang === 'ru' ? 'Ультра-быстрое обновление кэша (15 сек)' : '15 seconds cached priority update update'}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {t('pricing.featureTgAlerts')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {t('pricing.feature7dChart')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {t('pricing.featureCsv')}
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                showNotification(t('modal.unauthText'), 'info');
                navigate('/signup');
                return;
              }
              setWaitlistEmail(currentUser.email);
              setIsWaitlistModalOpen(true);
            }}
            id="btn-upgrade-pro"
            className={`w-full mt-8 py-3 text-black font-extrabold text-xs rounded-xl tracking-wider uppercase transition shadow-md hover:brightness-110 active:scale-95 ${
              isPro
                ? 'bg-emerald-500 hover:bg-emerald-400'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-450'
            }`}
          >
            {isPro ? (lang === 'ru' ? '👑 Доступ PRO АКТИВЕН' : '👑 PRO Active (Simulation)') : t('pricing.upgradeProBtn')}
          </button>
        </div>

      </div>

      {/* MATRIX DETAILED COMPARISON TABLE */}
      <div id="pricing-matrix" className="bg-[#101626] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hidden sm:block">
        <div className="p-4 bg-gray-900/60 border-b border-gray-850">
          <h4 className="text-xs font-mono font-extrabold text-slate-400 uppercase tracking-widest">
            {lang === 'ru' ? 'Полная матрица сравнения тарифов' : 'Detailed Feature Comparison Matrix'}
          </h4>
        </div>
        <div className="divide-y divide-gray-850 text-xs">
          <div className="flex p-3.5 text-slate-500 font-mono text-[9.5px] uppercase font-bold">
            <div className="w-1/2">{lang === 'ru' ? 'Параметр сканера' : 'Scanners Parameter'}</div>
            <div className="w-1/4 text-center">{lang === 'ru' ? 'Бесплатный тариф' : 'Free Tier'}</div>
            <div className="w-1/4 text-center text-yellow-450">{lang === 'ru' ? 'PRO подписка' : 'PRO Plan'}</div>
          </div>
          <div className="flex p-3.5 items-center">
            <div className="w-1/2 text-gray-200 font-semibold">{lang === 'ru' ? 'Количество доступных рынков' : 'Loaded markets spec limit'}</div>
            <div className="w-1/4 text-center text-slate-400">20 {lang === 'ru' ? 'рынков' : 'top markets'}</div>
            <div className="w-1/4 text-center text-white font-bold">{lang === 'ru' ? 'Все 25+ рынков' : 'All 25+ (unlimited)'}</div>
          </div>
          <div className="flex p-3.5 items-center">
            <div className="w-1/2 text-gray-200 font-semibold">{lang === 'ru' ? 'Интервал обновления информации (кэш)' : 'Cache update frequency'}</div>
            <div className="w-1/4 text-center text-slate-400">60 {lang === 'ru' ? 'секунд' : 'seconds'}</div>
            <div className="w-1/4 text-center text-emerald-400 font-bold">15 {lang === 'ru' ? 'секунд (приоритет)' : 'seconds priority'}</div>
          </div>
          <div className="flex p-3.5 items-center">
            <div className="w-1/2 text-gray-200 font-semibold">{lang === 'ru' ? 'Настройка Telegram-оповещений' : 'Telegram push configuration'}</div>
            <div className="w-1/4 text-center text-slate-650">✕</div>
            <div className="w-1/4 text-center text-emerald-400 font-bold">✓ ({lang === 'ru' ? 'Безлимитно' : 'Unlimited'})</div>
          </div>
          <div className="flex p-3.5 items-center">
            <div className="w-1/2 text-gray-200 font-semibold">{lang === 'ru' ? 'Глубина истории графиков' : 'Detailed history tracking range'}</div>
            <div className="w-1/4 text-center text-slate-400">24 {lang === 'ru' ? 'часа' : 'hours'}</div>
            <div className="w-1/4 text-center text-white font-bold">7 {lang === 'ru' ? 'дней' : 'days interval'}</div>
          </div>
          <div className="flex p-3.5 items-center">
            <div className="w-1/2 text-gray-200 font-semibold">{lang === 'ru' ? 'Скачивание отчетов в CSV' : 'CSV file extraction triggers'}</div>
            <div className="w-1/4 text-center text-slate-650">✕</div>
            <div className="w-1/4 text-center text-emerald-400 font-bold">✓</div>
          </div>
        </div>
      </div>

      {/* STRIPE SIMULATION CHECKOUT */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#101626] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 shrink-0">
              <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-yellow-400" />
                {lang === 'ru' ? 'Интеграция пре-ордера Stripe' : 'Stripe Pre-Order Integration'}
              </h3>
              <button 
                onClick={() => setIsWaitlistModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-xs font-bold p-1.5 hover:bg-slate-800 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-normal">
              {lang === 'ru'
                ? 'Форма оплаты Stripe сейчас находится в режиме песочницы разработчика. Подтвердите ваш email ниже для мгновенного бесплатного повышения статуса до PRO.'
                : 'Stripe checkout is currently in developer sandbox testing mode. Provide or verify your pre-order email below to instantly upgrade to PRO in this simulated environment for portfolio demonstration purposes!'
              }
            </p>

            <form onSubmit={handleUpgradeIntent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase font-mono">{lang === 'ru' ? 'Email адрес для пре-ордера' : 'Pre-Order Email Address'}</label>
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-gray-800 focus:border-yellow-500 rounded-xl py-2 pl-3 pr-3 text-xs text-white placeholder-gray-500 outline-none transition"
                />
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/15 p-3 rounded-xl text-[10.5px] text-yellow-400/90 leading-relaxed font-mono">
                🔒 <strong>{lang === 'ru' ? 'Правило песочницы:' : 'Sandbox Rule:'}</strong> {lang === 'ru' ? 'После отправки формы статус аккаунта в базе данных будет изменен на PRO. Все премиальные функции станут доступны без реальной оплаты!' : 'By signing up, your user tier in the active db.json will be saved as subscription_tier: "pro". You will immediately gain access to all locked charts, filters, alerts, and extraction utilities without actual costs!'}
              </div>

              <div className="border-t border-gray-850 pt-3 flex items-center justify-end gap-3 shrink-0">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline mr-auto font-mono"
                >
                  {lang === 'ru' ? 'Доки биллинга' : 'Billing Docs'}
                </a>
                <button
                  type="button"
                  onClick={() => setIsWaitlistModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition bg-transparent rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingWaitlist}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-black text-xs font-bold rounded-lg transition"
                >
                  {submittingWaitlist ? (lang === 'ru' ? 'Активация...' : 'Upgrading...') : t('pricing.activateProBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
