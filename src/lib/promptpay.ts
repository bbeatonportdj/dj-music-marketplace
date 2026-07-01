/**
 * PromptPay QR Code Generator
 * สร้าง PromptPay QR Code ตามมาตรฐาน EMVCo
 */
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

// PromptPay ID — เบอร์โทรหรือเลขบัตรประชาชน
const PROMPTPAY_ID = import.meta.env.VITE_PROMPTPAY_ID || '0000000000';

/**
 * สร้าง PromptPay payload string
 */
export const createPromptPayPayload = (amount: number): string => {
  return generatePayload(PROMPTPAY_ID, { amount });
};

/**
 * สร้าง QR Code เป็น Data URL (base64 PNG)
 */
export const generatePromptPayQR = async (amount: number): Promise<string> => {
  const payload = createPromptPayPayload(amount);
  
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
  
  return qrDataUrl;
};

/**
 * สร้าง Reference Number แบบ unique
 */
export const generateRefNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PP-${timestamp}-${random}`;
};
