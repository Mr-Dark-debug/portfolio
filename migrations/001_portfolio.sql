BEGIN;
CREATE TABLE IF NOT EXISTS portfolio_posts (
 slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), markdown text NOT NULL,
 draft boolean NOT NULL DEFAULT true, deleted boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS portfolio_rate_limits_expiry ON portfolio_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS portfolio_reactions (
 slug text NOT NULL, visitor text NOT NULL, kind text NOT NULL CHECK (kind IN ('view', 'clap')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (slug, visitor, kind)
);
CREATE TABLE IF NOT EXISTS portfolio_subscribers (
 email text PRIMARY KEY, token_hash text UNIQUE NOT NULL, confirmed_at timestamptz,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE portfolio_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_subscribers ENABLE ROW LEVEL SECURITY;
COMMIT;
