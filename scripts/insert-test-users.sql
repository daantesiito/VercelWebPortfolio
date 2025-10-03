-- Script para insertar 20 usuarios de prueba para el leaderboard de Twitchdle
-- Ejecutar en Supabase SQL Editor

-- Primero, insertar usuarios en la tabla User
INSERT INTO "User" (id, name, email, "displayName", "twitchLogin", "twitchId", "avatarUrl", followers, "createdAt", "updatedAt")
VALUES 
  ('user-001', 'streamer1', 'streamer1@test.com', 'Streamer1', 'streamer1', '1001', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1500, NOW(), NOW()),
  ('user-002', 'streamer2', 'streamer2@test.com', 'Streamer2', 'streamer2', '1002', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2300, NOW(), NOW()),
  ('user-003', 'streamer3', 'streamer3@test.com', 'Streamer3', 'streamer3', '1003', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1800, NOW(), NOW()),
  ('user-004', 'streamer4', 'streamer4@test.com', 'Streamer4', 'streamer4', '1004', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 3200, NOW(), NOW()),
  ('user-005', 'streamer5', 'streamer5@test.com', 'Streamer5', 'streamer5', '1005', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2100, NOW(), NOW()),
  ('user-006', 'streamer6', 'streamer6@test.com', 'Streamer6', 'streamer6', '1006', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 4500, NOW(), NOW()),
  ('user-007', 'streamer7', 'streamer7@test.com', 'Streamer7', 'streamer7', '1007', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2800, NOW(), NOW()),
  ('user-008', 'streamer8', 'streamer8@test.com', 'Streamer8', 'streamer8', '1008', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1900, NOW(), NOW()),
  ('user-009', 'streamer9', 'streamer9@test.com', 'Streamer9', 'streamer9', '1009', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 3600, NOW(), NOW()),
  ('user-010', 'streamer10', 'streamer10@test.com', 'Streamer10', 'streamer10', '1010', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2700, NOW(), NOW()),
  ('user-011', 'streamer11', 'streamer11@test.com', 'Streamer11', 'streamer11', '1011', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1400, NOW(), NOW()),
  ('user-012', 'streamer12', 'streamer12@test.com', 'Streamer12', 'streamer12', '1012', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 3800, NOW(), NOW()),
  ('user-013', 'streamer13', 'streamer13@test.com', 'Streamer13', 'streamer13', '1013', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2200, NOW(), NOW()),
  ('user-014', 'streamer14', 'streamer14@test.com', 'Streamer14', 'streamer14', '1014', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 3100, NOW(), NOW()),
  ('user-015', 'streamer15', 'streamer15@test.com', 'Streamer15', 'streamer15', '1015', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1600, NOW(), NOW()),
  ('user-016', 'streamer16', 'streamer16@test.com', 'Streamer16', 'streamer16', '1016', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 4200, NOW(), NOW()),
  ('user-017', 'streamer17', 'streamer17@test.com', 'Streamer17', 'streamer17', '1017', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2500, NOW(), NOW()),
  ('user-018', 'streamer18', 'streamer18@test.com', 'Streamer18', 'streamer18', '1018', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 1700, NOW(), NOW()),
  ('user-019', 'streamer19', 'streamer19@test.com', 'Streamer19', 'streamer19', '1019', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 2900, NOW(), NOW()),
  ('user-020', 'streamer20', 'streamer20@test.com', 'Streamer20', 'streamer20', '1020', 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ce57700a-def9-11e9-842d-784f43822e80-profile_image-150x150.png', 3300, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Luego, insertar puntuaciones en la tabla Score con diferentes valores para crear un leaderboard variado
INSERT INTO "Score" (id, "userId", "gameSlug", value, "createdAt", "updatedAt")
VALUES 
  -- Top 5: Streaks altos (15-20)
  ('score-001', 'user-001', 'twitchdle', 20, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('score-002', 'user-002', 'twitchdle', 18, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('score-003', 'user-003', 'twitchdle', 16, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('score-004', 'user-004', 'twitchdle', 15, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('score-005', 'user-005', 'twitchdle', 14, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  
  -- Medio-alto: Streaks 8-13
  ('score-006', 'user-006', 'twitchdle', 13, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('score-007', 'user-007', 'twitchdle', 12, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('score-008', 'user-008', 'twitchdle', 11, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('score-009', 'user-009', 'twitchdle', 10, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ('score-010', 'user-010', 'twitchdle', 9, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('score-011', 'user-011', 'twitchdle', 8, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  
  -- Medio: Streaks 4-7
  ('score-012', 'user-012', 'twitchdle', 7, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('score-013', 'user-013', 'twitchdle', 6, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ('score-014', 'user-014', 'twitchdle', 5, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ('score-015', 'user-015', 'twitchdle', 4, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  
  -- Bajo: Streaks 1-3
  ('score-016', 'user-016', 'twitchdle', 3, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ('score-017', 'user-017', 'twitchdle', 2, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
  ('score-018', 'user-018', 'twitchdle', 2, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('score-019', 'user-019', 'twitchdle', 1, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  ('score-020', 'user-020', 'twitchdle', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days')
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
LIMIT 20;
