'use strict';

/**
 * Carga territorios, edificios, departamentos y direcciones "no visitar"
 * desde un JSON. Los datos no viven en el repo (son direcciones de casas):
 * el script solo sabe leerlos.
 *
 * Formato:
 *   { "territorios": [ { "numero": "2", "manzanas": ["1", "3"],
 *       "edificios": [ { "numero": "1", "direccion": "Córdoba 3468",
 *                        "notas": "Manzana 1. No tocar PB C.",
 *                        "departamentos": ["1 A", "PB C"],
 *                        "noVisitar": ["Córdoba 3468 PB C"] } ] } ] }
 *
 * Se puede correr varias veces:
 * - Un territorio que ya existe se reutiliza. Sus manzanas solo se pisan si
 *   estaban vacías o eran las default del bootstrap.
 * - Un edificio que ya existe (misma dirección) no se modifica, pero se le
 *   agregan los departamentos que le falten.
 * - Las entradas "no visitar" que ya estaban no se duplican.
 *
 * Uso:
 *   STRAPI_URL=https://congre-este-strapi-back.fly.dev \
 *   node scripts/cargar-edificios.js <datos.json> --token-file <archivo> [--dry-run]
 */

const fs = require('fs');
const { crearCliente, leerToken, MANZANAS_DEFAULT } = require('./strapi-api');

const [archivoDatos, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

if (!archivoDatos) {
  console.error('Uso: STRAPI_URL=... node scripts/cargar-edificios.js <datos.json> --token-file <archivo> [--dry-run]');
  process.exit(1);
}

const api = crearCliente({ url: process.env.STRAPI_URL, token: leerToken() });

// Todas las colecciones tienen draftAndPublish: lo que se crea sin publishedAt
// queda como borrador y la app no lo ve.
const publicado = () => new Date().toISOString();

async function buscar(ruta, filtros, pageSize = 1) {
  const query = new URLSearchParams({ ...filtros, publicationState: 'preview', 'pagination[pageSize]': pageSize });
  const { data } = await api('GET', `${ruta}?${query}`);
  return data;
}

const sinManzanasPropias = (manzanas) =>
  !Array.isArray(manzanas) ||
  manzanas.length === 0 ||
  JSON.stringify(manzanas) === JSON.stringify(MANZANAS_DEFAULT);

async function cargarTerritorio(t, resumen) {
  const etiqueta = `Territorio ${t.numero}`;
  let [territorio] = await buscar('/territorios', { 'filters[Numero][$eq]': t.numero });

  if (!territorio) {
    console.log(`${etiqueta}: se crea con manzanas ${t.manzanas.join(', ')}`);
    resumen.territorios++;
    if (!dryRun) {
      ({ data: territorio } = await api('POST', '/territorios', {
        data: { Numero: t.numero, Manzanas: t.manzanas, publishedAt: publicado() },
      }));
    }
  } else if (sinManzanasPropias(territorio.attributes.Manzanas)) {
    console.log(`${etiqueta}: ya existe; se le ponen las manzanas ${t.manzanas.join(', ')}`);
    if (!dryRun) {
      await api('PUT', `/territorios/${territorio.id}`, { data: { Manzanas: t.manzanas } });
    }
  } else {
    console.log(`${etiqueta}: ya existe con manzanas propias; no se tocan`);
  }

  for (const e of t.edificios) {
    await cargarEdificio(e, territorio, resumen);
  }

  await cargarNoVisitar(t, territorio, resumen);
}

async function cargarEdificio(e, territorio, resumen) {
  const etiqueta = `  ${e.direccion}`;
  let [edificio] = await buscar('/edificios', { 'filters[Direccion][$eq]': e.direccion });
  let existentes = new Set();

  if (edificio) {
    const deptos = await buscar('/departamentos', { 'filters[edificio][id][$eq]': edificio.id }, 100);
    existentes = new Set(deptos.map((d) => d.attributes.Departamento));
  } else {
    resumen.edificios++;
    if (!dryRun) {
      ({ data: edificio } = await api('POST', '/edificios', {
        data: {
          Numero: e.numero,
          Direccion: e.direccion,
          Notas: e.notas || null,
          territorio: territorio.id,
          publishedAt: publicado(),
        },
      }));
    }
  }

  const faltan = e.departamentos.filter((d) => !existentes.has(d));
  console.log(
    `${etiqueta}: ${existentes.size ? `ya existe (${existentes.size} deptos)` : 'nuevo'}` +
      `${faltan.length ? `, se crean ${faltan.length} departamentos` : ', sin departamentos nuevos'}`
  );
  resumen.departamentos += faltan.length;

  if (dryRun) return;
  for (const departamento of faltan) {
    await api('POST', '/departamentos', {
      data: { Departamento: departamento, edificio: edificio.id, publishedAt: publicado() },
    });
  }
}

async function cargarNoVisitar(t, territorio, resumen) {
  const direcciones = t.edificios.flatMap((e) => e.noVisitar ?? []);
  if (direcciones.length === 0) return;

  const yaCargadas = territorio
    ? await buscar('/no-visitars', { 'filters[territorio][id][$eq]': territorio.id }, 100)
    : [];
  const claves = new Set(yaCargadas.map((n) => n.attributes.direccion.trim().toLowerCase()));

  for (const direccion of direcciones) {
    if (claves.has(direccion.trim().toLowerCase())) continue;
    console.log(`  No visitar: ${direccion}`);
    resumen.noVisitar++;
    if (!dryRun) {
      await api('POST', '/no-visitars', {
        data: { direccion, territorio: territorio.id, publishedAt: publicado() },
      });
    }
  }
}

async function main() {
  const datos = JSON.parse(fs.readFileSync(archivoDatos, 'utf8'));
  const resumen = { territorios: 0, edificios: 0, departamentos: 0, noVisitar: 0 };

  if (dryRun) console.log('DRY RUN: no se modifica nada.\n');

  for (const t of datos.territorios) {
    await cargarTerritorio(t, resumen);
  }

  const verbo = dryRun ? 'Se crearían' : 'Creados';
  console.log(
    `\n${verbo}: ${resumen.territorios} territorios · ${resumen.edificios} edificios · ` +
      `${resumen.departamentos} departamentos · ${resumen.noVisitar} "no visitar"`
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
