import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Search, Filter, Loader2, Package, List, DollarSign, User, ChevronUp, ChevronDown } from "lucide-react"; // Added ChevronUp, ChevronDown for sorting icons
import * as PackageService from "../../services/PackageServiceSid";
import * as ItineraryService from "../../services/ItineraryServiceSid";
import { toast } from "react-toastify";

const TravelPackageItinerary = () => {
  const { token, user, loading: authLoading } = useAuth();

  const [packages, setPackages] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [filteredCombinedData, setFilteredCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    packageName: "all",
    userId: "",
    // Removed minItineraryPrice and maxItineraryPrice filters
  });

  // State for sorting
  const [sortColumn, setSortColumn] = useState("itineraryId"); // Default sort column
  const [sortDirection, setSortDirection] = useState("asc"); // Default sort direction

  // Pagination for fetching all data (large page size for client-side filtering)
  const defaultPageSize = 1000; // Fetch a large number to enable client-side filtering
  const defaultSortBy = "createdAt"; // This is for API call, client-side sort will override
  const defaultSortDir = "desc"; // This is for API call, client-side sort will override

  /**
   * Fetches all packages and itineraries, then combines them.
   */
  const loadData = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!token || !user?.userId) {
      setLoading(false);
      setPackages([]);
      setItineraries([]);
      setCombinedData([]);
      setFilteredCombinedData([]);
      setError("Authentication required to view travel packages and itineraries.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [packagesResponse, itinerariesResponse] = await Promise.all([
        PackageService.getAllPackages(token, { pageNo: 0, pageSize: defaultPageSize, sortBy: defaultSortBy, sortDir: defaultSortDir }),
        ItineraryService.getAllItineraries(token, { pageNo: 0, pageSize: defaultPageSize, sortBy: defaultSortBy, sortDir: defaultSortDir }),
      ]);
      console.log("Fetched Packages:", packagesResponse.content);
      const fetchedPackages = packagesResponse.content || [];
      const fetchedItineraries = itinerariesResponse.content || [];

      setPackages(fetchedPackages);
      setItineraries(fetchedItineraries);

      // Combine data: For each itinerary, find its corresponding package
      const combined = fetchedItineraries.map(itinerary => {
        const correspondingPackage = fetchedPackages.find(
          pkg => pkg.packageId === itinerary.travelPackageId
        );
        return {
          ...itinerary,
          packageName: correspondingPackage?.packageName || "N/A",
          packageLocation: correspondingPackage?.location || "N/A",
          packageBasePrice: correspondingPackage?.price || 0,
        };
      });

      setCombinedData(combined);

    } catch (err) {
      console.error("Failed to load data:", err);
      const errorMessage = err.message || "Failed to load travel package and itinerary data. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setPackages([]);
      setItineraries([]);
      setCombinedData([]);
      setFilteredCombinedData([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.userId, authLoading]);

  // Load data initially and whenever dependencies of loadData change
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Handles sorting when a table header is clicked.
   * @param {string} column The column to sort by.
   */
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc"); // Default to ascending when changing sort column
    }
  };

  /**
   * Filters and sorts the combined data based on current filter and sort settings.
   */
  const filterAndSortCombinedData = useCallback(() => {
    let currentFiltered = [...combinedData];

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(item =>
        (item.packageName && item.packageName.toLowerCase().includes(searchTerm)) ||
        (item.packageLocation && item.packageLocation.toLowerCase().includes(searchTerm)) ||
        (item.customizationDetails && item.customizationDetails.toLowerCase().includes(searchTerm)) ||
        (item.userId?.toString().includes(searchTerm)) ||
        (item.itineraryId?.toString().includes(searchTerm))
      );
    }

    if (filters.packageName !== "all") {
      currentFiltered = currentFiltered.filter(item => item.packageName === filters.packageName);
    }

    if (filters.userId) {
      currentFiltered = currentFiltered.filter(item => item.userId?.toString() === filters.userId);
    }

    // Removed price filters logic here

    // Apply sorting
    currentFiltered.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values for sorting
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      // For numbers or other comparable types
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredCombinedData(currentFiltered);
  }, [combinedData, filters, sortColumn, sortDirection]); // Added sortColumn, sortDirection to dependencies

  // Re-filter and sort whenever combinedData, filters, or sort settings change
  useEffect(() => {
    filterAndSortCombinedData();
  }, [filterAndSortCombinedData]);

  return (
    <DashboardLayout title="Travel Packages & Itineraries">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Travel Packages & Itineraries
          </h1>
          <p className="text-gray-600">Overview of all travel packages and their associated itineraries</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by package name, location, user ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            {/* Package Name Filter */}
            <select
              value={filters.packageName}
              onChange={(e) => setFilters({ ...filters, packageName: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.packageId} value={pkg.packageName}>
                  {pkg.packageName}
                </option>
              ))}
            </select>

            {/* User ID Filter */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by User ID"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            {/* Removed Min Itinerary Price Filter */}
            {/* Removed Max Itinerary Price Filter */}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading travel packages and itineraries...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p>{error}</p>
            <p className="text-gray-600">Please ensure the backend services are running and you are logged in with appropriate permissions.</p>
          </div>
        )}

        {/* No Data Found State */}
        {!loading && !error && filteredCombinedData.length === 0 && (
          <div className="text-center py-12 bg-white shadow-md rounded-xl p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No matching packages or itineraries found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && filteredCombinedData.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("itineraryId")}
                    >
                      Itinerary ID
                      {sortColumn === "itineraryId" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("userId")}
                    >
                      User ID
                      {sortColumn === "userId" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("packageName")}
                    >
                      Package Name
                      {sortColumn === "packageName" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("packageLocation")}
                    >
                      Location
                      {sortColumn === "packageLocation" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("packageBasePrice")}
                    >
                      Package Base Price
                      {sortColumn === "packageBasePrice" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("price")}
                    >
                      Itinerary Price
                      {sortColumn === "price" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("customizationDetails")}
                    >
                      Customization Details
                      {sortColumn === "customizationDetails" && (
                        sortDirection === "asc" ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCombinedData.map((item) => (
                    <tr key={item.itineraryId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.itineraryId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.packageName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.packageLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{item.packageBasePrice?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{item.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.customizationDetails || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TravelPackageItinerary;
