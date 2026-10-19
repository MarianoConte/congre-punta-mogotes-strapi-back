'use strict';

/**
 * Copia consistente de la base SQLite, para el backup diario de Este
 * (repo territorios-este-backups). Usa la API de backup de SQLite, que es
 * segura aunque Strapi esté escribiendo en ese momento; copiar el archivo a
 * mano no lo es.
 *
 * Uso (dentro de la máquina de Fly):
 *   node /opt/app/scripts/backup-sqlite.js /opt/app/data/data.db /tmp/backup.db
 */

const Database = require('better-sqlite3');

const [origen, destino] = process.argv.slice(2);

if (!origen || !destino) {
  console.error('Uso: node scripts/backup-sqlite.js <origen.db> <destino.db>');
  process.exit(1);
}

const db = new Database(origen, { readonly: true, fileMustExist: true });

db.backup(destino)
  .then(() => {
    db.close();
    console.log(`Backup OK: ${destino}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
