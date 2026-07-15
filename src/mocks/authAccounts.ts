import type { AuthUser } from '@/types/auth';

// Backend thật hiện không đăng nhập được — Aiven cloud DB lệch schema so với `prisma/schema.prisma`
// (thiếu cột `internal_users.address` và nhiều cột khác, xem docs/more-require.md mục (jj)). Trong
// lúc chờ backend/DB owner đồng bộ lại, màn hình đăng nhập tạm dùng 2 tài khoản ảo cố định dưới đây
// thay vì gọi `POST /auth/login` thật — gỡ bỏ file này và quay lại `authApiService.login()`
// (src/app/auth/login/page.tsx) ngay khi backend đăng nhập được bình thường trở lại.

export interface MockAccount {
  username: string;
  password: string;
  user: AuthUser;
}

export const MOCK_TOKEN_PREFIX = 'mock-token-';

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    username: 'admin',
    password: 'Admin@123',
    user: {
      userId: 'mock-admin-1',
      username: 'admin',
      fullName: 'Quản trị viên hệ thống',
      role: { roleId: 'mock-role-admin', roleName: 'Admin' },
      status: 'active',
    },
  },
  {
    username: 'manager',
    password: 'Manager@123',
    user: {
      userId: 'mock-manager-1',
      username: 'manager',
      fullName: 'Trưởng phòng vận hành',
      role: { roleId: 'mock-role-manager', roleName: 'Manager' },
      status: 'active',
    },
  },
];

export function findMockAccount(username: string, password: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((account) => account.username === username && account.password === password);
}
