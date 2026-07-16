'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

export interface KpiCardItem {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconColor?: 'blue' | 'amber' | 'red' | 'green' | 'pink';
  changeLabel?: string;
  changeDirection?: 'up' | 'down';
  /** Đường dẫn tới màn hình chứa dữ liệu chi tiết của KPI này — có thì thẻ trở thành link bấm được. */
  href?: string;
}

interface DashboardStatsProps {
  items: KpiCardItem[];
}

const ICON_BG: Record<NonNullable<KpiCardItem['iconColor']>, string> = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
  pink: 'bg-pink-50 text-pink-600',
};

// Map số lượng KPI card -> grid cols để hàng luôn cân đối (vd 3 card thì chia đều 3 cột,
// không để 1 ô trống lệch khi grid cố định 4 cột).
const GRID_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1 lg:grid-cols-1',
  2: 'sm:grid-cols-2 lg:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
};

export default function DashboardStats({ items }: Readonly<DashboardStatsProps>) {
  const gridClass = GRID_COLS[items.length] ?? 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const cardBody = (
          <>
            <div className="flex items-start justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICON_BG[item.iconColor ?? 'blue']}`}>
                <Icon className="h-4 w-4" />
              </span>
              {item.changeLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                    item.changeDirection === 'down' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {item.changeLabel}
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
            </div>
          </>
        );
        const cardClassName = 'flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-colors duration-150 hover:border-blue-300';
        return (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.05 }}>
            {item.href ? (
              <Link href={item.href} className={`${cardClassName} block hover:shadow-sm`}>
                {cardBody}
              </Link>
            ) : (
              <div className={cardClassName}>{cardBody}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
