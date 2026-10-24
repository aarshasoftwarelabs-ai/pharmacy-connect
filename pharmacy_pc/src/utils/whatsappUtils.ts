import { Bill } from '../types/billing';

export const sanitizeIndianPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

export const generateWhatsAppBillText = (
  bill: Bill,
  pharmacyName: string = 'DavaSetu Pharmacy',
  pharmacyPhone: string = ''
): string => {
  const formattedDate = new Date(bill.createdAt || new Date()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = (bill.items || [])
    .map((item, idx) => {
      const lineTotal = Number(item.lineTotal || (item.quantity * item.unitPrice)).toFixed(2);
      return `${idx + 1}. *${item.medicineName}* (Qty: ${item.quantity}) - ₹${lineTotal}`;
    })
    .join('\n');

  let text = `🧾 *TAX INVOICE / DIGITAL BILL*\n`;
  text += `🏥 *${pharmacyName}*\n`;
  if (pharmacyPhone) text += `📞 Contact: ${pharmacyPhone}\n`;
  text += `------------------------------------\n`;
  text += `📄 *Bill No:* ${bill.billNumber}\n`;
  text += `👤 *Customer:* ${bill.customerName}\n`;
  text += `📅 *Date:* ${formattedDate}\n`;
  text += `💳 *Payment:* ${bill.paymentStatus || 'PAID'}\n`;
  text += `------------------------------------\n`;
  text += `💊 *Prescribed Medicines:*\n`;
  text += `${itemsList || 'General Medical Supplies'}\n`;
  text += `------------------------------------\n`;
  text += `Subtotal: ₹${Number(bill.subtotal).toFixed(2)}\n`;
  if (Number(bill.discount) > 0) {
    text += `Discount: -₹${Number(bill.discount).toFixed(2)}\n`;
  }
  if (Number(bill.totalGst || 0) > 0) {
    text += `GST Included: ₹${Number(bill.totalGst || 0).toFixed(2)}\n`;
  }
  text += `*GRAND TOTAL: ₹${Number(bill.total).toFixed(2)}*\n`;
  text += `------------------------------------\n`;
  text += `🙏 Thank you for choosing us! Wishing you a speedy recovery.\n`;
  text += `_Powered by DavaSetu Healthcare_`;

  return text;
};

export const openExternalLink = (url: string) => {
  try {
    const ipc = (window as any).ipcRenderer;
    if (ipc && typeof ipc.invoke === 'function') {
      ipc.invoke('open-external', url).catch(() => {
        window.open(url, '_blank');
      });
      return;
    }
  } catch (e) {
    console.warn('IPC invoke error, using window.open fallback', e);
  }
  window.open(url, '_blank');
};

export const sendWhatsAppBill = (
  bill: Bill,
  recipientPhone?: string,
  pharmacyName: string = 'K.Y Pharmacy'
): boolean => {
  let targetPhone = recipientPhone || bill.customerPhone || '';
  targetPhone = sanitizeIndianPhoneNumber(targetPhone);

  if (!targetPhone || targetPhone.length < 10) {
    const inputPhone = window.prompt ? window.prompt('Enter customer WhatsApp Mobile Number (10 digits):', '') : null;
    if (!inputPhone) return false;
    targetPhone = sanitizeIndianPhoneNumber(inputPhone);
  }

  if (targetPhone.length < 10) {
    alert('Please provide a valid 10-digit mobile number.');
    return false;
  }

  const messageText = generateWhatsAppBillText(bill, pharmacyName);
  const encodedMessage = encodeURIComponent(messageText);

  // Universal WhatsApp link compatible with WhatsApp Desktop & WhatsApp Web
  const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedMessage}`;
  openExternalLink(waUrl);
  return true;
};
