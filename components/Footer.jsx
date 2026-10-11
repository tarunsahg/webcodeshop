'use client';
import Link from 'next/link';
import { useApp } from './Providers';
import { SOCIAL_MAP, normalizeFooterSocials } from '@/lib/socials';

function SocialIcon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>;
}

export default function Footer() {
  const app = useApp();
  if (!app) return null;
  const year = new Date().getFullYear();
  const brand = (app.settings && app.settings.brand) || 'WebCodeShop';
  const socials = normalizeFooterSocials(app.settings && app.settings.footerSocials)
    .filter((s) => s.enabled && s.url && SOCIAL_MAP[s.id]);

  const onSubscribe = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value.trim() : '';
    if (!email) return;
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        app.showToast(data.isNew ? 'Subscribed! Check your inbox for a welcome email.' : 'You are already subscribed — thanks!', 'success');
        try { form.reset(); } catch {}
      } else {
        app.showToast((data && data.error) || 'Could not subscribe. Please try again.', 'error');
      }
    } catch {
      app.showToast('Could not subscribe. Please try again.', 'error');
    }
  };

  return (
    <footer className="footer-v2">
      <div className="container">
        <div className="top">
          <div className="brand-col">
            <div className="brand-row">
              <img src="/logo-icon.png" alt={brand} />
              <b>{brand}</b>
            </div>
            <div className="tagline">— Code. Templates. Scripts. Solutions. —</div>
            <p className="about">Premium code, scripts and digital gift cards built by indie developers — delivered to your account the moment you check out.</p>
            <ul className="foot-contact">
              <li><a href="tel:+919718962885">+91 97189 62885</a></li>
              <li><a href="tel:+918586070279">+91 85860 70279</a></li>
              <li><a href="mailto:contact@webcodeshop.com">contact@webcodeshop.com</a></li>
            </ul>
            {socials.length > 0 && (
              <div className="socials">
                {socials.map((s) => {
                  const href = String(s.url).trim();
                  const ext = /^https?:/i.test(href);
                  const props = ext ? { target: '_blank', rel: 'noopener noreferrer' } : {};
                  return (
                    <a key={s.id} href={href} aria-label={SOCIAL_MAP[s.id].label} {...props}>
                      <SocialIcon d={SOCIAL_MAP[s.id].d} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <h5>Shop</h5>
            <Link href="/shop" className="flink">All products</Link>
            {(app.categories || []).map((c) => (
              <Link key={c.id} href={'/shop?c=' + c.id} className="flink">{c.name}</Link>
            ))}
          </div>
          <div>
            <h5>Account</h5>
            <Link href="/login" className="flink">Sign in</Link>
            <Link href="/register" className="flink">Create account</Link>
            <Link href="/account" className="flink">My orders</Link>
            <Link href="/cart" className="flink">My cart</Link>
          </div>
          <div>
            <h5>Company</h5>
            <Link href="/about" className="flink">About us</Link>
            <Link href="/help" className="flink">Help center</Link>
            <Link href="/cookies" className="flink">Cookie policy</Link>
            <a href="mailto:contact@webcodeshop.com" className="flink">Contact us</a>
          </div>
          <div>
            <h5>Stay updated</h5>
            <p style={newsBlurbStyle}>Tips, drops &amp; promo codes — 1 email a week, no spam.</p>
            <form className="news" onSubmit={onSubscribe}>
              <input type="email" placeholder="you@email.com" required />
              <button type="submit">Join</button>
            </form>
          </div>
        </div>
        <div className="bot">
          <p>© {year} {brand}. All rights reserved.</p>
          <div style={legalLinksStyle}>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
const newsBlurbStyle = { fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 8, lineHeight: 1.55 };
const legalLinksStyle = { display: 'flex', gap: 18 };
