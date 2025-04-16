import { db } from '../server/db.js';
import { badges } from '../shared/schema.js';

const defaultBadges = [
  {
    name: "Madrugador",
    description: "Completar una oración antes de las 6:00 AM",
    icon: "sun",
    type: "morning_watch"
  },
  {
    name: "Noche de Vigilia",
    description: "Completar una oración después de las 10:00 PM",
    icon: "moon",
    type: "night_watch"
  },
  {
    name: "Primeros Pasos",
    description: "Completar tu primera oración",
    icon: "footprints",
    type: "first_prayer"
  },
  {
    name: "Consistente",
    description: "Completar 7 días seguidos de oración",
    icon: "calendar-check",
    type: "consistency_week"
  },
  {
    name: "Disciplinado",
    description: "Completar 30 días seguidos de oración",
    icon: "calendar-range",
    type: "consistency_month"
  },
  {
    name: "Intercesor",
    description: "Participar en 5 intenciones de oración de otros",
    icon: "heart-handshake",
    type: "intercessor"
  },
  {
    name: "Alentador",
    description: "Enviar 10 mensajes de aliento",
    icon: "heart-pulse",
    type: "encourager"
  },
  {
    name: "Perseverante",
    description: "Orar por más de 30 minutos en una sesión",
    icon: "timer",
    type: "long_prayer"
  }
];

async function seedBadges() {
  try {
    console.log("Verificando badges existentes...");
    const existingBadges = await db.select().from(badges);
    
    if (existingBadges.length === 0) {
      console.log("Creando badges predeterminadas...");
      
      // Insertar todas las badges de una vez
      await db.insert(badges).values(defaultBadges);
      
      console.log("Se crearon 8 badges con éxito!");
    } else {
      console.log(`Ya existen ${existingBadges.length} badges en la base de datos.`);
    }
  } catch (error) {
    console.error("Error al crear las badges:", error);
  } finally {
    process.exit(0);
  }
}

seedBadges();