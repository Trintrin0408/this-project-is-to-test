import { SecurityView } from '@/components/profile/SecurityView';

export default function Page() {
  return <SecurityView infoHref="/admin/profile" securityHref="/admin/profile/change-password" />;
}
