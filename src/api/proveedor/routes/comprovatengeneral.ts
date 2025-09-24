export default {
  routes: [
    {
      method: 'GET',
      path: '/proveedor/:id/comprobante-general',
      handler: 'api::proveedor.proveedor.reporteGeneral',
      config: {
        auth: false,
      },
    },
  ],
};

