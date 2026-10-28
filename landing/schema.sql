CREATE TABLE IF NOT EXISTS signups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  artist      TEXT NOT NULL,   -- who/what they want to see: artist, band, orchestra, show
  artist_key  TEXT NOT NULL,   -- lowercased, for grouping
  city        TEXT NOT NULL,
  city_key    TEXT NOT NULL,   -- lowercased, for grouping
  format      TEXT NOT NULL DEFAULT 'concert', -- concert | orchestral | theatre | other
  role        TEXT NOT NULL DEFAULT 'fan',     -- fan | performer | organizer | sponsor | provider
  country     TEXT,            -- visitor country from Cloudflare (ISO 3166-1 alpha-2)
  ip_hash     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email, artist_key, city_key)
);

CREATE INDEX IF NOT EXISTS signups_demand ON signups (artist_key, city_key);
CREATE INDEX IF NOT EXISTS signups_ip_day ON signups (ip_hash, created_at);
