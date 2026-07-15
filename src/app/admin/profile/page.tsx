import { ProfileView } from '@/components/profile/ProfileView';

export default function Page() {
  return <ProfileView infoHref="/admin/profile" securityHref="/admin/profile/change-password" />;
}
