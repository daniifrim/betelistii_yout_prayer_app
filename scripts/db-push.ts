import { exec } from 'child_process';

// Ejecutar drizzle-kit push con la bandera --force
exec('npx drizzle-kit push --force', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar el comando: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error en la ejecución: ${stderr}`);
    return;
  }
  
  console.log(`Salida del comando: ${stdout}`);
  console.log('Migración completada con éxito');
});