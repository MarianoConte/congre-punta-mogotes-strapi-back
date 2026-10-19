'use strict';

/**
 * Cliente mínimo de la API REST de Strapi para los scripts de carga.
 *
 * El token puede venir de STRAPI_TOKEN o de un archivo (STRAPI_TOKEN_FILE o
 * --token-file <archivo>). El archivo es lo recomendable: así el token no
 * queda en el historial de la terminal.
 *
 * No depende de node_modules: usa fetch nativo (Node 18 o más).
 */

const fs = require('fs');

// Las mismas que pone el bootstrap (src/index.js) a los territorios sin manzanas.
const MANZANAS_DEFAULT = ['A', 'B', 'C', 'D'];

function leerToken(argv = process.argv) {
  const i = argv.indexOf('--token-file');
  const archivo = i !== -1 ? argv[i + 1] : process.env.STRAPI_TOKEN_FILE;
  if (archivo) return fs.readFileSync(archivo, 'utf8').trim();
  return process.env.STRAPI_TOKEN;
}

/** Devuelve una función api(metodo, ruta, cuerpo) que habla con `${url}/api${ruta}`. */
function crearCliente({ url, token }) {
  const baseUrl = (url ?? '').replace(/\/+$/, '').replace(/\/api$/, '');
  if (!baseUrl || !token) {
    throw new Error('Faltan STRAPI_URL y el token (STRAPI_TOKEN, STRAPI_TOKEN_FILE o --token-file).');
  }

  return async function api(metodo, ruta, cuerpo) {
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
  };
}

module.exports = { crearCliente, leerToken, MANZANAS_DEFAULT };
