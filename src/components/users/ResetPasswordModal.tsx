'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { AdminUser } from '@/types/user';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (newPassword: string) => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  isSubmitting,
  errorMessage,
  onSubmit,
}: Readonly<ResetPasswordModalProps>) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) return;
    onSubmit(newPassword);
  };

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" form="reset-password-form" isLoading={isSubmitting}>
        Đặt lại mật khẩu
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đặt lại mật khẩu"
      subtitle={`Tài khoản @${user?.username ?? ''}`}
      footer={footer}
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          trailingIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          onTrailingIconClick={() => setShowPassword((s) => !s)}
        />
        <Input
          label="Xác nhận mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          error={passwordMismatch ? 'Mật khẩu xác nhận không khớp' : undefined}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">
            {errorMessage}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default ResetPasswordModal;
