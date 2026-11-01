export const ROLE_LV = { admin: 'Administrators', worker: 'Noliktavas darbinieks', sorter: 'Plauktu kārtotājs' };
export const PRODUCT_STATUS_LV = { in_stock: 'Kārtībā', damaged: 'Bojāta', expired: 'Derīguma termiņš beidzies' };
export const ORDER_STATUS_LV = { new: 'Jauns', processing: 'Apstrādē', packed: 'Sakomplektēts', shipped: 'Nosūtīts', cancelled: 'Atcelts' };
// next possible order statuses (the server enforces the same rules)
export const ORDER_NEXT = {
  new: ['processing', 'cancelled'], processing: ['packed', 'cancelled'], packed: ['shipped', 'cancelled'], shipped: [], cancelled: [],
};
export const NEXT_LABEL = { processing: 'Sākt apstrādi', packed: 'Sakomplektēts', shipped: 'Nosūtīt', cancelled: 'Atcelt' };
