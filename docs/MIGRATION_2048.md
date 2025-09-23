# Migración del Juego 2048 a Next.js

## Resumen

Este documento describe la migración del juego 2048 desde HTML/CSS/JavaScript vanilla a React/TypeScript usando Next.js App Router.

## Estructura del Proyecto

### Antes (Vanilla)
```
app/games/2048/
├── index.html
├── js/
│   ├── application.js
│   ├── game_manager.js
│   ├── grid.js
│   ├── tile.js
│   ├── keyboard_input_manager.js
│   ├── html_actuator.js
│   ├── local_storage_manager.js
│   └── theme_switcher.js
├── style/
│   ├── main.css
│   └── fonts/
└── media/
```

### Después (Next.js)
```
app/
├── (site)/                    # Route group para el portfolio principal
│   ├── layout.tsx            # Layout con header
│   └── page.tsx              # Página principal
├── (games)/                   # Route group para juegos
│   ├── layout.tsx            # Layout sin header
│   └── games/
│       └── 2048/
│           ├── page.tsx      # Página del juego
│           ├── Game2048.tsx  # Componente principal
│           ├── styles.css    # Estilos del juego
│           └── lib/          # Módulos TypeScript
│               ├── Grid.ts
│               ├── Tile.ts
│               ├── GameManager.ts
│               ├── KeyboardInputManager.ts
│               ├── HTMLActuator.ts
│               └── LocalStorageManager.ts
└── layout.tsx                # Layout raíz

public/games/2048/            # Assets estáticos
├── media/                    # Imágenes de emotes
├── style/                    # Fuentes y estilos originales
└── js/                       # Archivos JS originales (referencia)
```

## Mapeo de Archivos

| Archivo Original | Archivo Nuevo | Descripción |
|------------------|---------------|-------------|
| `index.html` | `app/(games)/games/2048/page.tsx` | Página principal del juego |
| `js/application.js` | `app/(games)/games/2048/Game2048.tsx` | Lógica de inicialización |
| `js/game_manager.js` | `app/(games)/games/2048/lib/GameManager.ts` | Lógica principal del juego |
| `js/grid.js` | `app/(games)/games/2048/lib/Grid.ts` | Manejo de la grilla |
| `js/tile.js` | `app/(games)/games/2048/lib/Tile.ts` | Representación de fichas |
| `js/keyboard_input_manager.js` | `app/(games)/games/2048/lib/KeyboardInputManager.ts` | Manejo de entrada |
| `js/html_actuator.js` | `app/(games)/games/2048/lib/HTMLActuator.ts` | Renderizado del DOM |
| `js/local_storage_manager.js` | `app/(games)/games/2048/lib/LocalStorageManager.ts` | Persistencia |
| `style/main.css` | `app/(games)/games/2048/styles.css` | Estilos del juego |

## Cambios Principales

### 1. Route Groups
- **`app/(site)/`**: Contiene el portfolio principal con header
- **`app/(games)/`**: Contiene los juegos sin header del portfolio
- **`app/layout.tsx`**: Layout raíz compartido

### 2. Migración a TypeScript
- Todos los archivos JavaScript convertidos a TypeScript
- Interfaces y tipos definidos para mejor type safety
- Manejo de tipos para `window` y `document` con guards

### 3. Componente React
- `Game2048.tsx` es un componente cliente (`"use client"`)
- Manejo de estado con hooks (`useState`, `useRef`, `useEffect`)
- Event listeners con cleanup automático

### 4. Assets Estáticos
- Imágenes movidas a `/games/2048/media/` en `public/`
- Rutas absolutas para evitar problemas de build
- Fuentes mantenidas en su ubicación original

### 5. Estilos
- CSS adaptado con namespace `.game-2048` para evitar conflictos
- Variables CSS mantenidas para temas (Twitch/Kick)
- Responsive design preservado

## Funcionalidades Preservadas

### ✅ Completamente Funcional
- ✅ Lógica del juego 2048
- ✅ Controles de teclado (flechas, WASD, vim)
- ✅ Controles táctiles (swipe)
- ✅ Persistencia en localStorage
- ✅ Sistema de puntuación y mejor puntuación
- ✅ Temas Twitch/Kick
- ✅ Modal de guía
- ✅ Botones sociales
- ✅ Emotes de Twitch como imágenes
- ✅ Animaciones CSS
- ✅ Responsive design

### 🔧 Adaptaciones
- **Inicialización**: Usa `useEffect` y `requestAnimationFrame`
- **Event Listeners**: Cleanup automático en desmontaje
- **DOM Access**: Guards para `typeof window !== 'undefined'`
- **CSS**: Namespaced para evitar conflictos con Tailwind

## Cómo Extender el Juego

### Cambiar Tamaño de Grilla
```typescript
// En Game2048.tsx, línea donde se crea GameManager
gameManagerRef.current = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
// Cambiar el primer parámetro (4) por el tamaño deseado
```

### Agregar Nuevos Emotes
1. Agregar imagen en `/public/games/2048/media/`
2. Actualizar `HTMLActuator.ts` en el switch statement
3. Agregar estilos CSS si es necesario

### Modificar Temas
1. Actualizar variables CSS en `styles.css`
2. Modificar lógica en `Game2048.tsx` para `handleThemeSwitch`

## Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start
```

## URLs

- **Desarrollo**: `http://localhost:3000/games/2048`
- **Producción**: `https://dantesito.dev/games/2048`

## Notas Técnicas

### SSR/CSR
- El juego es completamente client-side
- No hay hidratación de estado del servidor
- localStorage solo funciona en el cliente

### Performance
- Assets optimizados por Next.js
- Lazy loading de imágenes
- CSS crítico inline

### SEO
- Metadata específica para el juego
- Open Graph tags
- Robots.txt configurado

## Próximos Pasos

1. **Migrar Twitchdle**: Aplicar la misma estructura
2. **Migrar Suika**: Aplicar la misma estructura
3. **Optimizaciones**: 
   - Service Worker para cache
   - PWA manifest
   - Analytics mejorado

## Troubleshooting

### Build Errors
- Verificar que todos los imports de TypeScript sean correctos
- Asegurar que las rutas de assets sean absolutas
- Revisar que no haya referencias a `window` en SSR

### Runtime Errors
- Verificar que el DOM esté disponible antes de acceder
- Revisar que los event listeners se limpien correctamente
- Comprobar que localStorage esté disponible

### Styling Issues
- Verificar que los estilos no entren en conflicto con Tailwind
- Asegurar que las variables CSS estén definidas
- Revisar responsive breakpoints
