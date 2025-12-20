import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Usably',
  description: 'A simple web browser built with Electron and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='overflow-hidden'>
        <div className='absolute top-0 h-8 w-full titlebar' />
        {children}
      </body>
    </html>
  );
}
