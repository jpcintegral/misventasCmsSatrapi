// src/api/articulo/controllers/articulo.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::articulo.articulo', ({ strapi }) => ({
  async findWithStock(ctx) {
   const articulos = await strapi.service('api::articulo.articulo').getAllWithStock();
    return articulos;
  
      }
}));
