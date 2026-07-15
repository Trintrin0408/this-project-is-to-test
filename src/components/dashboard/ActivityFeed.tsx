'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ActivityFeedItem {
  key: string;
  time: number;
  message: ReactNode;
  icon: LucideIcon;
  iconColor: 'blue' | 'amber' | 'green';
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

const COLOR_CLASS: Record<ActivityFeedItem['iconColor'], string> = {
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-green-100 text-green-600',
};

export default function ActivityFeed({ items }: Readonly<ActivityFeedProps>) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-800">Hoạt động gần đây</h3>
      <div className="mt-5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có hoạt động nào.</p>
        ) : (
          <div className="relative flex flex-col gap-5 before:absolute before:bottom-0 before:left-[19px] before:top-0 before:w-px before:bg-slate-100">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="relative flex gap-4"
                >
                  <span
                    className={`z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white ${COLOR_CLASS[item.iconColor]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="pt-2 text-sm text-slate-600">{item.message}</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
