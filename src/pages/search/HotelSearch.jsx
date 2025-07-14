import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hotelService } from '../../services/hotelService';
import { MapPin, Star, Wifi, Car, Coffee, Dumbbell } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const HotelSearch = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    rating: 0,
    amenities: [],
  });
  const location = useLocation();

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.searchHotels(location.state || {});
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (hotel) => {
    setSelectedHotel(hotel);
    setBookingModal(true);
  };

  const confirmBooking = async () => {
    try {
      const bookingData = {
        hotelId: selectedHotel.id,
        checkIn: '2024-03-15',
        checkOut: '2024-03-18',
        guests: 2,
      };
      
      await hotelService.bookHotel(bookingData);
      alert('Hotel booked successfully!');
      setBookingModal(false);
    } catch (error) {
      alert('Booking failed. Please try again.');
    }
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'gym':
        return <Dumbbell className="w-4 h-4" />;
      case 'restaurant':
        return <Coffee className="w-4 h-4" />;
      case 'pool':
        return <Car className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Searching for hotels..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Search Results</h1>
        <p className="text-gray-600">Found {hotels.length} hotels for your stay</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            
            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: [0, parseInt(e.target.value)]
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">${filters.priceRange[1]}</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, rating })}
                    className={`p-1 ${
                      filters.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="space-y-2">
                {['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'].map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            amenities: [...filters.amenities, amenity]
                          });
                        } else {
                          setFilters({
                            ...filters,
                            amenities: filters.amenities.filter(a => a !== amenity)
                          });
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Results */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Hotel Image */}
                  <div className="md:w-1/3">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>

                  {/* Hotel Details */}
                  <div className="md:w-2/3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{hotel.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{hotel.location}</span>
                      </div>

                      <p className="text-gray-700 mb-4">{hotel.description}</p>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600"
                          >
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price and Booking */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">${hotel.price}</span>
                        <span className="text-gray-600 ml-1">per night</span>
                      </div>
                      <button
                        onClick={() => handleBooking(hotel)}
                        className="btn-primary"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Confirm Booking"
        size="md"
      >
        {selectedHotel && (
          <div>
            <div className="mb-4">
              <h4 className="font-semibold text-lg">{selectedHotel.name}</h4>
              <p className="text-gray-600">{selectedHotel.location}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span className="font-medium">March 15, 2024</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span className="font-medium">March 18, 2024</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span className="font-medium">2 Adults</span>
              </div>
              <div className="flex justify-between">
                <span>Nights:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-primary-600">${selectedHotel.price * 3}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setBookingModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 btn-primary"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotelSearch;