export default {
  routes: [
    {
      method: 'DELETE',
      path: '/seller-orders/:id/deleteFull',
      handler: 'api::seller-order.seller-order.deleteFull',
      config: {
        auth: false,
      },
    },
  ],
};
