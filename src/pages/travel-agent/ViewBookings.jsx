import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BookingStatsCard from '../../components/ui/BookingStatsCard'; // Assuming this component exists
import StatusBadge from '../../components/ui/StatusBadge'; // Assuming this component exists
import { Package, Users, Calendar, DollarSign, Search, Filter, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify'; // Import toast for notifications

// Import the services
import * as TravelPackageService from '../../services/PackageServiceSid'; // Changed to import all named exports
import BookingService from '../../services/BookingService'; // Adjust path as needed


const ViewBookings = () => {
  const { user, token } = useAuth(); // Get user and token from AuthContext
  const [packages, setPackages] = useState([]); // Stores all packages created by this agent
  const [bookings, setBookings] = useState([]); // Stores all bookings fetched from backend
  const [packageBookings, setPackageBookings] = useState([]); // Bookings specifically for agent's packages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    packageId: 'all', // Filter by package ID (or name, depending on how you map)
    status: 'all',    // Filter by booking status
    search: ''        // Search by booking ID or package name
  });

  // Pagination states for bookings
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt"); // Default sort by booking date
  const [sortDir, setSortDir] = useState("Desc");    // Default sort descending
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Function to load data from the backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // --- DEBUGGING LOGS ---
    console.log("loadData called. Current user:", user);
    console.log("Current token:", token);
    // --- END DEBUGGING LOGS ---

    if (!user || !token) {
      setLoading(false);
      setError("Authentication required to view bookings. Please log in.");
      toast.error("Authentication required to view bookings.");
      return;
    }

    try {
      // 1. Fetch all packages
      // CRUCIAL FIX: Pass pagination parameters to TravelPackageService.getAllPackages
      // Assuming TravelPackageService.getAllPackages expects (pageNo, pageSize, sortBy, sortDir, token)
      const packagesResponse = await TravelPackageService.getAllPackages(0, 100, 'packageId', 'Asc', token); // Fetch a reasonable number of packages
      const allPackages = packagesResponse.data.content || []; // Adjust based on actual response structure (assuming paginated)
      
      // Filter packages created by the current agent (assuming 'createdBy' field matches user.id)
      const agentPackages = allPackages.filter(pkg => pkg.createdBy === user.id);
      setPackages(agentPackages);

      // 2. Fetch all bookings (or bookings by user/agent if your API supports it efficiently)
      // For simplicity, fetching all bookings and then filtering client-side.
      // If your backend has an endpoint to get bookings for specific package IDs or by agent, use that for efficiency.
      const bookingsResponse = await BookingService.getAllBookings(pageNo, pageSize, sortBy, sortDir, token);
      console.log("Bookings response:", bookingsResponse.data.content); // Debugging log for bookings response
      const fetchedBookings = bookingsResponse.data.content || []; // Assuming paginated response
      setTotalPages(bookingsResponse.data.totalPages || 0);
      setTotalElements(bookingsResponse.data.totalElements || 0);

      // Map booking IDs to a consistent 'id' field if your backend uses 'bookingId'
      const mappedBookings = fetchedBookings.map(booking => ({
        ...booking,
        id: booking.id || booking.bookingId // Ensure 'id' is always present
      }));
      setBookings(mappedBookings);

      // 3. Filter bookings to only include those for the agent's packages
      const agentPackageNames = new Set(agentPackages.map(pkg => pkg.packageName)); // Assuming packages have 'packageName'
      const filteredByAgentPackages = mappedBookings.filter(booking => 
        booking.type === 'itinerary' && // Assuming a type for package bookings
        agentPackageNames.has(booking.packageName) // Match by package name
      );
      setPackageBookings(filteredByAgentPackages);

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load data: " + (err.response?.data?.message || err.message));
      setPackages([]);
      setBookings([]);
      setPackageBookings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [user, token, pageNo, pageSize, sortBy, sortDir]); // Dependencies for useCallback

  useEffect(() => {
    loadData();
  }, [loadData]); // Re-run when loadData function changes (due to its dependencies)

  // Client-side filtering based on user input for search, packageId, and status
  const filteredDisplayBookings = packageBookings.filter(booking => {
    const matchesPackage = filters.packageId === 'all' || booking.packageName === filters.packageId;
    const matchesStatus = filters.status === 'all' || booking.status === filters.status;
    const matchesSearch = !filters.search || 
      booking.packageName.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.id.toString().includes(filters.search.toLowerCase()) ||
      (booking.userId && booking.userId.toLowerCase().includes(filters.search.toLowerCase())); // Assuming userId might be searchable
    
    return matchesPackage && matchesStatus && matchesSearch;
  });

  // Calculate package statistics for display cards
  const getPackageStats = useCallback(() => {
    return packages.map(pkg => {
      const pkgBookings = packageBookings.filter(booking => booking.packageName === pkg.packageName);
      const revenue = pkgBookings
        .filter(booking => booking.status === 'CONFIRMED') // Assuming 'CONFIRMED' status
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0); // Use totalAmount from booking

      return {
        ...pkg,
        id: pkg.id || pkg.packageId, // Ensure consistent ID
        bookingCount: pkgBookings.length,
        revenue,
        confirmedBookings: pkgBookings.filter(b => b.status === 'CONFIRMED').length,
        pendingBookings: pkgBookings.filter(b => b.status === 'PENDING').length,
        cancelledBookings: pkgBookings.filter(b => b.status === 'CANCELLED').length
      };
    });
  }, [packages, packageBookings]);

  const packageStats = getPackageStats();
  const totalRevenue = packageBookings
    .filter(booking => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  // Pagination handlers
  const handlePreviousPage = () => {
    setPageNo((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPageNo((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <DashboardLayout title="Package Bookings">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Bookings</h1>
          <p className="text-gray-600">Monitor bookings for your travel packages</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalElements}</p> {/* Use totalElements from backend */}
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. per Package</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${packages.length > 0 ? Math.round(totalRevenue / packages.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="card p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings by package name, booking ID, or user ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <select
              value={filters.packageId}
              onChange={(e) => setFilters({ ...filters, packageId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
              disabled={loading}
            >
              <option value="all">All Packages</option>
              {packages.map(pkg => (
                <option key={pkg.id || pkg.packageId} value={pkg.packageName}>{pkg.packageName}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card overflow-hidden rounded-lg shadow-md">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
                <p>{error}</p>
              </div>
            ) : filteredDisplayBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  {filters.packageId !== 'all' || filters.status !== 'all' || filters.search
                    ? 'Try adjusting your filters'
                    : 'No bookings have been made for your packages yet'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Travelers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisplayBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{booking.id}</div>
                          <div className="text-sm text-gray-500">{booking.paymentMethod || 'N/A'}</div> {/* Default to N/A */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.packageName}</div>
                            {/* Assuming booking object has location from package */}
                            {booking.location && <div className="text-sm text-gray-500">{booking.location}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{booking.numberOfTravelers || 1}</span> {/* Default to 1 traveler */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${booking.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {/* Use totalAmount */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6 p-4 border-t border-gray-200">
              <button
                onClick={handlePreviousPage}
                disabled={pageNo === 0}
                className="btn-secondary p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-700">
                Page {pageNo + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pageNo === totalPages - 1}
                className="btn-secondary p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewBookings;

