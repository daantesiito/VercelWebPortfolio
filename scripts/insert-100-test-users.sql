-- Script para insertar 100 usuarios de prueba para el leaderboard de Twitchdle
-- Ejecutar en Supabase SQL Editor

-- Generar 100 usuarios de prueba usando una función generadora
WITH user_data AS (
  SELECT 
    'user-' || LPAD(generate_series(1, 100)::text, 3, '0') as id,
    'streamer' || LPAD(generate_series(1, 100)::text, 3, '0') as name,
    'streamer' || LPAD(generate_series(1, 100)::text, 3, '0') || '@test.com' as email,
    'Streamer' || LPAD(generate_series(1, 100)::text, 3, '0') as displayName,
    'streamer' || LPAD(generate_series(1, 100)::text, 3, '0') as twitchLogin,
    (1000 + generate_series(1, 100))::text as twitchId,
    'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png' as avatarUrl,
    (1000 + (random() * 5000)::int) as followers
)
INSERT INTO "User" (id, name, email, "displayName", "twitchLogin", "twitchId", "avatarUrl", followers, "createdAt", "updatedAt")
SELECT 
  id,
  name,
  email,
  displayName,
  twitchLogin,
  twitchId,
  avatarUrl,
  followers,
  NOW() - (random() * INTERVAL '30 days'),
  NOW() - (random() * INTERVAL '30 days')
FROM user_data
ON CONFLICT (id) DO NOTHING;

-- Generar 100 scores de prueba con distribución variada
WITH score_data AS (
  SELECT 
    'score-' || LPAD(generate_series(1, 100)::text, 3, '0') as id,
    'user-' || LPAD(generate_series(1, 100)::text, 3, '0') as userId,
    'twitchdle' as gameSlug,
    -- Distribución de scores: algunos altos, muchos medios, algunos bajos
    CASE 
      WHEN generate_series(1, 100) <= 5 THEN 20 + (random() * 10)::int  -- Top 5: 20-30
      WHEN generate_series(1, 100) <= 15 THEN 15 + (random() * 5)::int  -- Top 15: 15-20
      WHEN generate_series(1, 100) <= 35 THEN 10 + (random() * 5)::int  -- Top 35: 10-15
      WHEN generate_series(1, 100) <= 60 THEN 5 + (random() * 5)::int   -- Top 60: 5-10
      WHEN generate_series(1, 100) <= 85 THEN 2 + (random() * 3)::int   -- Top 85: 2-5
      ELSE 1                                                             -- Resto: 1
    END as value,
    NOW() - (random() * INTERVAL '30 days') as createdAt,
    NOW() - (random() * INTERVAL '30 days') as updatedAt
)
INSERT INTO "Score" (id, "userId", "gameSlug", value, "createdAt", "updatedAt")
SELECT 
  id,
  userId,
  gameSlug,
  value,
  createdAt,
  updatedAt
FROM score_data
ON CONFLICT (id) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
  s.id,
  u."displayName",
  u."twitchLogin",
  s.value as streak,
  s."createdAt",
  s."updatedAt"
FROM "Score" s
JOIN "User" u ON s."userId" = u.id
WHERE s."gameSlug" = 'twitchdle'
ORDER BY s.value DESC, s."updatedAt" ASC
LIMIT 100;
