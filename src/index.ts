import type { Core } from '@strapi/strapi';


export default {
  register({ strapi }: { strapi: Core.Strapi }) {

    // =========================
    // PEDIDOS DE PROVEEDOR
    // =========================
    strapi.db.lifecycles.subscribe({
      models: ['api::purchase-order.purchase-order'],

      async beforeCreate(event) {
        const { data } = event.params;
        const proveedorId = data.proveedor?.connect?.[0]?.id;
        const fecha = new Date();
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');

        const lastOrder = await strapi.db.query('api::purchase-order.purchase-order').findOne({
          orderBy: { id: 'desc' },
        });

        const nextId = lastOrder ? lastOrder.id + 1 : 1;

        data.codigo = `${yyyy}-${mm}-${dd}-P${proveedorId}-#${nextId}`;
        data.fecha = fecha;
      },

  async afterUpdate(event) {
  const { result } = event;
  
  if (result.status !== 'PARCIAL' && result.status !== 'PAGADO') return;

  const order = await strapi.db.query('api::purchase-order.purchase-order').findOne({
    where: { id: result.id },
    populate: { items: { populate: { articulo: true } } },
  });

  if (!order?.items) return;

  for (const item of order.items) {
    const articuloId = item.articulo?.id || item.articulo;
    if (!articuloId) continue;

    // Verificar si ya existe un movimiento de stock para este pedido y artículo
    const existingMovement = await strapi.db.query('api::stock-movement.stock-movement').findOne({
      where: { articulo: articuloId, nota: `Pedido proveedor #${order.codigo}` },
    });

    if (existingMovement) continue; // ya sumado, no hacemos nada

    // Crear movimiento de stock
    await strapi.db.query('api::stock-movement.stock-movement').create({
      data: {
        articulo: articuloId,
        cantidad: item.cantidad,
        tipo: 'entrada',
        fecha: new Date(),
        nota: `Pedido proveedor #${order.codigo}`,
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
}

    });

// =========================
// VENTAS DIRECTAS (seller-orders)
// =========================
strapi.db.lifecycles.subscribe({
  models: ['api::seller-order.seller-order'],

  // Generar código y fecha antes de crear
  async beforeCreate(event) {
    const { data } = event.params;

    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');

    // obtener el último pedido de venta
    const lastOrder = await strapi.db.query('api::seller-order.seller-order').findOne({
      orderBy: { id: 'desc' },
    });

    const nextId = lastOrder ? lastOrder.id + 1 : 1;

    // id del usuario (si guardas la relación con createdBy o un campo usuario)
    const usuarioId = data.createdBy || data.usuario || 0;

    data.codigo = `${yyyy}-${mm}-${dd}-VT#${nextId}`;
    data.fecha = fecha;
  },

});

    // =========================
// CREACIÓN DE ITEMS (seller-order-item)
// =========================
strapi.db.lifecycles.subscribe({
  models: ['api::seller-order-item.seller-order-item'],

  async afterCreate(event) {
    const { result } = event;

    // Poblar relaciones necesarias
    const item = await strapi.db.query('api::seller-order-item.seller-order-item').findOne({
      where: { id: result.id },
      populate: ['articulo', 'seller_order'],
    });

    if (!item.articulo || !item.articulo.id) return;

    const articuloId = item.articulo.id;

    // Actualizar stock del artículo
    const articulo = await strapi.db.query('api::articulo.articulo').findOne({
      where: { id: articuloId },
    });

    if (!articulo) return;

    await strapi.db.query('api::articulo.articulo').update({
      where: { id: articuloId },
      data: { stock: Math.max((articulo.stock || 0) - item.cantidad, 0) },
    });
      console.log("actualizar articulo");
    // Registrar movimiento de stock
    await strapi.db.query('api::stock-movement.stock-movement').create({
      data: {
        articulo: articuloId,
        cantidad: item.cantidad,
        tipo: 'venta',
        fecha: new Date(),
        nota: `Item de venta #${item.seller_order?.id || ''}`,
      },
    });

    strapi.log.info(`Stock actualizado para articulo #${articuloId} - nueva cantidad: ${articulo.stock - item.cantidad}`);
  },
});


  },

  bootstrap() {},
};
