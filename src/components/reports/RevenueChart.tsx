'use client';

import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RevenueReportPoint } from '@/types/report';
import { formatCurrency } from '@/utils/formatCurrency';

interface RevenueChartProps {
  data: RevenueReportPoint[];
}

function formatMillions(value: number): string {
  return `${Math.round(value / 1_000_000)}M`;
}

export default function RevenueChart({ data }: Readonly<RevenueChartProps>) {
  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Doanh thu 6 tháng gần đây</h3>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">6 tháng gần đây</span>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatMillions} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#revenueFill)"
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenue"
                position="top"
                formatter={(label) => formatMillions(Number(label))}
                style={{ fontSize: 11, fontWeight: 600, fill: '#1e3a8a' }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
