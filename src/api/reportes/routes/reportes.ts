// src/api/reportes/routes/reportes.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/reports/stock',
      handler: 'api::reportes.reportes.stock',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/pagos-pendientes',
      handler: 'api::reportes.reportes.pagosPendientes',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/compras-pagas',
      handler: 'api::reportes.reportes.comprasPagas',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/deuda-vendedores',
      handler: 'api::reportes.reportes.deudaVendedores',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/ventas-pagas',
      handler: 'api::reportes.reportes.ventasPagas',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/articulos-vendidos',
      handler: 'api::reportes.reportes.articulosVendidos',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/reports/articulos-ventas-porcentaje',
      handler: 'api::reportes.reportes.porcentajeVentasArticulos',
      config: { auth: false },
    },
  ],
};
