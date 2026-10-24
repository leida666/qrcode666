-- Anonymous usage tally: one "+1" per downloaded code,
-- by UTC day and code type. Nothing about the person is stored.
CREATE TABLE IF NOT EXISTS usage (
  day  TEXT    NOT NULL, -- UTC date, YYYY-MM-DD
  type TEXT    NOT NULL, -- 'url' | 'text' | 'wifi' | ...
  uses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, type)
);
