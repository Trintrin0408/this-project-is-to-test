'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, HelpCircle, Search, UserCircle, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const basePath = user?.role.roleName === 'Admin' ? '/admin' : '/manager';

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-xs">
      <div className="w-64">
        <Input
          placeholder="Tìm kiếm hệ thống..."
          icon={<Search className="h-4 w-4" />}
          className="!rounded-full !py-1.5 !text-xs border-slate-200 bg-slate-50 shadow-none transition-colors duration-150 focus:bg-white"
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-600"
        >
          <Bell className="h-5 w-5" />
          {/* Chấm báo hiệu thay vì số đếm — docs/api/ chưa có endpoint danh sách thông báo nên chưa
              có số thật; hiện trạng thái "có thông báo" thay vì bịa 1 con số cụ thể. */}
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-ping rounded-full bg-red-500" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button
          type="button"
          aria-label="Trợ giúp"
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-600"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <div ref={menuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex items-center rounded-full p-0.5 transition-colors duration-150 hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-slate-100"
              >
                <div className="px-3.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName ?? 'Khách'}</p>
                  <p className="truncate text-xs text-slate-400">{user?.role.roleName}</p>
                </div>
                <div className="h-px bg-slate-100" />
                <Link
                  href={`${basePath}/profile`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                >
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  Hồ sơ cá nhân
                </Link>
                <Link
                  href={`${basePath}/profile/change-password`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  Đổi mật khẩu
                </Link>
                <div className="h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
