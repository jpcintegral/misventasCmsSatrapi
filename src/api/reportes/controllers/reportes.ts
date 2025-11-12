import { Context } from 'koa';

export default {

  // ===========================
  // STOCK DE ARTÍCULOS
  // ===========================
  async stock(ctx: Context) {
    try {
      const articulos: any[] = await strapi.db.query('api::articulo.articulo').findMany({
        populate: ['proveedor'],
      });

      const stock = articulos.map(a => ({
        articulo: a.nombre ?? a.marca ?? 'N/A',
        proveedor: a.proveedor?.nombre ?? 'N/A',
        stock: a.stock ?? 0,
      }));

      ctx.body = stock;
      return stock;
    } catch (err: any) {
      ctx.throw(500, `Error generando reporte de stock: ${err.message}`);
    }
  },

  // ===========================
  // PAGOS PENDIENTES A PROVEEDORES
  // ===========================
  async pagosPendientes(ctx: Context) {
    const compras: any[] = await strapi.db.query('api::purchase-order.purchase-order').findMany({
      populate: ['proveedor', 'payments'],
    });

    const data: { id: number; nombre: string; totalPendiente: number }[] = [];

    compras.forEach(c => {
      const totalPagos = c.payments?.reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;
      const pendiente = (c.total ?? 0) - totalPagos;

      if (pendiente > 0 && c.proveedor) {
        const existente = data.find(d => d.id === c.proveedor.id);
        if (existente) {
          existente.totalPendiente += pendiente;
        } else {
          data.push({
            id: c.proveedor.id,
            nombre: c.proveedor.nombre ?? 'N/A',
            totalPendiente: pendiente,
          });
        }
      }
    });

    ctx.body = data;
    return data;
  },

  // ===========================
  // COMPRAS PAGADAS
  // ===========================
  async comprasPagas(ctx: Context) {
    const compras: any[] = await strapi.db.query('api::purchase-order.purchase-order').findMany({
      populate: ['payments', 'proveedor'],
    });

    const data = compras.map(c => {
      const totalPagos = c.payments?.reduce((sum, p) => sum + (p.monto ?? 0), 0) ?? 0;
      return {
        proveedor: c.proveedor?.nombre ?? 'N/A',
        totalCompra: c.total ?? 0,
        totalPagado: totalPagos,
      };
    });

    const totalPagado = data.reduce((acc, c) => acc + c.totalPagado, 0);
    const body = { totalPagado, detalle: data };
    ctx.body = body;
    return body;
  },

  // ===========================
  // DEUDA DE VENDEDORES (INCLUYE DIRECTAS)
  // ===========================
  async deudaVendedores(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: ['vendedor', 'payments'],
    });

    const data: Record<string, { id: number; nombre: string; deuda: number }> = {};

    ventas.forEach(v => {
      if (v.status === 'CANCELADO') return;

      const totalPagos = v.payments?.reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;
      const pendiente = (v.total ?? 0) - totalPagos;

      const vendedorId = v.vendedor?.id ?? 0; // ID 0 para ventas directas
      const vendedorNombre = v.vendedor?.nombre ?? 'DIRECTA';

      if (!data[vendedorId]) data[vendedorId] = { id: vendedorId, nombre: vendedorNombre, deuda: 0 };
      data[vendedorId].deuda += pendiente;
    });

    const body = Object.values(data);
    ctx.body = body;
    return body;
  },

  // ===========================
  // VENTAS PAGAS
  // ===========================
  async ventasPagas(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: ['payments'],
    });

    const totalPagado = ventas.reduce((acc, v) => {
      if (v.status === 'PAGADO') {
        const totalPagos = v.payments?.reduce((sum, p) => sum + (p.monto ?? 0), 0) ?? 0;
        return acc + totalPagos;
      }
      return acc;
    }, 0);

    const body = { totalPagado };
    ctx.body = body;
    return body;
  },

  // ===========================
  // ARTÍCULOS MÁS Y MENOS VENDIDOS
  // ===========================
  async articulosVendidos(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: { items: { populate: ['articulo'] } },
    });

    const articulosMap: Record<string, number> = {};

    ventas.forEach(v => {
      v.items.forEach((i: any) => {
        const nombreArticulo = i.articulo?.marca ?? 'N/A';
        articulosMap[nombreArticulo] = (articulosMap[nombreArticulo] ?? 0) + (i.cantidad ?? 0);
      });
    });

    const sorted = Object.entries(articulosMap).sort((a, b) => b[1] - a[1]);
    const body = {
      masVendido: sorted[0]?.[0] ?? 'N/A',
      menosVendido: sorted[sorted.length - 1]?.[0] ?? 'N/A',
    };
    ctx.body = body;
    return body;
  },

  // ===========================
  // PORCENTAJE DE VENTAS POR ARTÍCULO
  // ===========================
  async porcentajeVentasArticulos(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: { items: { populate: ['articulo'] } },
    });

    const articulosMap: Record<string, number> = {};
    let totalVendido = 0;

    ventas.forEach(v => {
      v.items.forEach((i: any) => {
        const nombreArticulo = i.articulo?.marca ?? 'N/A';
        const cantidad = i.cantidad ?? 0;
        articulosMap[nombreArticulo] = (articulosMap[nombreArticulo] ?? 0) + cantidad;
        totalVendido += cantidad;
      });
    });

    const porcentajeVentas = Object.entries(articulosMap).map(([articulo, cantidad]) => ({
      articulo,
      cantidad,
      porcentaje: totalVendido > 0 ? ((cantidad / totalVendido) * 100).toFixed(2) + '%' : '0%',
    }));

    const body = { totalVendido, porcentajeVentas };
    ctx.body = body;
    return body;
  },

  // ===========================
  // GANANCIA TOTAL
  // ===========================
  async gananciaTotal(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: ['items.articulo'],
    });

    let gananciaTotal = 0;

    ventas.forEach(v => {
      v.items.forEach((i: any) => {
        const precioVenta = i.precio_al_vendedor ?? i.articulo?.precio_venta ?? 0;
        const precioProveedor = i.articulo?.precio_proveedor ?? 0;
        const cantidad = i.cantidad ?? 0;
        gananciaTotal += (precioVenta - precioProveedor) * cantidad;
      });
    });

    const body = { gananciaTotal };
    ctx.body = body;
    return body;
  },

  // ===========================
  // GANANCIA MENSUAL
  // ===========================
  async gananciaMensual(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: ['items.articulo'],
    });

    const resumen: Record<string, number> = {};

    ventas.forEach(v => {
      const fecha = new Date(v.createdAt);
      const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;

      v.items.forEach((i: any) => {
        const pv = i.precio_al_vendedor ?? i.articulo?.precio_venta ?? 0;
        const pp = i.articulo?.precio_proveedor ?? 0;
        const cantidad = i.cantidad ?? 0;
        const ganancia = (pv - pp) * cantidad;

        resumen[mes] = (resumen[mes] ?? 0) + ganancia;
      });
    });

    const body = Object.entries(resumen).map(([mes, ganancia]) => ({ mes, ganancia }));
    ctx.body = body;
    return body;
  },

  // ===========================
  // PAGOS A PROVEEDORES
  // ===========================
  async pagosAProveedores(ctx: Context) {
    const compras: any[] = await strapi.db.query('api::purchase-order.purchase-order').findMany({
      populate: ['proveedor', 'payments'],
    });

    const data: Record<string, { proveedor: string; totalPagado: number }> = {};

    compras.forEach(c => {
      const proveedor = c.proveedor?.nombre ?? 'Desconocido';
      const totalPagos = c.payments?.reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;

      if (!data[proveedor]) data[proveedor] = { proveedor, totalPagado: 0 };
      data[proveedor].totalPagado += totalPagos;
    });

    const body = Object.values(data);
    ctx.body = body;
    return body;
  },

  // ===========================
  // VENTAS POR VENDEDOR (INCLUYE DIRECTAS)
  // ===========================
  async ventasPorVendedor(ctx: Context) {
    const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
      populate: ['vendedor', 'items.articulo'],
    });

    const data: Record<string, { vendedor: string; totalVendido: number; ganancia: number }> = {};

    ventas.forEach(v => {
      const vendedor = v.vendedor?.nombre ?? 'DIRECTA';
      if (!data[vendedor]) data[vendedor] = { vendedor, totalVendido: 0, ganancia: 0 };

      v.items.forEach((i: any) => {
        const pv = i.precio_al_vendedor ?? i.articulo?.precio_venta ?? 0;
        const pp = i.articulo?.precio_proveedor ?? 0;
        const cantidad = i.cantidad ?? 0;

        data[vendedor].totalVendido += pv * cantidad;
        data[vendedor].ganancia += (pv - pp) * cantidad;
      });
    });

    const body = Object.values(data);
    ctx.body = body;
    return body;
  },

  // ===========================
  // RESUMEN GENERAL (DASHBOARD)
  // ===========================
  async resumenGeneral(ctx: Context) {
    const [ganancia, ventasPagas, comprasPagas, deudaVend, pagosPend] = await Promise.all([
      this.gananciaTotal(ctx),
      this.ventasPagas(ctx),
      this.comprasPagas(ctx),
      this.deudaVendedores(ctx),
      this.pagosPendientes(ctx)
    ]);

    const body = {
      gananciaTotal: ganancia?.gananciaTotal ?? 0,
      totalVentasPagas: ventasPagas?.totalPagado ?? 0,
      totalComprasPagas: comprasPagas?.totalPagado ?? 0,
      totalDeudaVendedores: deudaVend?.reduce((acc, v) => acc + v.deuda, 0) ?? 0,
      totalPagosPendientesProveedores: pagosPend?.reduce((acc, p) => acc + p.totalPendiente, 0) ?? 0,
    };

    ctx.body = body;
    return body;
  }

};
