'use client';

import { useState } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import Reveal from '@/components/ui/Reveal';
import { formatDate } from '@/utils/formatDate';
import type { AuthProfile } from '@/types/auth';

interface ProfileViewProps {
  infoHref: string;
  securityHref: string;
}

export function ProfileView({ infoHref, securityHref }: Readonly<ProfileViewProps>) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  return (
    <div className="p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Xem thông tin tài khoản của bạn.</p>
      </div>

      <div className="mt-6">
        <ProfileHeader activeTab="info" infoHref={infoHref} securityHref={securityHref} onProfileLoaded={setProfile} />
      </div>

      <Reveal className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Thông tin cơ bản</h3>
        {profile ? (
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mã người dùng</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{profile.userId}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tên đăng nhập</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{profile.username}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ngày tạo</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(profile.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cập nhật gần nhất</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}

export default ProfileView;
