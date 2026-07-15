'use client';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import Reveal from '@/components/ui/Reveal';

interface SecurityViewProps {
  infoHref: string;
  securityHref: string;
}

export function SecurityView({ infoHref, securityHref }: Readonly<SecurityViewProps>) {
  return (
    <div className="p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý thông tin đăng nhập của bạn.</p>
      </div>

      <div className="mt-6">
        <ProfileHeader activeTab="security" infoHref={infoHref} securityHref={securityHref} />
      </div>

      <Reveal className="mt-6">
        <ChangePasswordForm />
      </Reveal>
    </div>
  );
}

export default SecurityView;
