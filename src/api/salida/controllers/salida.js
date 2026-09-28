'use strict';

/**
 * salida controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const NO_VISITAR_UID = 'api::no-visitar.no-visitar';

/**
 * Normaliza las direcciones que llegan del formulario: recorta espacios,
 * descarta vacías y elimina repetidas (comparando sin distinguir mayúsculas).
 */
const normalizarDirecciones = (valores) => {
  if (!Array.isArray(valores)) return [];

  const vistas = new Set();
  const resultado = [];

  for (const valor of valores) {
    const direccion = String(valor ?? '').trim();
    if (!direccion) continue;

    const clave = direccion.toLowerCase();
    if (vistas.has(clave)) continue;

    vistas.add(clave);
    resultado.push(direccion);
  }

  return resultado;
};

module.exports = createCoreController('api::salida.salida', ({ strapi }) => ({
  /**
   * Crea la salida y sus direcciones "no visitar" en una sola transacción:
   * si algo falla no queda una salida a medias sin sus direcciones.
   *
   * Las direcciones son únicas por territorio, no en todo el sistema: si la
   * dirección ya estaba cargada en ese territorio simplemente se omite, porque
   * el resultado buscado (que figure en la lista) ya está cumplido.
   */
  async create(ctx) {
    const datos = ctx.request.body?.data ?? {};
    const territorioId = datos.territorio;
    const direcciones = normalizarDirecciones(datos.NoVisitarNuevos);

    return strapi.db.transaction(async () => {
      const respuesta = await super.create(ctx);

      if (!territorioId || direcciones.length === 0) return respuesta;

      const yaCargadas = await strapi.entityService.findMany(NO_VISITAR_UID, {
        filters: { territorio: territorioId },
        fields: ['direccion'],
        publicationState: 'preview',
        limit: -1,
      });

      const existentes = new Set(
        yaCargadas.map((registro) => String(registro.direccion ?? '').trim().toLowerCase())
      );

      for (const direccion of direcciones) {
        if (existentes.has(direccion.toLowerCase())) continue;

        await strapi.entityService.create(NO_VISITAR_UID, {
          data: {
            direccion,
            territorio: territorioId,
            publishedAt: new Date().toISOString(),
          },
        });

        existentes.add(direccion.toLowerCase());
      }

      return respuesta;
    });
  },
}));
