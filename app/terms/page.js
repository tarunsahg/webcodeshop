export const metadata = {
  title: 'Terms & Conditions — WebCodeShop',
  description: 'The terms and conditions for buying and using digital products from WebCodeShop.',
};

export default function TermsPage() {
  const updated = 'June 2026';
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <div className="legal-head">
          <span className="legal-tag">Legal</span>
          <h1>Terms &amp; Conditions</h1>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>

        <div className="legal-body">
          <p>Welcome to WebCodeShop. These Terms &amp; Conditions (“Terms”) govern your access to and use of our website, products and services. By creating an account, browsing the store or completing a purchase, you agree to be bound by these Terms.</p>

          <h2>1. Digital products</h2>
          <p>WebCodeShop sells digital goods including PHP scripts, HTML templates, JavaScript applications and digital gift cards. All products are delivered electronically. No physical item is shipped.</p>

          <h2>2. Licenses</h2>
          <p>Unless stated otherwise on the product page, each purchase grants you a non-exclusive, non-transferable license to use the product for a single end product. You may not resell, redistribute or sublicense the source code as-is.</p>

          <h2>3. Orders &amp; payment</h2>
          <p>Prices are listed in Indian Rupees (₹) and include applicable taxes unless noted. We accept UPI, major cards, RuPay, PayPal and Cash on Delivery where available. Your order is confirmed once payment is authorised, and license keys are delivered to your account and email automatically.</p>

          <h2>4. All sales are final</h2>
          <p>Because products are digital and delivered instantly through secure, signed download links, all sales are final once your license keys are issued. If a product is broken or materially not as described, contact our support team and we will work with you to make it right.</p>

          <h2>5. Accounts</h2>
          <p>You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Notify us immediately of any unauthorised use.</p>

          <h2>6. Acceptable use</h2>
          <p>You agree not to use our products for any unlawful purpose, to infringe the rights of others, or to attempt to disrupt, reverse-engineer or compromise the security of the platform.</p>

          <h2>7. Intellectual property</h2>
          <p>All content on this site, including code, designs, logos and copy, is the property of WebCodeShop or its licensors and is protected by applicable intellectual property laws.</p>

          <h2>8. Limitation of liability</h2>
          <p>Products are provided “as is”. To the maximum extent permitted by law, WebCodeShop is not liable for any indirect, incidental or consequential damages arising from the use of, or inability to use, our products.</p>

          <h2>9. Changes to these terms</h2>
          <p>We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.</p>

          <h2>10. Contact</h2>
          <p>Questions about these Terms? Email us at <a href="mailto:support@webcodeshop.dev">support@webcodeshop.dev</a>.</p>
        </div>
      </div>
    </div>
  );
}
