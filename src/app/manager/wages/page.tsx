import { Wallet } from 'lucide-react';
import ComingSoonPage from '@/components/manager/ComingSoonPage';

export default function Page() {
  return (
    <ComingSoonPage
      title="Công & lương"
      description="Chấm công và tính tiền công Staff."
      icon={Wallet}
      outOfScopeNote="Chấm công & tính lương Staff không thuộc phạm vi phát triển của hệ thống này."
    />
  );
}
