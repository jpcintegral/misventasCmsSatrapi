/**
 * vendedor controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::vendedor.vendedor',
  ({ strapi }) => ({
    /**
     * Genera un comprobante general de todos los pedidos de un vendedor
     */
    async getComprobanteGeneral(ctx) {
      const { id: vendedorId } = ctx.params;

      if (!vendedorId) return ctx.badRequest('Se requiere el id del vendedor');

      try {
        // Traer todos los pedidos del vendedor que NO estén cancelados
       const pedidos = await strapi.db.query('api::seller-order.seller-order').findMany({
              where: {
                status: { $ne: 'CANCELADO' },
              },
              populate: {
                items: { populate: { articulo: true } },
                payments: true,
                vendedor: true,
              },
              orderBy: { createdAt: 'asc' },
            });

            // Filtrar pedidos para este vendedor o ventas directas si vendedorId = 0
            const pedidosFiltrados = pedidos.filter(p => {
              const idVendedor = p.vendedor?.id ?? 0;
              return idVendedor === Number(vendedorId);
            });


        let totalAdeudo = 0;

        // Procesar cada pedido
        const pedidosProcesados = pedidosFiltrados.map(pedido => {
          const totalPagado =
            pedido.payments?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
          const totalPedido =
            pedido.items?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0;
          const adeudo = totalPedido - totalPagado;

          totalAdeudo += adeudo;

          const itemsProcesados = pedido.items.map(i => ({
            marca: i.articulo?.marca,
            cantidad: i.cantidad,
            precio: i.precio_al_vendedor ?? i.precio_venta,
            subtotal: i.subtotal,
            imagen: i.articulo?.imagen?.[0]?.formats?.small?.url || '',
          }));

          const pagosProcesados = pedido.payments?.map(p => ({
            monto: p.monto,
            fecha: p.createdAt,
            evidencia: p.evidencia?.[0]?.formats?.small?.url || '',
          }));

          return {
            id: pedido.id,
            codigo: pedido.codigo,
            fecha: pedido.fecha,
            status: pedido.status,
            totalPedido,
            totalPagado,
            adeudo,
            items: itemsProcesados,
            payments: pagosProcesados,
          };
        });

        return ctx.send({
          vendedorId,
          totalAdeudo,
          pedidos: pedidosProcesados,
        });
      } catch (error) {
        console.error(error);
        return ctx.internalServerError(
          'Error al generar el comprobante general del vendedor'
        );
      }
    },
  })
);
