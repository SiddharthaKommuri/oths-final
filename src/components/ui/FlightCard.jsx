import { Plane, Clock, Users, Calendar } from 'lucide-react';


const FlightCard = ({ flight, onBook, showBookButton = true, isBookAuthorized = true }) => {
  
  
  const displayDepartureTime = flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const displayArrivalTime = flight.arrivalTime ? new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

  
  let durationText = 'N/A';
  if (flight.departureTime && flight.arrivalTime) {
    try {
      const dep = new Date(flight.departureTime);
      const arr = new Date(flight.arrivalTime);
      const diffMs = arr.getTime() - dep.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      durationText = `${hours}h ${minutes}m`;
    } catch (e) {
      console.error("Error calculating duration:", e);
    }
  }

  
  
  
  const isBookButtonDisabled = !flight.availability || !isBookAuthorized;

  
  let bookButtonText = 'Book Flight';
  if (!flight.availability) {
    bookButtonText = 'Not Available'; 
  } else if (!isBookAuthorized) {
    bookButtonText = 'Log in to Book';
  }

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
             
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">₹{flight.price}</p>
            <p className="text-sm text-gray-600">per person</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{displayDepartureTime}</p>
            <p className="text-sm text-gray-600">{flight.departure}</p> 
            
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-1">
              <div className="w-8 h-px bg-gray-300"></div>
              <Clock className="w-4 h-4" />
              <div className="w-8 h-px bg-gray-300"></div>
            </div>
            <p className="text-sm font-medium text-gray-700">{durationText}</p> {/* Display calculated duration */}
            <p className="text-xs text-gray-500">Direct</p>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{displayArrivalTime}</p>
            <p className="text-sm text-gray-600">{flight.arrival}</p> {/* Arrival location/airport code */}
            
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{flight.departureTime ? new Date(flight.departureTime).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {showBookButton && (
            <button
              onClick={() => onBook(flight)}
              className="btn-primary"
              disabled={isBookButtonDisabled}
              
            >
              {bookButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
