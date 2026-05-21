import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ru' | 'en';

export const ru = {
  nav: {
    scanner: "Сканер",
    signals: "Сигналы",
    howItWorks: "Как работает",
    pricing: "Тарифы",
    login: "Войти",
    signup: "Создать аккаунт",
    logout: "Выйти",
    settings: "Настройки",
    glossary: "Глоссарий",
    profile: "Профиль"
  },
  common: {
    back: "Назад",
    cancel: "Отмена",
    save: "Сохранить",
    loading: "Загрузка...",
    pro: "PRO",
    free: "FREE",
    active: "Активен",
    inactive: "Неактивен",
    simulation: "Симуляция",
    sandbox: "Песочница",
    details: "Подробнее",
    all: "Все",
    staleData: "Данные застарели",
    updated: "Обновлено"
  },
  hero: {
    badge: "MVP выпуск запущен",
    title: "Сканер ликвидности Polymarket",
    description: "Находите рынки с широким спредом, низкой глубиной и потенциальным проскальзыванием до того, как размещать лимитные ордера.",
    startFree: "Начать бесплатно",
    howItWorksLink: "Как это работает",
    microcopy: "Free-доступ: до 20 рынков, базовые сигналы и задержка обновления 60 секунд."
  },
  warningBar: {
    freeMode: "Вы используете Free-режим:",
    limits: "доступно до 20 рынков, обновление данных каждые 60 секунд.",
    upgradeCta: "Перейдите на Pro, чтобы открыть все рынки, CSV-экспорт и Telegram-алерты."
  },
  metrics: {
    trackedMarkets: "Отслеживаемые рынки",
    criticalSpreads: "Критические спреды",
    refreshDelay: "Задержка обновления",
    activeSignals: "Активные сигналы",
    trackedMarketsTooltip: "Общее число рынков прогнозирования, загруженных под ваш тарифный план.",
    criticalSpreadsTooltip: "Количество рынков, у которых спред превышает пороговые 5.0%.",
    refreshDelayTooltip: "Интервал принудительного обновления и кеширования данных на стороне сервера.",
    activeSignalsTooltip: "Количество алертов, сгенерированных сканером на основе ширины спреда или падения объема.",
    secondsFree: "60 сек FREE",
    secondsPro: "15 сек PRO"
  },
  filters: {
    allCategories: "Все категории",
    politics: "Политика",
    crypto: "Криптовалюты",
    economy: "Экономика",
    sports: "Спорт",
    other: "Другое",
    searchPlaceholder: "Поиск рынков по названию...",
    riskLevel: "Уровень риска",
    lowLiquidityOnly: "Только низкая ликвидность",
    lowLiquidityPro: "Низкая ликвидность (< $5,000)",
    spreadThreshold: "Порог спреда",
    depthThreshold: "Миним. глубина",
    volumeThreshold: "Объем 24ч",
    exportCsv: "Экспорт CSV",
    resetBtn: "Сбросить всё",
    anyspread: "Любой спред",
    anydepth: "Любая глубина",
    anyvol: "Любой объем"
  },
  table: {
    market: "Рынок",
    yesPrice: "Цена YES",
    spread: "Спред",
    depth2c: "Глубина 2c",
    volume24h: "Объем 24ч",
    risk: "Риск",
    updated: "Обновлено",
    action: "Действие",
    staleIndicator: "Устарело > 60 сек",
    quickDetails: "Детали",
    empty: "Рынки не найдены. Попробуйте изменить фильтры или отключить режим низкой ликвидности.",
    badgeHealthy: "Стабильно",
    badgeWatch: "Внимание",
    badgeHighSpread: "Широкий спред",
    badgeLowLiq: "Мало ликвидности",
    showingCount: "Показано {count} из {total} рынков.",
    promptSignup: "Создайте аккаунт для бесконечного просмотра.",
    upgradePrompt: "Перейдите на PRO, чтобы сканировать более 20 рынков одновременно!"
  },
  sidebar: {
    title: "Последние сигналы",
    subtitle: "Живой поток",
    emptyState: "Пока нет активных сигналов. Сканер покажет их здесь, когда обнаружит широкий спред или низкую глубину.",
    ctaArchive: "Смотреть все сигналы",
    reasonSpread: "Превышен порог спреда: {val}%",
    reasonLiquidity: "Глубина ликвидности 2c упала до: ${val}",
    ago: "м. назад",
    secAgo: "сек. назад"
  },
  detail: {
    stable: "Ликвидность стабильна",
    attention: "Требует внимания",
    critical: "Высокий риск ликвидности",
    yesFluctuations: "Колебания цены YES",
    fluctuationSub: "Анализ изменения рыночной цены на основе почасового сканирования.",
    toggle24h: "24ч Тренд",
    toggle7d: "7д История",
    bidTitle: "Покупка YES (Bids)",
    askTitle: "Продажа YES (Asks)",
    bidsCount: "{count} лимитных заявок",
    priceCol: "Цена",
    volumeCol: "Объем",
    totalCol: "Итого ($)",
    spreadGapWarning: "Широкий спред: вход и выход из позиции могут быть дорогими.",
    metricsPanelTitle: "Показатели ликвидности",
    bestBid: "Лучший Bid покупки:",
    bestAsk: "Лучший Ask продажи:",
    midPrice: "Средняя цена YES:",
    traded24h: "Суточный объем сделок:",
    telegramBoxTitle: "Telegram Оповещения",
    telegramBoxSub: "Получайте мгновенные Telegram-алерты, если ликвидность на этом рынке упадет ниже $5,000 или спред выйдет за пороговые 5%.",
    alertRegCta: "Включить Telegram-оповещения",
    backDashboard: "← Вернуться к сканеру"
  },
  pricing: {
    title: "Тарифные планы",
    subtitle: "Снимите ограничения кэширования и настройте автоматические Telegram-алерты.",
    freeBadge: "БЕСПЛАТНО ДЛЯ АНАЛИЗА",
    freePrice: "$0",
    freePeriod: "/ навсегда",
    freeDesc: "Базовые аналитические инструменты для поверхностной визуальной оценки спредов Polymarket.",
    proBadge: "PRO ВЫСОКАЯ ЧАСТОТА",
    proPrice: "$9",
    proPeriod: "/ месяц (Sandbox)",
    proDesc: "Высокоскоростная трассировка рынков для активных трейдеров и арбитражников.",
    upgradeProBtn: "Встать в waitlist Pro",
    proActive: "👑 PRO Активен (Режим Тестирования)",
    curActive: "Ваш текущий тариф",
    lockedFeature: "Доступно только в PRO",
    waitlistTitle: "Предзаказ Stripe Integration",
    waitlistInfo: "Интеграция с платежным шлюзом Stripe находится в тестовой песочнице. Введите вашу почту, чтобы мгновенно активировать PRO доступ совершенно бесплатно в учебных целях!",
    waitlistLabel: "Адрес электронной почты для предзаказа",
    sandboxRule: "Правило песочницы: Вашему аккаунту будет присвоен Pro-статус. Все заблокированные графики, выгрузки и Telegram-настройки откроются мгновенно.",
    matrixTitle: "Таблица сравнения возможностей тарифов",
    colParam: "Параметр",
    colFree: "Free тариф",
    colPro: "PRO тариф",
    rowMarkets: "Доступные рынки",
    rowMarketsFree: "Первые 20 рынков",
    rowMarketsPro: "Полная база (25+ рынков)",
    rowRefresh: "Частота обновления",
    rowRefreshFree: "60 секунд задержка",
    rowRefreshPro: "15 секунд (Приоритет)",
    rowAlerts: "Telegram Оповещения",
    rowAlertsFree: "Отсутствует",
    rowAlertsPro: "Доступно (Без ограничений)",
    rowHistory: "Исторические графики",
    rowHistoryFree: "Только 24 часа",
    rowHistoryPro: "Глубокая история за 7 дней",
    rowCsv: "Экспорт CSV-данных",
    rowCsvFree: "Заблокировано",
    rowCsvPro: "Доступно (В 1 клик)"
  },
  auth: {
    loginTitle: "Доступ к сканеру",
    loginSub: "Введите учетные данные, чтобы получить доступ к аналитике с высоким приоритетом.",
    signUpTitle: "Регистрация аккаунта",
    signUpSub: "Категоризировано для демонстрации преимуществ тарифных сеток.",
    emailLabel: "Электронная почта",
    passLabel: "Пароль",
    passConfirmLabel: "Подтвердите пароль",
    passMinChars: "Минимум 6 символов",
    agreeCheckbox: "Я подтверждаю свое согласие с юридическим дисклеймером, подтверждая понимание симуляционного характера данных.",
    loginBtn: "Войти в систему",
    signUpBtn: "Создать бесплатный аккаунт",
    noAccount: "Впервые у нас?",
    alreadyMember: "Уже зарегистрированы?",
    authNoticeTitle: "Внимание:",
    authNoticeDesc: "Учетная запись требуется исключительно для сохранения ваших пользовательских настроек в рамках MVP. Реальные торговые сделки не совершаются."
  },
  signalsPage: {
    title: "Журнал аналитических сигналов",
    subtitle: "Хронология зафиксированных аномалий ликвидности и расширения спреда на Polymarket во всех отслеживаемых секторах.",
    tableTime: "Время фиксации",
    tableMarket: "Рынок",
    tableType: "Тип сигнала",
    tableValue: "Значение",
    tableSeverity: "Серьезность аномалии",
    badgeSpread: "ШИРОКИЙ СПРЕД",
    badgeLiquidity: "НИЗКАЯ ГЛУБИНА"
  },
  settings: {
    title: "Настройки профиля",
    subtitle: "Управление вашим тарифным планом, интеграциями Telegram и языковыми предпочтениями.",
    profileSection: "Профиль пользователя",
    currentPlan: "Текущий тарифный план:",
    tgTitle: "Настройки Telegram-алертов",
    tgSub: "Введите ваш Telegram Chat ID. Без Pro-статуса поле сохранения будет заблокировано.",
    tgSaveBtn: "Сохранить Chat ID",
    tgPlaceholder: "Например, @my_channel или 554902123",
    dangerZone: "Опасная зона",
    deleteAccount: "Удалить профиль с платформы",
    deleteWarning: "Это действие необратимо. Все подписки на алерты будут удалены.",
    tgSuccess: "Telegram Chat ID успешно сохранен!",
    tgProRequired: "Настройка Telegram-вещания доступна только VIP-пользователям тарифа PRO.",
    delSuccess: "Регистрационные данные удалены из локальной базы."
  },
  glossary: {
    title: "Глоссарий аналитических терминов",
    subtitle: "Разберитесь в ключевых показателях ликвидности, спреда и проскальзывания, используемых в трейдинге Polymarket.",
    termSpread: "Spread (Спред)",
    descSpread: "Разница между лучшим лимитным предложением на покупку (Bid) и лучшим предложением на продажу (Ask). Чем шире спред, тем дороже обходится мгновенный вход в позицию по рыночной цене.",
    termDepth: "2c Depth (Глубина 2 цента)",
    descDepth: "Общая сумма капитала в стакане, находящаяся в пределах 2 центов (0.02) от средней текущей цены (Mid Price). Показывает силу защиты рынка против резкого проскальзывания при крупной сделке.",
    termBid: "Bid (Ставка покупателя)",
    descBid: "Лимитный ордер покупателя. Лучший Bid отображает наивысшую цену, которую кто-то готов заплатить за Yes/No контракты прямо сейчас.",
    termAsk: "Ask (Ордер продавца)",
    descAsk: "Лимитный ордер продавца. Лучший Ask отображает наинизшую цену, по которой кто-то готов расстаться с Yes/No контрактами прямо сейчас.",
    termMidPrice: "Mid Price (Средняя цена)",
    descMidPrice: "Математическая середина между лучшим Bid и лучшим Ask. Часто используется как справедливое справочное значение средней стоимости контракта.",
    termLowLiquidity: "Low Liquidity (Низкая ликвидность)",
    descLowLiquidity: "Состояние дефицита объема заявок, при котором даже незначительный покупательский ордер может сдвинуть цену в крайне невыгодном для вас направлении.",
    termSlippage: "Slippage (Проскальзывание)",
    descSlippage: "Разница между ожидаемой ценой сделки при отправке ордера и фактической ценой исполнения. Происходит на 'тонких' рынках с низкой глубиной.",
    termStaleData: "Stale Data (Устаревшие данные)",
    descStaleData: "Информация, которая задержалась на пути веб-обновления. Для бесплатных аккаунтов на дашборде выводится индикатор устаревания данных, предупреждающий об осторожности."
  },
  howItWorks: {
    title: "Методология работы сканера",
    subtitle: "Как MVP-платформа сканирует, оценивает и предупреждает о скрытых рисках ликвидности на Polymarket.",
    q1: "Что сканирует этот продукт?",
    a1: "Сканер круглосуточно считывает параметры открытых ордербуков (Bids и Asks) топовых рынков прогнозирования на платформе Polymarket. Он не привязан к депозитам пользователей, не требует подключения кошельков и выполняет исключительно информационно-аналитическую оценку.",
    q2: "Как рассчитывается Spread (Спред)?",
    a2: "Формула спреда: (Лучший Ask - Лучший Bid) / (Средняя цена Best Bid и Best Ask). Если полученное значение превышает 5.0%, система помечает его критическим rose-статусом, предупреждая о финансовом барьере.",
    q3: "Как рассчитывается 2c Depth (Глубина)?",
    a3: "Мы агрегируем все лимитные заявки на покупку и продажу, чьи цены отличаются от текущей Mid Price не более чем на ±0.02. Если суммарный объем в этой зоне падает ниже $5,000, рынок зачисляется в группу высокого риска ликвидности.",
    q4: "Предоставляет ли сканер торговые рекомендации?",
    a4: "Категорически нет! MVP не выдает триггеры 'покупай' или 'продавай'. Все сигналы носят нейтральный характер: они лишь констатируют объективное качество ордербука (спреды, глубина стакана), помогая избежать проскальзываний.",
    q5: "Почему данные могут быть симулированы или задержаны?",
    a5: "Это аналитический MVP. Чтобы не нарушать правила API и не перегружать инфраструктурные узлы, данные обновляются кеш-блоками с задержкой 60 секунд (для Free) или 15 секунд (для Pro). Графики и стаканы ордеров симулируют динамику изменений."
  },
  modal: {
    alertSubTitle: "Настроить Telegram-уведомление",
    alertSubMarket: "Рынок:",
    alertSubNote: "Присылать важные алерты, когда показатели спреда или объема этого рынка пересекут пограничные критерии.",
    tgIdLabel: "Ваш Telegram Chat ID",
    tgIdHint: "Получить chat ID можно у бота @userinfobot в Telegram.",
    unauthTitle: "Вход в систему ограничен",
    unauthText: "Только зарегистрированные аналитики могут подписываться на автоматические оповещения.",
    csvLockedTitle: "Экспорт заблокирован",
    csvLockedText: "CSV-экспорт таблиц доступен только пользователям тарифа PRO. Выгружайте ликвидность, спреды и глубинную метрику в один клик.",
    alertsLockedTitle: "Алерты заблокированы",
    alertsLockedText: "Предупреждения в реальном времени через Telegram-алерты являются Pro-опцией.",
    chartLockedTitle: "7-дневный график заблокирован",
    chartLockedText: "Глубокая история изменения ликвидности доступна только держателям Pro-пакета."
  },
  legal: {
    disclaimerTitle: "Правовая оговорка (Disclaimer)",
    privacyTitle: "Политика конфиденциальности (Privacy Policy)",
    termsTitle: "Пользовательское соглашение (Terms & Conditions)",
    termsContent: "Пользуясь данным сканером, вы подтверждаете его исключительно аналитическую направленность. Платформа не предоставляет финансовых услуг, не принимает депозитов и не работает с криптовалютой. Все котировки разработаны для демонстрации принципов расчета ликвидности.",
    privacyContent: "Мы заботимся о безопасности ваших настроек. В нашей локальной базе данных db.json сохраняется только ваш хэшированный пароль, email и Telegram Chat ID для отправки алертов. Данные никогда не передаются сторонним организациям.",
    disclaimerContent: "Информация, представленная на сайте, носит развлекательно-аналитический и образовательный характер. Она не является инвестиционной консультацией, торговой рекомендацией или призывом к совершению финансовых сделок. Все котировки, ордербуки, спреды и сигналы в MVP могут быть симулированы или задержаны. MVP создан исключительно в целях демонстрации навыков проектирования пользовательских интерфейсов."
  }
};

export const en = {
  nav: {
    scanner: "Scanner",
    signals: "Signals",
    howItWorks: "How It Works",
    pricing: "Pricing",
    login: "Log In",
    signup: "Sign Up",
    logout: "Log Out",
    settings: "Settings",
    glossary: "Glossary",
    profile: "Profile"
  },
  common: {
    back: "Back",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading...",
    pro: "PRO",
    free: "FREE",
    active: "Active",
    inactive: "Inactive",
    simulation: "Simulation",
    sandbox: "Sandbox",
    details: "Details",
    all: "All",
    staleData: "Stale Data",
    updated: "Updated"
  },
  hero: {
    badge: "MVP Release Live",
    title: "Polymarket Liquidity Scanner",
    description: "Detect wide spreads, thin depth, and potential slippage zones before placing limit orders.",
    startFree: "Start for Free",
    howItWorksLink: "How It Works",
    microcopy: "Free access includes 20 markets, basic signals, and a 60-second refresh delay."
  },
  warningBar: {
    freeMode: "You are using the Free plan:",
    limits: "up to 20 markets and 60-second refresh delay.",
    upgradeCta: "Upgrade to Pro to unlock all markets, CSV export, and Telegram alerts."
  },
  metrics: {
    trackedMarkets: "Tracked Markets",
    criticalSpreads: "Critical Spreads",
    refreshDelay: "Refresh Delay",
    activeSignals: "Active Signals",
    trackedMarketsTooltip: "Total prediction markets currently monitored for liquidity stats under your active tier.",
    criticalSpreadsTooltip: "Count of tracked markets with bidded spread exceeding 5.0%.",
    refreshDelayTooltip: "Inforced time delay between background caching server data updates.",
    activeSignalsTooltip: "Total alert alerts produced by scanner on critical spreads or volume depth slide.",
    secondsFree: "60s FREE",
    secondsPro: "15s PRO"
  },
  filters: {
    allCategories: "All Categories",
    politics: "Politics",
    crypto: "Crypto",
    economy: "Economy",
    sports: "Sports",
    other: "Other",
    searchPlaceholder: "Search markets by question keyword...",
    riskLevel: "Risk Level",
    lowLiquidityOnly: "Low Liquidity Only",
    lowLiquidityPro: "Low Liquidity (< $5,000)",
    spreadThreshold: "Spread Threshold",
    depthThreshold: "Minimum Depth",
    volumeThreshold: "24h Volume",
    exportCsv: "Export CSV",
    resetBtn: "Reset all",
    anyspread: "Any spread",
    anydepth: "Any depth",
    anyvol: "Any volume"
  },
  table: {
    market: "Market",
    yesPrice: "YES Price",
    spread: "Spread",
    depth2c: "2c Depth",
    volume24h: "24h Volume",
    risk: "Risk",
    updated: "Updated",
    action: "Action",
    staleIndicator: "Stale > 60s",
    quickDetails: "Details",
    empty: "No markets found. Try adjusting filters or disabling low-liquidity mode.",
    badgeHealthy: "Stable",
    badgeWatch: "Watch",
    badgeHighSpread: "High Spread",
    badgeLowLiq: "Low Liquidity",
    showingCount: "Showing {count} of {total} markets.",
    promptSignup: "Create an account for unlimited scrolling.",
    upgradePrompt: "Upgrade to PRO to scan more than 20 markets concurrently!"
  },
  sidebar: {
    title: "Recent Signals",
    subtitle: "Live Stream",
    emptyState: "No active signals yet. The scanner will show markets with wide spreads or thin depth here.",
    ctaArchive: "View all signals",
    reasonSpread: "Spread threshold broken at: {val}%",
    reasonLiquidity: "2c liquidity depth slid to: ${val}",
    ago: "m. ago",
    secAgo: "s. ago"
  },
  detail: {
    stable: "Liquidity stable",
    attention: "Needs attention",
    critical: "High liquidity risk",
    yesFluctuations: "YES Price Fluctuations",
    fluctuationSub: "Price index analysis computed by hourly background scans.",
    toggle24h: "24h Trend",
    toggle7d: "7d History",
    bidTitle: "Bids (Buying YES)",
    askTitle: "Asks (Selling YES)",
    bidsCount: "{count} limit queues",
    priceCol: "Price",
    volumeCol: "Volume",
    totalCol: "Total ($)",
    spreadGapWarning: "Wide spread: entering or exiting this market may be expensive.",
    metricsPanelTitle: "Liquidity Metrics Dashboard",
    bestBid: "Best buying Bid:",
    bestAsk: "Best selling Ask:",
    midPrice: "Mid-Market Price:",
    traded24h: "24h Aggregated Volume:",
    telegramBoxTitle: "Telegram Alerts",
    telegramBoxSub: "Get notified when a market enters a high-spread or low-liquidity zone below $5,000.",
    alertRegCta: "Unlock Telegram Alerts",
    backDashboard: "← Back to Dashboard"
  },
  pricing: {
    title: "Pricing Plans",
    subtitle: "Lift caching delays, unlock custom filtering, and route push notifications directly to Telegram.",
    freeBadge: "FREE FOR PORTFOLIO VIEWERS",
    freePrice: "$0",
    freePeriod: "/ lifetime",
    freeDesc: "Basic analytical parameters suitable for visual evaluations of Polymarket spreads.",
    proBadge: "PRO HIGH FREQUENCY",
    proPrice: "$9",
    proPeriod: "/ month (Sandbox)",
    proDesc: "High-frequency latency statistics tracking for active prediction volume nodes.",
    upgradeProBtn: "Join Pro Waitlist",
    proActive: "👑 PRO Active (Sandbox mode)",
    curActive: "Your current plan",
    lockedFeature: "Available on PRO only",
    waitlistTitle: "Stripe Pre-Order Integration",
    waitlistInfo: "Stripe checkout is currently in developer sandbox testing mode. Provide or verify your email below to instantly upgrade to PRO in this simulated environment!",
    waitlistLabel: "Pre-order Email Address",
    sandboxRule: "Sandbox Rule: Your user tier in db.json will be set to 'pro' immediately. You will gain access to all locked tools, filters, and charts without fees.",
    matrixTitle: "Detailed Feature Comparison Matrix",
    colParam: "Feature",
    colFree: "Free Tier",
    colPro: "PRO Plan",
    rowMarkets: "Tracked Markets",
    rowMarketsFree: "First 20 markets",
    rowMarketsPro: "Full Database (25+ markets)",
    rowRefresh: "Data Refresh Frequency",
    rowRefreshFree: "60-second delay cached",
    rowRefreshPro: "15-second priority update",
    rowAlerts: "Telegram Alerts Config",
    rowAlertsFree: "Not available",
    rowAlertsPro: "Available (Unlimited)",
    rowHistory: "Historical Price Range",
    rowHistoryFree: "24 hours maximum",
    rowHistoryPro: "7-day analytical historical",
    rowCsv: "CSV State Export",
    rowCsvFree: "Locked",
    rowCsvPro: "Unlocked (1-click)"
  },
  auth: {
    loginTitle: "Access Liquidity Panel",
    loginSub: "Provide your credentials to look at high-priority scanner stats.",
    signUpTitle: "Create Free Scanner Profile",
    signUpSub: "No deposit needed. MVP is read-only analytical software.",
    emailLabel: "Email Address",
    passLabel: "Secure Password",
    passConfirmLabel: "Confirm Secure Password",
    passMinChars: "Minimum 6 values",
    agreeCheckbox: "I agree with the legal disclaimer conditions stating that all statistics and data values compiled are simulations.",
    loginBtn: "Sign In to Dashboard",
    signUpBtn: "Create Free Scanner Account",
    noAccount: "New to Scanner Platform?",
    alreadyMember: "Already registered?",
    authNoticeTitle: "Notice:",
    authNoticeDesc: "Your account is used to save settings and demonstrate limits in this sandbox framework. No real trades are executed."
  },
  signalsPage: {
    title: "Analytical Signals Log",
    subtitle: "Historical chronological archive of anomalous spread widening or severe orderbook thinness detected globally.",
    tableTime: "Sensing Timestamp",
    tableMarket: "Market Question",
    tableType: "Signal Type",
    tableValue: "Telemetry value",
    tableSeverity: "Severity",
    badgeSpread: "WIDE SPREAD",
    badgeLiquidity: "LOW DEPTH"
  },
  settings: {
    title: "Profile Settings",
    subtitle: "Control your subscription plans, Telegram router endpoints, and localization parameters.",
    profileSection: "User Profile Overview",
    currentPlan: "Current subscription plan:",
    tgTitle: "Telegram Alarm Route Node",
    tgSub: "Set up your Telegram user/channel chat ID. Free tier is locked from completing save updates.",
    tgSaveBtn: "Save Chat ID",
    tgPlaceholder: "E.g., @my_channel or 554902123",
    dangerZone: "Danger Zone",
    deleteAccount: "Remove Account Registration",
    deleteWarning: "This is irreversible. Your profile and custom subscriptions will be removed from local database.",
    tgSuccess: "Telegram Chat ID persisted successfully!",
    tgProRequired: "Telegram alerts route is available to PRO upgraded tiers only.",
    delSuccess: "Registration has been purged from mock storage."
  },
  glossary: {
    title: "Analytical Terminology Glossary",
    subtitle: "Unpack core market metrics, orderbook equations, and liquidity flags on Polymarket.",
    termSpread: "Spread",
    descSpread: "The fractional cost distance between the best limit bid buying price and the best limit ask selling price. Wide spreads cost more to execute immediate market orders.",
    termDepth: "2c Depth (2-cent Depth)",
    descDepth: "The aggregated size of orders placed within 2 cents ($0.02) from the mid price point. Represents the market resistance to price slippage from larger position sizes.",
    termBid: "Bid Order",
    descBid: "A limit order placed to acquire contracts. The best bid represents the maximum current rate anyone is actively offering to buy YES.",
    termAsk: "Ask Order",
    descAsk: "A limit order placed to liquidate contracts. The best ask represents the cheapest rate anyone is actively offering to sell YES.",
    termMidPrice: "Mid-Market Price",
    descMidPrice: "The exact middle value between the current best bidded bid and best bidded ask. Utilized as the fairest price reference point.",
    termLowLiquidity: "Low Liquidity",
    descLowLiquidity: "A thin market state lacking bid sizes. Under low liquidity, standard traders trigger massive price deviations even on minor positions.",
    termSlippage: "Slippage",
    descSlippage: "The negative deviation caused when the actual fill price of a trade is worse than the expected price, typically because the order book is thin.",
    termStaleData: "Stale data warning",
    descStaleData: "A security measure informing you that caching latency thresholds have lapsed, typical of free tier configurations."
  },
  howItWorks: {
    title: "Operational Methodology",
    subtitle: "Learn how the Polymarket Liquidity Scanner MVP scans, estimates, and guards capitalization.",
    q1: "What does this application scan?",
    a1: "The scanner continuously tracks aggregated orderbook sizes (bids and asks arrays) of the top prediction markets. We never hook to client wallets, sign transactions, or process orders. The application is completely read-only.",
    q2: "How is Spread computed?",
    a2: "The equation is: (Best Ask - Best Bid) / Mid Price. Values exceeding 5.0% are categorized as critical high-spread warnings, explaining execution barriers.",
    q3: "How is 2c Depth calculated?",
    a3: "We check the best bids and asks within a range of ±$0.02 from the Mid Price. If total capital drops below $5,000, we flag it as high liquidity risk.",
    q4: "Does this scanner provide trade recommendations?",
    a4: "No. The alerts and signals are strictly analytical. The platform provides analytical notifications about the spread and quality of the book, never recommending specific Yes or No positions.",
    q5: "Why are quotes sometimes delayed or simulated?",
    a5: "This is a demonstration MVP. To prevent rate-limiting and minimize background latency, server caching holds values with a 60s delay (Free) or 15s (Pro)."
  },
  modal: {
    alertSubTitle: "Configure Telegram Alarm",
    alertSubMarket: "Ticker Target:",
    alertSubNote: "Send push alerts immediately when spread threshold boundaries or volume depth requirements lapse.",
    tgIdLabel: "Your Telegram Chat ID",
    tgIdHint: "Sourced through @userinfobot chat utilities.",
    unauthTitle: "Access Restricted",
    unauthText: "Authenticating is required to register custom Telegram notifications.",
    csvLockedTitle: "CSV Export Locked",
    csvLockedText: "CSV spreadsheet exports are optimized for PRO subscribers. Unlock 1-click downloads of spreads and metrics tables.",
    alertsLockedTitle: "Alert Node Locked",
    alertsLockedText: "Telegram alerting triggers are reserved for PRO subscriber tiers.",
    chartLockedTitle: "7d Historical Locked",
    chartLockedText: "Weekly graphical analyses are reserved for Pro tiered members."
  },
  legal: {
    disclaimerTitle: "Analytical Disclaimer",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Service",
    termsContent: "By viewing this dashboard, you explicitly accept its educational nature. Standard services do not facilitate financial transactions, custody tokens, or trade real assets. Prices are generated for metrics calculations.",
    privacyContent: "We prioritize user privacy. In our local sandboxed JSON DB, we store hashed password values and your setup chat ID only. Information is never shared with third parties.",
    disclaimerContent: "All information compiled is for entertainment, education, and analytical simulation only. It does not constitute investment advice, legal advice, or trade recommendations. Quotations and spreads are simulated for MVP design presentation purposes."
  }
};

type I18nContextType = {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, variables?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'en' || saved === 'ru') ? saved : 'ru';
  });

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (keyPath: string, variables?: Record<string, string | number>): string => {
    const dictionary = lang === 'ru' ? ru : en;
    const keys = keyPath.split('.');
    let current: any = dictionary;

    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to English dictionary if translation is missing in Russian
        let enCurrent: any = en;
        for (const enK of keys) {
          if (enCurrent[enK] === undefined) {
            return keyPath;
          }
          enCurrent = enCurrent[enK];
        }
        current = enCurrent;
        break;
      }
      current = current[k];
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    if (variables) {
      Object.entries(variables).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(val));
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
