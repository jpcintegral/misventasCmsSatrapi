export default {
  routes: [
    {
      method: 'GET',
      path: '/vendedors/:id/comprobante-general',
      handler: 'api::vendedor.vendedor.getComprobanteGeneral',
      config: {
        auth: false,
      },
    },
  ],
};

