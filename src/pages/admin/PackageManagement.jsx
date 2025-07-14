import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { Package, Search, Filter, MapPin, DollarSign, User, Calendar, IndianRupee, Plus } from 'lucide-react';
import { getAllPackages, getTotalPackages, createPackage } from '../../services/PackageServiceSid'; // Import package services
import { getAllItineraries } from '../../services/ItineraryServiceSid'; // Import itinerary service to count package bookings
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth to get user info and token


const PackageManagement = () => {
  const { user, token, isAuthenticated } = useAuth(); // Get user and token from AuthContext

  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    location: 'all',
    status: 'all',
    createdBy: 'all' // This will now be agent ID (Long) from backend
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for package booking counts
  const [packageBookingCounts, setPackageBookingCounts] = useState({}); // packageId -> count map

  // State for Create Package Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackageData, setNewPackageData] = useState({
    packageName: '',
    location: '',
    price: '',
    includedHotelIds: '', // Input as string, convert to array
    includedFlightIds: '', // Input as string, convert to array
    activities: '', // Input as string, convert to array
    status: 'Active' // Default status for new packages
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // Effect to fetch packages from backend
  useEffect(() => {
    const fetchPackages = async () => {
      console.log("fetchPackages: Starting...");
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false); // Stop loading if no token
        console.log("fetchPackages: Exiting early, no token. Loading set to false.");
        return;
      }

      setLoading(true); // Start loading
      console.log("fetchPackages: Loading set to true."); // Log when loading starts
      setError(null);
      try {
        console.log("fetchPackages: Calling getAllPackages...");
        // Fetch all packages for now; pagination can be added later if needed
        const response = await getAllPackages(token, { pageNo: 0, pageSize: 1000 }); // Fetch a large page
        setPackages(response.content || []); // Assuming response.content holds the list
        console.log("fetchPackages: Packages fetched successfully.");
      } catch (err) {
        if (err.message && err.message.includes('Unauthorized')) {
          setError('Session expired or unauthorized. Please log in again.');
          localStorage.removeItem('travora_auth_token');
          localStorage.removeItem('travora_user_data');
          // Optionally, redirect to login page here
        } else {
          setError(err.message || 'Failed to load packages.');
        }
        console.error("fetchPackages: Failed to fetch packages:", err);
      } finally {
        setLoading(false); // Stop loading regardless of success or failure
        console.log("fetchPackages: Loading set to false in finally block."); // Log when loading ends
      }
    };

    fetchPackages();
  }, [token]); // Re-fetch when token changes

  // Effect to fetch and calculate booking counts for packages
  useEffect(() => {
    const fetchPackageBookingCounts = async () => {
      console.log("fetchPackageBookingCounts: Starting...");
      if (!token || packages.length === 0) {
        // Only fetch if token is available and packages data has been loaded
        console.log("fetchPackageBookingCounts: Skipping due to missing token or no packages.");
        return;
      }

      try {
        console.log("fetchPackageBookingCounts: Calling getAllItineraries...");
        // Fetch all itineraries. For a large dataset, this needs pagination handling.
        const itineraryResponse = await getAllItineraries(token, { pageNo: 0, pageSize: 1000 });
        const allItineraries = itineraryResponse.content || [];

        console.log("Fetched Itineraries for Booking Counts:", allItineraries);

        const counts = {};
        allItineraries.forEach(itinerary => {
          // FIX: Use itinerary.travelPackageId as provided by the backend
          if (itinerary.travelPackageId) {
            counts[itinerary.travelPackageId] = (counts[itinerary.travelPackageId] || 0) + 1;
          }
        });
        setPackageBookingCounts(counts);
        console.log("fetchPackageBookingCounts: Successfully updated packageBookingCounts:", counts);
      } catch (err) {
        console.error("fetchPackageBookingCounts: Failed to fetch itinerary counts for packages:", err);
        // This error might not block package display, so just log
      }
    };

    fetchPackageBookingCounts();
  }, [token, packages]); // Re-run when token or packages data changes

  // Effect to filter packages locally
  useEffect(() => {
    filterPackages();
  }, [packages, filters]);

  const filterPackages = () => {
    let currentFiltered = [...packages];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(pkg =>
        (pkg.packageName && pkg.packageName.toLowerCase().includes(searchTerm)) ||
        (pkg.location && pkg.location.toLowerCase().includes(searchTerm)) || // Added null check
        (pkg.activities && pkg.activities.some(activity => activity.toLowerCase().includes(searchTerm)))
      );
    }

    if (filters.location !== 'all') {
      currentFiltered = currentFiltered.filter(pkg =>
        pkg.location && pkg.location.toLowerCase() === filters.location.toLowerCase() // Added null check
      );
    }

    if (filters.status !== 'all') {
      currentFiltered = currentFiltered.filter(pkg =>
        pkg.status && pkg.status.toLowerCase() === filters.status.toLowerCase() // Added null check
      );
    }

    if (filters.createdBy !== 'all') {
      // createdBy is a String in DTO, which maps to Long createdByAgentId in entity.
      // Assuming 'createdBy' in DTO is the string representation of agent ID.
      currentFiltered = currentFiltered.filter(pkg => pkg.createdBy === filters.createdBy);
    }

    // Sort by packageId (assuming it's a good default for creation order if no createdAt in DTO)
    currentFiltered.sort((a, b) => a.packageId - b.packageId);

    setFilteredPackages(currentFiltered);
  };

  // Updated getBookingCount to use the state-managed counts
  const getBookingCount = (packageId) => {
    return packageBookingCounts[packageId] || 0; // Return count from state, default to 0 if not found
  };

  const getAgentEmail = (agentId) => {
    // In a real application, you would fetch agent details (e.g., email) from a user service
    // based on the agentId. For now, this remains a mock.
    // Assuming agentId from backend is a String.
    const agents = {
      '1': 'agent1@example.com', // Example mapping
      '2': 'agent2@example.com',
      'system': 'System Agent', // Added mapping for 'system'
      // Add more agent mappings as needed
    };
    return agents[agentId] || `Agent ${agentId}`;
  };

  // Extract unique locations and creators from fetched packages for filter dropdowns
  const locations = [...new Set(packages.map(pkg => pkg.location).filter(Boolean))].sort();
  const creators = [...new Set(packages.map(pkg => pkg.createdBy).filter(Boolean))].sort();

  const getStatsCounts = () => {
    const totalBookings = Object.values(packageBookingCounts).reduce((sum, count) => sum + count, 0);
    // Total revenue is complex. For now, sum (package price * booking count) as an approximation.
    // A more accurate way would involve fetching booking details and summing finalPrice from itineraries.
    const totalRevenue = packages.reduce((sum, pkg) => {
      const bookingsForPackage = packageBookingCounts[pkg.packageId] || 0;
      return sum + (pkg.price * bookingsForPackage);
    }, 0);

    return {
      total: packages.length,
      active: packages.filter(p => p.status && p.status.toLowerCase() === 'active').length,
      inactive: packages.filter(p => p.status && p.status.toLowerCase() === 'inactive').length,
      totalBookings,
      totalRevenue
    };
  };

  const stats = getStatsCounts();

  // --- Create Package Modal Logic ---
  const handleOpenCreateModal = () => {
    if (!isAuthenticated || user.role !== 'travel_agent') { // Only allow travel agents to create
      setError('Only Travel Agents can create packages.');
      return;
    }
    setShowCreateModal(true);
    setNewPackageData({
      packageName: '',
      location: '',
      price: '',
      includedHotelIds: '', // Input as string, convert to array
      includedFlightIds: '', // Input as string, convert to array
      activities: '', // Input as string, convert to array
      status: 'Active' // Default status for new packages
    });
    setCreateError(null);
    setCreateSuccess(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateLoading(false);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const handleNewPackageChange = (e) => {
    const { name, value } = e.target;
    setNewPackageData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      // Prepare DTO for backend
      const packageDto = {
        packageName: newPackageData.packageName,
        location: newPackageData.location,
        price: parseFloat(newPackageData.price), // Convert price to number
        // Split comma-separated strings into arrays of Longs/Strings
        includedHotelIds: newPackageData.includedHotelIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)),
        includedFlightIds: newPackageData.includedFlightIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)),
        activities: newPackageData.activities.split(',').map(activity => activity.trim()).filter(Boolean),
        createdBy: user.userId ? String(user.userId) : 'system', // Use logged-in user's ID
        status: newPackageData.status,
      };

      const createdPkg = await createPackage(packageDto, token);
      setCreateSuccess(`Package "${createdPkg.packageName}" created successfully! ID: ${createdPkg.packageId}`);
      // Refresh the list of packages after creation
      const response = await getAllPackages(token, { pageNo: 0, pageSize: 1000 });
      setPackages(response.content || []);
      setFilteredPackages(response.content || []); // Also update filtered list immediately
      setNewPackageData({ // Reset form
        packageName: '',
        location: '',
        price: '',
        includedHotelIds: '',
        includedFlightIds: '',
        activities: '',
        status: 'Active'
      });
    } catch (err) {
      setCreateError(err.message || 'Failed to create package.');
      console.error("Create package error:", err);
    } finally {
      setCreateLoading(false);
    }
  };


  return (
    <DashboardLayout title="Package Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
            <p className="text-gray-600">Manage all travel packages created by agents</p>
          </div>
          {isAuthenticated && user.role === 'travel_agent' && ( // Only show for travel agents
            <button onClick={handleOpenCreateModal} className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Package</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          
          
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-orange-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages by name, location, or activities..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

           

            
          </div>
        </div>

        {/* Packages Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg text-gray-600">Loading packages...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-red-600">
                      <p className="text-lg font-medium">Error: {error}</p>
                      <p className="text-gray-600">Please try again later.</p>
                    </td>
                  </tr>
                ) : filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.packageId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pkg.packageName}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              Activities: {pkg.activities && pkg.activities.length > 0 ? pkg.activities.join(', ') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{getAgentEmail(pkg.createdBy)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{pkg.location || 'N/A'}</span> {/* Display N/A if null */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{pkg.price}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getBookingCount(pkg.packageId)} bookings
                        </span>
                      </td>
                     
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                      <p className="text-gray-600">
                        {filters.search || filters.location !== 'all' || filters.status !== 'all' || filters.createdBy !== 'all'
                          ? 'Try adjusting your filters'
                          : 'No travel packages have been created yet'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Travel Package</h2>
              <button onClick={handleCloseCreateModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreatePackageSubmit} className="space-y-4">
              <div>
                <label htmlFor="packageName" className="block text-sm font-medium text-gray-700">Package Name</label>
                <input
                  type="text"
                  id="packageName"
                  name="packageName"
                  value={newPackageData.packageName}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newPackageData.location}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (per person)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={newPackageData.price}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="includedHotelIds" className="block text-sm font-medium text-gray-700">Included Hotel IDs (comma-separated)</label>
                <input
                  type="text"
                  id="includedHotelIds"
                  name="includedHotelIds"
                  value={newPackageData.includedHotelIds}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 1,2,3"
                  required
                />
              </div>
              <div>
                <label htmlFor="includedFlightIds" className="block text-sm font-medium text-gray-700">Included Flight IDs (comma-separated)</label>
                <input
                  type="text"
                  id="includedFlightIds"
                  name="includedFlightIds"
                  value={newPackageData.includedFlightIds}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 101,102"
                  required
                />
              </div>
              <div>
                <label htmlFor="activities" className="block text-sm font-medium text-gray-700">Activities (comma-separated)</label>
                <input
                  type="text"
                  id="activities"
                  name="activities"
                  value={newPackageData.activities}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Sightseeing,Hiking"
                  required
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  name="status"
                  value={newPackageData.status}
                  onChange={handleNewPackageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {createLoading && (
                <div className="flex items-center justify-center py-2">
                  <div className="w-6 h-6 border-4 border-t-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                  <p className="text-blue-600">Creating package...</p>
                </div>
              )}

              {createError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center" role="alert">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{createSuccess}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-md"
                  disabled={createLoading}
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PackageManagement; 
