import CountdownTimer from './CountdownTimer';
import QRDisplay from '../qr/QRDisplay';

const STATUS_CONFIG = {
  available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Available' },
  matched: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Matched' },
  in_transit: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Transit' },
  delivered: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Delivered' },
  expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
};

const DonationCard = ({ donation, showAcceptButton, onAccept, showQR }) => {
  const status = STATUS_CONFIG[donation.status] || STATUS_CONFIG.available;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition hover:shadow-md flex flex-col sm:flex-row gap-4">
      {/* Left side: Image */}
      <div className="shrink-0 w-full sm:w-28 h-40 sm:h-auto rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center">
        {donation.image ? (
          <img src={donation.image} alt={donation.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl block w-full text-center py-6">🍽️</span>
        )}
      </div>

      {/* Right side: Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-heading font-bold text-lg text-text">{donation.name}</h3>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-text/60 mb-2">{donation.category}</p>
          
          <div className="flex items-center gap-3 text-sm font-medium text-text/80 mb-3">
            <span className="bg-gray-100 px-2 py-1 rounded-md">📦 {donation.quantity} {donation.quantityUnit}</span>
            {donation.distance !== undefined && (
              <span className="text-primary bg-green-50 px-2 py-1 rounded-md">📍 {donation.distance.toFixed(1)}km away</span>
            )}
          </div>
          
          {(donation.status === 'available' || donation.status === 'matched') && (
             <CountdownTimer expiresAt={donation.expiresAt} />
          )}
        </div>

        {/* Conditional Interactions */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {showAcceptButton && donation.status === 'available' && (
            <button 
              onClick={() => onAccept(donation._id)}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition"
            >
              Accept Donation
            </button>
          )}

          {showQR && donation.qrCode && ['matched', 'in_transit'].includes(donation.status) && (
            <div className="mt-2">
              <QRDisplay qrDataUrl={donation.qrCode} />
            </div>
          )}

          {/* Donor detail area if populate exists */}
          {donation.donor?.name && !showAcceptButton && (
             <p className="text-xs text-text/50 mt-2 block w-full text-right">By {donation.donor.orgName || donation.donor.name}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
