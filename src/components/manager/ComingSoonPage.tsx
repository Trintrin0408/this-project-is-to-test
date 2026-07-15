import { type LucideIcon } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Ghi chú riêng khi tính năng nằm ngoài phạm vi phát triển (khác "chưa xây dựng xong"). */
  outOfScopeNote?: string;
}

// Placeholder dùng chung cho các route Manager đã có trong Sidebar (MANAGER_NAV_SECTIONS) nhưng
// chưa build tính năng thật — xem tiến độ ở docs/manager-features-checklist.md.
export default function ComingSoonPage({ title, description, icon: Icon, outOfScopeNote }: Readonly<ComingSoonPageProps>) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
          <Icon className="h-6 w-6" />
        </span>
        {outOfScopeNote ? (
          <p className="max-w-sm text-sm text-slate-400">{outOfScopeNote}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-500">Tính năng đang được xây dựng.</p>
            <p className="max-w-sm text-xs text-slate-400">Xem tiến độ tại docs/manager-features-checklist.md.</p>
          </>
        )}
      </div>
    </div>
  );
}
