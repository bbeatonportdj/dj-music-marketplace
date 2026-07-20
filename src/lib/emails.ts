export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to DJ Music Marketplace!',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#ff453a;font-size:28px;margin:0;">BEAT VAULT</h1>
            <p style="color:#666;font-size:12px;letter-spacing:2px;">PREMIUM DJ EDITS & MUSIC</p>
          </div>
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:32px;">
            <h2 style="color:#fff;font-size:22px;margin:0 0 16px;">Welcome, ${name}!</h2>
            <p style="color:#999;line-height:1.6;">
              Your account is ready. Browse our catalog of premium DJ edits, remixes, and original productions.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="https://djmusicmarketplace.fun/browse" style="display:inline-block;padding:14px 32px;background:#ff453a;color:#fff;text-decoration:none;font-weight:bold;border-radius:8px;letter-spacing:1px;">
                BROWSE CATALOG
              </a>
            </div>
            <p style="color:#666;font-size:13px;">
              Start with free downloads or explore premium packs. Happy mixing!
            </p>
          </div>
          <p style="color:#444;font-size:11px;text-align:center;margin-top:24px;">
            &copy; 2026 DJ Music Marketplace. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function orderConfirmationEmail(_name: string, orderId: string, items: Array<{ title: string; price: number }>, total: number): { subject: string; html: string } {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #333;color:#fff;">${item.title}</td>
      <td style="padding:12px 0;border-bottom:1px solid #333;color:#999;text-align:right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `Order Confirmed #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#ff453a;font-size:28px;margin:0;">BEAT VAULT</h1>
            <p style="color:#666;font-size:12px;letter-spacing:2px;">PREMIUM DJ EDITS & MUSIC</p>
          </div>
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:32px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="width:64px;height:64px;border-radius:50%;background:#22c55e;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="color:#fff;font-size:32px;">✓</span>
              </div>
              <h2 style="color:#fff;font-size:22px;margin:0;">Payment Confirmed!</h2>
            </div>
            <p style="color:#999;text-align:center;margin-bottom:24px;">
              Order #${orderId.slice(0, 8).toUpperCase()} — Your tracks are ready for download.
            </p>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #444;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Track</td>
                  <td style="padding:8px 0;border-bottom:1px solid #444;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Price</td>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td style="padding:12px 0;color:#fff;font-weight:bold;">Total</td>
                  <td style="padding:12px 0;color:#ff453a;font-weight:bold;text-align:right;">$${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div style="text-align:center;margin:32px 0;">
              <a href="https://djmusicmarketplace.fun/downloads" style="display:inline-block;padding:14px 32px;background:#ff453a;color:#fff;text-decoration:none;font-weight:bold;border-radius:8px;letter-spacing:1px;">
                DOWNLOAD NOW
              </a>
            </div>
          </div>
          <p style="color:#444;font-size:11px;text-align:center;margin-top:24px;">
            &copy; 2026 DJ Music Marketplace. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}
