'use strict';

/**
 * Carga masiva de territorios con su foto.
 *
 * Toma una carpeta con imágenes nombradas por número de territorio (1.png,
 * 2.jpg, 15.webp...) y, para cada una, crea el territorio si no existe y le
 * asigna la foto si todavía no tiene. Se puede correr varias veces: lo que ya
 * está cargado se saltea.
 *
 * Uso:
 *   STRAPI_URL=https://congre-este-strapi-back.fly.dev \
 *   STRAPI_TOKEN=<API token> \
 *   node scripts/cargar-territorios.js <carpeta> [--dry-run]
 *
 * El token se crea en el admin: Settings → API Tokens → Create new API Token,
 * tipo "Full access". Conviene borrarlo cuando termina la carga.
 *
 * No depende de node_modules: usa fetch/FormData nativos (Node 18 o más).
 */

const fs = require('fs');
const path = require('path');

const TERRITORIO_UID = 'api::territorio.territorio';
// Las mismas que pone el bootstrap (src/index.js) a los territorios sin manzanas.
const MANZANAS_DEFAULT = ['A', 'B', 'C', 'D'];
const TIPOS = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const [carpeta, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const baseUrl = (process.env.STRAPI_URL ?? '').replace(/\/+$/, '').replace(/\/api$/, '');
const token = process.env.STRAPI_TOKEN;

if (!carpeta || !baseUrl || !token) {
  console.error('Uso: STRAPI_URL=... STRAPI_TOKEN=... node scripts/cargar-territorios.js <carpeta> [--dry-run]');
  process.exit(1);
}

async function api(metodo, ruta, cuerpo) {
  const esForm = cuerpo instanceof FormData;
  const respuesta = await fetch(`${baseUrl}/api${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(cuerpo && !esForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? (esForm ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`${metodo} ${ruta} → ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }
  return respuesta.json();
}

/** Lee la carpeta y devuelve [{ numero, archivo }] ordenado por número. */
function leerImagenes(dir) {
  return fs
    .readdirSync(dir)
    .map((nombre) => {
      const ext = path.extname(nombre).toLowerCase();
      const numero = path.basename(nombre, path.extname(nombre));
      if (!TIPOS[ext] || !/^\d+$/.test(numero)) return null;
      return { numero: String(Number(numero)), archivo: path.join(dir, nombre), tipo: TIPOS[ext] };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.numero) - Number(b.numero));
}

async function buscarTerritorio(numero) {
  const query = new URLSearchParams({
    'filters[Numero][$eq]': numero,
    publicationState: 'preview',
    populate: 'Foto',
  });
  const { data } = await api('GET', `/territorios?${query}`);
  return data[0] ?? null;
}

async function crearTerritorio(numero) {
  const { data } = await api('POST', '/territorios', {
    data: { Numero: numero, Manzanas: MANZANAS_DEFAULT, publishedAt: new Date().toISOString() },
  });
  return data;
}

/** Sube la imagen y la deja asignada al campo Foto del territorio en un solo paso. */
async function subirFoto(territorioId, { archivo, tipo }) {
  const form = new FormData();
  form.append('files', new Blob([fs.readFileSync(archivo)], { type: tipo }), path.basename(archivo));
  form.append('ref', TERRITORIO_UID);
  form.append('refId', String(territorioId));
  form.append('field', 'Foto');
  await api('POST', '/upload', form);
}

async function main() {
  const imagenes = leerImagenes(carpeta);
  if (imagenes.length === 0) {
    console.error(`No hay imágenes con nombre numérico (1.png, 2.jpg...) en ${carpeta}`);
    process.exit(1);
  }

  console.log(`${imagenes.length} imágenes en ${carpeta}${dryRun ? ' (dry run: no se modifica nada)' : ''}`);
  const resumen = { creados: 0, fotos: 0, salteados: 0, errores: 0 };

  for (const imagen of imagenes) {
    const etiqueta = `Territorio ${imagen.numero}`;
    try {
      let territorio = await buscarTerritorio(imagen.numero);

      if (territorio?.attributes?.Foto?.data) {
        console.log(`${etiqueta}: ya tiene foto, se saltea`);
        resumen.salteados++;
        continue;
      }

      if (dryRun) {
        console.log(`${etiqueta}: ${territorio ? 'existe sin foto' : 'se crearía'}; se subiría ${path.basename(imagen.archivo)}`);
        continue;
      }

      if (!territorio) {
        territorio = await crearTerritorio(imagen.numero);
        resumen.creados++;
      }

      await subirFoto(territorio.id, imagen);
      resumen.fotos++;
      console.log(`${etiqueta}: listo`);
    } catch (error) {
      resumen.errores++;
      console.error(`${etiqueta}: ERROR — ${error.message}`);
    }
  }

  console.log(
    `\nCreados: ${resumen.creados} · Fotos subidas: ${resumen.fotos} · ` +
      `Salteados: ${resumen.salteados} · Errores: ${resumen.errores}`
  );
  if (resumen.errores > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
