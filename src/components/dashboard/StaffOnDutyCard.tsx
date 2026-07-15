import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import type { StaffDutyStatus, StaffOnDuty } from '@/mocks/adminDashboard';

const STATUS_TEXT: Record<StaffDutyStatus, string> = {
  busy: 'Bận',
  processing: 'Đang xử lý',
  off: 'Nghỉ phép',
};

const STATUS_COLOR: Record<StaffDutyStatus, string> = {
  busy: 'text-green-600',
  processing: 'text-amber-600',
  off: 'text-slate-400',
};

interface StaffOnDutyCardProps {
  staff: StaffOnDuty[];
}

export default function StaffOnDutyCard({ staff }: Readonly<StaffOnDutyCardProps>) {
  const activeCount = staff.filter((person) => person.status !== 'off').length;

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Nhân viên phụ trách hôm nay</h3>
        <Link href="/admin/settings/users" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Xem tất cả
        </Link>
      </div>

      <div className="mt-3 flex-1 space-y-3">
        {staff.map((person) => (
          <div key={person.name} className="flex items-center gap-3">
            <Avatar name={person.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{person.name}</p>
              <p className="text-xs text-slate-400">
                {person.eventsCount} sự kiện • {person.ordersCount} đơn đặt
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold ${STATUS_COLOR[person.status]}`}>{STATUS_TEXT[person.status]}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
        Tổng số nhân viên đang trực: {activeCount} điều phối viên chính.
      </p>
    </div>
  );
}
