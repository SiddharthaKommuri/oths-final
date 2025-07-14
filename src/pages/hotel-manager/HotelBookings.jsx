import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  Building,
  Users,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { hotelService } from "../../services/hotelService";
import BookingService from "../../services/BookingService";
// import PaymentService from "../../services/PaymentService"; // Removed PaymentService import
import { toast } from "react-toastify";
import { getUserById } from "../../services/UserService";

const HotelBookings = () => {
  const { token, user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  // const [userPayments, setUserPayments] = useState({}); // Removed userPayments state
  const [groupedBookings, setGroupedBookings] = useState([]);
  const [expandedHotels, setExpandedHotels] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerNames, setCustomerNames] = useState({});

  const [filters, setFilters] = useState({
    hotelId: "all",
    status: "all",
    search: "",
  });

  const [sortBy, setSortBy] = useState("hotelNameAsc");

  const loadData = useCallback(async () => {
    if (!token || !user?.userId) {
      setLoading(false);
      setError("Authentication required. Please log in.");
      return;
    }

    if (user.role !== "hotel_manager") {
      setLoading(false);
      setError("Access Denied: You must be a Hotel Manager to view this page.");
      setHotels([]);
      setBookings([]);
      // setUserPayments({}); // Removed setUserPayments
      setGroupedBookings([]);
      setCustomerNames({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedAllHotels = await hotelService.getAllHotels(token);
      const managerHotels = fetchedAllHotels
      // .filter(
      //   (hotel) => String(hotel.createdBy) === String(user.userId)
      // );
      setHotels(managerHotels);
      console.log("DEBUG: MANAGER HOTELS:", managerHotels);

      const allHotelTypeBookingsResponse =
        await BookingService.getBookingsByType(
          "HOTEL",
          0,
          1000,
          "createdAt",
          "desc",
          token
        );
      const allHotelTypeBookings =
        allHotelTypeBookingsResponse.data.content ||
        allHotelTypeBookingsResponse.data;

      const relevantBookings = (
        Array.isArray(allHotelTypeBookings) ? allHotelTypeBookings : []
      ).filter((booking) =>
        managerHotels.some((hotel) => hotel.hotelId === booking.hotelId)
      );
      console.log("DEBUG: RELEVANT BOOKINGS (before enrichment):", relevantBookings);

      const uniqueCustomerIds = [
        ...new Set(relevantBookings.map((booking) => booking.userId)),
      ];
      console.log("DEBUG: UNIQUE CUSTOMER IDs:", uniqueCustomerIds);

      const fetchedCustomerNames = {};
      // const paymentsByUser = {}; // Removed paymentsByUser

      await Promise.all(
        uniqueCustomerIds.map(async (userId) => {
          if (userId) {
            try {
              const customer = await getUserById(userId, token);
              fetchedCustomerNames[userId] =
                customer.fullName || `User ${userId}`;

             
            } catch (customerOrPaymentError) {
              console.warn(
                `DEBUG: Failed to fetch data for user ${userId}:`,
                customerOrPaymentError
              );
              fetchedCustomerNames[userId] = `User ${userId}`;
              // paymentsByUser[userId] = []; // Removed
            }
          }
        })
      );
      setCustomerNames(fetchedCustomerNames);
    

      const enrichedBookingsPromises = relevantBookings.map(async (booking) => {
        const foundHotel = managerHotels.find(
          (h) => h.hotelId === booking.hotelId
        );

       

        return {
          ...booking,
          hotelName: foundHotel?.name || "Unknown Hotel",
          location: foundHotel?.location || "N/A",
          hotelDetails: foundHotel,
          // Default values for payment fields since logic is removed
          paymentStatus: "N/A",
          paymentAmount: "0.00",
          paymentMethod: "N/A",
          paymentDate: null,
          paymentDetails: null, // Ensure this is null as no payment object will be found
        };
      });

      const enrichedAndFilteredBookings = await Promise.all(
        enrichedBookingsPromises
      );
      setBookings(enrichedAndFilteredBookings);
      console.log("DEBUG: FINAL ENRICHED BOOKINGS SET TO STATE:", enrichedAndFilteredBookings);

    } catch (err) {
      console.error("loadData: Failed to load data:", err);
      setError("Failed to load hotel and booking data. Please try again.");
      toast.error(
        "Failed to load data: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterAndGroupBookings = useCallback(() => {
    let filteredBookings = [...bookings];

    if (filters.hotelId !== "all") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.hotelId === parseInt(filters.hotelId, 10)
      );
    }

    if (filters.status !== "all") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status?.toLowerCase() === filters.status
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredBookings = filteredBookings.filter(
        (booking) =>
          String(booking.bookingId).includes(searchTerm) ||
          booking.hotelName?.toLowerCase().includes(searchTerm) ||
          booking.location?.toLowerCase().includes(searchTerm) ||
          customerNames[booking.userId]?.toLowerCase().includes(searchTerm) ||
          booking.paymentStatus?.toLowerCase().includes(searchTerm) ||
          String(booking.paymentAmount).includes(searchTerm) ||
          booking.paymentMethod?.toLowerCase().includes(searchTerm)
      );
    }

    let grouped = hotels
      .map((hotel) => {
        const hotelBookings = filteredBookings.filter(
          (booking) => booking.hotelId === hotel.hotelId
        );

        return {
          hotel,
          bookings: hotelBookings.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          ),
          totalBookings: hotelBookings.length,
          confirmedBookings: hotelBookings.filter(
            (b) => b.status?.toLowerCase() === "confirmed"
          ).length,
          pendingBookings: hotelBookings.filter(
            (b) => b.status?.toLowerCase() === "pending"
          ).length,
          cancelledBookings: hotelBookings.filter(
            (b) => b.status?.toLowerCase() === "cancelled"
          ).length,
        };
      })
      .filter(
        (group) => group.bookings.length > 0 || filters.hotelId === "all"
      );

    if (sortBy === "hotelNameAsc") {
      grouped.sort((a, b) => a.hotel.name.localeCompare(b.hotel.name));
    } else if (sortBy === "hotelNameDesc") {
      grouped.sort((a, b) => b.hotel.name.localeCompare(a.hotel.name));
    }

    setGroupedBookings(grouped);
    console.log("DEBUG: FINAL GROUPED BOOKINGS FOR DISPLAY:", groupedBookings);
  }, [bookings, hotels, filters, customerNames, sortBy]);

  useEffect(() => {
    filterAndGroupBookings();
  }, [filterAndGroupBookings]);

  const toggleHotelExpansion = (hotelId) => {
    const newExpanded = new Set(expandedHotels);
    newExpanded.has(hotelId)
      ? newExpanded.delete(hotelId)
      : newExpanded.add(hotelId);
    setExpandedHotels(newExpanded);
  };

  const totalBookings = groupedBookings.reduce(
    (sum, group) => sum + group.totalBookings,
    0
  );
  const totalConfirmed = groupedBookings.reduce(
    (sum, group) => sum + group.confirmedBookings,
    0
  );

  return (
    <DashboardLayout title="Hotel Bookings Overview">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hotel Bookings Overview
          </h1>
          <p className="text-gray-600">View all bookings grouped by hotel</p>
        </div>

        {/* --- Dashboard Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Hotels
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
                <p className="2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Confirmed Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalConfirmed}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* --- Filters and Sort Section --- */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings or hotels..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <select
              value={filters.hotelId}
              onChange={(e) =>
                setFilters({ ...filters, hotelId: e.target.value })
              }
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
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* New Sort By dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="hotelNameAsc">Hotel Name (A-Z)</option>
              <option value="hotelNameDesc">Hotel Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* --- Loading, Error, and No Bookings States --- */}
        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading bookings data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && groupedBookings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">
              {filters.hotelId !== "all" ||
              filters.status !== "all" ||
              filters.search
                ? "Try adjusting your filters"
                : "No bookings have been made for your hotels yet"}
            </p>
          </div>
        )}

        {/* --- Grouped Bookings Display --- */}
        {!loading && !error && groupedBookings.length > 0 && (
          <div className="space-y-4">
            {groupedBookings.map((group) => (
              <div
                key={group.hotel.hotelId}
                className="bg-white shadow-md rounded-xl overflow-hidden"
              >
                {/* Hotel Header (expandable) */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => toggleHotelExpansion(group.hotel.hotelId)}
                >
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <span>{group.hotel.name}</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({group.totalBookings} bookings)
                    </span>
                  </h2>
                  {expandedHotels.has(group.hotel.hotelId) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                {/* Bookings Table (shown when expanded) */}
                {expandedHotels.has(group.hotel.hotelId) && (
                  <div className="p-4 border-t border-gray-200">
                    {group.bookings.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">
                        No bookings match the current filters for this hotel.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Booking ID
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Customer
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Guests
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Booking Status
                              </th>
                            
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Hotel Manager ID
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.bookings.map((booking) => (
                              <tr key={booking.bookingId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {booking.bookingId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {customerNames[booking.userId] ||
                                    "Loading..."}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {booking.numberOfGuests || "1"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <StatusBadge status={booking.status} />
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {booking.hotelDetails?.createdBy || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HotelBookings;