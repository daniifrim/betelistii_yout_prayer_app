const { Client } = require('pg');

async function runMigration() {
  console.log("Starting migration...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Sincronizar las tablas nuevas y agregar columnas a las tablas existentes
  try {
    // Primero, veamos si ya existen las tablas de actividades
    const checkActivitiesTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activities'
      );
    `);

    if (!checkActivitiesTable.rows[0].exists) {
      console.log("Creando nuevas tablas...");
      
      // Crear tabla badges primero (porque activities la referencia)
      await client.query(`
        CREATE TABLE IF NOT EXISTS badges (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          type TEXT NOT NULL
        );
      `);
      
      // Crear tabla activities
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL, 
          content TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          related_user_id INTEGER REFERENCES users(id),
          related_prayer_id INTEGER REFERENCES prayers(id),
          related_badge_id INTEGER REFERENCES badges(id)
        );
      `);
      
      // Crear tabla user_badges
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
          earned_at TIMESTAMP DEFAULT NOW() NOT NULL,
          displayed BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);
      
      // Crear tabla prayer_intentions
      await client.query(`
        CREATE TABLE IF NOT EXISTS prayer_intentions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);
      
      // Crear tabla intention_participants
      await client.query(`
        CREATE TABLE IF NOT EXISTS intention_participants (
          id SERIAL PRIMARY KEY,
          intention_id INTEGER NOT NULL REFERENCES prayer_intentions(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Crear tabla encouragements
      await client.query(`
        CREATE TABLE IF NOT EXISTS encouragements (
          id SERIAL PRIMARY KEY,
          from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          read BOOLEAN DEFAULT FALSE NOT NULL
        );
      `);
    } else {
      console.log("Las tablas nuevas ya existen, omitiendo creación...");
    }
    
    // Verificar si necesitamos agregar las nuevas columnas a la tabla prayers
    const checkStartTimeColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prayers'
        AND column_name = 'start_time'
      );
    `);
    
    if (!checkStartTimeColumn.rows[0].exists) {
      console.log("Agregando nuevas columnas a la tabla prayers...");
      
      // Agregar columnas para rastrear el tiempo de oración
      await client.query(`
        ALTER TABLE prayers
        ADD COLUMN start_time TIMESTAMP,
        ADD COLUMN end_time TIMESTAMP,
        ADD COLUMN duration INTEGER;
      `);
    } else {
      console.log("Las columnas ya existen en la tabla prayers, omitiendo...");
    }
    
    console.log("Migración completada con éxito!");
  } catch (error) {
    console.error("Error durante la migración:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runMigration();