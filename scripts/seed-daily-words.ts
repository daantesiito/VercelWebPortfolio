import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Palabras de ejemplo para testing (reemplaza con tus propias palabras)
const SAMPLE_WORDS = [
  'ASMR', 'POGGERS', 'KAPPA', 'LUL', 'OMEGALUL', 'PEPE', 'KEKW', 'MONKAS',
  'FORSEN', 'XQC', 'NINJA', 'SHROUD', 'SUMMIT', 'DOC', 'TIM', 'SODA',
  'TWITCH', 'STREAM', 'CHAT', 'SUB', 'DONO', 'BITS', 'EMOTE', 'RAID'
]

async function seedDailyWords() {
  try {
    console.log('🌱 Iniciando seed de palabras de ejemplo...')
    
    // Limpiar palabras existentes
    await prisma.$executeRaw`DELETE FROM "DailyWord"`
    
    // Insertar palabras de ejemplo
    for (let i = 0; i < SAMPLE_WORDS.length; i++) {
      const word = SAMPLE_WORDS[i]
      await prisma.$executeRaw`
        INSERT INTO "DailyWord" (id, date, word, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '2025-01-01', ${word}, NOW(), NOW())
        ON CONFLICT (date) DO NOTHING
      `
    }
    
    console.log(`✅ Insertadas ${SAMPLE_WORDS.length} palabras de ejemplo`)
    console.log('📝 Reemplaza estas palabras con las tuyas usando el endpoint admin')
    console.log('🔧 O ejecuta SQL directamente en tu base de datos')
    
  } catch (error) {
    console.error('❌ Error en seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDailyWords()
