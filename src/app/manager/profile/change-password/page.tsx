import { SecurityView } from '@/components/profile/SecurityView';

export default function Page() {
  return <SecurityView infoHref="/manager/profile" securityHref="/manager/profile/change-password" />;
}
