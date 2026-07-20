import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-[800px] mx-auto px-4 lg:px-16 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-text hover:text-electric-red transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <FileText size={28} className="text-electric-red" />
        <h1 className="font-display text-3xl font-extrabold text-on-surface">Terms of Service</h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-text">
        <p className="text-sm text-border-gray">Last updated: July 2026</p>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using DJ Music Marketplace ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">2. Description of Service</h2>
          <p>DJ Music Marketplace is an online platform that allows users to browse, preview, and purchase digital music files including DJ edits, remixes, and original productions. All music is delivered digitally via download.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">3. Account Registration</h2>
          <p>To purchase music, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">4. Purchases and Payments</h2>
          <p>All purchases are final. Prices are displayed in USD. Payment is processed via PromptPay QR or Stripe. You receive a non-exclusive license to use the purchased music files.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">5. Digital Content License</h2>
          <p>Upon purchase, you receive a license to use the music for personal and commercial purposes including DJ performances, live sets, and recorded mixes. You may not redistribute, resell, or share the original files.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">6. Refund Policy</h2>
          <p>Due to the digital nature of our products, all sales are final. If you experience technical issues with a download, please contact support for assistance.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">7. Prohibited Conduct</h2>
          <p>You may not: redistribute, resell, or share purchased music; use the Service for illegal purposes; attempt to circumvent security measures; or interfere with the Service's operation.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">8. Intellectual Property</h2>
          <p>All music and content on the Service remains the intellectual property of the respective artists and creators. Your purchase grants usage rights, not ownership of the underlying copyright.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">9. Limitation of Liability</h2>
          <p>DJ Music Marketplace shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">10. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-on-surface mb-3">11. Contact</h2>
          <p>For questions about these Terms, contact us at <span className="text-electric-red">support@djmusicmarketplace.com</span></p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
