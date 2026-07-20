import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Loader2, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 lg:px-16 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-text hover:text-electric-red transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Mail size={28} className="text-electric-red" />
        <h1 className="font-display text-3xl font-extrabold text-on-surface">Contact Us</h1>
      </div>

      {sent ? (
        <div className="bg-surface-gray border border-border-gray rounded-xl p-12 text-center">
          <CheckCircle size={64} className="text-success-green mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Message Sent!</h2>
          <p className="text-muted-text mb-6">We'll get back to you within 24 hours.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 transition-all"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Subject</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors resize-none"
              placeholder="Tell us more..."
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Contact;
