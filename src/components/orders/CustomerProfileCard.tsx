import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Customer } from '@/types/customer';

interface CustomerProfileCardProps {
  customer: Customer;
}

export default function CustomerProfileCard({ customer }: Readonly<CustomerProfileCardProps>) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mb-4 flex justify-center">
        <Avatar name={customer.customerName} size="lg" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{customer.customerName}</h3>

      <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 text-left">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">{customer.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">{customer.email || '—'}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">{customer.address || '—'}</span>
        </div>
      </div>

      <Link
        href={`/manager/customers/${customer.customerId}`}
        className="mt-8 block w-full rounded-lg border border-blue-100 bg-blue-50 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100"
      >
        Xem hồ sơ khách hàng →
      </Link>
    </div>
  );
}
