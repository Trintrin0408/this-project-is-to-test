'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface OrderStatusDonutItem {
  status: string;
  value: number;
}

interface OrderStatusDonutProps {
  data: OrderStatusDonutItem[];
}

const COLORS = ['#2563eb', '#f59e0b', '#94a3b8', '#16a34a', '#94a3b8', '#ef4444', '#94a3b8'];

export default function OrderStatusDonut({ data }: Readonly<OrderStatusDonutProps>) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const percent = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Phân bố trạng thái đơn hàng</h3>
      <p className="mt-0.5 text-xs text-slate-400">Nguồn: GET /reports/orders (by_status)</p>
      <div className="relative mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-400">Tổng đơn</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
        {data.map((item, index) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            {item.status} ({item.value} · {percent(item.value)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
