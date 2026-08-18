import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anand Hardware — Building Supplies & Construction Materials | Biratnagar, Nepal',
  description: 'Premier supplier of PVC pipes, electrical wiring, cements, Asian paints, hand tools, and heavy door locks in Biratnagar. Wholesale and retail site delivery across Morang.',
  keywords: [
    'Anand Hardware',
    'Hardware shop Biratnagar',
    'Construction materials Nepal',
    'PVC pipes Biratnagar',
    'Panchakanya pipes',
    'Shivam cement',
    'Asian paints Biratnagar',
    'Door locks hardware',
  ],
  openGraph: {
    title: 'Anand Hardware — Building Supplies & Construction Materials',
    description: 'Premier supplier of PVC pipes, electrical wiring, cements, paints, and hardware in Biratnagar, Nepal.',
    url: 'https://anandhardware.com',
    siteName: 'Anand Hardware',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
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
