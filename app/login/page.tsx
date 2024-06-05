import AppLogo from '@/app/ui/app-logo';
import LoginForm from '@/app/ui/login-form';
import { Metadata } from 'next';

import { signIn } from '@/auth';
import { Button } from '@/app/ui/button';

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AppLogo/>
          </div>
        </div>
        <LoginForm />
        <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-4">
          <form
            action={async () => {
              'use server';
              await signIn('github');
            }}
          >
            <Button className="w-full">Sign In With GitHub</Button>
          </form>
          <form
            action={async () => {
              'use server';
              await signIn('google');
            }}
          >
            <Button className="mt-4 w-full">Sign In With Google</Button>
          </form>
        </div>
      </div>
    </main>
  )
    ;
}