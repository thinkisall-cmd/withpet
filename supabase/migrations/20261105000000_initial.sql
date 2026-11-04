-- =============================================
-- Tables
-- =============================================

CREATE TABLE users (
  id uuid PRIMARY KEY,  -- Supabase Auth uid
  nickname text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text,
  temperament text CHECK (temperament IN ('gentle', 'normal', 'caution')),
  photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  route jsonb NOT NULL DEFAULT '[]',
  share_token uuid UNIQUE
);

CREATE TABLE walk_session_dogs (
  walk_session_id uuid NOT NULL REFERENCES walk_sessions(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  PRIMARY KEY (walk_session_id, dog_id)
);

CREATE TABLE live_locations (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  updated_at timestamptz NOT NULL,
  walk_session_id uuid NOT NULL REFERENCES walk_sessions(id) ON DELETE CASCADE
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_session_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- dogs
CREATE POLICY "dogs_select" ON dogs FOR SELECT USING (true);
CREATE POLICY "dogs_write" ON dogs FOR ALL USING (auth.uid() = user_id);

-- walk_sessions: 본인만 (공유 조회는 service_role API route에서)
CREATE POLICY "sessions_own" ON walk_sessions FOR ALL USING (auth.uid() = user_id);

-- walk_session_dogs
CREATE POLICY "wsd_own" ON walk_session_dogs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM walk_sessions ws
    WHERE ws.id = walk_session_id AND ws.user_id = auth.uid()
  ));

-- live_locations
CREATE POLICY "live_select" ON live_locations FOR SELECT USING (true);
CREATE POLICY "live_write" ON live_locations FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- DB function: append_route_point
-- read-then-write 레이스 컨디션 방지
-- =============================================

CREATE OR REPLACE FUNCTION append_route_point(
  session_id uuid,
  uid uuid,
  point jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE walk_sessions
  SET route = route || point
  WHERE id = session_id AND user_id = uid AND ended_at IS NULL;
$$;

-- =============================================
-- Realtime
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;

-- =============================================
-- Ghost marker cleanup (pg_cron)
-- 1분마다 5분 미갱신 live_locations 삭제
-- =============================================

SELECT cron.schedule(
  'cleanup-stale-live-locations',
  '* * * * *',
  $$DELETE FROM live_locations WHERE updated_at < now() - interval '5 minutes';$$
);

-- =============================================
-- Storage bucket (SQL 방식)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "dog_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'dog-photos');

CREATE POLICY "dog_photos_own_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dog-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
