import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Bell, 
  CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useI18n } from '../i18n';
import { Market, User } from '../types';

interface MarketDetailPageProps {
  currentUser: User | null;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

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

export const MarketDetailPage: React.FC<MarketDetailPageProps> = ({ currentUser, showNotification }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useI18n();

  // Core States
  const [market, setMarket] = useState<Market | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState<'24h' | '7d'>('24h');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Modal Subscription state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [submittingAlert, setSubmittingAlert] = useState<boolean>(false);

  const isPro = currentUser?.subscription_tier === 'pro';

  // Load Market details
  const loadSpecifications = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorStatus(null);
    try {
      // Fetch details
      const detail = await api.get(`/api/markets/${id}`);
      setMarket(detail);

      // Fetch history points based on active configuration
      const hoursToQuery = historyPeriod === '24h' ? 24 : 168;
      const historyRes = await api.get(`/api/markets/${id}/history?hours=${hoursToQuery}`);
      if (historyRes && historyRes.history) {
        setHistoryData(historyRes.history);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Market failed to resolve.');
    } finally {
      setLoading(false);
    }
  }, [id, historyPeriod]);

  useEffect(() => {
    loadSpecifications();
  }, [loadSpecifications]);

  // Request Telegram Alert node
  const handleAlertRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramChatId) {
      showNotification(lang === 'ru' ? 'Введите ваш Chat ID в Telegram.' : 'Provide your verification Telegram Chat ID.', 'error');
      return;
    }
    if (!currentUser) {
      showNotification(t('modal.unauthTitle'), 'info');
      navigate('/login');
      return;
    }
    if (!isPro) {
      showNotification(t('modal.alertsLockedText'), 'error');
      setIsAlertModalOpen(false);
      navigate('/pricing');
      return;
    }

    setSubmittingAlert(true);
    try {
      await api.post('/api/alerts/subscribe', {
        marketId: id,
        telegramChatId
      });
      showNotification(
        lang === 'ru' 
          ? `Успешно! Оповещения будут отправлены в Telegram: ${telegramChatId}.`
          : `Registered! Alerts will be pushed to Telegram Node: ${telegramChatId}.`, 
        'success'
      );
      setIsAlertModalOpen(false);
      setTelegramChatId('');
    } catch (err: any) {
      showNotification(err.message || 'Failed to dispatch alert subscription.', 'error');
    } finally {
      setSubmittingAlert(false);
    }
  };

  // Switch Period on Chart
  const switchPeriod = (period: '24h' | '7d') => {
    if (period === '7d' && !isPro) {
      showNotification(t('modal.chartLockedText'), 'error');
      navigate('/pricing');
      return;
    }
    setHistoryPeriod(period);
  };

  if (loading) {
    return (
      <div className="bg-[#101626] border border-gray-800 rounded-2xl p-16 text-center max-w-2xl mx-auto my-8">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs font-mono text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (errorStatus || !market) {
    return (
      <div className="bg-[#101626] border border-rose-950 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-450 mx-auto mb-3 animate-bounce" />
        <h3 className="text-lg font-bold text-white mb-2">{lang === 'ru' ? 'Рыночные показатели не найдены' : 'Market indicators not found'}</h3>
        <p className="text-xs text-rose-300">{errorStatus || 'The requested prediction ticker was not located.'}</p>
        <Link to="/dashboard" className="inline-block mt-4 text-xs bg-slate-850 hover:bg-slate-800 px-4 py-2 rounded-lg text-white font-semibold transition">
          {t('detail.backDashboard')}
        </Link>
      </div>
    );
  }

  const volumeStr = `$${market.volume24h.toLocaleString()}`;
  const depthStr = `$${market.depth2c.toLocaleString()}`;
  const spreadPercent = (market.spread * 100).toFixed(2) + '%';
  const midPrice = (((market.orderbook.bids[0]?.price || 0) + (market.orderbook.asks[0]?.price || 0)) / 2).toFixed(2);

  return (
    <div id="market-detail-workspace" className="space-y-6">
      
      {/* 1. BREADCRUMBS & NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-gray-500 uppercase">
          <Link to="/dashboard" className="hover:text-emerald-400 transition">{lang === 'ru' ? 'Сканер' : 'Scanner'}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-300 truncate max-w-[120px] sm:max-w-xs">{market.id}</span>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 hover:text-white border border-gray-800 px-3.5 py-2 rounded-xl text-xs text-gray-300 transition shadow">
          <ArrowLeft className="w-4 h-4 text-gray-400" />
          {t('detail.backDashboard')}
        </Link>
      </div>

      {/* 2. SPEC SHEET HEADLINE BRAND */}
      <div className="bg-[#101626] border border-gray-850 rounded-2xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 blur-3xl pointer-events-none"></div>
        <div className="relative space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 text-[9.5px] font-extrabold uppercase font-mono tracking-widest rounded-md">
              {market.category}
            </span>
            <span className="px-2.5 py-0.5 bg-gray-900 border border-gray-800 text-[9.5px] font-mono rounded-md text-gray-400 uppercase">
              ID: {market.id}
            </span>
            {market.isHighSpread ? (
              <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-455 border border-rose-800/40 text-[9.5px] font-mono font-extrabold rounded-md animate-pulse">
                ⚡ {t('detail.critical')}
              </span>
            ) : market.isLowLiquidity ? (
              <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-800/40 text-[9.5px] font-mono font-bold rounded-md">
                ▲ {t('detail.attention')}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[9.5px] font-mono font-bold rounded-md">
                ✓ {t('detail.stable')}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {market.question}
          </h1>
          <p className="text-xs text-gray-400 max-w-4xl leading-relaxed">
            {market.description}
          </p>
        </div>
      </div>

      {/* 3. COLUMNS WRAPPER */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: VISUALIZATIONS */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* CHART AREA */}
          <div className="bg-[#101626] border border-gray-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                  {t('detail.yesFluctuations')}
                </h3>
                <p className="text-[10px] text-gray-500">
                  {t('detail.fluctuationSub')}
                </p>
              </div>
              
              <div className="flex gap-1 bg-[#0b0f19] p-1 border border-gray-850 rounded-lg shrink-0">
                <button
                  onClick={() => switchPeriod('24h')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition ${
                     historyPeriod === '24h' 
                      ? 'bg-emerald-500 text-black shadow font-extrabold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('detail.toggle24h')}
                </button>
                <button
                  onClick={() => switchPeriod('7d')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 transition ${
                     historyPeriod === '7d' 
                      ? 'bg-emerald-500 text-black shadow font-extrabold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('detail.toggle7d')}
                  {!isPro && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                </button>
              </div>
            </div>

            {/* Price Cards Summary row */}
            <div className="py-2 flex items-baseline gap-4 border-b border-gray-850">
              <span className="text-3xl md:text-4xl font-extrabold text-[#00ffcc] font-mono tracking-tight">
                YES {market.yesPrice.toFixed(2)}¢
              </span>
              <span className="text-base md:text-lg font-mono text-gray-500">
                NO {market.noPrice.toFixed(2)}¢
              </span>
              <span className={`text-xs font-mono font-bold flex items-center gap-1 ${market.yesPrice >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {market.yesPrice >= 0.5 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {market.yesPrice >= 0.5 ? '+3.4%' : '-2.9%'} ({lang === 'ru' ? '24ч симуляция' : '24h simulation'})
              </span>
            </div>

            {/* Recharts Wrapper */}
            <div className="h-64 mt-4 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161e32" />
                  <XAxis dataKey="time" stroke="#5d6980" />
                  <YAxis domain={[0.01, 0.99]} tickCount={5} stroke="#5d6980" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#101626', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ color: '#64748b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, stroke: '#064e3b', strokeWidth: 1 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* SIMULATED ORDER BOOK MATRIX */}
          <div className="bg-[#101626] border border-gray-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
            
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                {lang === 'ru' ? 'Структура ордеров (Orderbook Depth)' : 'Order Depth Matrix'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {lang === 'ru' 
                  ? 'Симулированный стакан заявок, отображающий 5 лучших ценовых предложений YES контракта.'
                  : 'Real-time simulated orderbook containing top 5 limit order bids and asks on current YES outcome.'
                }
              </p>
            </div>

            {market.spread > 0.05 && (
              <div className="p-3 bg-rose-500/10 border border-rose-800/40 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-pulse font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
                <span>{t('detail.spreadGapWarning')} ({t('table.spread')}: {spreadPercent})</span>
              </div>
            )}

            {/* Bids/Asks Splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Bids Column */}
              <div className="bg-[#0b0f19] border border-gray-850 rounded-xl overflow-hidden p-3.5 space-y-3">
                <div className="px-1 flex items-center justify-between border-b border-gray-800 pb-1.5 shrink-0">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                    {t('detail.bidTitle')}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{t('detail.bidsCount', { count: 5 })}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex border-b border-gray-900 pb-1 text-[10px] text-slate-500 font-mono uppercase">
                    <div className="w-1/3">{t('detail.priceCol')}</div>
                    <div className="w-1/3 text-right">{t('detail.volumeCol')}</div>
                    <div className="w-1/3 text-right">{t('detail.totalCol')}</div>
                  </div>
                  {market.orderbook.bids.map((b: any, idx: number) => (
                    <div key={idx} className="flex relative items-center py-1 font-mono text-[11px] text-slate-300 z-10 transition">
                      <div className="absolute top-0 bottom-0 left-0 bg-emerald-500/5 -z-10 rounded transition-all" style={{ width: `${Math.min(b.volume / 250, 100)}%` }}></div>
                      <div className="w-1/3 font-bold text-emerald-400">{b.price.toFixed(2)}¢</div>
                      <div className="w-1/3 text-right text-gray-450">{b.volume.toLocaleString()}</div>
                      <div className="w-1/3 text-right">${b.total.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asks Column */}
              <div className="bg-[#0b0f19] border border-gray-850 rounded-xl overflow-hidden p-3.5 space-y-3">
                <div className="px-1 flex items-center justify-between border-b border-gray-800 pb-1.5 shrink-0">
                  <span className="text-xs font-bold text-rose-455 flex items-center gap-1 uppercase tracking-wider">
                    {t('detail.askTitle')}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">{t('detail.bidsCount', { count: 5 })}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex border-b border-gray-900 pb-1 text-[10px] text-slate-500 font-mono uppercase">
                    <div className="w-1/3">{t('detail.priceCol')}</div>
                    <div className="w-1/3 text-right">{t('detail.volumeCol')}</div>
                    <div className="w-1/3 text-right">{t('detail.totalCol')}</div>
                  </div>
                  {market.orderbook.asks.map((a: any, idx: number) => (
                    <div key={idx} className="flex relative items-center py-1 font-mono text-[11px] text-slate-300 z-10 transition">
                      <div className="absolute top-0 bottom-0 right-0 bg-rose-500/5 -z-10 rounded transition-all" style={{ width: `${Math.min(a.volume / 250, 100)}%` }}></div>
                      <div className="w-1/3 font-bold text-rose-450">{a.price.toFixed(2)}¢</div>
                      <div className="w-1/3 text-right text-gray-450">{a.volume.toLocaleString()}</div>
                      <div className="w-1/3 text-right">${a.total.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ANALYTICS SHEET */}
        <div className="w-full lg:w-1/3 space-y-6">
          
          {/* STATS SUMMARY BOX */}
          <div className="bg-[#101626] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono border-b border-gray-850 pb-2.5">
              {t('detail.metricsPanelTitle')}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0b0f19] border border-gray-850 rounded-xl p-3 text-center">
                <span className="text-[9.5px] text-slate-500 block font-mono uppercase leading-tight">{t('table.spread')}</span>
                <span className={`text-lg font-mono font-extrabold block mt-1.5 ${market.isHighSpread ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {spreadPercent}
                </span>
              </div>
              <div className="bg-[#0b0f19] border border-gray-850 rounded-xl p-3 text-center">
                <span className="text-[9.5px] text-slate-500 block font-mono uppercase leading-tight">{t('table.depth2c')}</span>
                <span className={`text-lg font-mono font-extrabold block mt-1.5 ${market.isLowLiquidity ? 'text-amber-400' : 'text-white'}`}>
                  {depthStr}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('detail.bestBid')}</span>
                <strong className="text-white font-mono">{market.orderbook.bids[0]?.price.toFixed(2) || '0.00'}¢</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('detail.bestAsk')}</span>
                <strong className="text-white font-mono">{market.orderbook.asks[0]?.price.toFixed(2) || '0.00'}¢</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('detail.midPrice')}</span>
                <strong className="text-emerald-400 font-mono">
                  {midPrice}¢
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('detail.traded24h')}</span>
                <strong className="text-slate-200 font-mono">{volumeStr}</strong>
              </div>
            </div>

          </div>

          {/* TELEGRAM SUBSCRIPTION ALERT CARD */}
          <div className="bg-[#111c30] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
                <Bell className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h4 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">
                  {t('detail.telegramBoxTitle')}
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  {t('detail.telegramBoxSub')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  showNotification(t('modal.unauthText'), 'info');
                  navigate('/login');
                  return;
                }
                setIsAlertModalOpen(true);
              }}
              id="btn-alert-subscribe"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold text-xs rounded-xl shadow-md hover:brightness-110 shadow-cyan-500/5 select-none transition"
            >
              {lang === 'ru' ? 'Настроить Telegram оповещение' : 'Configure Telegram Alarm'}
            </button>
          </div>

        </div>

      </div>

      {/* OVERLAY TELEGRAM ALERTS POPUP FORM */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101626] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 shrink-0">
              <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                {t('modal.alertSubTitle')}
              </h3>
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-xs font-bold uppercase p-1.5 hover:bg-slate-800 rounded"
              >
                ✕
              </button>
            </div>

            {!isPro ? (
              <div className="space-y-4 py-2 text-center sm:text-left">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-250 text-xs">
                  <span className="flex items-center gap-1.1 text-amber-400 font-bold mb-1.5 uppercase font-mono">
                    <Lock className="w-4 h-4" />
                    {t('pricing.lockedFeature')}
                  </span>
                  {t('modal.alertsLockedText')}
                </div>
                <button
                  onClick={() => {
                    setIsAlertModalOpen(false);
                    navigate('/pricing');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase py-2.5 rounded-xl transition"
                >
                  {t('pricing.upgradeProBtn')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAlertRegistration} className="space-y-4">
                <p className="text-xs text-slate-300 leading-normal">
                  {lang === 'ru' 
                    ? `Вы вошли как PRO-аналитик. Вы настраиваете уведомления для рынка ` 
                    : `You are logged in as a PRO analyst. Setup triggers for `}
                  <strong className="text-emerald-400 font-mono">{market.id}</strong>.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase font-mono">{t('modal.tgIdLabel')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('settings.tgPlaceholder')}
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-gray-800 focus:border-cyan-500 rounded-xl py-2 pl-3 pr-3 text-xs text-white placeholder-gray-500 outline-none transition"
                  />
                  <span className="text-[10px] text-gray-500 block">
                    {t('modal.tgIdHint')}
                  </span>
                </div>

                <div className="border-t border-gray-850 pt-3 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAlertModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-slate-200 transition bg-transparent rounded-lg"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAlert}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold rounded-lg transition"
                  >
                    {submittingAlert ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
