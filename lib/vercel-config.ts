// Configuración específica para Vercel
export const vercelConfig = {
  // Configuración de Prisma para serverless
  prisma: {
    // Deshabilitar prepared statements en serverless
    preparedStatements: false,
    // Configuración de connection pooling
    connectionLimit: 1,
    // Timeout para conexiones
    connectionTimeout: 10000,
  },
  
  // Configuración de NextAuth para serverless
  nextAuth: {
    // Usar JWT en lugar de database sessions en serverless
    useJWT: true,
    // Configuración de cookies
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
}