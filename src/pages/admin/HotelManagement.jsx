import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Building,
  Search,
  MapPin,
  DollarSign,
  Star,
  Users,
  Plus,
  X, 
  CheckCircle, 
  AlertCircle, 
  IndianRupee
} from "lucide-react";
import { getAllHotels, searchHotelsByLocation } from "../../services/HotelServiceSid";
import { createBooking, getBookingsByType } from "../../services/BookingServiceSid"; 
import { useAuth } from '../../contexts/AuthContext'; 

const HotelManagement = () => {
  const { user, token, isAuthenticated } = useAuth(); 

  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    location: "all",
    status: "all",
    priceRange: "all",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const [hotelBookingCounts, setHotelBookingCounts] = useState({}); 

  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  
  useEffect(() => {
    const fetchHotels = async () => {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let fetchedData;
        if (filters.search && filters.location === "all") {
          
          
          
          
          
          fetchedData = await getAllHotels(token); 
        } else if (filters.location !== "all") {
          
          fetchedData = await searchHotelsByLocation(filters.location, token);
        } else {
          
          fetchedData = await getAllHotels(token);
        }
        setHotels(fetchedData);
      } catch (err) {
        if (err.message && err.message.includes('Unauthorized')) {
          setError('Session expired or unauthorized. Please log in again.');
          localStorage.removeItem('travora_auth_token');
          localStorage.removeItem('travora_user_data');
          
        } else {
          setError(err.message || 'Failed to load hotels.');
        }
        console.error("Failed to fetch hotels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [token, filters.location]); 

  
  useEffect(() => {
    const fetchBookingCounts = async () => {
      if (!token || hotels.length === 0) {
        
        return;
      }

      try {
        
        
        
        
        
        const bookingResponse = await getBookingsByType('hotel', token, { pageNo: 0, pageSize: 1000 });
        const allBookings = bookingResponse.content || [];

        const counts = {};
        allBookings.forEach(booking => {
          if (booking.hotelId) {
            counts[booking.hotelId] = (counts[booking.hotelId] || 0) + 1;
          }
        });
        setHotelBookingCounts(counts);
      } catch (err) {
        console.error("Failed to fetch booking counts:", err);
        
      }
    };

    fetchBookingCounts();
  }, [token, hotels]); 

  
  useEffect(() => {
    filterHotels();
  }, [hotels, filters.search, filters.status, filters.priceRange]);

  const filterHotels = () => {
    let currentFiltered = [...hotels];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (hotel) =>
          (hotel.name && hotel.name.toLowerCase().includes(searchTerm)) ||
          (hotel.location && hotel.location.toLowerCase().includes(searchTerm)) ||
          (hotel.description && hotel.description.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.status !== "all") {
      if (filters.status === "available") {
        currentFiltered = currentFiltered.filter((hotel) => hotel.roomsAvailable > 0);
      } else if (filters.status === "full") {
        currentFiltered = currentFiltered.filter((hotel) => hotel.roomsAvailable === 0);
      } else if (filters.status === "inactive") {
         currentFiltered = currentFiltered.filter((hotel) => getHotelStatus(hotel) === "Inactive");
      }
    }

    if (filters.priceRange !== "all") {
      const [min, max] = filters.priceRange.split("-").map(Number);
      currentFiltered = currentFiltered.filter((hotel) => {
        const price = hotel.pricePerNight;
        return max ? price >= min && price <= max : price >= min;
      });
    }

    currentFiltered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredHotels(currentFiltered);
  };

  
  const getBookingCount = (hotelId) => {
    return hotelBookingCounts[hotelId] || 0; 
  };

  const getHotelStatus = (hotel) => {
    if (hotel.roomsAvailable === 0) return "Full";
    if (hotel.status === "Inactive" || hotel.status === "inactive") 
      return "Inactive";
    return "Available";
  };

  const getStatusColor = (hotel) => {
    const status = getHotelStatus(hotel);
    switch (status) {
      case "Available":
        return "text-green-600";
      case "Full":
        return "text-red-600";
      case "Inactive":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const locations = [...new Set(hotels.map((hotel) => hotel.location))].sort();

  const stats = {
    total: hotels.length,
    availableRooms: hotels.reduce((sum, h) => sum + (h.roomsAvailable || 0), 0),
  };

  
  const handleBookNowClick = (hotel) => {
    if (!isAuthenticated) {
      setError('You must be logged in to book a hotel.');
      return;
    }
    setSelectedHotel(hotel);
    setShowBookingModal(true);
    setBookingError(null);
    setBookingSuccess(null);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedHotel(null);
    setBookingError(null);
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedHotel || !user || !token) {
      setBookingError('Missing hotel or user information for booking.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    
    const mockPaymentId = Math.floor(Math.random() * 1000000000) + 1;

    
    const userIdFromAuth = user.userId || user.id; 

    if (!userIdFromAuth) {
        setBookingError('User ID not found in authentication context. Cannot proceed with booking.');
        setBookingLoading(false);
        return;
    }

    const bookingDto = {
      userId: userIdFromAuth,
      type: "hotel",
      hotelId: selectedHotel.hotelId,
      flightId: null,
      itineraryId: null,
      status: "confirmed", 
      paymentId: mockPaymentId,
    };

    try {
      const result = await createBooking(bookingDto, token);
      setBookingSuccess(`Booking confirmed for ${selectedHotel.name}! Booking ID: ${result.bookingId}`);
   
      setHotels(prevHotels => prevHotels.map(h => 
        h.hotelId === selectedHotel.hotelId ? { ...h, roomsAvailable: h.roomsAvailable - 1 } : h
      ));
       setHotelBookingCounts(prevCounts => ({
        ...prevCounts,
        [selectedHotel.hotelId]: (prevCounts[selectedHotel.hotelId] || 0) + 1
      }));

    } catch (err) {
      setBookingError(err.message || 'Failed to create booking.');
      console.error("Booking creation error:", err);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <DashboardLayout title="Hotel Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Management</h1>
          <p className="text-gray-600">Manage all hotels across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Hotels
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Available Rooms
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.availableRooms}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search hotels by name, location, or description..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="full">Fully Booked</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.priceRange}
              onChange={(e) =>
                setFilters({ ...filters, priceRange: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Prices</option>
              <option value="0-200">₹0 - ₹200</option>
              <option value="200-400">₹200 - ₹400</option>
              <option value="400-600">₹400 - ₹600</option>
              <option value="600">₹600+</option>
            </select>
          </div>
        </div>
        {/* Hotels Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rooms Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Night
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12"> {/* Updated colspan */}
                      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg text-gray-600">Loading hotels...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-red-600"> {/* Updated colspan */}
                      <p className="text-lg font-medium">Error: {error}</p>
                      <p className="text-gray-600">Please try again later.</p>
                    </td>
                  </tr>
                ) : filteredHotels.length > 0 ? (
                  filteredHotels.map((hotel) => (
                    <tr key={hotel.hotelId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {hotel.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hotel.amenities && hotel.amenities.length > 0 && (
                                <span>
                                  {hotel.amenities.slice(0, 2).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {hotel.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm text-gray-900">
                            {hotel.rating || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {hotel.roomsAvailable}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {hotel.pricePerNight || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getBookingCount(hotel.hotelId)} bookings {/* Changed to hotel.hotelId */}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${getStatusColor(
                            hotel
                          )}`}
                        >
                          {getHotelStatus(hotel)}
                        </span>
                      </td>
                     
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-12"> {/* Updated colspan */}
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hotels found
                      </h3>
                      <p className="text-gray-600">
                        {filters.search ||
                        filters.location !== "all" ||
                        filters.status !== "all" ||
                        filters.priceRange !== "all"
                          ? "Try adjusting your filters"
                          : "No hotels have been added to the system yet"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedHotel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Book Hotel: {selectedHotel.name}</h2>
              <button onClick={handleCloseBookingModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              You are about to book a room at **{selectedHotel.name}** in **{selectedHotel.location}** for **${selectedHotel.pricePerNight}** per night.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Rooms available: {selectedHotel.roomsAvailable}
            </p>

            {bookingLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="w-8 h-8 border-4 border-t-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                <p className="text-blue-600">Processing booking...</p>
              </div>
            )}

            {bookingError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center mb-4" role="alert">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{bookingError}</span>
              </div>
            )}
            {bookingSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center mb-4" role="alert">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{bookingSuccess}</span>
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseBookingModal}
                className="btn-secondary px-4 py-2 rounded-md"
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="btn-primary px-4 py-2 rounded-md"
                disabled={bookingLoading || bookingSuccess} // Disable if loading or already succeeded
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HotelManagement;
