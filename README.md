# Dante Puddu - Portfolio

Portfolio personal de Dante Puddu, Pentester Junior, desarrollado con Next.js 14, TypeScript y TailwindCSS.

## 🚀 Características

- **Single Page Application** con navegación suave entre secciones
- **Modo oscuro** por defecto con paleta de colores personalizada
- **Responsive design** optimizado para mobile y desktop
- **SEO optimizado** con Open Graph y metadatos
- **Accesibilidad** con ARIA labels y navegación por teclado
- **Juegos embebidos** con fallback automático
- **Componentes reutilizables** y arquitectura escalable

## 🎨 Paleta de Colores

- **Negro**: `#090E14` (fondo principal)
- **Celeste**: `#009AFE` (color primario)
- **Rojo**: `#FE0000` (color de acento)

## 📁 Estructura del Proyecto

```
├── app/
│   ├── games/[slug]/          # Páginas dinámicas para juegos
│   ├── globals.css            # Estilos globales y variables CSS
│   ├── layout.tsx             # Layout principal con SEO
│   └── page.tsx               # Página principal
├── components/
│   ├── CertCard.tsx           # Card para certificaciones
│   ├── ContactList.tsx        # Lista de contacto
│   ├── Header.tsx             # Navegación principal
│   ├── ProjectCard.tsx        # Card para proyectos
│   └── Section.tsx            # Wrapper de secciones
├── data/
│   ├── certs.ts               # Datos de certificaciones
│   ├── contact.ts             # Información de contacto
│   └── projects.ts            # Datos de proyectos y juegos
└── public/
    ├── images/                # Imágenes placeholder
    └── favicon.ico            # Favicons
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Node.js 18+ 
- npm, yarn o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd dante-puddu-portfolio

# Instalar dependencias
npm install
# o
yarn install
# o
pnpm install

# Ejecutar en modo desarrollo
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build para Producción

```bash
npm run build
npm start
```

## 📝 Personalización

### Editar Información Personal

1. **Datos de contacto** (`data/contact.ts`):
   ```typescript
   export const contactInfo: ContactInfo = {
     email: "tu-email@ejemplo.com",
     instagram: "https://instagram.com/tu-usuario",
     telegram: "@tu-usuario",
     github: "https://github.com/tu-usuario"
   };
   ```

2. **Descripción personal** (`app/page.tsx`):
   - Buscar los comentarios `TODO` y reemplazar con tu información real
   - Actualizar la sección "Sobre Mí" con tu historia y habilidades

3. **Proyectos** (`data/projects.ts`):
   - Agregar nuevos proyectos al array `projects`
   - Actualizar descripciones existentes
   - Cambiar imágenes en `/public/images/`

### Agregar Nuevos Proyectos

```typescript
{
  id: "mi-proyecto",
  title: "Mi Proyecto",
  description: "Descripción del proyecto...",
  image: "/images/mi-proyecto.svg",
  href: "https://mi-proyecto.com", // o "/games/mi-juego" para juegos
  kind: "external" // o "game" para juegos embebidos
}
```

### Agregar Certificaciones

```typescript
{
  id: "mi-certificacion",
  title: "Mi Certificación",
  image: "/images/mi-cert.svg",
  href: "https://certificacion.com"
}
```

### Agregar Nuevos Juegos

1. Agregar el proyecto en `data/projects.ts` con `kind: "game"`
2. Agregar la URL en `gameUrls`:
   ```typescript
   export const gameUrls: Record<string, string> = {
     // ... otros juegos
     "mi-juego": "https://mi-juego.github.io/"
   };
   ```

## 🎮 Juegos Incluidos

- **Suika Game**: [https://daantesiito.github.io/suika/](https://daantesiito.github.io/suika/)
- **2048**: [https://daantesiito.github.io/2048/](https://daantesiito.github.io/2048/)
- **Twitchdle**: [https://daantesiito.github.io/twitchdle/](https://daantesiito.github.io/twitchdle/)

## 🚀 Deploy en Vercel

1. Conectar tu repositorio a Vercel
2. Configurar las variables de entorno si es necesario
3. Deploy automático en cada push a main

### Configuración Recomendada en Vercel

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 🔧 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **TailwindCSS** - Framework de CSS
- **React 18** - Biblioteca de UI
- **Next/Image** - Optimización de imágenes
- **Next/Link** - Navegación optimizada

## 📱 Características Responsive

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Navegación**: Header sticky con menú adaptativo
- **Grids**: Responsive grids para proyectos y certificaciones

## ♿ Accesibilidad

- **ARIA labels** en todos los elementos interactivos
- **Navegación por teclado** completamente funcional
- **Contraste** optimizado para WCAG AA
- **Alt text** en todas las imágenes
- **Focus indicators** visibles

## 🎨 Personalización de Estilos

Las variables CSS están definidas en `app/globals.css`:

```css
:root {
  --color-bg: #090E14;
  --color-primary: #009AFE;
  --color-accent: #FE0000;
}
```

## 📄 SEO y Metadatos

- **Open Graph** configurado para redes sociales
- **Twitter Cards** para mejor preview
- **Meta tags** optimizados
- **Sitemap** y robots.txt incluidos
- **Structured data** preparado para agregar

## 🐛 Solución de Problemas

### Error de iframe en juegos
Si un juego no se carga, el sistema automáticamente muestra un fallback con botón para abrir en nueva pestaña.

### Imágenes no cargan
Verificar que las rutas en `data/projects.ts` y `data/certs.ts` sean correctas.

### Build falla
Ejecutar `npm run lint` para verificar errores de TypeScript.

## 📞 Soporte

Para dudas o problemas:
- Crear un issue en el repositorio
- Contactar a Dante Puddu en los enlaces del portfolio

## 📄 Licencia

Este proyecto es de uso personal. Todos los derechos reservados.

---

**Desarrollado con ❤️ por Dante Puddu**

