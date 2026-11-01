// Single source of truth for what each role may do.
// The server enforces it; the client receives the list from /api/auth/me
// only to decide which menu items to show.
export const PERMISSIONS = {
  admin: [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'location:manage',
    'report:read',
  ],
  worker: [
    'product:read', 'product:create', 'product:update',
    'order:read', 'order:create', 'order:update_status',
    'report:read',
  ],
  sorter: [
    'product:read',
    'placement:read', 'placement:write',
    'report:read',
  ],
};

export const ROLES = Object.keys(PERMISSIONS);

export const can = (role, permission) =>
  PERMISSIONS[role]?.includes(permission) ?? false;

// Which report types each role may open (all need 'report:read' too).
export const REPORT_ACCESS = {
  admin: ['stock', 'orders', 'placement', 'activity'],
  worker: ['stock', 'orders'],
  sorter: ['stock', 'placement'],
};
