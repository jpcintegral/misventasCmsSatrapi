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
        await strapi.db.query('api::payment.payment').delete({
          where: { seller_order: id },
        });

     
        await strapi.db.query('api::seller-order-item.seller-order-item').delete({
          where: { seller_order: id },
        });

        
        const ventaEliminada = await strapi.db.query('api::seller-order.seller-order').delete({where: { id },
        });

        return ventaEliminada;
      } catch (error) {
        console.error(error);
        return ctx.internalServerError('Error al eliminar la venta, sus items y pagos');
      }
    },

 })
);
