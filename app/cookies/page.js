export const metadata = {
  title: 'Cookie Policy — WebCodeShop',
  description: 'How WebCodeShop uses cookies and similar technologies.',
};

export default function CookiesPage() {
  const updated = 'June 2026';
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <div className="legal-head">
          <span className="legal-tag">Legal</span>
          <h1>Cookie Policy</h1>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>

        <div className="legal-body">
          <p>This Cookie Policy explains how WebCodeShop uses cookies and similar technologies when you visit our website. By using the site, you agree to the use of cookies as described below.</p>

          <h2>1. What are cookies?</h2>
          <p>Cookies are small text files placed on your device when you visit a website. They help the site remember your actions and preferences — such as keeping you signed in and remembering your cart — over a period of time.</p>

          <h2>2. How we use cookies</h2>
          <ul>
            <li>To keep you securely signed in to your account.</li>
            <li>To remember the items in your shopping cart.</li>
            <li>To understand how the store is used so we can improve it.</li>
            <li>To remember your preferences and settings.</li>
          </ul>

          <h2>3. Types of cookies we use</h2>
          <ul>
            <li><b>Essential cookies</b> — required for the website to function, including sign-in and checkout.</li>
            <li><b>Preference cookies</b> — remember choices such as your cart and settings.</li>
            <li><b>Analytics cookies</b> — help us measure and improve performance.</li>
          </ul>

          <h2>4. Managing cookies</h2>
          <p>You can control and delete cookies through your browser settings at any time. Please note that disabling essential cookies may prevent parts of the site — such as signing in or checking out — from working correctly.</p>

          <h2>5. Contact</h2>
          <p>If you have any questions about our use of cookies, email us at <a href="mailto:contact@webcodeshop.com">contact@webcodeshop.com</a> or call <a href="tel:+919718962885">+91 97189 62885</a> / <a href="tel:+918586070279">+91 85860 70279</a>.</p>
        </div>
      </div>
    </div>
  );
}
