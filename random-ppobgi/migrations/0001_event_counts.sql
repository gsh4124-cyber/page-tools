CREATE TABLE IF NOT EXISTS event_counts (
  event_date TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK (event_name IN ('game_start', 'game_complete', 'reroll', 'exclude_reroll')),
  method TEXT NOT NULL CHECK (method IN ('ladder', 'wheel', 'lot', 'pinball', 'race', 'capsule', 'slot', 'bomb')),
  input_mode TEXT NOT NULL CHECK (input_mode IN ('number', 'name', 'na')),
  participant_bucket TEXT NOT NULL CHECK (participant_bucket IN ('1', '2-5', '6-10', '11-20', '21+', 'na')),
  result_mode TEXT NOT NULL CHECK (result_mode IN ('winner', 'rank', 'custom', 'bomb')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (
    event_date,
    event_name,
    method,
    input_mode,
    participant_bucket,
    result_mode
  )
);
