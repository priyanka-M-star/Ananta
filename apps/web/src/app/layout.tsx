import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TeacherPortraitDefs } from '@/components/TeacherPortrait';

export const metadata: Metadata = {
  title: {
    default: 'Ananta — AI tutoring for Karnataka State Board',
    template: '%s · Ananta',
  },
  description:
    'AI tutoring website for Grades 10, 11 and 12. Daily live classes from six AI teachers. ₹299 a month.',
  metadataBase: new URL('https://ananta.app'),
};

export const viewport: Viewport = {
  themeColor: '#FAF5EB',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TeacherPortraitDefs />
        {children}
      </body>
    </html>
  );
}
