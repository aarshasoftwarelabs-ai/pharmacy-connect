import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

// Initialize Razorpay strictly from environment configuration (never hardcode live secrets)
const razorpayKeyId = env.RAZORPAY_KEY_ID || '';
const razorpaySecret = env.RAZORPAY_KEY_SECRET || '';
const razorpay = razorpayKeyId && razorpaySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecret
    })
  : null;

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!razorpaySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(body)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const providedBuf = Buffer.from(razorpaySignature, 'utf8');
  return expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Create a new Razorpay order
 * POST /api/payments/create-order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured on server' });
    }
    const { amount, currency, receipt, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      keyId: razorpayKeyId,
      order,
    });
  } catch (error: any) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * Verify Razorpay payment signature
 * POST /api/payments/verify
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    if (!razorpaySecret) {
      return res.status(503).json({ success: false, message: 'Payment gateway secret is not configured' });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const isAuthentic = verifyRazorpaySignature(
      String(razorpay_order_id),
      String(razorpay_payment_id),
      String(razorpay_signature)
    );

    if (isAuthentic) {
      // Payment is successful
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};
