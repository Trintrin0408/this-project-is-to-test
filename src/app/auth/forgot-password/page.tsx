'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApiService } from '@/services/auth.service';

function getErrorMessage(err: unknown, fallback: string): string {
  const axiosError = err as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authApiService.forgotPassword({ username });
      setIsDone(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Gửi yêu cầu thất bại, vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">
            BN
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-semibold text-slate-900">Quên mật khẩu</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          {isDone ? 'Đã gửi yêu cầu!' : 'Nhập tên đăng nhập để nhận hướng dẫn khôi phục qua email.'}
        </p>

        {!isDone ? (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Tên đăng nhập"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">
                {error}
              </p>
            )}
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Gửi yêu cầu
            </Button>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-inset ring-green-600/20">
              Nếu tài khoản tồn tại, email khôi phục mật khẩu đã được gửi.
            </p>
            <Link href="/auth/login">
              <Button type="button" className="w-full">
                Về trang đăng nhập
              </Button>
            </Link>
          </div>
        )}

        {!isDone && (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
