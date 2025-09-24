/**
 * seller-order controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::seller-order.seller-order',
  ({ strapi }) => ({
    // Método custom para eliminar una venta junto con sus items y pagos
   async deleteFull(ctx) {
  const { id } = ctx.params;

  if (!id) {
    return ctx.badRequest('El id de la venta es obligatorio');
  }

  try {
    // Traer los items de la venta con sus artículos
    const items = await strapi.db.query('api::seller-order-item.seller-order-item').findMany({
      where: { seller_order: id },
      populate: { articulo: true },
    });

    // Actualizar stock de cada artículo
    for (const item of items) {
      const articuloId = item.articulo?.id || item.articulo;
      if (!articuloId) continue;

      // Registrar movimiento de stock
      await strapi.db.query('api::stock-movement.stock-movement').create({
        data: {
          articulo: articuloId,
          cantidad: item.cantidad,
          tipo: 'entrada', // suma al stock
          fecha: new Date(),
          nota: `Cancelación venta #${id}`,
        },
      });

      // Actualizar stock
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

    // Eliminar pagos asociados
    await strapi.db.query('api::payment.payment').delete({
      where: { seller_order: id },
    });

    // Eliminar items de la venta
    await strapi.db.query('api::seller-order-item.seller-order-item').delete({
      where: { seller_order: id },
    });

    // Finalmente eliminar la venta
    const ventaEliminada = await strapi.db.query('api::seller-order.seller-order').delete({
      where: { id },
    });

    return ventaEliminada;
  } catch (error) {
    console.error(error);
    return ctx.internalServerError('Error al eliminar la venta, sus items y pagos');
  }
},
async cancelOrder(ctx) {
  const { id } = ctx.params;

  if (!id) {
    return ctx.badRequest('El id de la venta es obligatorio');
  }

  try {
    // Traer los items de la venta con sus artículos
    const items = await strapi.db.query('api::seller-order-item.seller-order-item').findMany({
      where: { seller_order: id },
      populate: { articulo: true },
    });

    // Actualizar stock de cada artículo
    for (const item of items) {
      const articuloId = item.articulo?.id || item.articulo;
      if (!articuloId) continue;

      // Registrar movimiento de stock
      await strapi.db.query('api::stock-movement.stock-movement').create({
        data: {
          articulo: articuloId,
          cantidad: item.cantidad,
          tipo: 'entrada', // devuelve al stock
          fecha: new Date(),
          nota: `Cancelación venta #${id}`,
        },
      });

      // Actualizar stock en el artículo
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

    // Cambiar el estado de la venta a CANCELADO
    const ventaCancelada = await strapi.db.query('api::seller-order.seller-order').update({
      where: { id },
      data: { status: 'CANCELADO' },
    });

    return ventaCancelada;
  } catch (error) {
    console.error(error);
    return ctx.internalServerError('Error al cancelar la venta y actualizar el stock');
  }
}

 })
);
