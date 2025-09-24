# Sistema de Autenticación y Scores

Este documento explica cómo configurar y usar el sistema de autenticación con Twitch y persistencia de scores para los juegos.

## Configuración Inicial

### 1. Crear Aplicación en Twitch

1. Ve a [dev.twitch.tv](https://dev.twitch.tv)
2. Inicia sesión con tu cuenta de Twitch
3. Ve a "Your Console" → "Applications"
4. Crea una nueva aplicación:
   - **Name**: `dantesito.dev`
   - **OAuth Redirect URLs**: 
     - `http://localhost:3000/api/auth/callback/twitch` (desarrollo)
     - `https://dantesito.dev/api/auth/callback/twitch` (producción)
   - **Category**: Website
5. Copia el **Client ID** y **Client Secret**

### 2. Configurar Base de Datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings → Database
3. Copia la **Connection string** (URI)
4. Ejecuta las migraciones:
   ```bash
   npm run prisma:migrate
   ```

### 3. Variables de Entorno

Configura las variables en Vercel (Project Settings → Environment Variables):

```env
NEXTAUTH_URL=https://dantesito.dev
NEXTAUTH_SECRET=tu-clave-secreta-de-32-caracteres-minimo
TWITCH_CLIENT_ID=tu-client-id-de-twitch
TWITCH_CLIENT_SECRET=tu-client-secret-de-twitch
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Desarrollo
npm run dev

# Build para producción
npm run build
```

## Flujo de Usuario

1. **Sin sesión**: Usuario ve pantalla de login con Twitch
2. **Login**: Usuario hace clic en "Login con Twitch" → redirige a Twitch → autoriza → vuelve al juego
3. **Jugar**: Usuario juega normalmente
4. **Fin de partida**: Score se envía automáticamente a la base de datos
5. **Leaderboard**: Top 10 se muestra en tiempo real

## API Endpoints

### GET /api/scores
Obtiene el leaderboard de un juego.

**Query Parameters:**
- `game`: slug del juego (`2048`, `twitchdle`, `suika`)
- `limit`: número de resultados (1-100, default: 10)

**Response:**
```json
[
  {
    "displayName": "Usuario",
    "avatarUrl": "https://...",
    "twitchLogin": "usuario",
    "value": 12345
  }
]
```

### POST /api/scores
Guarda o actualiza el mejor score de un usuario.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "game": "2048",
  "value": 12345
}
```

**Response:**
```json
{
  "best": 12345,
  "updated": true
}
```

## Estructura de Base de Datos

### Tablas NextAuth
- `User`: Usuarios del sistema
- `Account`: Cuentas OAuth (Twitch)
- `Session`: Sesiones activas
- `VerificationToken`: Tokens de verificación

### Tablas Personalizadas
- `Profile`: Datos públicos de Twitch (displayName, avatarUrl, etc.)
- `Score`: Mejores scores por usuario y juego

## Extensión a Otros Juegos

Para agregar un nuevo juego (ej: `twitchdle`):

1. **Crear página del juego**:
   ```tsx
   // app/(games)/games/twitchdle/page.tsx
   export default async function TwitchdlePage() {
     const session = await getServerSession(authOptions);
     const topScores = await getTopScores('twitchdle', 10);
     // ... resto igual que 2048
   }
   ```

2. **Integrar envío de scores**:
   ```tsx
   // En el componente del juego
   const { submitScore } = useScoreSubmission();
   
   // Al terminar partida
   await submitScore(finalScore);
   ```

3. **Actualizar validación**:
   ```ts
   // lib/scores.ts
   const validGames = ['2048', 'twitchdle', 'suika', 'nuevo-juego'];
   ```

## Seguridad

- Validación de scores (anti-cheat básico)
- Rate limiting por IP/usuario
- Autenticación requerida para POST scores
- Validación de game slugs
- Límites en valores de scores (0 ≤ score ≤ 1e9)

## Troubleshooting

### Error: "Invalid game slug"
- Verifica que el slug esté en la lista de juegos válidos
- Usa exactamente: `2048`, `twitchdle`, `suika`

### Error: "Unauthorized"
- Usuario no está autenticado
- Sesión expirada
- Verifica configuración de NextAuth

### Error: "Database connection failed"
- Verifica DATABASE_URL
- Confirma que Supabase esté activo
- Ejecuta `npm run prisma:generate`
