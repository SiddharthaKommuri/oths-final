import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import FlightService from "../../services/FlightService";
import FlightCard from "../../components/ui/FlightCard";
import PaymentModal from "../../components/ui/PaymentModal";
import { useAuth } from "../../contexts/AuthContext";
import { MapPin, Search, CalendarDays} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify"; // Ensure toast is imported

const TravelerFlights = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    departureDate: "", // Added for flight date selection
    returnDate: "",    // Added for round trip flights
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    setError("");

    try {
      let response;
      // Adjust FlightService.getAllFlights to accept pagination/sorting if needed,
      // or ensure it returns all flights if no search criteria.
      if (searchData.from || searchData.to) { // Search if either 'from' or 'to' is provided
        response = await FlightService.searchFlights(
          searchData.from,
          searchData.to,
          token
        );
      } else {
        // Fetch all flights if no specific search criteria are provided
        response = await FlightService.getAllFlights(token);
      }

      // Assuming response.data contains the array of flights directly
      setFlights(response.data);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      setError("Failed to fetch flights. Please try again.");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [token]); // Re-fetch flights if token changes (e.g., on login/logout)

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFlights();
  };

  const handleBooking = (flight) => {
    console.log("TravelerFlights: handleBooking triggered for flight:", flight);
    console.log("TravelerFlights: Current user:", user);
    console.log("TravelerFlights: Current token:", token);
    console.log("TravelerFlights: searchData.departureDate:", searchData.departureDate);
    console.log("TravelerFlights: searchData.returnDate:", searchData.returnDate);

    // Check for authentication before proceeding
    if (!user || !token) {
      toast.error("Please log in to book a flight.");
      console.log("TravelerFlights: Booking aborted due to missing user or token.");
      return;
    }

    // Check if departure date is selected
    if (!searchData.departureDate) {
      toast.error("Please select a departure date before booking.");
      console.log("TravelerFlights: Booking aborted due to missing departure date.");
      return;
    }

    // Optional: Add check for returnDate if it's a round trip and required
    // if (flight.type === 'roundTrip' && !searchData.returnDate) {
    //   toast.error("Please select a return date for round trip flights.");
    //   return;
    // }

    setSelectedFlight(flight);
    setPaymentModal(true);
    console.log("TravelerFlights: Payment modal set to open.");
  };

  // The handlePayment function is removed from here,
  // as its logic is now handled entirely by the PaymentModal component.

  return (
    <DashboardLayout title="Search Flights">
      <div className="card p-6 mb-6 rounded-lg shadow-md">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="From (Origin)"
              value={searchData.from}
              onChange={(e) =>
                setSearchData({ ...searchData, from: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="To (Destination)"
              value={searchData.to}
              onChange={(e) =>
                setSearchData({ ...searchData, to: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="date"
              placeholder="Departure Date"
              value={searchData.departureDate}
              onChange={(e) =>
                setSearchData({ ...searchData, departureDate: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Optional: Add return date input if you support round trips */}
          {/* <div className="relative">
            <CalendarDays className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="date"
              placeholder="Return Date (Optional)"
              value={searchData.returnDate}
              onChange={(e) =>
                setSearchData({ ...searchData, returnDate: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div> */}

          <button
            type="submit"
            className="btn-primary flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              "Searching..."
            ) : (
              <>
                <Search className="w-5 h-5" /> <span>Search Flights</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && <div className="text-red-600 text-center mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        {flights.length > 0 ? (
          flights.map((flight) => (
            <FlightCard
              key={flight.flightId}
              flight={flight}
              onBook={handleBooking}
              showBookButton={true}
              isBookAuthorized={!!token}
            />
          ))
        ) : (
          !loading && (
            <div className="text-center text-gray-500 p-6 bg-white rounded-lg shadow-md">
              <p>No flights found matching your criteria.</p>
            </div>
          )
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        selectedItem={selectedFlight} // Pass the selected flight as selectedItem
        bookingType="flight"          // Specify the booking type
        searchData={searchData}      // Pass searchData for dates/guests
        user={user}                  // Pass the entire user object
        token={token}                // Pass token from AuthContext
        navigate={navigate}          // Pass navigate function
      />
    </DashboardLayout>
  );
};

export default TravelerFlights;