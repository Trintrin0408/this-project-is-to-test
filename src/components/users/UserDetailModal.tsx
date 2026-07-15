'use client';

import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatDate';
import { USER_ROLE_OPTIONS } from '@/constants/roles';
import type { AdminUser } from '@/types/user';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Đã vô hiệu hóa',
  SUSPENDED: 'Tạm khóa',
};

function InfoField({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function UserDetailModal({ isOpen, onClose, user }: Readonly<UserDetailModalProps>) {
  if (!user) return null;

  const roleLabel = USER_ROLE_OPTIONS.find((r) => r.value === user.role)?.label ?? user.role;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết người dùng" size="lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <Avatar name={user.fullName} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-slate-900">{user.fullName}</p>
              <Badge variant={getStatusBadgeVariant(user.status)}>{STATUS_LABEL[user.status] ?? user.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-100 p-4">
          <InfoField label="Mã người dùng" value={user.userId} />
          <InfoField label="Vai trò" value={<Badge variant="neutral">{roleLabel}</Badge>} />
          <InfoField label="Ngày tạo" value={formatDate(user.createdAt)} />
        </div>
      </div>
    </Modal>
  );
}

export default UserDetailModal;
