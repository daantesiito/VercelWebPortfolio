# Solución para Error de Prepared Statements en Vercel

## Problema
Error `"prepared statement \"s2\" already exists"` al usar Prisma con NextAuth en Vercel.

## Causa
En entornos serverless como Vercel, las funciones pueden reutilizar instancias, causando que Prisma intente crear prepared statements que ya existen.

## Solución Implementada

### 1. Configuración de Prisma (`lib/prisma.ts`)
- Crear nueva instancia de PrismaClient para cada request en Vercel
- Desconexión automática después de 5 segundos
- Manejo de errores de desconexión

### 2. Wrapper de Base de Datos (`lib/db-connection.ts`)
- Función `withDatabase()` para operaciones que requieren desconexión automática
- Función `withAuthDatabase()` específica para operaciones de NextAuth
- Manejo de errores y desconexión limpia

### 3. Configuración de NextAuth (`lib/auth.ts`)
- Uso del wrapper `withAuthDatabase()` en operaciones críticas
- Eventos de desconexión después de signIn/signOut
- Manejo de timeouts para evitar bloqueos

### 4. Configuración de Vercel (`vercel.json`)
- Timeout de 30 segundos para funciones API
- Configuración de entorno de producción

## Uso
Las operaciones de base de datos ahora se manejan automáticamente. No se requiere cambios en el código existente, excepto para operaciones críticas que deben usar `withAuthDatabase()`.

## Monitoreo
- Logs de debug habilitados en desarrollo
- Logs de error en producción
- Desconexión automática para evitar memory leaks
