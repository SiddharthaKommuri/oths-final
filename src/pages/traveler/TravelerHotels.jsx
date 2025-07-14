import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import HotelCard from "../../components/ui/HotelCard";
import PaymentModal from "../../components/ui/PaymentModal";
import { hotelService } from "../../services/hotelService"; // Assuming hotelService is correctly defined
import BookingService from "../../services/BookingService"; // Correct import for your BookingService
import { useAuth } from "../../contexts/AuthContext";
import { MapPin, Calendar, Search } from "lucide-react";
import { toast } from "react-toastify";

const TravelerHotels = () => {
  const { user, token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state) {
      setSearchData((prev) => ({ ...prev, ...location.state }));
    }
    fetchHotels();
  }, [location.state, token]); // Added token to dependency array for fetchHotels

  const fetchHotels = async () => {
    try {
      // hotelService.getAllHotels already returns the array of hotels directly
      const allHotels = await hotelService.getAllHotels(token);
      
      const hotelsWithRooms = allHotels.filter(
        (hotel) => hotel.roomsAvailable > 0
      );
      setHotels(hotelsWithRooms);
      applySearchFilter(hotelsWithRooms);
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
      toast.error("Failed to load hotels. Please try again.");
    }
  };

  const applySearchFilter = (hotelList) => {
    let filtered = [...hotelList];
    if (searchData.destination) {
      filtered = filtered.filter(
        (hotel) =>
          hotel.location
            .toLowerCase()
            .includes(searchData.destination.toLowerCase()) ||
          hotel.name
            .toLowerCase()
            .includes(searchData.destination.toLowerCase())
      );
    }
    setFilteredHotels(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applySearchFilter(hotels);
  };

  const handleBooking = (hotel) => {
    console.log("TravelerHotels: handleBooking triggered.");
    console.log("TravelerHotels: Current user:", user);
    console.log("TravelerHotels: Current token:", token);
    console.log("TravelerHotels: searchData.checkIn:", searchData.checkIn);
    console.log("TravelerHotels: searchData.checkOut:", searchData.checkOut);
    console.log("TravelerHotels: Selected hotel passed to handleBooking:", hotel);


    // Check for authentication before proceeding
    if (!user || !token) {
      toast.error("Please log in to book a hotel.");
      console.log("TravelerHotels: Booking aborted due to missing user or token.");
      return;
    }

    if (!searchData.checkIn || !searchData.checkOut) {
      toast.error("Please select check-in and check-out dates before booking.");
      console.log("TravelerHotels: Booking aborted due to missing check-in/check-out dates.");
      return;
    }
    setSelectedHotel(hotel);
    setPaymentModal(true);
    console.log("TravelerHotels: Payment modal set to open.");
  };

  // calculateNights is now moved to PaymentModal for dynamic calculation within the modal
  // but we keep a local version if needed for other UI elements in TravelerHotels
  const calculateNights = () => {
    if (!searchData.checkIn || !searchData.checkOut) return 1;
    const checkIn = new Date(searchData.checkIn);
    const checkOut = new Date(searchData.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // The handlePayment function is removed from here, as its logic is now handled by PaymentModal.
  // PaymentModal will handle the full transaction and then close itself and navigate.

  return (
    <DashboardLayout title="Hotel Search">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Search Form */}
        <div className="card p-6 rounded-lg shadow-md">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Destination"
                value={searchData.destination}
                onChange={(e) =>
                  setSearchData({ ...searchData, destination: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={searchData.checkIn}
                onChange={(e) =>
                  setSearchData({ ...searchData, checkIn: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={searchData.checkOut}
                onChange={(e) =>
                  setSearchData({ ...searchData, checkOut: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Hotel Results */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredHotels.length} hotels available
              </h2>
            </div>

            {filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.hotelId}
                  hotel={hotel}
                  onBook={handleBooking}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No hotels found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModal}
          onClose={() => setPaymentModal(false)}
          selectedItem={selectedHotel} // Pass the selected hotel as selectedItem
          bookingType="hotel"          // Specify the booking type
          searchData={searchData}      // Pass searchData for dates/guests
          user={user}                  // Pass the entire user object
          token={token}                // Pass token from AuthContext
          navigate={navigate}          // Pass navigate function
          toast={toast}                // Pass toast function
        />
      </div>
    </DashboardLayout>
  );
};

export default TravelerHotels;
