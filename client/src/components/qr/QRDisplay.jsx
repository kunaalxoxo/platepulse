const QRDisplay = ({ qrDataUrl }) => {
  return (
    <div className="flex flex-col items-center bg-green-50 p-4 rounded-xl border border-green-100">
      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto bg-white p-2 rounded-lg shadow-sm" />
      <p className="text-sm font-medium text-primary mt-3 mb-2">Show this at pickup</p>
      <a 
        href={qrDataUrl} 
        download="platepulse-qr.png"
        className="text-xs text-white bg-primary px-4 py-1.5 rounded-full hover:bg-green-700 transition"
      >
        Download QR
      </a>
    </div>
  );
};

export default QRDisplay;
