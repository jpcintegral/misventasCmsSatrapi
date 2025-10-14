// src/api/reportes/routes/reportes.ts
export default {
  routes: [
    // ===========================
    //  STOCK
    // ===========================
    {
      method: 'GET',
      path: '/reports/stock',
      handler: 'api::reportes.reportes.stock',
      config: { auth: false },
    },

    // ===========================
    // PAGOS PENDIENTES A PROVEEDORES
    // ===========================
    {
      method: 'GET',
      path: '/reports/pagos-pendientes',
      handler: 'api::reportes.reportes.pagosPendientes',
      config: { auth: false },
    },

    // ===========================
    //  COMPRAS PAGADAS
    // ===========================
    {
      method: 'GET',
      path: '/reports/compras-pagas',
      handler: 'api::reportes.reportes.comprasPagas',
      config: { auth: false },
    },

    // ===========================
    // DEUDA DE VENDEDORES
    // ===========================
    {
      method: 'GET',
      path: '/reports/deuda-vendedores',
      handler: 'api::reportes.reportes.deudaVendedores',
      config: { auth: false },
    },

    // ===========================
    //  VENTAS PAGAS
    // ===========================
    {
      method: 'GET',
      path: '/reports/ventas-pagas',
      handler: 'api::reportes.reportes.ventasPagas',
      config: { auth: false },
    },

    // ===========================
    //  ARTÍCULOS MÁS Y MENOS VENDIDOS
    // ===========================
    {
      method: 'GET',
      path: '/reports/articulos-vendidos',
      handler: 'api::reportes.reportes.articulosVendidos',
      config: { auth: false },
    },

    // ===========================
    // PORCENTAJE DE VENTAS POR ARTÍCULO
    // ===========================
    {
      method: 'GET',
      path: '/reports/articulos-ventas-porcentaje',
      handler: 'api::reportes.reportes.porcentajeVentasArticulos',
      config: { auth: false },
    },

    // ===========================
    //  GANANCIA TOTAL
    // ===========================
    {
      method: 'GET',
      path: '/reports/ganancia-total',
      handler: 'api::reportes.reportes.gananciaTotal',
      config: { auth: false },
    },

    // ===========================
    //  GANANCIA MENSUAL
    // ===========================
    {
      method: 'GET',
      path: '/reports/ganancia-mensual',
      handler: 'api::reportes.reportes.gananciaMensual',
      config: { auth: false },
    },

    // ===========================
    //  PAGOS A PROVEEDORES
    // ===========================
    {
      method: 'GET',
      path: '/reports/pagos-proveedores',
      handler: 'api::reportes.reportes.pagosAProveedores',
      config: { auth: false },
    },

    // ===========================
    //  VENTAS POR VENDEDOR
    // ===========================
    {
      method: 'GET',
      path: '/reports/ventas-vendedor',
      handler: 'api::reportes.reportes.ventasPorVendedor',
      config: { auth: false },
    },

    // ===========================
    //  RESUMEN GENERAL (DASHBOARD)
    // ===========================
    {
      method: 'GET',
      path: '/reports/resumen-general',
      handler: 'api::reportes.reportes.resumenGeneral',
      config: { auth: false },
    },
  ],
};
