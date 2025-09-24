export default {
  routes: [
    {
      method: 'DELETE',
      path: '/seller-orders/:id/cancelOrder',
      handler: 'api::seller-order.seller-order.cancelOrder',
      config: {
        auth: false,
      },
    },
  ],
};
