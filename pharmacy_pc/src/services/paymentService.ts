const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const PaymentService = {
  createOrder: async (amount: number, currency: string = 'INR', planName: string = '') => {
    try {
      const response = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency, notes: { planName } }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  verifyPayment: async (paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) => {
    try {
      const response = await fetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }
};
