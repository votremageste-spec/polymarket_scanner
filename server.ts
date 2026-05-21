import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'polymarket_scanner_secret_2026';

const app = express();
app.use(express.json());

// Structure of our JSON database
interface DBStructure {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    subscription_tier: 'free' | 'pro';
    upgrade_waitlist_email: boolean;
    created_at: string;
  }>;
  signals: Array<{
    id: number;
    market_id: string;
    market_title: string;
    signal_type: 'HIGH_SPREAD' | 'LOW_LIQUIDITY';
    severity: 'info' | 'warning' | 'critical';
    value: number;
    created_at: string;
  }>;
  alert_subscriptions: Array<{
    id: number;
    user_id: string;
    market_id: string;
    telegram_chat_id: string;
    created_at: string;
  }>;
  pricing_waitlist: Array<{
    id: number;
    email: string;
    created_at: string;
  }>;
  markets: any[]; // cached seeded markets with dynamic variation
}

// Global DB instance
let db: DBStructure = {
  users: [],
  signals: [],
  alert_subscriptions: [],
  pricing_waitlist: [],
  markets: [],
};

// Seeder for Polymarket data (History & Orderbooks)
function generateHistoricalPrice(basePrice: number, points: number, seed: number): Array<{ time: string; price: number }> {
  const result = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const timePoint = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Create random-like walk
    const variation = Math.sin(i * 0.5 + seed) * 0.05 + Math.cos(i * 0.2 + seed) * 0.03;
    let price = parseFloat((basePrice + variation).toFixed(2));
    if (price < 0.01) price = 0.01;
    if (price > 0.99) price = 0.99;
    
    result.push({
      time: hourStr,
      price: price
    });
  }
  return result;
}

function generateOrderbook(yesPrice: number, baseVol: number): { bids: any[]; asks: any[] } {
  const bids = [];
  const asks = [];
  
  // Yes Price Bids (buyers buy below the current price)
  for (let i = 1; i <= 5; i++) {
    const price = parseFloat((yesPrice - i * 0.01).toFixed(2));
    if (price <= 0.01) continue;
    const volume = Math.round(baseVol * (1.5 - i * 0.25) * (0.8 + Math.random() * 0.4));
    bids.push({
      price,
      volume,
      total: parseFloat((price * volume).toFixed(2))
    });
  }

  // Yes Price Asks (sellers sell above the current price)
  for (let i = 1; i <= 5; i++) {
    const price = parseFloat((yesPrice + i * 0.01).toFixed(2));
    if (price >= 0.99) continue;
    const volume = Math.round(baseVol * (1.5 - i * 0.25) * (0.8 + Math.random() * 0.4));
    asks.push({
      price,
      volume,
      total: parseFloat((price * volume).toFixed(2))
    });
  }

  return { bids, asks };
}

// Initialize and seed database
function initDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      console.log('Database loaded successfully from file.');
      return;
    } catch (e) {
      console.error('Error reading DB file, re-creating database...', e);
    }
  }

  // Pre-seed 25 Markets of Polymarket
  const rawMarkets = [
    { id: 'btc-110k', q: 'Will Bitcoin reach $110,000 in 2026?', category: 'crypto', yes: 0.65, baseVol: 25000, desc: 'This market resolves to Yes if Bitcoin reaches $110,000.00 or more according to CoinGecko trade index within 2026.' },
    { id: 'next-speaker-house', q: 'Next Speaker of the US House of Representatives', category: 'politics', yes: 0.42, baseVol: 1800, desc: 'This market resolves to the individual officially elected as Speaker of the House of Representatives by roll call vote.' },
    { id: 'solana-cap-eth', q: 'Solana to surpass Ethereum in market cap in 2026', category: 'crypto', yes: 0.18, baseVol: 15000, desc: 'This market resolves to Yes if Solana Market Cap exceeds Ethereum on CoinMarketCap for 7 consecutive days in 2026.' },
    { id: 'spacex-starship-flight6', q: 'Will SpaceX launch Starship Flight 6 next month?', category: 'other', yes: 0.78, baseVol: 45000, desc: 'This market resolves to Yes if SpaceX finishes orbital launches or high-altitude flight tests under authorization.' },
    { id: 'france-new-prime-minister', q: 'Will France appoint a new Prime Minister by June?', category: 'politics', yes: 0.55, baseVol: 3000, desc: 'Resolves of the official appointment of a Prime Minister by the President of France.' },
    { id: 'openai-gpt5-release', q: 'Will OpenAI announce GPT-5 in 2026?', category: 'other', yes: 0.84, baseVol: 80000, desc: 'Resolves to Yes if OpenAI releases or officially names the next generation flagship LLM as GPT-5.' },
    { id: 'ethereum-etf-inflows', q: 'Will Ethereum ETF see net positive inflows next week?', category: 'crypto', yes: 0.49, baseVol: 12000, desc: 'Resolves to Yes if the aggregate flows across all SEC US-approved weekly spot Ethereum ETFs are net positive.' },
    { id: 'trump-approval-45', q: 'Will Donald Trump approval rating exceed 45%?', category: 'politics', yes: 0.52, baseVol: 65000, desc: 'This market resolves based on the FiveThirtyEight weighted average approval rating on the final scheduled date.' },
    { id: 'taylor-album-2026', q: 'Will Taylor Swift announce a new studio album in 2026?', category: 'other', yes: 0.63, baseVol: 9000, desc: 'Resolves to Yes if Taylor Swift officially announces her next record through verified social media accounts.' },
    { id: 'us-fed-rate-cut', q: 'Will US Fed cut interest rates in next meeting?', category: 'politics', yes: 0.71, baseVol: 110000, desc: 'Resolves to Yes if the FOMC announces a target rate reduction of at least 25 basis points.' },
    { id: 'doge-one-dollar', q: 'Will Dogecoin reach $1.00 in 2026?', category: 'crypto', yes: 0.12, baseVol: 18000, desc: 'Resolves to Yes if Dogecoin spot price reaches $1.00000 on major exchanges.' },
    { id: 'apple-ar-glasses', q: 'Will Apple release AR glasses in 2026?', category: 'other', yes: 0.28, baseVol: 2200, desc: 'Resolves to Yes if Apple introduces head-worn AR device during any official keynote.' },
    { id: 'uk-election-2026', q: 'Will there be a UK General Election in 2026?', category: 'politics', yes: 0.08, baseVol: 800, desc: 'Resolves to Yes if a general parliamentary election is held before the end of December 2026.' },
    { id: 'bnb-ath', q: 'Will Binance coin (BNB) set a new ATH in 2026?', category: 'crypto', yes: 0.45, baseVol: 14000, desc: 'Resolves to Yes if BNB spot price hits an all-time-high above $720.67.' },
    { id: 'dune-part3-oscar', q: 'Will Dune Part 3 win Best Picture at Oscars?', category: 'other', yes: 0.31, baseVol: 1200, desc: 'Resolves to Yes if Dune: Part Three wins the Academy Award for Best Picture.' },
    { id: 'german-gdp-2026', q: 'German GDP growth above 1% in 2026?', category: 'politics', yes: 0.24, baseVol: 2000, desc: 'Resolves to Yes if German statistical agency releases adjusted real GDP output index above 1.0%.' },
    { id: 'solana-transactions', q: 'Will Solana Transactions hit 100 Billion?', category: 'crypto', yes: 0.88, baseVol: 50000, desc: 'Resolves to Yes if the public Mainnet Beta ledger processed transaction count exceeds 100 billion.' },
    { id: 'ai-ceo-sp500', q: 'AI CEO appointed to S&P 500 company?', category: 'other', yes: 0.15, baseVol: 750, desc: 'Resolves to Yes if a publicly traded corporation on the S&P 500 appoints artificial intelligence as CEO.' },
    { id: 'xrp-double-2026', q: 'Will XRP price double in 2026?', category: 'crypto', yes: 0.33, baseVol: 19000, desc: 'Resolves to Yes if XRP matches double of its Jan 1st starting price.' },
    { id: 'nasa-artemis2', q: 'Will NASA launch Artemis 2 in 2026?', category: 'other', yes: 0.68, baseVol: 14000, desc: 'Resolves to Yes if SLS rocket and Orion spacecraft launch astronauts on an orbital circumlunar path.' },
    { id: 'next-italy-pm', q: 'Next prime minister of Italy', category: 'politics', yes: 0.39, baseVol: 1300, desc: 'Resolves to the nominated President of Council of Ministers officially appointed by Italy\'s President.' },
    { id: 'bitcoin-fee-100', q: 'Will Bitcoin Transaction fees hit $100?', category: 'crypto', yes: 0.07, baseVol: 1100, desc: 'Resolves to Yes if single transaction median fee on Bitcoin blockchain exceeds $100 USD.' },
    { id: 'human-clone-2026', q: 'Will a human clone be born in 2026?', category: 'other', yes: 0.03, baseVol: 300, desc: 'Resolves if credible science academies authenticate a successfully birthed cloned human.' },
    { id: 'uk-rejoin-eu', q: 'Will the UK rejoin the EU Single Market?', category: 'politics', yes: 0.11, baseVol: 1800, desc: 'Resolves to Yes if the UK enters matching treaties re-joining the single consumer market.' },
    { id: 'cardano-top5', q: 'Will Cardano reach top 5 in CoinMarketCap?', category: 'crypto', yes: 0.09, baseVol: 2800, desc: 'Resolves to Yes if ADA reaches #5 on the CMC ranking panel.' }
  ];

  // Seed the complete market array
  db.markets = rawMarkets.map((m, idx) => {
    // Determine spread: some markets have wilder values, especially low liquidity ones
    let spread = 0.005 + (m.baseVol < 1500 ? 0.048 : Math.random() * 0.02);
    if (m.id === 'next-speaker-house') spread = 0.052;
    if (m.id === 'uk-election-2026') spread = 0.075;
    if (m.id === 'ethereum-etf-inflows') spread = 0.061;
    if (m.id === 'german-gdp-2026') spread = 0.055;
    if (m.id === 'ai-ceo-sp500') spread = 0.082;
    if (m.id === 'bitcoin-fee-100') spread = 0.068;
    if (m.id === 'human-clone-2026') spread = 0.095;
    
    // Depth: Liquidity is mapped around voluntary sizes
    let depth2c = Math.round(m.baseVol * (1 + Math.random() * 0.5));
    if (m.id === 'next-speaker-house') depth2c = 2800;
    if (m.id === 'france-new-prime-minister') depth2c = 4900;
    if (m.id === 'apple-ar-glasses') depth2c = 3200;
    if (m.id === 'uk-election-2026') depth2c = 1100;
    if (m.id === 'dune-part3-oscar') depth2c = 800;
    if (m.id === 'german-gdp-2026') depth2c = 2500;
    if (m.id === 'ai-ceo-sp500') depth2c = 950;
    if (m.id === 'bitcoin-fee-100') depth2c = 1500;
    if (m.id === 'human-clone-2026') depth2c = 400;

    const volume24h = Math.round(m.baseVol * (5 + Math.random() * 50));
    
    // Check constraints
    const isLowLiquidity = depth2c < 5000;
    const isHighSpread = spread > 0.05;

    // Generate price histories
    const history24h = generateHistoricalPrice(m.yes, 24, idx);
    const history7d = generateHistoricalPrice(m.yes, 7, idx); // Pro-exclusive

    // Orderbook structure
    const orderbook = generateOrderbook(m.yes, m.baseVol / 10);

    return {
      id: m.id,
      question: m.q,
      description: m.desc,
      category: m.category,
      yesPrice: m.yes,
      noPrice: parseFloat((1.0 - m.yes).toFixed(2)),
      spread: parseFloat(spread.toFixed(4)),
      depth2c,
      volume24h,
      isLowLiquidity,
      isHighSpread,
      history24h,
      history7d,
      orderbook,
    };
  });

  // Seed default 9 scanner signals from the schema specifications
  db.signals = [
    {
      id: 1,
      market_id: 'next-speaker-house',
      market_title: 'Next Speaker of the US House',
      signal_type: 'HIGH_SPREAD',
      severity: 'critical',
      value: 5.2,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      market_id: 'next-speaker-house',
      market_title: 'Next Speaker of the US House',
      signal_type: 'LOW_LIQUIDITY',
      severity: 'warning',
      value: 2800,
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      market_id: 'france-new-prime-minister',
      market_title: 'Will France appoint a new Prime Minister by June?',
      signal_type: 'LOW_LIQUIDITY',
      severity: 'warning',
      value: 4900,
      created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      market_id: 'ethereum-etf-inflows',
      market_title: 'Will Ethereum ETF see net positive inflows next week?',
      signal_type: 'HIGH_SPREAD',
      severity: 'critical',
      value: 6.1,
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      market_id: 'apple-ar-glasses',
      market_title: 'Will Apple release AR glasses in 2026?',
      signal_type: 'LOW_LIQUIDITY',
      severity: 'warning',
      value: 3200,
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    },
    {
      id: 6,
      market_id: 'uk-election-2026',
      market_title: 'Will there be a UK General Election in 2026?',
      signal_type: 'HIGH_SPREAD',
      severity: 'critical',
      value: 7.5,
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    {
      id: 7,
      market_id: 'uk-election-2026',
      market_title: 'Will there be a UK General Election in 2026?',
      signal_type: 'LOW_LIQUIDITY',
      severity: 'critical',
      value: 1100,
      created_at: new Date(Date.now() - 132 * 60 * 1000).toISOString()
    },
    {
      id: 8,
      market_id: 'german-gdp-2026',
      market_title: 'German GDP growth above 1% in 2026?',
      signal_type: 'HIGH_SPREAD',
      severity: 'warning',
      value: 5.5,
      created_at: new Date(Date.now() - 240 * 60 * 1000).toISOString()
    },
    {
      id: 9,
      market_id: 'ai-ceo-sp500',
      market_title: 'AI CEO appointed to S&P 500 company?',
      signal_type: 'LOW_LIQUIDITY',
      severity: 'critical',
      value: 950,
      created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString()
    }
  ];

  db.users = [];
  db.alert_subscriptions = [];
  db.pricing_waitlist = [];

  // Write new seeded DB
  saveDB();
  console.log('Seeded 25 markets & signals into new db.json successfully.');
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB file:', e);
  }
}

// Boot up DB
initDB();

// -----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------
function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (err) {
        res.status(403).json({ error: 'Forbidden. Invalid access token.' });
        return;
      }
      (req as any).user = decodedUser;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized. Token not provided.' });
  }
}

// -----------------------------------------------------
// PUBLIC API ENDPOINTS
// -----------------------------------------------------

// GET /api/health - Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Polymarket Liquidity Scanner API' });
});

// GET /api/markets - Retrieve markets with pagination, filtering, caching simulation
app.get('/api/markets', (req: Request, res: Response) => {
  const limitValue = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const category = (req.query.category as string || 'all').toLowerCase();
  
  let resultMarkets = [...db.markets];
  
  // Categorization filter
  if (category !== 'all') {
    resultMarkets = resultMarkets.filter(m => m.category === category);
  }

  // Sort descending by 2c Depth by default
  resultMarkets.sort((a, b) => b.depth2c - a.depth2c);

  // Apply cache tier parameters if user is logged in
  // Pro tier sees unlimited markets. Free tier is always capped to first 20.
  // The client identifies users on their end, but we enforce it here for stability.
  const authHeader = req.headers.authorization;
  let isPro = false;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const decodedUser = jwt.verify(token, JWT_SECRET) as any;
      const foundUser = db.users.find(u => u.email === decodedUser.email);
      if (foundUser && foundUser.subscription_tier === 'pro') {
        isPro = true;
      }
    } catch (e) {
      // safe fallback
    }
  }

  // Cap at 20 unless they are Pro or explicitly fetching a single item
  if (!isPro) {
    resultMarkets = resultMarkets.slice(0, 20);
  } else {
    // Pro limit up to the requested value or all
    if (limitValue) {
      resultMarkets = resultMarkets.slice(0, Math.min(limitValue, 50));
    }
  }

  res.json({
    markets: resultMarkets,
    cachedInTier: isPro ? '15 seconds (Pro priority)' : '60 seconds (Free)',
    totalCount: db.markets.length
  });
});

// GET /api/markets/:id - Get specific market's specifications
app.get('/api/markets/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const market = db.markets.find(m => m.id === id);
  if (!market) {
    res.status(404).json({ error: `Market with identity ${id} not found.` });
    return;
  }
  res.json(market);
});

// GET /api/markets/:id/history - Get specific chart dataset
app.get('/api/markets/:id/history', (req: Request, res: Response) => {
  const id = req.params.id;
  const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
  const market = db.markets.find(m => m.id === id);

  if (!market) {
    res.status(404).json({ error: 'Market not found' });
    return;
  }

  // Simulation: 24h history for free, 7d history for Pro
  if (hours > 24) {
    // Pro authorized check (simplified back-end check)
    const authHeader = req.headers.authorization;
    let isPro = false;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decodedUser = jwt.verify(token, JWT_SECRET) as any;
        const foundUser = db.users.find(u => u.email === decodedUser.email);
        if (foundUser && foundUser.subscription_tier === 'pro') {
          isPro = true;
        }
      } catch (e) {}
    }

    if (!isPro) {
      res.status(403).json({ error: 'Upgrade to Pro to fetch 7-day price history.' });
      return;
    }
    res.json({ history: market.history7d || market.history24h.slice(0, 7) });
  } else {
    res.json({ history: market.history24h });
  }
});

// GET /api/markets/:id/orderbook - Get specific orderbook
app.get('/api/markets/:id/orderbook', (req: Request, res: Response) => {
  const id = req.params.id;
  const market = db.markets.find(m => m.id === id);
  if (!market) {
    res.status(404).json({ error: 'Market not found' });
    return;
  }
  res.json(market.orderbook);
});

// GET /api/signals - Get recent scanner alerts list
app.get('/api/signals', (req: Request, res: Response) => {
  res.json({
    signals: db.signals.slice(0, 10)
  });
});

// -----------------------------------------------------
// AUTHENTICATED OR REGISTRATION API ENDPOINTS
// -----------------------------------------------------

// POST /api/auth/register - Sign up endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required fields.' });
    return;
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    passwordHash,
    subscription_tier: 'free' as 'free' | 'pro',
    upgrade_waitlist_email: false,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB();

  const token = jwt.sign({ email: newUser.email, id: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
  
  res.status(201).json({
    token,
    user: {
      email: newUser.email,
      subscription_tier: newUser.subscription_tier,
      upgrade_waitlist_email: newUser.upgrade_waitlist_email
    }
  });
});

// POST /api/auth/login - Sign in endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required fields.' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      email: user.email,
      subscription_tier: user.subscription_tier,
      upgrade_waitlist_email: user.upgrade_waitlist_email
    }
  });
});

// GET /api/user/me - Fetch authenticated user details
app.get('/api/user/me', authenticateJWT, (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const user = db.users.find(u => u.email === tokenUser.email);
  if (!user) {
    res.status(404).json({ error: 'User profiles not found.' });
    return;
  }

  res.json({
    user: {
      email: user.email,
      subscription_tier: user.subscription_tier,
      upgrade_waitlist_email: user.upgrade_waitlist_email
    }
  });
});

// POST /api/user/upgrade-intent - Save email for pricing waitlist early access
app.post('/api/user/upgrade-intent', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  // Update user in DB if registered
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.upgrade_waitlist_email = true;
    user.subscription_tier = 'pro'; // Simulate immediate Pro upgrade for testability!
    saveDB();
  }

  // Also push to generic waitlist
  const alreadyInWaitlist = db.pricing_waitlist.some(w => w.email.toLowerCase() === email.toLowerCase());
  if (!alreadyInWaitlist) {
    db.pricing_waitlist.push({
      id: db.pricing_waitlist.length + 1,
      email,
      created_at: new Date().toISOString()
    });
    saveDB();
  }

  res.json({
    success: true,
    message: 'Upgraded successfully to simulated PRO tier. Thank you!',
    user: user ? {
      email: user.email,
      subscription_tier: user.subscription_tier,
      upgrade_waitlist_email: user.upgrade_waitlist_email
    } : null
  });
});

// POST /api/alerts/subscribe - Alert subscription list simulation
app.post('/api/alerts/subscribe', authenticateJWT, (req: Request, res: Response) => {
  const { marketId, telegramChatId } = req.body;
  const tokenUser = (req as any).user;

  if (!marketId || !telegramChatId) {
    res.status(400).json({ error: 'Market ID and Telegram Chat ID are required.' });
    return;
  }

  const foundUser = db.users.find(u => u.email === tokenUser.email);
  if (!foundUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (foundUser.subscription_tier !== 'pro') {
    res.status(403).json({ error: 'Telegram alerts are exclusive to Pro tier subscribers.' });
    return;
  }

  const newAlert = {
    id: db.alert_subscriptions.length + 1,
    user_id: foundUser.id,
    market_id: marketId,
    telegram_chat_id: telegramChatId,
    created_at: new Date().toISOString()
  };

  db.alert_subscriptions.push(newAlert);
  saveDB();

  res.status(201).json({
    success: true,
    message: `Telegram alert subscription created for market ${marketId}.`,
    alert: newAlert
  });
});

// -----------------------------------------------------
// SERVING VITE FRONTEND (DEV MODE & PRODUCTION)
// -----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static routes configured for production build.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server actively running on http://localhost:${PORT}`);
  });
}

startServer();
export default app;
