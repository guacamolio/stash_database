export const PRODUCT_STATUS = ['in_stock', 'damaged', 'expired'];
export const PRODUCT_STATUS_LV = { in_stock: 'Kārtībā', damaged: 'Bojāta', expired: 'Derīguma termiņš beidzies' };

export const ORDER_STATUS_LV = {
  new: 'Jauns', processing: 'Apstrādē', packed: 'Sakomplektēts', shipped: 'Nosūtīts', cancelled: 'Atcelts',
};
export const ORDER_TRANSITIONS = {
  new: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};
export const ROLE_LV = { admin: 'Administrators', worker: 'Noliktavas darbinieks', sorter: 'Plauktu kārtotājs' };
export const LOW_STOCK = 10;
