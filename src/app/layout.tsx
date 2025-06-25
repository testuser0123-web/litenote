import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiteNote',
  description: 'A simple note-taking app',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}