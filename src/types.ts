// TypeScript Type Definitions for Polymarket Liquidity Scanner MVP

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro'
}

export enum SignalType {
  HIGH_SPREAD = 'HIGH_SPREAD',
  LOW_LIQUIDITY = 'LOW_LIQUIDITY'
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface MarketHistoryPoint {
  time: string;
  price: number;
}

export interface OrderBookItem {
  price: number;
  volume: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
}

export interface Market {
  id: string;
  question: string;
  description: string;
  category: string; // 'politics' | 'crypto' | 'other'
  yesPrice: number;
  noPrice: number;
  spread: number; // e.g. 0.052 for 5.2%
  depth2c: number; // e.g. 2800 for $2,800
  volume24h: number; // e.g. 12400 for $12,400
  isLowLiquidity: boolean;
  isHighSpread: boolean;
  history24h: MarketHistoryPoint[];
  history7d?: MarketHistoryPoint[]; // Pro exclusive
  orderbook: OrderBook;
}

export interface Signal {
  id: number;
  market_id: string;
  market_title: string;
  signal_type: SignalType;
  severity: Severity;
  value: number;
  created_at: string;
}

export interface User {
  email: string;
  subscription_tier: SubscriptionTier;
  upgrade_waitlist_email: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PriceAlertRequest {
  marketId: string;
  telegramChatId: string;
}
