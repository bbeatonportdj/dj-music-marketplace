import { Request, Response } from 'express';
import { Order, OrderItem, Track, Purchase, User } from '../models/index.js';
import { EmailService } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';
// If we want to call third-party APIs, native global fetch is available in Node.js v18+.

/**
 * Handle PromptPay slip verification or simulation
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Track,
              as: 'track',
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.json({ message: 'Order is already paid', order });
    }

    console.log(`💳 Verifying PromptPay payment for Order: ${orderId}...`);

    // Fetch user details for the email confirmation
    const user = await User.findByPk(order.user_id || '');
    const displayName = user?.display_name || 'Customer';

    // 1. Slip Verification API Integration (If SLIPOK_API_KEY is configured)
    const slipokKey = process.env.SLIPOK_API_KEY;
    const slipFile = req.file;

    if (slipokKey) {
      if (!slipFile) {
        return res.status(400).json({ error: 'Transfer slip file is required' });
      }
      console.log('🔍 SlipOK integration detected. Uploading slip for verification...');
      try {
        // Send file to SlipOK API for verification
        // Form Data setup
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(slipFile.buffer)], { type: slipFile.mimetype });
        formData.append('files', blob, slipFile.originalname);
        formData.append('log', 'true');

        const response = await fetch('https://api.slipok.com/api/v1/submerchant/verify-slip', {
          method: 'POST',
          headers: {
            'x-authorization': slipokKey,
          },
          body: formData,
        });

        const slipResult = await response.json();

        if (slipResult.success) {
          const amount = slipResult.data.amount;
          const ref = slipResult.data.transRef;
          
          console.log(`✅ Slip verified! Ref: ${ref}, Amount: ${amount}`);

          if (Math.abs(amount - Number(order.total_amount)) > 0.01) {
            return res.status(400).json({ 
              error: `Invalid transfer amount. Order total: $${order.total_amount}, Transfer amount: $${amount}` 
            });
          }

          // Complete the order
          order.status = 'paid';
          order.promptpay_ref = ref;
          await order.save();
        } else {
          return res.status(400).json({ error: 'Slip verification failed: ' + (slipResult.message || 'Invalid transfer slip') });
        }
      } catch (err: unknown) {
        console.error('❌ SlipOK verification request failed:', err);
        return res.status(500).json({ error: 'Failed to contact payment verification service' });
      }
    } else {
      // 2. Local Simulation Mode (Allowed only if ALLOW_PAYMENT_SIMULATION is set to 'true')
      if (process.env.ALLOW_PAYMENT_SIMULATION === 'true') {
        console.log('🛠️ Payment Simulation Mode: Auto-approving payment.');
        order.status = 'paid';
        await order.save();
      } else {
        console.log('❌ Payment verification not configured (SLIPOK_API_KEY missing) and simulation is disabled.');
        return res.status(500).json({ error: 'Payment verification service is currently unconfigured' });
      }
    }

    // Register purchases for download access
    const tracks = order.items
      .map((item) => (item as Record<string, unknown>).track)
      .filter(Boolean) as unknown as Track[];
    const purchases = tracks.map((track) => ({
      user_id: order.user_id,
      track_id: track.id,
      purchased_at: new Date(),
    }));
    
    await Purchase.bulkCreate(purchases, { ignoreDuplicates: true });

    // Send order confirmation with download links
    EmailService.sendDownloadLinksEmail(order.email, displayName, order.id, tracks);

    return res.json({
      message: 'Payment verified and completed successfully',
      order,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error verifying payment:', message);
    return res.status(500).json({ error: message || 'Server error during payment verification' });
  }
};

/**
 * Handle incoming webhook notifications from bank providers
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const requestSecret = req.headers['x-webhook-secret'] || req.query.secret;

    if (!webhookSecret) {
      console.log('⚠️ Webhook received but process.env.WEBHOOK_SECRET is not configured. Webhooks are disabled.');
      return res.status(500).json({ error: 'Webhook service is disabled' });
    }

    if (requestSecret !== webhookSecret) {
      console.log('❌ Unauthorized webhook request.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transaction_ref, amount, promptpay_ref } = req.body;
    
    console.log(`🔔 Webhook received: transaction_ref=${transaction_ref}, amount=${amount}, promptpay_ref=${promptpay_ref}`);

    // Find order by promptpay_ref
    const order = await Order.findOne({
      where: { promptpay_ref },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Track, as: 'track' }],
        },
      ],
    });

    if (!order) {
      console.log(`⚠️ Order not found for PromptPay Ref: ${promptpay_ref}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.json({ message: 'Order already completed' });
    }

    if (Math.abs(amount - Number(order.total_amount)) > 0.01) {
      console.log(`⚠️ Webhook amount mismatch for Order ${order.id}. Expected: ${order.total_amount}, Received: ${amount}`);
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Complete the order
    order.status = 'paid';
    await order.save();

    // Register purchases
    const tracks = order.items
      .map((item) => (item as Record<string, unknown>).track)
      .filter(Boolean) as unknown as Track[];
    const purchases = tracks.map((track) => ({
      user_id: order.user_id,
      track_id: track.id,
      purchased_at: new Date(),
    }));
    await Purchase.bulkCreate(purchases, { ignoreDuplicates: true });

    // Send confirmation email
    const user = await User.findByPk(order.user_id || '');
    EmailService.sendDownloadLinksEmail(order.email, user?.display_name || 'Customer', order.id, tracks);

    return res.json({ message: 'Order updated via webhook successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error processing webhook:', message);
    return res.status(500).json({ error: message || 'Server error processing webhook' });
  }
};
