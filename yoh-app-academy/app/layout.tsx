import type { Metadata } from 'next';
import './globals.css';
import './academy-homepage.css';
export const metadata: Metadata = { title: 'YOH App Academy | Your ideas. Real apps.', description: 'Learn React Native, Expo and JavaScript through practical app development courses. Explore real projects, meet your mentors and try a free lesson.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
