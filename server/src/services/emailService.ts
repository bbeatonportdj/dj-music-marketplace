import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || '';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (host && user && pass) {
      console.log('📧 Email Service: Using custom SMTP configuration.');
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      console.log('📧 Email Service: SMTP credentials not set. Generating Ethereal test mail account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`📧 Ethereal test SMTP configured. User: ${testAccount.user}`);
      } catch (err) {
        console.error('❌ Failed to configure test SMTP. Logging emails to console only.', err);
        // Fallback dummy
        this.transporter = {
          sendMail: async (mailOptions: any) => {
            console.log('\n=== [CONSOLE EMAIL DUMP] ===');
            console.log(`From: ${mailOptions.from}`);
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Body (HTML):\n${mailOptions.html}`);
            console.log('============================\n');
            return { messageId: 'console-dummy-id' };
          },
        } as any;
      }
    }

    return this.transporter!;
  }

  /**
   * Send Welcome Sign-up Email
   */
  static async sendWelcomeEmail(toEmail: string, displayName: string) {
    const transporter = await this.getTransporter();
    const from = process.env.SMTP_FROM || '"RunMusic Store" <noreply@beatvault.dj>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #6366f1;">Welcome to RunMusic-storeDj! 🎧</h2>
        <p>Dear ${displayName},</p>
        <p>Thank you for signing up to our platform. You are now part of a premium marketplace curated specifically for professional and hobbyist DJs.</p>
        <p>You can now browse tracks by genre, listen to high-quality audio previews (including BPM and key scales), save your favorites, and purchase edits/packs for your DJ sets.</p>
        <br>
        <a href="http://localhost:5173/browse" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Catalog</a>
        <br><br>
        <p>Best regards,<br>The RunMusic-storeDj Team</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: 'Welcome to RunMusic-storeDj! 🎧',
        html,
      });

      if (info.messageId !== 'console-dummy-id' && nodemailer.getTestMessageUrl(info)) {
        console.log(`✉️ Test email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      console.log(`✉️ Signup confirmation email sent to: ${toEmail}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
    }
  }

  /**
   * Send Order Confirmation with download link
   */
  static async sendDownloadLinksEmail(toEmail: string, displayName: string, orderId: string, tracks: any[]) {
    const transporter = await this.getTransporter();
    const from = process.env.SMTP_FROM || '"RunMusic Store" <noreply@beatvault.dj>';

    let tracksHtml = '<ul style="list-style-type: none; padding: 0;">';
    tracks.forEach((track) => {
      tracksHtml += `
        <li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
          <img src="${track.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop'}" width="50" height="50" style="border-radius: 4px; margin-right: 15px; object-fit: crop;" />
          <div>
            <strong style="font-size: 16px;">${track.title}</strong><br>
            <span style="color: #666; font-size: 14px;">${track.artist} (${track.version || 'Original Edit'})</span><br>
            <a href="${track.audio_url}" download style="color: #6366f1; font-weight: bold; text-decoration: underline; font-size: 14px;">Download Track Link</a>
          </div>
        </li>
      `;
    });
    tracksHtml += '</ul>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #10b981;">Payment Verified! Thank you for your purchase 🎵</h2>
        <p>Dear ${displayName},</p>
        <p>We are excited to inform you that your payment for Order <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> has been verified successfully.</p>
        <p>Here are your purchased DJ tracks and download links:</p>
        
        ${tracksHtml}
        
        <br>
        <p>You can also log in to your account and download your purchased tracks at any time by visiting your purchase history on your Profile dashboard page.</p>
        <p>If you have any questions or require support, feel free to reply to this email.</p>
        <br>
        <p>Best regards,<br>The RunMusic-storeDj Team</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: `Payment Confirmed & Download Links (Order #${orderId.substring(0, 8).toUpperCase()}) 🎵`,
        html,
      });

      if (info.messageId !== 'console-dummy-id' && nodemailer.getTestMessageUrl(info)) {
        console.log(`✉️ Test email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      console.log(`✉️ Order verification email sent to: ${toEmail}`);
    } catch (error) {
      console.error('❌ Failed to send download links email:', error);
    }
  }

  /**
   * Send Order Created Alert to Admin
   */
  static async sendAdminOrderNotification(orderId: string, totalAmount: number, email: string) {
    const transporter = await this.getTransporter();
    const from = process.env.SMTP_FROM || '"RunMusic Store" <noreply@beatvault.dj>';
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@beatvault.dj';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #f59e0b;">New Order Created (Pending Payment) 🛒</h2>
        <p>A new order has been created on the RunMusic marketplace.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
        <p>Please check the admin console for PromptPay payment updates.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `New Pending Order #${orderId.substring(0, 8).toUpperCase()} - $${totalAmount.toFixed(2)}`,
        html,
      });
      console.log(`✉️ Admin order notification sent for Order: ${orderId}`);
    } catch (error) {
      console.error('❌ Failed to send admin order notification:', error);
    }
  }
}
