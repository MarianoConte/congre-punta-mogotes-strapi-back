"use strict";

/**
 * departamento controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::departamento.departamento",
  ({ strapi }) => ({
    // Method 1: Creating an entirely new custom controller
    async updateDepartamentos(ctx) {
      if (!ctx.request.body.departamentos) {
        return ctx.throw(400, "No se recibieron departamentos");
      }

      const departamentos = ctx.request.body.departamentos;
      const fechaActual = new Date();

      try {
        await strapi.db.query("api::departamento.departamento").updateMany({
          where: {
            id: departamentos,
          },
          data: {
            UltimaVisita: fechaActual,
          },
        });

        return { departamentos, fechaActual };
      } catch (err) {
        return ctx.throw(400, err);
      }
    },
  })
);
