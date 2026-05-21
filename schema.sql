-- PostgreSQL Migration Schema for Supabase
-- Polymarket Liquidity Scanner MVP

-- 1. Create enum for subscription tiers
CREATE TYPE subscription_tier_type AS ENUM ('free', 'pro');

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free' | 'pro'
    upgrade_waitlist_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index user email for extremely fast logins
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Create Signals Table
CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    market_id VARCHAR(255) NOT NULL,
    market_title VARCHAR(255) NOT NULL,
    signal_type VARCHAR(50) NOT NULL, -- 'HIGH_SPREAD', 'LOW_LIQUIDITY'
    severity VARCHAR(20) DEFAULT 'info', -- 'info' | 'warning' | 'critical'
    value DECIMAL NOT NULL, -- e.g., spread percentage (6.8) or dollar depth value (1200)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_market_id ON signals(market_id);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- 4. Create Alert Subscriptions Table (Future Pro feature placeholder)
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market_id VARCHAR(255) NOT NULL,
    telegram_chat_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Pricing Waitlist Table for Stripe pre-orders
CREATE TABLE IF NOT EXISTS pricing_waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Seed initial high-fidelity Polymarket Scanner signals
INSERT INTO signals (market_id, market_title, signal_type, severity, value, created_at)
VALUES 
    ('next-speaker-house', 'Next Speaker of the US House', 'HIGH_SPREAD', 'critical', 5.2, now() - INTERVAL '5 minutes'),
    ('next-speaker-house', 'Next Speaker of the US House', 'LOW_LIQUIDITY', 'warning', 2800, now() - INTERVAL '12 minutes'),
    ('france-new-prime-minister', 'Will France appoint a new Prime Minister by June?', 'LOW_LIQUIDITY', 'warning', 4900, now() - INTERVAL '24 minutes'),
    ('ethereum-etf-inflows', 'Will Ethereum ETF see net positive inflows next week?', 'HIGH_SPREAD', 'critical', 6.1, now() - INTERVAL '40 minutes'),
    ('apple-ar-glasses', 'Will Apple release AR glasses in 2026?', 'LOW_LIQUIDITY', 'warning', 3200, now() - INTERVAL '1.5 hours'),
    ('uk-election-2026', 'Will there be a UK election in 2026?', 'HIGH_SPREAD', 'critical', 7.5, now() - INTERVAL '2 hours'),
    ('uk-election-2026', 'Will there be a UK election in 2026?', 'LOW_LIQUIDITY', 'critical', 1100, now() - INTERVAL '2.2 hours'),
    ('german-gdp-2026', 'German GDP growth above 1% in 2026?', 'HIGH_SPREAD', 'warning', 5.5, now() - INTERVAL '4 hours'),
    ('ai-ceo-sp500', 'AI CEO appointed to S&P 500 company?', 'LOW_LIQUIDITY', 'critical', 950, now() - INTERVAL '6 hours');
