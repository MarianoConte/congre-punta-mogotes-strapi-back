'use strict';

const publicActions = [
  'api::territorio.territorio.find',
  'api::territorio.territorio.findOne',
  'api::edificio.edificio.find',
  'api::edificio.edificio.findOne',
  'api::departamento.departamento.find',
  'api::departamento.departamento.findOne',
  'api::no-visitar.no-visitar.find',
  'api::no-visitar.no-visitar.findOne',
];

const authenticatedActions = [
  // Los usuarios logueados también necesitan leer los mismos datos que los públicos
  'api::territorio.territorio.find',
  'api::territorio.territorio.findOne',
  'api::edificio.edificio.find',
  'api::edificio.edificio.findOne',
  'api::departamento.departamento.find',
  'api::departamento.departamento.findOne',
  'api::no-visitar.no-visitar.find',
  'api::no-visitar.no-visitar.findOne',
  // Acciones exclusivas de usuarios autenticados
  'api::salida.salida.find',
  'api::salida.salida.findOne',
  'api::salida.salida.create',
  'api::no-visitar.no-visitar.create',
];

async function habilitarPermisos(strapi, roleType, actions) {
  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: roleType } });

  if (!role) return;

  for (const action of actions) {
    const existing = await strapi
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });

    if (existing) {
      if (!existing.enabled) {
        await strapi
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
      }
    } else {
      await strapi
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id, enabled: true } });
    }
  }
}

async function configurarManzanasDefault(strapi) {
  const territorios = await strapi
    .query('api::territorio.territorio')
    .findMany({});

  for (const t of territorios) {
    if (!t.Manzanas) {
      await strapi
        .query('api::territorio.territorio')
        .update({ where: { id: t.id }, data: { Manzanas: ['A', 'B', 'C', 'D'] } });
    }
  }
}

module.exports = {
  register(/* { strapi } */) {},

  async bootstrap({ strapi }) {
    await habilitarPermisos(strapi, 'public', publicActions);
    await habilitarPermisos(strapi, 'authenticated', authenticatedActions);
    await configurarManzanasDefault(strapi);
  },
};
