import { Context } from 'koa';

export default {
async stock(ctx: Context) {
    try {
      const articulos: any[] = await strapi.db.query('api::articulo.articulo').findMany({
        populate: ['proveedor'],
      });

      const stock = articulos.map(a => ({
        articulo: a.nombre ?? a.marca ?? 'N/A', // usa nombre o marca
        proveedor: a.proveedor?.nombre ?? 'N/A',
        stock: a.stock ?? 0, // si stock es undefined, asigna 0
      }));

      ctx.body = stock;
    } catch (err) {
      ctx.throw(500, `Error generando reporte de stock: ${err.message}`);
    }
  },
async pagosPendientes(ctx: Context) {
  const compras: any[] = await strapi.db.query('api::purchase-order.purchase-order').findMany({
    populate: ['proveedor', 'payments'],
  });

  // Usamos un array de objetos para almacenar id, nombre y total pendiente
  const data: { id: number; nombre: string; totalPendiente: number }[] = [];

  compras.forEach(c => {
    const totalPagos = c.payments?.reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;
    const pendiente = (c.total ?? 0) - totalPagos;

    if (pendiente > 0) {
      const proveedor = c.proveedor;
      if (!proveedor) return;

      // Buscar si ya existe el proveedor en el array
      const existente = data.find(d => d.id === proveedor.id);
      if (existente) {
        existente.totalPendiente += pendiente;
      } else {
        data.push({
          id: proveedor.id,
          nombre: proveedor.nombre ?? 'N/A',
          totalPendiente: pendiente,
        });
      }
    }
  });

  return data;
},

  async comprasPagas(ctx: Context) {
    const compras: any[] = await strapi.db.query('api::purchase-order.purchase-order').findMany({
      populate: ['payments'],
    });

    const totalPagado = compras.reduce((acc, c) => {
      const totalPagos = c.payments?.reduce((sum, p) => sum + (p.monto ?? 0), 0) ?? 0;
      return acc + totalPagos;
    }, 0);

    return { totalPagado };
  },

  async deudaVendedores(ctx: Context) {
  const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
    populate: ['vendedor', 'payments'],
  });

  // Usamos un objeto para agrupar por ID de vendedor
  const data: Record<string, { id: number; nombre: string; deuda: number }> = {};

  ventas.forEach(v => {
    if ((v.status !== 'PAGADO' && v.status !== 'CANCELADO')  && v.vendedor) {
      const totalPagos =
        v.payments?.reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;

      const pendiente = (v.total ?? 0) - totalPagos;

      const vendedorId = v.vendedor.id;
      const vendedorNombre = v.vendedor.nombre ?? 'N/A';

      if (!data[vendedorId]) {
        data[vendedorId] = { id: vendedorId, nombre: vendedorNombre, deuda: 0 };
      }

      data[vendedorId].deuda += pendiente;
    }
  });

  return Object.values(data);
}
,

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

    return { totalPagado };
  },

  async articulosVendidos(ctx: Context) {
  const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
    populate: {
      items: {
        populate: ['articulo'],
      },
    },
  });

  const articulosMap: Record<string, number> = {};

  ventas.forEach(v => {
    v.items.forEach((i: any) => {
      const nombreArticulo = i.articulo?.marca ?? 'N/A'; // Usa el campo correcto de tu artículo
      articulosMap[nombreArticulo] = (articulosMap[nombreArticulo] ?? 0) + (i.cantidad ?? 0);
    });
  });

  const sorted = Object.entries(articulosMap).sort((a, b) => b[1] - a[1]);

  return {
    masVendido: sorted[0]?.[0] ?? 'N/A',
    menosVendido: sorted[sorted.length - 1]?.[0] ?? 'N/A',
  };
},

async porcentajeVentasArticulos(ctx: Context) {
  const ventas: any[] = await strapi.db.query('api::seller-order.seller-order').findMany({
    populate: {
      items: {
        populate: ['articulo'],
      },
    },
  });

  const articulosMap: Record<string, number> = {};
  let totalVendido = 0;

  ventas.forEach(v => {
    v.items.forEach((i: any) => {
      const nombreArticulo = i.articulo?.marca ?? 'N/A'; // o usa i.articulo?.nombre si existe
      const cantidad = i.cantidad ?? 0;
      articulosMap[nombreArticulo] = (articulosMap[nombreArticulo] ?? 0) + cantidad;
      totalVendido += cantidad;
    });
  });

  // Crear array con porcentaje
  const porcentajeVentas = Object.entries(articulosMap).map(([articulo, cantidad]) => ({
    articulo,
    cantidad,
    porcentaje: totalVendido > 0 ? ((cantidad / totalVendido) * 100).toFixed(2) + '%' : '0%',
  }));

  return {
    totalVendido,
    porcentajeVentas,
  };
}

};
