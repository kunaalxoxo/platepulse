import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ onScan, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let stream = null;
    let animationFrameId;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setHasCamera(false);
        setError('Camera access denied or no camera found.');
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          onScan(code.data);
          return; // Stop ticking when successful
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-primary text-white flex justify-between items-center">
          <h3 className="font-heading font-bold">Scan QR Code</h3>
          <button onClick={onCancel} className="text-white/80 hover:text-white font-bold text-xl">×</button>
        </div>
        
        <div className="relative bg-black aspect-square flex items-center justify-center">
          {error ? (
            <p className="text-red-400 p-4 text-center">{error}</p>
          ) : !hasCamera ? (
            <p className="text-white/60">Waiting for camera...</p>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Green targeting box overlay */}
              <div className="absolute inset-x-12 inset-y-12 border-2 border-primary/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br"></div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 text-center">
          <p className="text-sm text-text/70 mb-4 animate-pulse">Scanning...</p>
          <button onClick={onCancel} className="w-full py-2.5 bg-gray-100 text-text rounded-xl font-medium hover:bg-gray-200 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
