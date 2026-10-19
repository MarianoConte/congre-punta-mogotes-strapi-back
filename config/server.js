module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // Este (Fly.io) apunta la carpeta publica al volumen para que las fotos sobrevivan
  // a los deploys. Punta Mogotes usa la de siempre.
  dirs: {
    public: env('PUBLIC_DIR', './public'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
