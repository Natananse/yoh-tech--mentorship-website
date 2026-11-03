import type { Metadata } from 'next';
import { netlifyHeadCompatibilityScript } from '../lib/netlify-head-script';
import './fonts.css';
import './design-tokens.css';
import './globals.css';
import './academy-homepage.css';
import './lesson-player.css';
import './academy-account.css';
export const metadata: Metadata = { title: 'YO Tech Academy | Your ideas. Real apps.', description: 'Learn React Native, Expo and JavaScript through practical app development courses. Explore real projects, meet your mentors and try a free lesson.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head>
    <script id="yo-tech-hosting-compat" dangerouslySetInnerHTML={{ __html: netlifyHeadCompatibilityScript }} />
    <link rel="preload" href="/fonts/bricolage-0.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/fonts/inter-0.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  </head><body>{children}</body></html>;
}
