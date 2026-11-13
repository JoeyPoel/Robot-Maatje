import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HvA Robot Maatje // Command Center',
  description: 'Hogeschool van Amsterdam • Creating Tomorrow • Alpha Mini Robotics Command Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="dark">
      <body className="bg-[#040A18] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
