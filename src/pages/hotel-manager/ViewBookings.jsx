import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  Building,
  Users,
  Calendar,
  DollarSign,
  Search,
  Loader2,
  CreditCard,
} from "lucide-react";
import hotelService from "../../services/hotelService"; // Renamed from * as HotelService to default import
import BookingService from "../../services/BookingService";
import PaymentService from "../../services/PaymentService";
import { toast } from "react-toastify";
 
const ViewBookings = () => {
  const { token, user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]); // This will store enriched bookings
  const [payments, setPayments] = useState([]); // Raw payments data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [filters, setFilters] = useState({
    hotelId: "all",
    status: "all", // Booking status
    search: "",
    paymentStatus: "all",
    paymentMethod: "all",
  });
 
  const AVAILABLE_BOOKING_STATUSES = useMemo(() => ['confirmed', 'pending', 'cancelled'], []);
  const AVAILABLE_PAYMENT_STATUSES = useMemo(() => ['completed', 'pending', 'failed', 'refunded'], []); // **Confirm these match your backend payment statuses exactly**
 
  const loadData = useCallback(async () => {
    console.log("loadData: Starting data fetch...");
    if (!token || !user?.userId) {
      setLoading(false);
      setError("Authentication required. Please log in.");
      console.log("loadData: Authentication missing.");
      return;
    }
 
    // Role check: Ensure only hotel managers can access this page
    if (user.role !== 'hotel_manager') {
      setLoading(false);
      setError("Access Denied: You must be a Hotel Manager to view this page.");
      setHotels([]);
      setBookings([]);
      setPayments([]);
      console.log("loadData: Access denied for user role:", user.role);
      return;
    }
 
    setLoading(true);
    setError(null);
 
    try {
      console.log("loadData: Fetching hotels, bookings, and payments concurrently...");
      const [fetchedAllHotels, allHotelTypeBookingsResponse, allPaymentsResponse] = await Promise.all([
        hotelService.getAllHotels(token), // Ensure this returns an array of hotels
        BookingService.getBookingsByType(
          "HOTEL", // Assuming this is the correct type for hotel bookings
          0,
          1000, // Fetch a large page size to get all relevant bookings for client-side filtering
          "bookingId",
          "desc",
          token
        ),
        PaymentService.getAllPayments(token) // Ensure this returns an object with a 'payments' array or direct array
      ]);
 
      console.log("loadData: Fetched Hotels (raw):", fetchedAllHotels);
      console.log("loadData: Fetched Bookings Raw Response:", allHotelTypeBookingsResponse);
      console.log("loadData: Fetched Payments Raw Response:", allPaymentsResponse);
 
      // Filter hotels to only include those created by the current user (hotel manager)
      // Assuming hotel DTO has 'createdBy' field which matches user.userId
      const managerHotels = fetchedAllHotels.filter(
        (hotel) => hotel.createdBy === String(user.userId) // Ensure type consistency (user.userId might be number, createdBy string)
      );
      setHotels(managerHotels);
      console.log("loadData: Manager's Hotels (filtered):", managerHotels);
 
      // Extract bookings content
      const allHotelTypeBookings = allHotelTypeBookingsResponse.data?.content || []; // Access .data.content for Axios
      console.log("loadData: Processed All Hotel Type Bookings:", allHotelTypeBookings);
 
      // Extract payments content
      let fetchedPayments = [];
      if (allPaymentsResponse.data && Array.isArray(allPaymentsResponse.data.content)) {
        fetchedPayments = allPaymentsResponse.data.content;
        console.log("loadData: Payments found in .data.content.");
      } else if (allPaymentsResponse.data && Array.isArray(allPaymentsResponse.data.payments)) { // Check for 'payments' array directly
        fetchedPayments = allPaymentsResponse.data.payments;
        console.log("loadData: Payments found in .data.payments.");
      } else if (Array.isArray(allPaymentsResponse.data)) { // Direct array from backend
        fetchedPayments = allPaymentsResponse.data;
        console.log("loadData: Payments found directly in .data.");
      } else {
        console.warn("loadData: Unexpected payment API response structure. Payments not found in expected paths.", allPaymentsResponse);
        toast.warn("Could not load payment data. Check console for details.");
      }
      setPayments(fetchedPayments);
      console.log("loadData: Processed Fetched Payments:", fetchedPayments);
 
      // Create a map for quick payment lookup by bookingId
      const paymentMap = new Map();
      fetchedPayments.forEach(payment => {
        // Ensure bookingId is present and consistent in type for map key
        if (payment.bookingId !== undefined && payment.bookingId !== null) {
          // Convert bookingId to string if it's a number and you expect string keys, or vice-versa
          paymentMap.set(String(payment.bookingId), payment);
        } else {
          console.warn("Payment object missing bookingId, skipping:", payment);
        }
      });
      console.log("loadData: Payment Map created with size:", paymentMap.size);
 
      // Enrich bookings with hotel names/locations and payment details
      const enrichedBookings = allHotelTypeBookings.map((booking) => {
        const foundHotel = managerHotels.find((h) => h.hotelId === booking.hotelId);
        // Ensure booking.bookingId is used as a string for lookup if paymentMap keys are strings
        const associatedPayment = paymentMap.get(String(booking.bookingId));
 
        return {
          ...booking,
          hotelName: foundHotel ? foundHotel.name : "Unknown Hotel",
          location: foundHotel ? foundHotel.location : "N/A",
          // Ensure status is lowercase for consistency with filters
          status: booking.status ? String(booking.status).toLowerCase() : 'unknown',
          // Payment details - ensure correct property names from your backend Payment DTO
          paymentId: associatedPayment?.paymentId || null,
          paymentAmount: associatedPayment?.amount || null, // Assuming 'amount' for payment amount
          paymentStatus: associatedPayment?.status ? String(associatedPayment.status).toLowerCase() : 'N/A',
          paymentMethod: associatedPayment?.paymentMethod || 'N/A',
          paymentDate: associatedPayment?.paymentDate || null, // Assuming 'paymentDate'
          // For booking date, use 'createdAt' or 'bookingDate' from the booking object
          // Ensure it's a valid date string for new Date()
          displayBookingDate: booking.createdAt || booking.bookingDate || null, // Use createdAt or bookingDate
        };
      });
 
      setBookings(enrichedBookings);
      console.log("loadData: Enriched Bookings set. Total:", enrichedBookings.length);
 
    } catch (err) {
      console.error("loadData: Failed to load data:", err);
      setError("Failed to load hotel, booking, and payment data. Please try again.");
      toast.error(
        "Failed to load data: " + (err.response?.data?.message || err.message || "Unknown error")
      );
      setHotels([]);
      setBookings([]);
      setPayments([]);
    } finally {
      setLoading(false);
      console.log("loadData: Data fetch complete.");
    }
  }, [token, user]); // Dependencies ensure loadData re-runs if user or token changes
 
  useEffect(() => {
    loadData();
  }, [loadData]); // Effect depends on the memoized loadData function
 
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} to ${value}`);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  }, []);
 
  const filteredBookings = useMemo(() => {
    console.log("filteredBookings: Re-calculating. Current filters:", filters);
    console.log("filteredBookings: Total bookings available:", bookings.length);
 
    return bookings
      .filter((booking) => {
        // Filter by hotelId (ensure type consistency for comparison)
        const matchesHotel =
          filters.hotelId === "all" ||
          String(booking.hotelId) === String(filters.hotelId); // Convert both to string for safe comparison
 
        // Filter by booking status (ensure lowercase comparison)
        const bookingStatusLower = booking.status ? String(booking.status).toLowerCase() : '';
        const matchesBookingStatus =
          filters.status === "all" || bookingStatusLower === filters.status;
 
        // Filter by payment status (ensure lowercase comparison)
        const paymentStatusLower = booking.paymentStatus ? String(booking.paymentStatus).toLowerCase() : '';
        const matchesPaymentStatus =
          filters.paymentStatus === "all" || paymentStatusLower === filters.paymentStatus;
 
        // Filter by payment method (ensure lowercase comparison)
        const paymentMethodLower = booking.paymentMethod ? String(booking.paymentMethod).toLowerCase() : '';
        const matchesPaymentMethod =
          filters.paymentMethod === "all" || paymentMethodLower === filters.paymentMethod;
 
        // Search filter (case-insensitive, checks multiple fields)
        const matchesSearch =
          !filters.search ||
          booking.hotelName
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          String(booking.bookingId).includes(filters.search.toLowerCase()) ||
          booking.customerName // Assuming customerName exists on booking
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          String(booking.paymentId || '').includes(filters.search.toLowerCase());
 
        return matchesHotel && matchesBookingStatus && matchesPaymentStatus && matchesPaymentMethod && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by booking creation date (newest first)
        const dateA = new Date(a.createdAt || a.bookingDate);
        const dateB = new Date(b.createdAt || b.bookingDate);
        return dateB.getTime() - dateA.getTime();
      });
  }, [bookings, filters]);
 
  const totalRevenue = useMemo(() => {
    console.log("totalRevenue: Re-calculating.");
    return filteredBookings // Use filteredBookings for revenue calculation
      .filter((booking) => booking.status === "confirmed" && booking.paymentStatus === "completed")
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0); // Use totalPrice from booking
  }, [filteredBookings]);
 
  const uniquePaymentMethods = useMemo(() => {
    console.log("uniquePaymentMethods: Re-calculating.");
    const methods = new Set();
    // Use the 'payments' state which holds raw payment data
    payments.forEach(p => {
      if (p.paymentMethod) methods.add(p.paymentMethod.toLowerCase());
    });
    const sortedMethods = Array.from(methods).sort();
    console.log("Unique Payment Methods found:", sortedMethods);
    return ['all', ...sortedMethods];
  }, [payments]);
 
 
  return (
    <DashboardLayout title="Hotel Bookings">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Bookings</h1>
          <p className="text-gray-600">Monitor bookings and their payment statuses for your hotels</p>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Hotels Managed
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {hotels.length}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredBookings.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue (Completed Payments)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
        {/* Filters Section */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex flex-col md:flex-row flex-wrap gap-4">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings/payments (hotel, ID, customer, payment ID)..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
 
            <select
              name="hotelId"
              value={filters.hotelId}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Hotels</option>
              {hotels.map((hotel) => (
                <option key={hotel.hotelId} value={hotel.hotelId}>
                  {hotel.name}
                </option>
              ))}
            </select>
 
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Booking Statuses</option>
              {AVAILABLE_BOOKING_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </option>
              ))}
            </select>
 
            {/* Payment Status Filter */}
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Payment Statuses</option>
              {AVAILABLE_PAYMENT_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </option>
              ))}
            </select>
 
            {/* Payment Method Filter */}
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Payment Methods</option>
              {/* Only render actual payment methods if they exist */}
              {uniquePaymentMethods.filter(method => method !== 'all').map((method) => (
                <option key={method} value={method}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading bookings and payment data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        {/* Bookings Table */}
        {!loading && !error && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Amount
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center py-6 text-gray-500"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No bookings found
                        </h3>
                        <p className="text-gray-600">
                          {filters.hotelId !== "all" ||
                            filters.status !== "all" ||
                            filters.paymentStatus !== "all" ||
                            filters.paymentMethod !== "all" ||
                            filters.search
                            ? "Try adjusting your filters"
                            : "No bookings have been made for your hotels yet"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{booking.bookingId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.hotelName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {booking.numberOfGuests || "1"}
                            </span>
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{booking.totalPrice?.toFixed(2) || "0.00"}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <StatusBadge status={booking.status} />
                        </td>
                        {/* New Payment Columns */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.paymentId ? `#${booking.paymentId}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.paymentAmount !== null ? `₹${booking.paymentAmount?.toFixed(2)}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {booking.paymentStatus !== 'N/A' ? (
                            <StatusBadge status={booking.status} />
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            {booking.paymentMethod && booking.paymentMethod !== 'N/A' && <CreditCard className="w-4 h-4 text-gray-400 mr-1" />}
                            {booking.paymentMethod && booking.paymentMethod !== 'N/A'
                              ? booking.paymentMethod.charAt(0).toUpperCase() + booking.paymentMethod.slice(1)
                              : 'N/A'}
                          </div>
                        </td>
                        {/* End New Payment Columns */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.displayBookingDate ? new Date(booking.createdAt).toLocaleDateString() : 'Invalid Date'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
 
export default ViewBookings;