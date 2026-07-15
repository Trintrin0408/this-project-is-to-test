import { ProfileView } from '@/components/profile/ProfileView';

export default function Page() {
  return <ProfileView infoHref="/manager/profile" securityHref="/manager/profile/change-password" />;
}
