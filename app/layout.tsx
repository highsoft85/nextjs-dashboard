import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Next Dashboard',
    default: 'Next Dashbaord',
  },
  description: 'The Next.js Dashboard, built with App Router',
  metadataBase: new URL('https://next-dashboard-highsoft85.vercel.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}