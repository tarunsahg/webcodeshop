export const metadata = {
  title: 'About Us — WebCodeShop',
  description: 'Learn about WebCodeShop — premium code, scripts and digital gift cards delivered instantly.',
};

export default function AboutPage() {
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <div className="legal-head">
          <span className="legal-tag">Company</span>
          <h1>About WebCodeShop</h1>
          <p className="legal-updated">Code. Templates. Scripts. Solutions.</p>
        </div>

        <div className="legal-body">
          <p>WebCodeShop is a digital marketplace for premium, production-ready code, scripts, templates and digital gift cards. We help developers, founders and creators ship faster by giving them high-quality building blocks they can buy and download in seconds.</p>

          <div className="about-stats">
            <div className="about-stat"><b>12,000+</b><span>Developers served</span></div>
            <div className="about-stat"><b>500+</b><span>Products delivered</span></div>
            <div className="about-stat"><b>4.9/5</b><span>Average rating</span></div>
            <div className="about-stat"><b>24/7</b><span>Instant delivery</span></div>
          </div>

          <h2>Our mission</h2>
          <p>We believe great software should be accessible to everyone. Our mission is to make buying and selling quality code as simple and trustworthy as possible — with instant delivery, fair pricing and real human support.</p>

          <h2>What we offer</h2>
          <ul>
            <li><b>PHP scripts</b> — robust, ready-to-deploy backends and tools.</li>
            <li><b>HTML templates</b> — modern, responsive designs for any project.</li>
            <li><b>JavaScript apps</b> — interactive front-end and full-stack solutions.</li>
            <li><b>Digital gift cards</b> — delivered instantly with secure license keys.</li>
          </ul>

          <h2>Why developers choose us</h2>
          <ul>
            <li>Instant, automated license-key delivery on every order.</li>
            <li>Lifetime updates included on most products.</li>
            <li>Multiple payment options including UPI, cards, PayPal and COD.</li>
            <li>Friendly support from a team that actually writes code.</li>
          </ul>

          <h2>Get in touch</h2>
          <p>Have a question or need a hand? Email us at <a href="mailto:contact@webcodeshop.com">contact@webcodeshop.com</a> or call <a href="tel:+919718962885">+91 97189 62885</a> or <a href="tel:+918586070279">+91 85860 70279</a>. You can also visit our <a href="/help">Help Center</a>.</p>
        </div>
      </div>
    </div>
  );
}
