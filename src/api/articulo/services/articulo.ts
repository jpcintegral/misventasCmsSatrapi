// src/api/articulo/services/articulo.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::articulo.articulo', ({ strapi }) => ({
  /**
   * Obtener el stock de un artículo específico
   */
  async getStock(articuloId: number) {
    const movimientos = await strapi.db.query('api::stock-movement.stock-movement').findMany({
      where: { articulo: articuloId },
      select: ['tipo', 'cantidad'],
    });

    let stock = 0;
    movimientos.forEach((m) => {
      if (m.tipo === 'entrada') stock += m.cantidad;
      if (m.tipo === 'venta') stock -= m.cantidad;
      if (m.tipo === 'ajuste') stock += m.cantidad; // Ajustes positivos o negativos
    });

    return stock;
  },

  /**
   * Obtener todos los artículos con su stock actualizado
   */
  async getAllWithStock() {
    const articulos = await strapi.db.query('api::articulo.articulo').findMany();
    const result = await Promise.all(
      articulos.map(async (a) => ({
        ...a,
        stock: await this.getStock(a.id),
      }))
    );
    return result;
  },
}));
