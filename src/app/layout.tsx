
import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import EconomyBar from '@/components/EconomyBar';

export const metadata: Metadata = {
  title: 'NokTek - اقتصاد التفاعل',
  description: 'منصة NokTek للتواصل الاجتماعي والمكافآت',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen pb-20">
        <AuthProvider>
          <EconomyBar />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
