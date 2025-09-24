# Migración del Sistema de Scores

Este documento detalla los cambios realizados para implementar el sistema de autenticación y persistencia de scores.

## Archivos Creados

### Configuración Base
- `lib/prisma.ts` - Cliente Prisma singleton
- `lib/auth.ts` - Configuración NextAuth con Twitch
- `lib/scores.ts` - Helpers para manejo de scores
- `prisma/schema.prisma` - Modelos de base de datos

### API Routes
- `app/api/auth/[...nextauth]/route.ts` - Handler de NextAuth
- `app/api/scores/route.ts` - API REST para scores

### Componentes
- `components/SessionProvider.tsx` - Provider de sesión NextAuth
- `components/AuthButton.tsx` - Botón de login/logout
- `components/TopScores.tsx` - Componente de leaderboard

### Juego 2048
- `app/(games)/games/2048/hooks/useScoreSubmission.ts` - Hook para envío de scores
- `app/(games)/games/2048/components/ScoreNotification.tsx` - Notificación de récords
- `app/(games)/games/2048/lib/HTMLActuatorWithCallbacks.ts` - Actuator con callbacks

### Documentación
- `ENV_VARS.md` - Variables de entorno
- `env.example` - Ejemplo de configuración
- `docs/README_AUTH_SCORES.md` - Guía completa del sistema

## Archivos Modificados

### Layouts
- `app/layout.tsx` - Agregado SessionProvider
- `app/(games)/games/2048/page.tsx` - Integrado autenticación y leaderboard

### Juego 2048
- `app/(games)/games/2048/Game2048.tsx` - Integrado envío automático de scores

### Configuración
- `package.json` - Agregados scripts de Prisma

## Modelos de Base de Datos

### NextAuth (Estándar)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  profile       Profile?
  scores        Score[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // ... campos OAuth
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### Personalizados
```prisma
model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  twitchId     String   @unique
  twitchLogin  String   @unique
  displayName  String
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Score {
  id        String   @id @default(cuid())
  userId    String
  gameSlug  String   // "2048" | "twitchdle" | "suika"
  value     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, gameSlug])   // un best score por juego
  @@index([gameSlug, value])
}
```

## Flujo de Datos

### 1. Autenticación
```
Usuario → Login Twitch → NextAuth → Crear/Actualizar User + Profile
```

### 2. Juego
```
Usuario juega → Fin partida → HTMLActuator callback → useScoreSubmission → API POST
```

### 3. Leaderboard
```
Página carga → getTopScores() → API GET → TopScores component
```

## Extensión a Otros Juegos

### Para Twitchdle
1. Crear `app/(games)/games/twitchdle/page.tsx`:
   ```tsx
   export default async function TwitchdlePage() {
     const session = await getServerSession(authOptions);
     if (!session) return <LoginScreen />;
     
     const topScores = await getTopScores('twitchdle', 10);
     return (
       <div>
         <TwitchdleGame />
         <TopScores scores={topScores} game="twitchdle" />
       </div>
     );
   }
   ```

2. En el componente del juego:
   ```tsx
   const { submitScore } = useScoreSubmission();
   
   // Al terminar
   await submitScore(finalScore);
   ```

### Para Suika
1. Mismo patrón que Twitchdle
2. Cambiar slug a `'suika'`
3. Reutilizar todos los componentes y APIs

## Comandos de Migración

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Crear migración inicial
npm run prisma:migrate

# Aplicar a base de datos
npm run db:push
```

## Variables de Entorno Requeridas

Ver `ENV_VARS.md` para la lista completa.

## Próximos Pasos

1. **Configurar Twitch App** en dev.twitch.tv
2. **Configurar Supabase** y obtener DATABASE_URL
3. **Configurar variables** en Vercel
4. **Probar autenticación** en desarrollo
5. **Deploy** y verificar en producción
6. **Replicar patrón** en twitchdle y suika
