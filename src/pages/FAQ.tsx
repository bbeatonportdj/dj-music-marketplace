import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border-gray rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-gray transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold text-on-surface">{question}</span>
        {isOpen ? <ChevronUp size={18} className="text-muted-text" /> : <ChevronDown size={18} className="text-muted-text" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-muted-text">{answer}</div>
      )}
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    { q: 'How do I purchase tracks?', a: 'Browse the catalog, add tracks to your cart, and proceed to checkout. You can pay via PromptPay QR or credit card (Stripe). After payment, tracks become available for download instantly.' },
    { q: 'What payment methods do you accept?', a: 'We accept PromptPay QR (Thai bank apps) and credit/debit cards via Stripe (Visa, Mastercard, AMEX).' },
    { q: 'Can I use purchased music commercially?', a: 'Yes. Your purchase grants a license to use the music for DJ performances, live sets, recorded mixes, and other commercial purposes. You may not redistribute or resell the original files.' },
    { q: 'How do I download my purchased tracks?', a: 'After purchase, go to Profile > My Downloads or Orders. Click the download button next to any purchased track.' },
    { q: 'What audio format are the tracks?', a: 'All tracks are delivered as high-quality MP3 files (320kbps).' },
    { q: 'Can I get a refund?', a: 'Due to the digital nature of our products, all sales are final. If you experience technical issues with a download, please contact support.' },
    { q: 'How do I become a producer on the platform?', a: 'Sign up for an account and upgrade to a Producer account from your Profile page. Once approved, you can upload and sell your own tracks.' },
    { q: 'I forgot my password. How do I reset it?', a: 'Go to the login page and click "Forgot Password". You will receive a reset link via email.' },
    { q: 'How do I contact support?', a: 'Email us at support@djmusicmarketplace.com or use the Contact page. We typically respond within 24 hours.' },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 lg:px-16 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-text hover:text-electric-red transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <HelpCircle size={28} className="text-electric-red" />
        <h1 className="font-display text-3xl font-extrabold text-on-surface">FAQ & Support</h1>
      </div>

      <div className="space-y-3 mb-12">
        {faqs.map((faq, i) => (
          <FAQItem key={i} question={faq.q} answer={faq.a} />
        ))}
      </div>

      <div className="bg-surface-gray border border-border-gray rounded-xl p-8 text-center">
        <h2 className="font-display text-xl font-bold text-on-surface mb-2">Still have questions?</h2>
        <p className="text-muted-text mb-6">Our support team is ready to help.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@djmusicmarketplace.com"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 transition-all"
          >
            <Mail size={18} /> Email Support
          </a>
          <Link
            to="/contact"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
          >
            <MessageCircle size={18} /> Contact Form
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
