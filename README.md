# Congre La Perla - Strapi Backend

API backend para la aplicación de gestión de territorios de la congregación La Perla.

## 🚀 Deploy a Railway

### Preparación previa

1. Asegúrate de tener una cuenta en [Railway](https://railway.app)
2. Instala Railway CLI: `npm install -g @railway/cli`
3. Ten listos los valores para las variables de entorno

### Variables de entorno requeridas en Railway

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=$PORT
APP_KEYS=genera,claves,seguras,aqui
API_TOKEN_SALT=genera_un_salt_seguro
ADMIN_JWT_SECRET=genera_un_jwt_secret_seguro  
JWT_SECRET=genera_un_jwt_secret_seguro
TRANSFER_TOKEN_SALT=genera_un_transfer_salt_seguro
DATABASE_URL=$DATABASE_URL
DATABASE_SSL=false
```

### Pasos para el deploy

1. **Conectar repositorio a Railway:**
   - Ve a [Railway Dashboard](https://railway.app/dashboard)
   - Haz clic en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta este repositorio

2. **Agregar base de datos PostgreSQL:**
   - En tu proyecto de Railway, haz clic en "Add Service"
   - Selecciona "Database" → "PostgreSQL"
   - Railway automáticamente creará la variable `DATABASE_URL`

3. **Configurar variables de entorno:**
   - Ve a la pestaña "Variables" de tu servicio
   - Agrega todas las variables listadas arriba
   - Genera valores seguros para las claves secretas

4. **Deploy automático:**
   - Railway detectará automáticamente tu aplicación Node.js
   - El deploy se ejecutará automáticamente

### Generar claves seguras

Para generar claves seguras, puedes usar:

```bash
# Para APP_KEYS (4 claves separadas por comas)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Para los demás secrets
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project. Find the one that suits you on the [deployment section of the documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html).

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://docs.strapi.io) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
