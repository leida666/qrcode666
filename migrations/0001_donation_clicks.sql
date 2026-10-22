-- Anonymous donation-link click counts. Deliberately no IP, user agent,
-- referrer, cookie or any other per-person data: just a daily tally.
CREATE TABLE IF NOT EXISTS donation_clicks (
  day    TEXT    NOT NULL, -- UTC date, YYYY-MM-DD
  org    TEXT    NOT NULL, -- 'unicef' | 'wfp'
  lang   TEXT    NOT NULL, -- page language: 'en' | 'zh'
  clicks INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, org, lang)
);
