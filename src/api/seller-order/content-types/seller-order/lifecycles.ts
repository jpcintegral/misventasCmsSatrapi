// path: src/api/seller-order/content-types/seller-order/lifecycles.ts
export const lifecycles = {
  async afterUpdate(event) {
    console.log("entro")
    const { result, params } = event;

    // Solo ejecutar si la venta se canceló
    if (result.status !== 'CANCELADO') return;

    // Traer los items de la venta con sus artículos
    const order = await strapi.db.query('api::seller-order.seller-order').findOne({
      where: { id: result.id },
      populate: { items: { populate: { articulo: true } } },
    });

    if (!order?.items) return;

    for (const item of order.items) {
      const articuloId = item.articulo?.id || item.articulo;
      if (!articuloId) continue;

      // Registrar movimiento de stock
      await strapi.db.query('api::stock-movement.stock-movement').create({
        data: {
          articulo: articuloId,
          cantidad: item.cantidad,
          tipo: 'entrada', // suma al stock
          fecha: new Date(),
          nota: `Cancelación venta #${order.documentId}`,
        },
      });

      // Actualizar stock del artículo
      const articulo = await strapi.db.query('api::articulo.articulo').findOne({
        where: { id: articuloId },
      });

      if (articulo) {
        await strapi.db.query('api::articulo.articulo').update({
          where: { id: articuloId },
          data: { stock: (articulo.stock || 0) + item.cantidad },
        });
      }
    }
  },
};
