/**
 * proveedor controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::proveedor.proveedor', ({ strapi }) => ({
    
async reporteGeneral(ctx) {
  try {
    const { id } = ctx.params; // id del proveedor

    // Buscar los pedidos del proveedor, excluyendo CANCELADOS
    const pedidos = await strapi.db.query('api::purchase-order.purchase-order').findMany({
      where: {
        proveedor: id,
        status: { $ne: 'CANCELADO' }, // excluye CANCELADOS
      },
      populate: {
        items: { populate: { articulo: true } },
        proveedor: true,
        payments: true,
      },
    });

    // Procesar pedidos
    const reporte = pedidos.map((pedido) => {
      const totalPagado = pedido.payments.reduce((acc, p) => acc + (p.monto || 0), 0);
      const totalAdeudo = pedido.total - totalPagado;

      return {
        id: pedido.id,
        documentId: pedido.documentId,
        codigo: pedido.codigo,
        fecha: pedido.fecha,
        status: pedido.status,
        total: pedido.total,
        proveedor: pedido.proveedor,
        items: pedido.items,
        payments: pedido.payments,
        totalPagado,
        totalAdeudo,
      };
    });

    // Totales generales (sólo de pedidos NO PAGADOS)
    const reporteNoPagados = reporte.filter(p => p.status !== 'PAGADO');

    const totalGeneral = reporteNoPagados.reduce((acc, p) => acc + p.total, 0);
    const totalPagadoGeneral = reporteNoPagados.reduce((acc, p) => acc + p.totalPagado, 0);
    const totalAdeudoGeneral = totalGeneral - totalPagadoGeneral;

    return {
      pedidos: reporte, // incluye todos los pedidos no cancelados
      totales: {
        totalGeneral,
        totalPagadoGeneral,
        totalAdeudoGeneral,
      },
    };
  } catch (err) {
    ctx.throw(500, err);
  }
},

}));
