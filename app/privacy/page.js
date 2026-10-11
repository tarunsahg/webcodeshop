export const metadata = {
  title: 'Privacy Policy — WebCodeShop',
  description: 'How WebCodeShop collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  const updated = 'June 2026';
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <div className="legal-head">
          <span className="legal-tag">Legal</span>
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>

        <div className="legal-body">
          <p>Your privacy matters to us. This Privacy Policy explains what information WebCodeShop collects, how we use it, and the choices you have. By using our website you consent to the practices described below.</p>

          <h2>1. Information we collect</h2>
          <ul>
            <li><b>Account details</b> — your name, email address and password (stored in hashed form).</li>
            <li><b>Order information</b> — products purchased, amounts, coupon codes and delivery email.</li>
            <li><b>Usage data</b> — pages viewed, device and browser information, used to improve the store.</li>
          </ul>

          <h2>2. How we use your information</h2>
          <ul>
            <li>To process orders and deliver license keys automatically.</li>
            <li>To provide customer support and respond to your requests.</li>
            <li>To send important account and order notifications.</li>
            <li>To improve our products, security and overall experience.</li>
          </ul>

          <h2>3. Cookies</h2>
          <p>We use essential cookies to keep you signed in and to remember your cart. We may use analytics cookies to understand how the store is used. You can control cookies through your browser settings.</p>

          <h2>4. Payments</h2>
          <p>Payment details are processed by our payment providers. We do not store full card numbers on our servers.</p>

          <h2>5. Data sharing</h2>
          <p>We do not sell your personal information. We share data only with trusted service providers (such as payment and email providers) as needed to operate the store, or when required by law.</p>

          <h2>6. Data retention</h2>
          <p>We retain your account and order information for as long as your account is active or as needed to comply with legal obligations.</p>

          <h2>7. Your rights</h2>
          <p>You may access, update or delete your account information at any time from your account settings, or by contacting us. You may also request a copy of the data we hold about you.</p>

          <h2>8. Security</h2>
          <p>We use industry-standard measures to protect your data, including password hashing and encrypted connections. No method of transmission is 100% secure, but we work hard to keep your information safe.</p>

          <h2>9. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated date.</p>

          <h2>10. Contact</h2>
          <p>Questions about your privacy? Email us at <a href="mailto:privacy@webcodeshop.dev">privacy@webcodeshop.dev</a>.</p>
        </div>
      </div>
    </div>
  );
}
