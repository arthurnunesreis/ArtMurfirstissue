-- One active Suggestion per matchKey (format + region + sorted performers).
-- Prisma can't express partial unique indexes, so this ships as a raw SQL migration.
CREATE UNIQUE INDEX IF NOT EXISTS "suggestion_active_match"
  ON "Suggestion" ("matchKey")
  WHERE "status" IN ('DRAFT', 'OPEN', 'THRESHOLD_MET', 'BOOKING');
