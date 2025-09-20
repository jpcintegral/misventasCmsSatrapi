// src/api/articulo/routes/articulo.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/articulos/findWithStock',
      handler: 'api::articulo.articulo.findWithStock',
      config: {
        auth: false, // o { scope: ['users-permissions'] } si quieres verlo en la UI de permisos
      },
    },
  ],
};
