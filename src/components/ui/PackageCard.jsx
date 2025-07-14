import { MapPin, Clock, Users, Star, Package } from 'lucide-react';
 
// Import your images directly
// Adjust the paths based on the actual location relative to PackageCard.jsx
import image2 from '../../assets/pexels-photonova-2907578.jpg';
import image1 from '../../assets/image.jpg';
 
const PackageCard = ({ package: pkg, onCustomize, onBook, showActions = true }) => {
  const activitiesToDisplay = pkg.activities || []; // Ensure it's an array
 
  const displayPrice = pkg.price; // Use pkg.price directly from DTO
 
  const selectedImage = pkg.packageId % 2 === 0 ? image1 : image2;
 
  const displayRating = pkg.rating || 'N/A';
 
  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img
          src={selectedImage}
          alt={pkg.packageName || 'Travel Package'}
          className="w-full h-full object-cover"
        />
        {displayRating !== 'N/A' && (
          <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{displayRating}</span>
          </div>
        )}
      </div>
 
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.packageName}</h3>
 
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{pkg.location}</span>
        </div>
 
        {/* Included Hotels and Flights - Displaying IDs for now as names are not available directly */}
        {(pkg.includedHotelIds && pkg.includedHotelIds.length > 0) || (pkg.includedFlightIds && pkg.includedFlightIds.length > 0) ? (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Included:</h4>
            <div className="flex flex-wrap gap-2">
              {pkg.includedHotelIds && pkg.includedHotelIds.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Hotels ({pkg.includedHotelIds.length})
                </span>
              )}
              {pkg.includedFlightIds && pkg.includedFlightIds.length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  Flights ({pkg.includedFlightIds.length})
                </span>
              )}
            </div>
          </div>
        ) : null}
 
        {/* Activities Preview */}
        {activitiesToDisplay.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Activities ({activitiesToDisplay.length}):
            </h4>
            <div className="space-y-1">
              {activitiesToDisplay.slice(0, 3).map((activityName, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Package className="w-3 h-3 mr-2 text-green-600" />
                  <span>{activityName}</span>
                </div>
              ))}
              {activitiesToDisplay.length > 3 && (
                <p className="text-xs text-gray-500">+{activitiesToDisplay.length - 3} more activities</p>
              )}
            </div>
          </div>
        )}
 
        {/* Pricing and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Starting from</p>
            <p className="text-xl font-bold text-primary-300">₹{displayPrice ? displayPrice.toFixed(2) : 'N/A'}</p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
         
          {showActions && (
            <div className="flex space-x-2">
              <button
                onClick={() => onCustomize(pkg)}
                className="btn-secondary text-sm"
              >
                Customize
              </button>
              <button
                onClick={() => onBook(pkg)}
                className="btn-primary text-sm"
              >
                Book Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default PackageCard;