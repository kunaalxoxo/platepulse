import { useRef, useCallback } from 'react';
import QRCode from 'qrcode';

const useQR = () => {
  const canvasRef = useRef(null);

  const generateQR = useCallback(async (data) => {
    try {
      const url = await QRCode.toDataURL(JSON.stringify(data), { width: 256 });
      return url;
    } catch (err) {
      console.error('QR generation failed:', err);
      return null;
    }
  }, []);

  return { canvasRef, generateQR };
};

export default useQR;
