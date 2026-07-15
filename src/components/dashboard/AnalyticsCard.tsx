'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  isPlaceholder?: boolean;
  children: ReactNode;
}

export default function AnalyticsCard({ title, subtitle, isPlaceholder, children }: Readonly<AnalyticsCardProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {isPlaceholder && (
          <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Dữ liệu minh họa
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}
