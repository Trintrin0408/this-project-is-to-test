'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Trễ animation (giây) — dùng để so le nhiều section liền kề. */
  delay?: number;
}

/**
 * Wrapper scroll-reveal dùng chung toàn site (CLAUDE.md mục 4) — cùng animation
 * (opacity/translateY, viewport once) đã dùng ở components/dashboard/AnalyticsCard.tsx,
 * chỉ tách ra để tái dùng cho mọi section/card khác thay vì lặp lại props motion thủ công.
 */
export default function Reveal({ children, delay = 0, className }: Readonly<RevealProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
