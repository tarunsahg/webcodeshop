'use client';
import { usePathname } from 'next/navigation';
import Nav from './Nav';
import Footer from './Footer';

export default function AppShell({ children }) {
  const pathname = usePathname() || '';
  const isAdmin = pathname.startsWith('/admin');
  return (
    <>
      {!isAdmin && <Nav />}
      <main key={pathname}>{children}</main>
      {!isAdmin && <Footer />}
    </>
  );
}
