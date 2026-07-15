'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApiService } from '@/services/auth.service';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { ROLE_OPTIONS } from '@/constants/roles';
import type { AuthProfile } from '@/types/auth';

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Đã vô hiệu hóa',
  locked: 'Tạm khóa',
};

interface ProfileHeaderProps {
  activeTab: 'info' | 'security';
  infoHref: string;
  securityHref: string;
  onProfileLoaded?: (profile: AuthProfile) => void;
}

export function ProfileHeader({ activeTab, infoHref, securityHref, onProfileLoaded }: Readonly<ProfileHeaderProps>) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    authApiService.getProfile().then((res) => {
      setProfile(res.data);
      onProfileLoaded?.(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {profile ? (
          <Avatar name={profile.fullName} size="lg" />
        ) : (
          <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-full bg-slate-100" />
        )}
        <div>
          {profile ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900">{profile.fullName}</h2>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="neutral">
                  {ROLE_OPTIONS.find((r) => r.value === profile.role.roleName)?.label ?? profile.role.roleName}
                </Badge>
                <Badge variant={getStatusBadgeVariant(profile.status.toUpperCase())}>
                  {STATUS_LABEL[profile.status] ?? profile.status}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5 border-t border-slate-100 pt-3">
        <Link
          href={infoHref}
          className={`pb-2 text-sm font-medium ${
            activeTab === 'info'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Thông tin cá nhân
        </Link>
        <Link
          href={securityHref}
          className={`pb-2 text-sm font-medium ${
            activeTab === 'security'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Bảo mật & Tài khoản
        </Link>
      </div>
    </div>
  );
}

export default ProfileHeader;
