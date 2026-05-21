import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Lock, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Bell, 
  ChevronRight, 
  CheckCircle, 
  TrendingDown, 
  HelpCircle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  Crown
} from 'lucide-react';
import { useI18n } from '../i18n';
import { Market, Signal, User } from '../types';

interface DashboardPageProps {
  currentUser: User | null;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Global API direct Fetch helper
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, showNotification }) => {
  const navigate = useNavigate();
  const { lang, t } = useI18n();

  // Primary states
  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [lowLiquidityOnly, setLowLiquidityOnly] = useState<boolean>(false);
  const [spreadThreshold, setSpreadThreshold] = useState<string>('all'); // 'all', '1', '2', '5'
  const [depthThreshold, setDepthThreshold] = useState<string>('all'); // 'all', '2000', '5000', '10000'

  // Tooltips hover state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isPro = currentUser?.subscription_tier === 'pro';

  // Load Markets and Recent Alerts
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      // 1. Fetch Markets with category filters
      const mData = await api.get(`/api/markets?category=${categoryFilter}`);
      if (mData && mData.markets) {
        setMarkets(mData.markets);
      }

      // 2. Fetch Signals
      const sData = await api.get('/api/signals');
      if (sData && sData.signals) {
        setSignals(sData.signals);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error occurred fetching data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle countdown Timer according to Free (60s) / Pro (15s) refresh rate
  useEffect(() => {
    const defaultSecs = isPro ? 15 : 60;
    setRefreshCountdown(defaultSecs);

    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          loadData(true);
          return defaultSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPro, loadData]);

  // Filter & Search Logic
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // 1. Title/Description Query search
      const matchSearch = 
        m.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Risk Level filter
      let matchRisk = true;
      if (riskLevelFilter === 'healthy') {
        matchRisk = !m.isHighSpread && !m.isLowLiquidity;
      } else if (riskLevelFilter === 'watch') {
        matchRisk = m.isLowLiquidity && !m.isHighSpread;
      } else if (riskLevelFilter === 'critical') {
        matchRisk = m.isHighSpread;
      }

      // 3. Low Liquidity Only
      let matchLowLiq = true;
      if (lowLiquidityOnly) {
        matchLowLiq = m.isLowLiquidity;
      }

      // 4. Spread Threshold
      let matchSpread = true;
      if (spreadThreshold === '1') {
        matchSpread = m.spread >= 0.01;
      } else if (spreadThreshold === '2') {
        matchSpread = m.spread >= 0.02;
      } else if (spreadThreshold === '5') {
        matchSpread = m.spread >= 0.05;
      }

      // 5. Depth Threshold
      let matchDepth = true;
      if (depthThreshold === '2000') {
        matchDepth = m.depth2c < 2000;
      } else if (depthThreshold === '5000') {
        matchDepth = m.depth2c < 5000;
      } else if (depthThreshold === '10000') {
        matchDepth = m.depth2c < 10000;
      }

      return matchSearch && matchRisk && matchLowLiq && matchSpread && matchDepth;
    });
  }, [markets, searchQuery, riskLevelFilter, lowLiquidityOnly, spreadThreshold, depthThreshold]);

  // Math calculated metrics for Cards
  const totalCount = markets.length;
  const criticalSpreadsCount = useMemo(() => {
    return markets.filter(m => m.isHighSpread).length;
  }, [markets]);

  const activeSignalsCount = useMemo(() => {
    return signals.length || 9;
  }, [signals]);

  // Reset Filters trigger
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setRiskLevelFilter('all');
    setLowLiquidityOnly(false);
    setSpreadThreshold('all');
    setDepthThreshold('all');
    showNotification(lang === 'ru' ? 'Фильтры успешно сброшены' : 'Filters reset successfully', 'info');
  };

  // CSV Exporter
  const handleCSVExport = () => {
    if (!currentUser) {
      showNotification(t('modal.unauthTitle'), 'info');
      navigate('/login');
      return;
    }
    if (!isPro) {
      showNotification(t('modal.csvLockedText'), 'error');
      navigate('/pricing');
      return;
    }

    // Export Logic
    const headers = 'Market ID,Question,Category,YES Price,Spread %,2c Depth ($),Volume 24h\n';
    const rows = filteredMarkets.map(m => 
      `"${m.id}","${m.question.replace(/"/g, '""')}","${m.category}",${m.yesPrice},${(m.spread * 100).toFixed(2)}%,${m.depth2c},${m.volume24h}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `polymarket_liquidity_scan_${categoryFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(lang === 'ru' ? 'Экспорт CSV скачан успешно' : 'CSV Export downloaded successfully', 'success');
  };

  // Safe toggler for Low Liquidity
  const handleLowLiqToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      showNotification(t('modal.unauthTitle'), 'info');
      navigate('/login');
      return;
    }
    if (!isPro) {
      showNotification(t('modal.alertsLockedText'), 'error');
      navigate('/pricing');
      return;
    }
    setLowLiquidityOnly(e.target.checked);
  };

  return (
    <div id="scanner-dashboard" className="space-y-6">

      {/* 1. HERO BRAND BOX */}
      {!currentUser && (
        <div className="bg-[#10192d] border border-gray-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/20 font-mono tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {t('hero.badge')}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{t('hero.title')}</h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-2xl leading-relaxed">
              {t('hero.description')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10">
            <Link 
              to="/signup" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold rounded-xl shadow-lg shadow-emerald-400/10 hover:brightness-110 transition duration-200"
            >
              {t('hero.startFree')}
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/how-it-works" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-gray-800/80 transition duration-200"
            >
              {t('hero.howItWorksLink')}
            </Link>
          </div>
        </div>
      )}

      {/* 2. WELCOME LOGGED IN BANNER */}
      {currentUser && (
        <div className="bg-gradient-to-r from-gray-900 via-[#111827] to-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              {lang === 'ru' ? 'Добро пожаловать,' : 'Welcome back,'} <span className="text-emerald-400">{currentUser.email}</span>!
              {isPro && (
                <span className="inline-flex text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-extrabold items-center gap-1 animate-pulse">
                  <Crown className="w-3 h-3" />
                  {t('common.pro')}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              {isPro 
                ? t('settings.tgSuccess') + ' ' + (lang === 'ru' ? 'Приоритетный доступ к API включен.' : 'Priority API access activated.')
                : t('warningBar.limits')
              }
            </p>
          </div>
          {!isPro && (
            <Link 
              to="/pricing" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold rounded-lg shadow-md hover:brightness-110 active:scale-95 transition tracking-wide"
            >
              <Crown className="w-4 h-4 fill-black animate-bounce" />
              {lang === 'ru' ? 'АКТИВИРОВАТЬ PRO ДОСТУП' : 'UPGRADE TO PRO SCANNER'}
            </Link>
          )}
        </div>
      )}

      {/* 3. FREE LIMITS WARNING STRIP */}
      {(!currentUser || currentUser.subscription_tier === 'free') && (
        <div id="free-mode-banner" className="bg-gradient-to-r from-amber-950/40 via-[#1c140a] to-amber-950/40 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 mt-0.5">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {t('warningBar.freeMode')} {t('warningBar.limits')}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('warningBar.upgradeCta')}
              </p>
            </div>
          </div>
          <Link 
            to="/pricing" 
            className="text-center bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold px-4 py-2 rounded-xl transition duration-150 uppercase"
          >
            {lang === 'ru' ? 'Снять ограничения' : 'Remove Limits'}
          </Link>
        </div>
      )}

      {/* 4. DYNAMIC DECK METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div id="card-tracked-markets" className="bg-[#111625] border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow relative group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono uppercase tracking-wider">{t('metrics.trackedMarkets')}</span>
              <span className="text-lg font-extrabold text-white block">{totalCount || 25}</span>
            </div>
          </div>
          <button 
            onMouseEnter={() => setActiveTooltip('tracked')}
            onMouseLeave={() => setActiveTooltip(null)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {activeTooltip === 'tracked' && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-gray-700 text-[11px] text-gray-300 p-2.5 rounded-lg shadow-xl z-30 font-sans leading-normal">
              {t('metrics.trackedMarketsTooltip')}
            </div>
          )}
        </div>

        {/* Metric 2 */}
        <div id="card-critical-spreads" className="bg-[#111625] border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow relative group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-450 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono uppercase tracking-wider">{t('metrics.criticalSpreads')}</span>
              <span className="text-lg font-extrabold text-rose-400 block">{criticalSpreadsCount} {lang === 'ru' ? 'рынков' : 'Markets'}</span>
            </div>
          </div>
          <button 
            onMouseEnter={() => setActiveTooltip('spreads')}
            onMouseLeave={() => setActiveTooltip(null)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {activeTooltip === 'spreads' && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-gray-700 text-[11px] text-gray-300 p-2.5 rounded-lg shadow-xl z-30 font-sans leading-normal">
              {t('metrics.criticalSpreadsTooltip')}
            </div>
          )}
        </div>

        {/* Metric 3 */}
        <div id="card-refresh-rate" className="bg-[#111625] border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow relative group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono uppercase tracking-wider">{t('metrics.refreshDelay')}</span>
              <span className="text-sm font-extrabold text-white block flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                {refreshCountdown}s ({isPro ? t('metrics.secondsPro') : t('metrics.secondsFree')})
              </span>
            </div>
          </div>
          <button 
            onMouseEnter={() => setActiveTooltip('refresh')}
            onMouseLeave={() => setActiveTooltip(null)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {activeTooltip === 'refresh' && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-gray-700 text-[11px] text-gray-300 p-2.5 rounded-lg shadow-xl z-30 font-sans leading-normal">
              {t('metrics.refreshDelayTooltip')}
            </div>
          )}
        </div>

        {/* Metric 4 */}
        <div id="card-active-signals" className="bg-[#111625] border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow relative group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Bell className="w-5 h-5 text-purple-400 animate-swing" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono uppercase tracking-wider">{t('metrics.activeSignals')}</span>
              <span className="text-lg font-extrabold text-white block">{activeSignalsCount} {lang === 'ru' ? 'сигналов' : 'Active'}</span>
            </div>
          </div>
          <button 
            onMouseEnter={() => setActiveTooltip('signals')}
            onMouseLeave={() => setActiveTooltip(null)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {activeTooltip === 'signals' && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-gray-700 text-[11px] text-gray-300 p-2.5 rounded-lg shadow-xl z-30 font-sans leading-normal">
              {t('metrics.activeSignalsTooltip')}
            </div>
          )}
        </div>
      </div>

      {/* 5. INTERACTIVE SPLIT WORKSPACE */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* 5A. FILTER PANEL AND MAIN TABLE */}
        <div className="w-full lg:w-3/4 space-y-4">
          
          {/* CONTROL BAR */}
          <div className="bg-[#101626] border border-gray-850 rounded-xl p-4 space-y-4 shadow-md">
            
            {/* Filter Row 1: Search & Category Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: t('filters.allCategories') },
                  { key: 'politics', label: t('filters.politics') },
                  { key: 'crypto', label: t('filters.crypto') },
                  { key: 'other', label: t('filters.other') }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setCategoryFilter(tab.key)}
                    id={`tab-category-${tab.key}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-155 ${
                      categoryFilter === tab.key
                        ? 'bg-emerald-500 text-black shadow font-extrabold'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text Search */}
              <div className="relative flex-grow max-w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-gray-800 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 outline-none transition"
                />
              </div>
            </div>

            {/* Filter Row 2: Deep Liquidity / Custom Filters */}
            <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-gray-850/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
              
              {/* Risk Filter */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5">{t('filters.riskLevel')}</label>
                <select
                  value={riskLevelFilter}
                  onChange={(e) => setRiskLevelFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
                >
                  <option value="all">✕ {t('common.all')}</option>
                  <option value="healthy">✓ {t('table.badgeHealthy')}</option>
                  <option value="watch">▲ {t('table.badgeWatch')}</option>
                  <option value="critical">⚡ {t('table.badgeHighSpread')}</option>
                </select>
              </div>

              {/* Spread Threshold Filter */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5">{t('filters.spreadThreshold')}</label>
                <select
                  value={spreadThreshold}
                  onChange={(e) => setSpreadThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
                >
                  <option value="all">{t('filters.anyspread')}</option>
                  <option value="1">&gt; 1.0%</option>
                  <option value="2">&gt; 2.0%</option>
                  <option value="5">&gt; 5.0% {lang === 'ru' ? '(Критич)' : '(Critical)'}</option>
                </select>
              </div>

              {/* Depth Threshold Filter */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1.5">{t('filters.depthThreshold')}</label>
                <select
                  value={depthThreshold}
                  onChange={(e) => setDepthThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
                >
                  <option value="all">{t('filters.anydepth')}</option>
                  <option value="2000">&lt; $2,000</option>
                  <option value="5000">&lt; $5,000</option>
                  <option value="10000">&lt; $10,000</option>
                </select>
              </div>

              {/* Pro Low Liquidity Checkbox, CSV Selector & Reset */}
              <div className="flex items-center justify-between sm:justify-start gap-4">
                
                {/* Checkbox Wrapper */}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="liq-toggle"
                    checked={lowLiquidityOnly}
                    onChange={handleLowLiqToggle}
                    className="w-4 h-4 rounded border-gray-700 bg-slate-900 text-amber-500 focus:ring-opacity-0 cursor-pointer"
                  />
                  <label 
                    htmlFor="liq-toggle" 
                    className="text-xs text-slate-400 select-none flex items-center gap-1.5 cursor-pointer relative"
                  >
                    {t('filters.lowLiquidityOnly')}
                    {!isPro && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </label>
                </div>
              </div>
            </div>

            {/* Sub-controls footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-850/60 max-w-full overflow-hidden">
              <span className="text-[11px] text-gray-500">
                {t('table.showingCount', { count: filteredMarkets.length, total: totalCount })}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg text-xs font-semibold transition"
                >
                  {t('filters.resetBtn')}
                </button>
                <button
                  onClick={handleCSVExport}
                  id="btn-export-csv"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-gray-800 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  {t('filters.exportCsv')}
                  {!isPro && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            </div>

          </div>

          {/* MAIN TICKERS TABLE CARDS CONTAINER */}
          {loading ? (
            <div className="bg-[#101626] border border-gray-800 rounded-xl p-12 text-center shadow-lg space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-400 font-mono tracking-wider uppercase animate-pulse">{t('common.loading')}</p>
              {/* Skeleton Grid */}
              <div className="space-y-2 max-w-md mx-auto pt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 bg-slate-900 rounded-md animate-pulse border border-gray-800 flex items-center justify-between px-3">
                    <div className="h-2 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-2 bg-gray-700 rounded w-10"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="bg-[#101626] border border-rose-950/80 rounded-xl p-8 text-center text-rose-350 shadow shadow-rose-950/10">
              <XCircle className="w-8 h-8 text-rose-450 mx-auto mb-2" />
              <p className="text-xs font-bold font-mono uppercase">{lang === 'ru' ? 'Ошибка загрузки данных' : 'Telemetry fetch error'}</p>
              <p className="text-sm mt-1 text-gray-400 font-sans max-w-sm mx-auto">{error}</p>
              <button 
                onClick={() => loadData()} 
                className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold rounded-lg transition"
              >
                {lang === 'ru' ? 'Повторить попытку' : 'Retry Query'}
              </button>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="bg-[#101626] border border-gray-850 rounded-xl p-12 text-center text-gray-400 text-sm shadow">
              {t('table.empty')}
              <div className="mt-4">
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-900 border border-gray-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition"
                >
                  {t('filters.resetBtn')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* DESKTOP VIEW COMPONENT (Visible on md and above) */}
              <div className="hidden md:block bg-[#101626] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b0f19] text-gray-400 border-b border-gray-800/80 font-mono tracking-wider uppercase text-[10px]">
                        <th className="py-4 px-4 font-semibold">{t('table.market')}</th>
                        <th className="py-4 px-3 font-semibold text-right">{t('table.yesPrice')}</th>
                        <th className="py-4 px-3 font-semibold text-right">{t('table.spread')}</th>
                        <th className="py-4 px-3 font-semibold text-right">{t('table.depth2c')}</th>
                        <th className="py-4 px-3 font-semibold text-right">{t('table.volume24h')}</th>
                        <th className="py-4 px-3 font-semibold text-center">{t('table.risk')}</th>
                        <th className="py-4 px-4 font-semibold text-right">{t('table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {filteredMarkets.map(m => {
                        const isStale = !isPro; // Free tier receives delayed simulation warnings
                        return (
                          <tr 
                            key={m.id}
                            id={`market-row-${m.id}`}
                            className="hover:bg-slate-900/35 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/market/${m.id}`)}
                          >
                            
                            {/* Question Title */}
                            <td className="py-3 px-4 max-w-[280px] md:max-w-[340px]">
                              <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                                {m.question}
                              </div>
                              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mt-0.5">
                                ID: {m.id} • {m.category}
                              </span>
                            </td>

                            {/* YES Price Indicator */}
                            <td className="py-3 px-3 text-right">
                              <span className={`font-mono font-bold text-sm ${m.yesPrice >= 0.5 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                {m.yesPrice.toFixed(2)}
                              </span>
                            </td>

                            {/* Spread Fraction */}
                            <td className="py-3 px-3 text-right">
                              <span className={`font-mono font-bold ${
                                m.spread < 0.02 ? 'text-emerald-400' : m.spread <= 0.05 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {(m.spread * 100).toFixed(2)}%
                              </span>
                            </td>

                            {/* 2-cent Depth Capital */}
                            <td className="py-3 px-3 text-right">
                              <div className="font-mono text-gray-200">
                                ${m.depth2c.toLocaleString()}
                              </div>
                              {m.isLowLiquidity && (
                                <span className="inline-flex text-[8px] font-extrabold bg-amber-500/15 text-amber-400 hover:text-amber-300 border border-amber-500/20 px-1 rounded mt-0.5">
                                  {t('table.badgeLowLiq')}
                                </span>
                              )}
                            </td>

                            {/* 24 Hours Volume */}
                            <td className="py-3 px-3 text-right font-mono text-gray-400">
                              ${m.volume24h.toLocaleString()}
                            </td>

                            {/* Risk Flag Badges */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {m.isHighSpread ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-950/60 text-rose-400 text-[9px] border border-red-500/20 rounded font-semibold">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    {lang === 'ru' ? 'Шир. Спред' : 'High Spread'}
                                  </span>
                                ) : m.isLowLiquidity ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 text-amber-400 text-[9px] border border-amber-500/20 rounded font-semibold">
                                    <TrendingDown className="w-2.5 h-2.5" />
                                    {t('table.badgeWatch')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 text-emerald-400 text-[9px] border border-emerald-500/20 rounded font-semibold">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    {t('table.badgeHealthy')}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Details Action */}
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-black text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-155">
                                {t('common.details')}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* TABLE FOOTER WARNING */}
                <div className="bg-[#0b0f19] px-4 py-3 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-gray-400 text-xs gap-3">
                  <span className="font-mono text-[10px] text-gray-500">
                    {t('common.updated')} {60 - refreshCountdown}s {lang === 'ru' ? 'назад' : 'ago'}
                  </span>
                  {!currentUser && (
                    <span className="text-amber-400 font-bold hover:underline">
                      {t('table.promptSignup')}
                    </span>
                  )}
                  {currentUser && currentUser.subscription_tier === 'free' && (
                    <Link to="/pricing" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 animate-pulse" />
                      {t('table.upgradePrompt')}
                    </Link>
                  )}
                </div>
              </div>

              {/* MOBILE DETAILED CARD VIEW (Visible below 768px in responsive environments) */}
              <div className="block md:hidden space-y-3">
                {filteredMarkets.map(m => (
                  <div 
                    key={m.id}
                    id={`market-card-${m.id}`}
                    onClick={() => navigate(`/market/${m.id}`)}
                    className="bg-[#101626] border border-gray-800 rounded-xl p-4 space-y-3 shadow-md hover:border-emerald-500/50 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-normal line-clamp-2">{m.question}</h4>
                        <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase block mt-1">
                          ID: {m.id} • {m.category}
                        </span>
                      </div>
                      <span className={`text-base font-extrabold font-mono shrink-0 ${m.yesPrice >= 0.5 ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {m.yesPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#0b0f19] p-2.5 rounded-lg border border-gray-850/80 text-center">
                      <div>
                        <span className="text-[9px] text-gray-500 block font-mono uppercase">{t('table.spread')}</span>
                        <span className={`text-xs font-mono font-bold ${
                          m.spread < 0.02 ? 'text-emerald-400' : m.spread <= 0.05 ? 'text-amber-400' : 'text-rose-450'
                        }`}>
                          {(m.spread * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block font-mono uppercase">{lang === 'ru' ? 'Глубина' : 'Depth'}</span>
                        <span className="text-xs font-mono text-gray-200 font-semibold block">${m.depth2c.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block font-mono uppercase">Vol 24h</span>
                        <span className="text-xs font-mono text-gray-400 block">${m.volume24h.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {m.isHighSpread ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-950/60 text-rose-400 text-[9px] border border-red-500/20 rounded font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                            {lang === 'ru' ? 'Спред' : 'Spread'}
                          </span>
                        ) : m.isLowLiquidity ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-950/60 text-amber-400 text-[9px] border border-amber-500/20 rounded font-semibold">
                            <TrendingDown className="w-2.5 h-2.5" />
                            {t('table.badgeLowLiq')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 text-[9px] border border-emerald-500/25 rounded font-semibold">
                            <CheckCircle className="w-2.5 h-2.5" />
                            {t('table.badgeHealthy')}
                          </span>
                        )}
                      </div>

                      <div className="text-emerald-400 text-xs font-bold flex items-center gap-0.5 font-mono uppercase text-[10px]">
                        {t('common.details')}
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* 5B. RECENT SCANNER LIVE ALERTS FEED SIGNALS SIDEBAR */}
        <div id="scanner-alerts-sidebar" className="w-full lg:w-1/4 bg-[#101626] border border-gray-800 rounded-2xl p-4.5 space-y-4 shrink-0 shadow-lg relative">
          
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-gray-850 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400 animate-swing" />
              {t('sidebar.title')}
            </h3>
            <span className="inline-flex items-center text-[9px] bg-emerald-500/10 text-emerald-400/90 font-extrabold px-1.5 py-0.5 rounded font-mono">
              {t('sidebar.subtitle')}
            </span>
          </div>

          {/* Interactive signal items stream */}
          <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
            {signals.map(s => {
              const isCrit = s.severity === 'critical';
              return (
                <div 
                  key={s.id}
                  id={`signal-item-${s.id}`}
                  onClick={() => navigate(`/market/${s.market_id}`)}
                  className="bg-[#0b0f19] hover:bg-slate-900 border border-gray-850 hover:border-emerald-500/20 rounded-lg p-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-widest ${
                      isCrit 
                        ? 'bg-rose-500/10 text-rose-405 border border-rose-550/20' 
                        : 'bg-amber-500/10 text-amber-405 border border-amber-550/20'
                    }`}>
                      {s.signal_type === 'HIGH_SPREAD' ? t('signalsPage.badgeSpread') : t('signalsPage.badgeLiquidity')}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono tracking-tighter shrink-0">
                      12 {lang === 'ru' ? 'сек' : 'sec'} {t('sidebar.ago')}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition truncate leading-snug">
                    {s.market_title}
                  </h4>
                  
                  <p className="text-[10.5px] text-gray-400 mt-1 font-sans">
                    {s.signal_type === 'HIGH_SPREAD' 
                      ? t('sidebar.reasonSpread', { val: s.value })
                      : t('sidebar.reasonLiquidity', { val: s.value.toLocaleString() })
                    }
                  </p>
                </div>
              );
            })}
          </div>

          {/* Archive signals trigger redirection */}
          <Link
            to="/signals"
            className="block text-center w-full py-2 bg-slate-900 hover:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white border border-gray-850 uppercase tracking-widest font-mono transition"
          >
            {t('sidebar.ctaArchive')}
          </Link>
        </div>

      </div>

    </div>
  );
};
