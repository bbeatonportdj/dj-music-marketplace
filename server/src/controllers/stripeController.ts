import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Order, OrderItem, Track, Purchase, User } from '../models/index.js';
import { EmailService } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === 'sk_test_placeholder') {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

const getDomain = () => process.env.FRONTEND_URL || 'http://localhost:5173';

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { track_ids } = req.body;

    if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
      return res.status(400).json({ error: 'Track IDs are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tracks = await Track.findAll({ where: { id: track_ids } });
    if (tracks.length === 0) {
      return res.status(400).json({ error: 'No valid tracks found' });
    }

    const total_amount = tracks.reduce((sum, track) => sum + Number(track.price), 0);

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const promptpay_ref = `PP-${timestamp}-${random}`;

    const order = await Order.create({
      user_id: req.user.id,
      email: req.user.email,
      total_amount,
      status: total_amount === 0 ? 'paid' : 'pending',
      payment_method: 'stripe',
      promptpay_ref,
    });

    const orderItems = tracks.map((track) => ({
      order_id: order.id,
      track_id: track.id,
      price_at_purchase: track.price,
    }));
    await OrderItem.bulkCreate(orderItems);

    if (total_amount === 0) {
      const purchases = tracks.map((track) => ({
        user_id: req.user!.id,
        track_id: track.id,
        purchased_at: new Date(),
      }));
      await Purchase.bulkCreate(purchases, { ignoreDuplicates: true });
      EmailService.sendDownloadLinksEmail(req.user.email, req.user.display_name, order.id, tracks);

      return res.status(201).json({
        order,
        qr_code_url: '',
        url: null,
        tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, price: t.price })),
      });
    }

    const lineItems = tracks.map((track) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${track.title} - ${track.artist}`,
          images: track.artwork_url ? [track.artwork_url] : [],
        },
        unit_amount: Math.round(Number(track.price) * 100),
      },
      quantity: 1,
    }));

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${getDomain()}/orders?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${getDomain()}/cart?cancelled=true`,
      metadata: {
        order_id: order.id,
        user_id: req.user.id,
      },
      customer_email: req.user.email,
    });

    return res.status(201).json({
      order,
      qr_code_url: '',
      url: session.url,
      tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, price: t.price })),
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    console.log('⚠️ STRIPE_WEBHOOK_SECRET not configured, skipping webhook verification');
    return res.status(200).json({ received: true });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error('❌ No order_id in Stripe session metadata');
      return res.status(400).json({ error: 'Missing order_id' });
    }

    try {
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Track, as: 'track' }],
          },
        ],
      });

      if (!order) {
        console.error(`❌ Order ${orderId} not found`);
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'paid') {
        return res.json({ message: 'Order already completed' });
      }

      order.status = 'paid';
      await order.save();

      const tracks = order.items.map((item: any) => item.track).filter(Boolean);
      const purchases = tracks.map((track: any) => ({
        user_id: order.user_id,
        track_id: track.id,
        purchased_at: new Date(),
      }));
      await Purchase.bulkCreate(purchases, { ignoreDuplicates: true });

      const user = await User.findByPk(order.user_id || '');
      EmailService.sendDownloadLinksEmail(
        order.email,
        user?.display_name || 'Customer',
        order.id,
        tracks,
      );

      console.log(`✅ Order ${orderId} completed via Stripe webhook`);
    } catch (err) {
      console.error(`❌ Error processing order ${orderId}:`, err);
    }
  }

  return res.json({ received: true });
};

export const getStripePublicKey = async (_req: Request, res: Response) => {
  return res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
};
