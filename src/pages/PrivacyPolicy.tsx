import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-[800px] mx-auto px-4 lg:px-16 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-text hover:text-electric-red transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} className="text-electric-red" />
        <h1 className="font-display text-3xl font-extrabold text-on-surface">Privacy Policy</h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-text">
        <p className="text-sm text-border-gray">Last updated: July 2026</p>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly: email address, display name, and payment information. We also collect usage data including IP address, browser type, and pages visited.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">2. How We Use Your Information</h2>
          <p>We use your information to: process transactions, send order confirmations, provide customer support, improve our Service, and send promotional communications (with your consent).</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share data with payment processors (Stripe, PromptPay) solely to complete transactions, and with hosting providers necessary to operate the Service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">4. Data Security</h2>
          <p>We implement industry-standard security measures including SSL encryption, secure authentication, and regular security audits. However, no method of transmission is 100% secure.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">5. Cookies and Tracking</h2>
          <p>We use essential cookies for authentication and session management. We may use analytics tools to understand usage patterns. You can control cookie settings in your browser.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">6. Data Retention</h2>
          <p>We retain your account information for as long as your account is active. Purchase history is retained for legal and accounting purposes. You may request data deletion by contacting support.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">7. Your Rights</h2>
          <p>You have the right to: access your personal data, correct inaccurate data, request deletion of your data, and opt out of marketing communications.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">8. Children's Privacy</h2>
          <p>The Service is not intended for users under 13. We do not knowingly collect information from children under 13.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. Material changes will be notified via email or prominent notice on the Service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">10. Contact</h2>
          <p>For privacy-related inquiries, contact us at <span className="text-electric-red">support@djmusicmarketplace.com</span></p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
