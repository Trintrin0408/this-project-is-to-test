export type PermissionKey = 'master-data:manage' | 'orders:manage';

// Quyền tối thiểu theo role (xem CLAUDE.md mục "Vai trò & phân quyền").
// Sẽ chi tiết hóa theo từng UC khi code tới module tương ứng.
export const PERMISSIONS: Record<PermissionKey, string[]> = {
  'master-data:manage': ['Admin'],
  'orders:manage': ['Manager'],
};
