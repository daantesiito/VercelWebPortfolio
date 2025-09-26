import { Pool } from 'pg'

// Configuración de connection pooling para Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1, // Máximo 1 conexión para serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Función para ejecutar queries SQL directamente
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Función para obtener scores
export async function getScores(gameSlug: string, limit: number = 10, streamersOnly: boolean = false) {
  let queryText = `
    SELECT 
      s.value,
      COALESCE(u."displayName", u.name) as displayName,
      u."avatarUrl" as avatarUrl,
      u."twitchLogin"
    FROM "Score" s
    JOIN "User" u ON s."userId" = u.id
    WHERE s."gameSlug" = $1
  `
  
  if (streamersOnly) {
    queryText += ` AND u."isStreamer" = true`
  }
  
  queryText += ` ORDER BY s.value DESC LIMIT $2`
  
  const result = await query(queryText, [gameSlug, limit])
  console.log('🔍 getScores result:', result.rows)
  return result.rows
}

// Función para crear/actualizar usuario
export async function upsertUser(userData: {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  twitchId?: string | null
  twitchLogin?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}) {
  console.log('🔧 upsertUser called with data:', {
    id: userData.id,
    name: userData.name,
    displayName: userData.displayName,
    twitchLogin: userData.twitchLogin,
    avatarUrl: userData.avatarUrl
  })

  const queryText = `
    INSERT INTO "User" (
      id, name, email, image, "twitchId", "twitchLogin", 
      "displayName", "avatarUrl", followers, "isStreamer", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      image = EXCLUDED.image,
      "twitchId" = EXCLUDED."twitchId",
      "twitchLogin" = EXCLUDED."twitchLogin",
      "displayName" = EXCLUDED."displayName",
      "avatarUrl" = EXCLUDED."avatarUrl",
      "updatedAt" = NOW()
    RETURNING id, name, "displayName", "twitchLogin", "avatarUrl"
  `
  
  const result = await query(queryText, [
    userData.id,
    userData.name,
    userData.email,
    userData.image,
    userData.twitchId,
    userData.twitchLogin,
    userData.displayName,
    userData.avatarUrl,
    0, // followers
    false, // isStreamer
  ])
  
  console.log('✅ upsertUser result:', result.rows[0])
  return result.rows[0]
}

// Función para crear/actualizar score
export async function upsertScore(userId: string, gameSlug: string, value: number) {
  const queryText = `
    INSERT INTO "Score" (id, "userId", "gameSlug", value, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    ON CONFLICT ("userId", "gameSlug") DO UPDATE SET
      value = GREATEST("Score".value, EXCLUDED.value),
      "updatedAt" = NOW()
    RETURNING value
  `
  
  const result = await query(queryText, [userId, gameSlug, value])
  return result.rows[0]
}

// Función para obtener scores de racha (streak)
export async function getStreakScores(gameSlug: string, limit: number = 10) {
  console.log('🔍 getStreakScores called with:', { gameSlug, limit })
  
  const queryText = `
    SELECT 
      s.value,
      COALESCE(u."displayName", u.name) as displayName,
      u."avatarUrl" as avatarUrl,
      u."twitchLogin"
    FROM "Score" s
    JOIN "User" u ON s."userId" = u.id
    WHERE s."gameSlug" = $1
    ORDER BY s.value DESC LIMIT $2
  `
  
  const result = await query(queryText, [gameSlug, limit])
  console.log('🔍 getStreakScores result:', result.rows)
  return result.rows
}
