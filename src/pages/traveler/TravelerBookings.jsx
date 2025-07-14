import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import BookingCard from "../../components/ui/BookingCard";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import InvoiceGenerator from "../../components/ui/InvoiceGenerator";
import RefundMessage from "../../components/ui/RefundMessage";
import {
  Filter,
  Search,
  Calendar,
  Package,
  Plane,
  Building,
} from "lucide-react";
 
// Import all necessary services and AuthContext
import BookingService from "../../services/BookingService";
import HotelService from "../../services/hotelService";
import PaymentService from "../../services/PaymentService";
import FlightService from "../../services/FlightService";
// Import the new travel package service
import * as TravelPackageService from "../../services/TravelPackageService"; // Assuming the path is correct
import * as ItineraryService from "../../services/ItineraryServiceSid"; // Assuming this is correctly imported
 
import { useAuth } from "../../contexts/AuthContext";
 
const TravelerBookings = () => {
  const { user, token } = useAuth();
 
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    pageNo: 0,
    pageSize: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    booking: null,
  });
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    booking: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const currentUserId = user?.userId;
 
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!currentUserId || !token) {
      setLoading(false);
      setBookings([]);
      setError("Please log in to view your bookings.");
      return;
    }
 
    try {
      // 1. Fetch initial bookings
      const bookingResponse = await BookingService.getBookingsByUserId(
        currentUserId,
        filters.pageNo,
        filters.pageSize,
        filters.sortBy,
        filters.sortDir,
        token
      );
      let fetchedBookings = Array.isArray(bookingResponse.data.content)
        ? bookingResponse.data.content
        : Array.isArray(bookingResponse.data)
        ? bookingResponse.data
        : [];
 
      // 2. Identify unique hotel IDs and fetch their details
      const hotelBookings = fetchedBookings.filter(
        (b) => b.type?.toLowerCase() === "hotel" && b.hotelId
      );
      const uniqueHotelIds = [...new Set(hotelBookings.map((b) => b.hotelId))];
 
      let hotelsData = {};
      if (uniqueHotelIds.length > 0) {
        for (const hotelId of uniqueHotelIds) {
          try {
            const hotelDetail = await HotelService.getHotelById(hotelId, token);
            if (hotelDetail.data) {
              hotelsData[hotelId] = hotelDetail.data;
            }
          } catch (hotelErr) {
            console.warn(
              `Could not fetch details for hotelId ${hotelId}:`,
              hotelErr
            );
            hotelsData[hotelId] = {
              name: "Hotel Not Found",
              location: "N/A",
              rating: null,
            };
          }
        }
      }
 
      // 3. Identify unique flight IDs and fetch their details
      const flightBookings = fetchedBookings.filter(
        (b) => b.type?.toLowerCase() === "flight" && b.flightId
      );
      const uniqueFlightIds = [
        ...new Set(flightBookings.map((b) => b.flightId)),
      ];
 
      let flightsData = {};
      if (uniqueFlightIds.length > 0) {
        for (const flightId of uniqueFlightIds) {
          try {
            const flightDetail = await FlightService.getFlightById(
              flightId,
              token
            );
            if (flightDetail.data) {
              flightsData[flightId] = flightDetail.data;
            }
          } catch (flightErr) {
            console.warn(
              `Could not fetch details for flightId ${flightId}:`,
              flightErr
            );
            flightsData[flightId] = {
              airline: "Airline Not Found",
              flightNumber: "N/A",
            };
          }
        }
      }
 
      // 4. Identify unique package IDs and fetch their details
      const packageBookings = fetchedBookings.filter(
        (b) => b.type?.toLowerCase() === "package" && b.packageId
      );
      const uniquePackageIds = [
        ...new Set(packageBookings.map((b) => b.packageId)),
      ];
 
      let packagesData = {};
      if (uniquePackageIds.length > 0) {
        for (const packageId of uniquePackageIds) {
          try {
            const packageDetailResponse =
              await TravelPackageService.getPackageById(
                // Renamed to avoid confusion
                packageId,
                token
              );
            if (packageDetailResponse.data) {
              // Access .data property
              packagesData[packageId] = packageDetailResponse.data;
            }
          } catch (packageErr) {
            console.warn(
              `Could not fetch details for packageId ${packageId}:`,
              packageErr
            );
            packagesData[packageId] = {
              packageName: "Package Not Found",
              location: "N/A",
            };
          }
        }
      }
 
      // 5. Identify unique itinerary IDs and fetch their details
      const itineraryBookings = fetchedBookings.filter((b) => b.itineraryId); // Filter all bookings that have an itineraryId
      const uniqueItineraryIds = [
        ...new Set(itineraryBookings.map((b) => b.itineraryId)),
      ];
 
      let itinerariesData = {};
      if (uniqueItineraryIds.length > 0) {
        for (const itineraryId of uniqueItineraryIds) {
          try {
            const itineraryDetailResponse =
              await ItineraryService.getItineraryById(
                // Renamed
                itineraryId,
                token
              );
            if (itineraryDetailResponse.data) {
              // Access .data property
              itinerariesData[itineraryId] = itineraryDetailResponse.data;
            }
          } catch (itineraryErr) {
            console.warn(
              `Could not fetch details for itineraryId ${itineraryId}:`,
              itineraryErr
            );
            itinerariesData[itineraryId] = {
              customizationDetails: "N/A",
              price: null,
            };
          }
        }
      }
 
      // 6. Fetch payment details for the user
      let userPayments = [];
      try {
        const paymentResponse = await PaymentService.getPaymentsByUserId(
          currentUserId,
          token
        );
        if (
          paymentResponse.data &&
          Array.isArray(paymentResponse.data.payments)
        ) {
          userPayments = paymentResponse.data.payments;
        } else if (Array.isArray(paymentResponse.data)) {
          userPayments = paymentResponse.data;
        } else {
          console.warn(
            "PaymentService.getPaymentsByUserId did not return an array of payments in 'data.payments' or 'data':",
            paymentResponse
          );
        }
      } catch (paymentErr) {
        console.warn("Could not fetch user payments:", paymentErr);
      }
 
      // Create a map of payments by bookingId
      const paymentMap = new Map();
      userPayments.forEach((payment) => {
        if (payment.bookingId) {
          paymentMap.set(payment.bookingId, payment);
        } else {
          console.warn("Payment object missing bookingId:", payment);
        }
      });
 
      // 7. Hydrate bookings with hotel, flight, package, itinerary, and payment details
      fetchedBookings = fetchedBookings.map((booking) => {
        let hydratedBooking = { ...booking };
 
        // Handle Package and Itinerary types together
        if (
          hydratedBooking.type?.toLowerCase() === "package" ||
          hydratedBooking.type?.toLowerCase() === "itinerary"
        ) {
          // Standardize type to 'package' for display in BookingCard
          if (hydratedBooking.type?.toLowerCase() === "itinerary") {
            hydratedBooking.type = "package";
          }
 
          // Initialize package-related fields with default "N/A"
          hydratedBooking.packageName = "N/A";
          hydratedBooking.packageLocation = "N/A";
          hydratedBooking.itineraryCustomizationDetails = undefined; // Clear previous if any
          hydratedBooking.itineraryPrice = undefined; // Clear previous if any
 
          // First, try to get package details if packageId exists
          if (
            hydratedBooking.packageId &&
            packagesData[hydratedBooking.packageId]
          ) {
            const packageDetails = packagesData[hydratedBooking.packageId];
            hydratedBooking.packageName = packageDetails.packageName || "N/A";
            hydratedBooking.packageLocation = packageDetails.location || "N/A";
            hydratedBooking.includedHotelIds = packageDetails.includedHotelIds;
            hydratedBooking.includedFlightIds =
              packageDetails.includedFlightIds;
            hydratedBooking.activities = packageDetails.activities;
            hydratedBooking.displayPrice = packageDetails.price; // Base package price
            hydratedBooking.createdAt =
              packageDetails.createdAt || hydratedBooking.createdAt;
          } else if (
            hydratedBooking.type?.toLowerCase() === "package" &&
            !hydratedBooking.packageId
          ) {
            // If it's explicitly a "package" type but no packageId, provide generic names
            hydratedBooking.packageName = "Generic Package";
            hydratedBooking.packageLocation = "Unknown Location";
          }
 
          // Then, overlay itinerary details if itineraryId exists
          if (
            hydratedBooking.itineraryId &&
            itinerariesData[hydratedBooking.itineraryId]
          ) {
            const itineraryDetails =
              itinerariesData[hydratedBooking.itineraryId];
            hydratedBooking.itineraryCustomizationDetails =
              itineraryDetails.customizationDetails;
            hydratedBooking.itineraryPrice = itineraryDetails.price;
 
            // If itinerary has a price, it takes precedence over the base package price
            if (
              itineraryDetails.price !== undefined &&
              itineraryDetails.price !== null
            ) {
              hydratedBooking.displayPrice = itineraryDetails.price;
            }
 
            // If it's an itinerary, and no package name/location was set from a packageId,
            // try to get it from the itinerary details or set a default.
            if (
              itineraryDetails.packageName &&
              (hydratedBooking.packageName === "N/A" ||
                hydratedBooking.packageName === "Generic Package")
            ) {
              hydratedBooking.packageName = itineraryDetails.packageName;
            } else if (
              hydratedBooking.packageName === "N/A" ||
              hydratedBooking.packageName === "Generic Package"
            ) {
              hydratedBooking.packageName = "Custom Itinerary";
            }
 
            if (
              itineraryDetails.location &&
              (hydratedBooking.packageLocation === "N/A" ||
                hydratedBooking.packageLocation === "Unknown Location")
            ) {
              hydratedBooking.packageLocation = itineraryDetails.location;
            } else if (
              hydratedBooking.packageLocation === "N/A" ||
              hydratedBooking.packageLocation === "Unknown Location"
            ) {
              hydratedBooking.packageLocation = "Various Locations";
            }
          }
        }
        // Existing hotel and flight logic remains the same
        // Add hotel details
        if (
          hydratedBooking.type?.toLowerCase() === "hotel" &&
          hydratedBooking.hotelId &&
          hotelsData[hydratedBooking.hotelId]
        ) {
          const hotelDetails = hotelsData[hydratedBooking.hotelId];
          hydratedBooking = {
            ...hydratedBooking,
            hotelName: hotelDetails.name || hotelDetails.hotelName,
            location: hotelDetails.location,
            rating: hotelDetails.rating,
            displayPrice: hotelDetails.pricePerNight,
            createdAt: hotelDetails.createdAt || hydratedBooking.createdAt,
          };
        }
 
        // Add flight details
        if (
          hydratedBooking.type?.toLowerCase() === "flight" &&
          hydratedBooking.flightId &&
          flightsData[hydratedBooking.flightId]
        ) {
          const flightDetails = flightsData[hydratedBooking.flightId];
          hydratedBooking = {
            ...hydratedBooking,
            airline: flightDetails.airline,
            flightNumber:
              flightDetails.flightNumber || hydratedBooking.flightNumber,
            departureTime: flightDetails.departureTime,
            arrivalTime: flightDetails.arrivalTime,
            displayPrice: flightDetails.price,
            createdAt: flightDetails.createdAt || hydratedBooking.createdAt,
          };
        }
 
        // Add payment details (Applies to ALL booking types)
        if (
          hydratedBooking.bookingId && // Ensure the booking object has a bookingId
          paymentMap.has(hydratedBooking.bookingId)
        ) {
          hydratedBooking = {
            ...hydratedBooking,
            paymentDetails: paymentMap.get(hydratedBooking.bookingId),
          };
        }
        return hydratedBooking;
      });
 
      setBookings(fetchedBookings);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings. Please try again.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentUserId,
    token,
    filters.pageNo,
    filters.pageSize,
    filters.sortBy,
    filters.sortDir,
  ]);
 
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);
 
  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab, filters.status, filters.search]);
 
  const filterBookings = () => {
    let filtered = [...bookings];
 
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (booking) =>
          booking.type && booking.type.toLowerCase() === activeTab.toLowerCase()
      );
    }
 
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (booking) =>
          booking.status &&
          booking.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
 
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          (booking.hotelName &&
            booking.hotelName.toLowerCase().includes(searchTerm)) ||
          (booking.airline &&
            booking.airline.toLowerCase().includes(searchTerm)) ||
          (booking.flightNumber &&
            booking.flightNumber.toLowerCase().includes(searchTerm)) ||
          (booking.packageName && // Added for package search
            booking.packageName.toLowerCase().includes(searchTerm)) ||
          (booking.packageLocation && // Added for package search
            booking.packageLocation.toLowerCase().includes(searchTerm)) ||
          (booking.location &&
            booking.location.toLowerCase().includes(searchTerm))
      );
    }
 
    filtered.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
 
    setFilteredBookings(filtered);
  };
 
  const handleCancelBooking = (booking) => {
    setCancelModal({ isOpen: true, booking });
  };
 
  const confirmCancelBooking = async () => {
    const bookingToCancel = cancelModal.booking;
    if (!bookingToCancel || !token) {
      // Replaced alert with a custom message box or console error for better UX
      console.error("Error: Booking or authentication token missing.");
      setCancelModal({ isOpen: false, booking: null });
      return;
    }
 
    const bookingDate = new Date(bookingToCancel.bookingDate);
    const twelveHoursAfterBooking = new Date(
      bookingDate.getTime() + 12 * 60 * 60 * 1000
    );
    const now = new Date();
 
    if (now > twelveHoursAfterBooking) {
      // Replaced alert with a custom message box or console error for better UX
      console.warn("Cancellation is only allowed within 12 hours of booking.");
      setCancelModal({ isOpen: false, booking: null });
      return;
    }
 
    try {
      const response = await BookingService.cancelBooking(
        bookingToCancel.bookingId,
        token
      );
      await loadBookings();
 
      setCancelModal({ isOpen: false, booking: null });
      setRefundModal({ isOpen: true, booking: response.data });
      // Replaced alert with a custom message box or console log for better UX
      console.log("Booking cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
      // Replaced alert with a custom message box or console error for better UX
      console.error("Failed to cancel booking. Please try again.");
    }
  };
 
  const handleModifyBooking = (booking) => {
    // Replaced alert with a custom message box or console log for better UX
    console.log(
      "Modification feature coming soon! You can cancel and rebook for now."
    );
  };
 
  const getTabIcon = (tab) => {
    switch (tab) {
      case "hotel":
        return <Building className="w-5 h-5" />;
      case "flight":
        return <Plane className="w-5 h-5" />;
      case "package":
        return <Package className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };
 
  const getTabCount = (tab) => {
    if (tab === "all") return bookings.length;
    return bookings.filter(
      (booking) =>
        booking.type && booking.type.toLowerCase() === tab.toLowerCase()
    ).length;
  };
 
  const getStatusCounts = useCallback(() => {
    return {
      all: bookings.length,
      confirmed: bookings.filter(
        (b) => b.status && b.status.toLowerCase() === "confirmed"
      ).length,
      pending: bookings.filter(
        (b) => b.status && b.status.toLowerCase() === "pending"
      ).length,
      cancelled: bookings.filter(
        (b) => b.status && b.status.toLowerCase() === "cancelled"
      ).length,
    };
  }, [bookings]);
 
  const statusCounts = getStatusCounts();
 
  const tabs = [
    { id: "all", label: "All Bookings" },
    { id: "hotel", label: "Hotels" },
    { id: "flight", label: "Flights" },
    // { id: "package", label: "Packages" },
  ];
 
  const canCancelBooking = (bookingDateString) => {
    if (!bookingDateString) return false;
    const bookingDate = new Date(bookingDateString);
    const twelveHoursAfterBooking = new Date(
      bookingDate.getTime() + 12 * 60 * 60 * 1000
    );
    const now = new Date();
    return now <= twelveHoursAfterBooking;
  };
 
  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.all}
              </p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {statusCounts.confirmed}
              </p>
              <p className="text-sm text-gray-600">Confirmed</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {statusCounts.pending}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {statusCounts.cancelled}
              </p>
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
          </div>
        </div>
 
        {/* Tabs */}
        <div className="card p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {getTabIcon(tab.id)}
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {getTabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>
 
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
 
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
 
        {/* Loading and Error Indicators */}
        {loading && (
          <div className="text-center p-8">
            <p className="text-lg text-gray-600">Loading bookings...</p>
          </div>
        )}
 
        {error && (
          <div className="text-center p-8 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p>{error}</p>
          </div>
        )}
 
        {/* Bookings List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.bookingId} className="card p-6">
                  {" "}
                  {/* Use bookingId for key */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <BookingCard
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onModify={handleModifyBooking}
                      showActions={false}
                    />
 
                    
                  </div>
                  {/* Display cancellation note if applicable */}
                  {booking.status &&
                    booking.status.toLowerCase() !== "cancelled" &&
                    !canCancelBooking(booking.bookingDate) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Free cancellation is only
                          available within 12 hours of booking.
                        </p>
                      </div>
                    )}
                </div>
              ))
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {getTabIcon(activeTab)}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.status !== "all" || filters.search
                    ? "Try adjusting your filters"
                    : "Start planning your next trip!"}
                </p>
                {activeTab === "all" &&
                  !filters.search &&
                  filters.status === "all" && (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() =>
                          (window.location.href = "/traveler/hotels")
                        }
                        className="btn-primary"
                      >
                        Book Hotels
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = "/traveler/flights")
                        }
                        className="btn-secondary"
                      >
                        Book Flights
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
 
        {/* Cancel Confirmation Modal */}
        <ConfirmationModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, booking: null })}
          onConfirm={confirmCancelBooking}
          title="Cancel Booking"
          message={`Are you sure you want to cancel your booking? ${
            cancelModal.booking &&
            canCancelBooking(cancelModal.booking.bookingDate)
              ? "You will receive a full refund."
              : "Cancellation fees may apply."
          }`}
          confirmText="Cancel Booking"
          type="danger"
        />
 
        {/* Refund Message Modal */}
        <RefundMessage
          isOpen={refundModal.isOpen}
          booking={refundModal.booking}
          onClose={() => setRefundModal({ isOpen: false, booking: null })}
        />
      </div>
    </DashboardLayout>
  );
};
 
export default TravelerBookings;