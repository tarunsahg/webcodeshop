import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import Analytics from '@/components/Analytics';
import { buildRootMetadata, jsonLd } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildRootMetadata();
}

export default function RootLayout({ children }) {
  const ldHtml = { __html: JSON.stringify(jsonLd()) };
  return (
    <html lang="en" className={inter.variable + ' ' + mono.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
