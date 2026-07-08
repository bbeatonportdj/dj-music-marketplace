import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Order, OrderItem, Track, Purchase } from '../models/index.js';
import { EmailService } from '../services/emailService.js';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

// PromptPay ID (Phone number or National ID)
const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0812345678';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { track_ids, payment_method } = req.body;
    
    if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
      return res.status(400).json({ error: 'Track IDs are required and must be a non-empty array' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Retrieve tracks to calculate total amount
    const tracks = await Track.findAll({ where: { id: track_ids } });
    if (tracks.length === 0) {
      return res.status(400).json({ error: 'No valid tracks found' });
    }

    const total_amount = tracks.reduce((sum, track) => sum + Number(track.price), 0);

    // Create unique PromptPay reference number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const promptpay_ref = `PP-${timestamp}-${random}`;

    // Create Order in DB
    const order = await Order.create({
      user_id: req.user.id,
      email: req.user.email,
      total_amount,
      status: total_amount === 0 ? 'paid' : 'pending',
      payment_method: payment_method || 'promptpay',
      promptpay_ref,
    });

    // Create Order Items
    const orderItems = tracks.map((track) => ({
      order_id: order.id,
      track_id: track.id,
      price_at_purchase: track.price,
    }));
    await OrderItem.bulkCreate(orderItems);

    // Generate PromptPay QR if pending & amount > 0
    let qr_code_url = '';
    if (order.status === 'pending' && total_amount > 0) {
      const payload = generatePayload(PROMPTPAY_ID, { amount: total_amount });
      qr_code_url = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
      });
    }

    // If total_amount is 0, fulfill order immediately (free track purchase)
    if (order.status === 'paid') {
      const purchases = tracks.map((track) => ({
        user_id: req.user!.id,
        track_id: track.id,
        purchased_at: new Date(),
      }));
      await Purchase.bulkCreate(purchases, { ignoreDuplicates: true });
      
      // Send download link email immediately for free orders
      EmailService.sendDownloadLinksEmail(req.user.email, req.user.display_name, order.id, tracks.map(t => t.toJSON()));
    } else {
      // Send admin alert for pending orders
      EmailService.sendAdminOrderNotification(order.id, total_amount, req.user.email);
    }

    return res.status(201).json({
      order,
      qr_code_url,
      tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, price: t.price })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating order:', message);
    return res.status(500).json({ error: message || 'Server error creating order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Track,
              as: 'track',
              attributes: ['id', 'title', 'artist', 'version', 'price', 'artwork_url', 'audio_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json(orders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching orders:', message);
    return res.status(500).json({ error: message || 'Server error fetching orders' });
  }
};

export const getPurchasedTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const purchases = await Purchase.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Track,
          as: 'track',
          attributes: ['id', 'title', 'artist', 'version', 'bpm', 'key', 'genre', 'artwork_url', 'audio_url'],
        },
      ],
      order: [['purchased_at', 'DESC']],
    });

    return res.json(purchases.map(p => p.track).filter(Boolean));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching purchased tracks:', message);
    return res.status(500).json({ error: message || 'Server error fetching purchased tracks' });
  }
};
