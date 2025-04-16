const { Client } = require('pg');

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
  console.log("Iniciando proceso de creación de insignias...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no encontrada");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log("Verificando insignias existentes...");
    
    const existingBadgesResult = await client.query(`
      SELECT COUNT(*) as count FROM badges
    `);
    
    const badgeCount = parseInt(existingBadgesResult.rows[0].count);
    
    if (badgeCount === 0) {
      console.log("Creando insignias predeterminadas...");
      
      for (const badge of defaultBadges) {
        await client.query(`
          INSERT INTO badges (name, description, icon, type)
          VALUES ($1, $2, $3, $4)
        `, [badge.name, badge.description, badge.icon, badge.type]);
      }
      
      console.log("Se crearon 8 insignias con éxito!");
    } else {
      console.log(`Ya existen ${badgeCount} insignias en la base de datos.`);
    }
  } catch (error) {
    console.error("Error al crear las insignias:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seedBadges();