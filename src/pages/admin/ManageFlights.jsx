import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import EditFlightModal from "../../components/ui/EditFlightModal";
import FlightService from "../../services/FlightService"; // Import the FlightService
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook
import {
  Plane,
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
} from "lucide-react";

// Simple Message Display Component (reused for consistency)
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-100" : "bg-green-100";
  const textColor = type === "error" ? "text-red-800" : "text-green-800";
  const borderColor = type === "error" ? "border-red-400" : "border-green-400";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 flex items-center justify-between space-x-4 border ${bgColor} ${textColor} ${borderColor}`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-current hover:text-opacity-75 focus:outline-none"
      >
        &times;
      </button>
    </div>
  );
};

const ManageFlights = () => {
  const [flights, setFlights] = useState([]); // Stores all flights fetched from the API
  const [filteredFlights, setFilteredFlights] = useState([]); // Stores flights after applying client-side filters
  const [editModal, setEditModal] = useState({ isOpen: false, flight: null });
  const [filters, setFilters] = useState({
    search: "",
    airline: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

  // Access user and token from the authentication context
  const { user, token } = useAuth();

  // Assuming a fixed role for admin actions (e.g., this page requires ADMIN role)
  const REQUIRED_ROLE = "ADMIN"; // Or whatever role is needed to manage flights

  // Function to show a temporary message
  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000); // Message disappears after 3 seconds
  };

  // Function to fetch all flights from the backend
  const fetchFlights = useCallback(async () => {
    setLoading(true);
    // Check if user and token are available before making the API call
    if (!user || !token) {
      setLoading(false);
      setFlights([]); // Clear flights if not authenticated
      showMessage("Authentication required to manage flights. Please log in.", "error");
      return;
    }

    // Optional: Check if the user has the required role
    // This is a client-side check for UX; backend should also enforce this.
    // if (!user.roles || !user.roles.includes(REQUIRED_ROLE)) {
    //   setLoading(false);
    //   setFlights([]);
    //   showMessage("You do not have permission to manage flights.", "error");
    //   return;
    // }

    try {
      // Pass the token to the getAllFlights service method
      const response = await FlightService.getAllFlights(token);
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
      const errorMessage = error.response?.data?.message || "Failed to load flights. Please try again.";
      showMessage(errorMessage, "error");
      setFlights([]); // Clear flights on error
    } finally {
      setLoading(false);
    }
  }, [user, token]); // Dependencies on user and token for re-fetching on auth change

  // Effect to load flights on component mount or when user/token changes
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]); // Dependency on fetchFlights to avoid stale closure issues

  // Effect to apply client-side filters whenever flights or filters change
  useEffect(() => {
    let currentFiltered = [...flights];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (flight) =>
          (flight.airline && flight.airline.toLowerCase().includes(searchTerm)) ||
          (flight.flightNumber && flight.flightNumber.toLowerCase().includes(searchTerm)) || // Assuming flightNumber exists in backend model
          (flight.from && flight.from.toLowerCase().includes(searchTerm)) || // Airport code
          (flight.to && flight.to.toLowerCase().includes(searchTerm)) || // Airport code
          (flight.fromCity && flight.fromCity.toLowerCase().includes(searchTerm)) || // Assuming fromCity exists in backend model
          (flight.toCity && flight.toCity.toLowerCase().includes(searchTerm)) // Assuming toCity exists in backend model
      );
    }

    if (filters.airline !== "all") {
      currentFiltered = currentFiltered.filter(
        (flight) => flight.airline === filters.airline
      );
    }

    if (filters.status !== "all") {
      currentFiltered = currentFiltered.filter(
        (flight) => flight.status === filters.status
      );
    }

    setFilteredFlights(currentFiltered);
  }, [flights, filters]);

  // Function to toggle flight status (active/inactive)
  const toggleFlightStatus = async (flightId) => {
    // Authorization check before action
    if (!user || !token) {
      showMessage("Authentication required to update flight status.", "error");
      return;
    }
    // Optional: Role check
    // if (!user.roles || !user.roles.includes(REQUIRED_ROLE)) {
    //   showMessage("You do not have permission to update flight status.", "error");
    //   return;
    // }

    const flightToUpdate = flights.find((f) => f.id === flightId);
    if (!flightToUpdate) {
      showMessage("Flight not found.", "error");
      return;
    }

    const newStatus = flightToUpdate.status === "active" ? "inactive" : "active";
    // Ensure the updatedFlightData matches your backend Flight model structure
    const updatedFlightData = { ...flightToUpdate, status: newStatus };

    try {
      // Send the updated flight object to the backend, passing the token
      await FlightService.updateFlight(
        flightId,
        updatedFlightData,
        REQUIRED_ROLE, // Pass the role as a query parameter
        token // Pass the authentication token
      );
      showMessage(`Flight status updated to ${newStatus}.`, "success");
      fetchFlights(); // Re-fetch all flights to update the UI
    } catch (error) {
      console.error("Error toggling flight status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update flight status.";
      showMessage(errorMessage, "error");
    }
  };

  // Handler for opening the edit modal
  const handleEdit = (flight) => {
    // Authorization check before opening modal
    if (!user || !token) {
      showMessage("Authentication required to edit flights.", "error");
      return;
    }
    // Optional: Role check
    // if (!user.roles || !user.roles.includes(REQUIRED_ROLE)) {
    //   showMessage("You do not have permission to edit flights.", "error");
    //   return;
    // }
    setEditModal({ isOpen: true, flight });
  };

  // Handler for saving edits from the modal
  const handleEditSave = async (updatedFlight) => {
    // Authorization check before saving edits
    if (!user || !token) {
      showMessage("Authentication required to save flight changes.", "error");
      return;
    }
    // Optional: Role check
    // if (!user.roles || !user.roles.includes(REQUIRED_ROLE)) {
    //   showMessage("You do not have permission to save flight changes.", "error");
    //   return;
    // }

    try {
      // Send the updated flight object from the modal to the backend, passing the token
      await FlightService.updateFlight(
        updatedFlight.flightId,
        updatedFlight,
        REQUIRED_ROLE, // Pass the role as a query parameter
        token // Pass the authentication token
      );
      showMessage("Flight updated successfully!", "success");
      setEditModal({ isOpen: false, flight: null }); // Close modal
      fetchFlights(); // Re-fetch all flights to update the UI
    } catch (error) {
      console.error("Error saving flight edits:", error);
      const errorMessage = error.response?.data?.message || "Failed to save flight changes.";
      showMessage(errorMessage, "error");
    }
  };

  // Get unique airline names for the filter dropdown
  const airlines = [...new Set(flights.map((flight) => flight.airline))].filter(Boolean); // Filter out any null/undefined airlines

  // Calculate status counts
  const getStatusCounts = () => {
    return {
      all: flights.length,
      active: flights.filter((f) => f.status === "active").length,
      inactive: flights.filter((f) => f.status === "inactive").length,
    };
  };

  const statusCounts = getStatusCounts();

  // Determine if the user is authorized to perform admin actions (e.g., add, edit, toggle)
  // This is a client-side UX helper. Backend must enforce security.
  const isAuthorized = user && token; // && user.roles && user.roles.includes(REQUIRED_ROLE);

  return (
    <DashboardLayout title="Manage Flights">
      <MessageDisplay
        message={message}
        type={messageType}
        onClose={() => setMessage(null)}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Flights</h1>
            <p className="text-gray-600">Manage all flights in the system</p>
          </div>
          {isAuthorized && ( // Only show "Add New Flight" button if authorized
            <Link
              to="/admin/flights/create"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Flight</span>
            </Link>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "..." : statusCounts.all}
            </p>
            <p className="text-sm text-gray-600">Total Flights</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {loading ? "..." : statusCounts.active}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {loading ? "..." : statusCounts.inactive}
            </p>
            <p className="text-sm text-gray-600">Inactive</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search flights by airline, origin, destination..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!isAuthorized && !loading} // Disable filters if not authorized and not loading
              />
            </div>

            <select
              value={filters.airline}
              onChange={(e) =>
                setFilters({ ...filters, airline: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!isAuthorized && !loading}
            >
              <option value="all">All Airlines</option>
              {airlines.map((airline) => (
                <option key={airline} value={airline}>
                  {airline}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!isAuthorized && !loading}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Flight Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-primary-500 mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-600">Loading flights...</p>
              </div>
            ) : !isAuthorized ? ( // Display authorization message if not authorized
              <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
                <p className="font-semibold mb-2">Authorization Required</p>
                <p>You must be logged in with appropriate permissions to view and manage flights.</p>
                {/* Optionally, add a login button here */}
                {/* <button onClick={() => navigate('/login')} className="mt-4 btn-primary">Login</button> */}
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No flights found
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.search ||
                  filters.airline !== "all" ||
                  filters.status !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first flight to get started"}
                </p>
                {/* Only show "Create First Flight" if no flights exist at all AND user is authorized */}
                {flights.length === 0 && isAuthorized && (
                  <Link to="/admin/flights/create" className="btn-primary">
                    Create Your First Flight
                  </Link>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFlights.map((flight) => (
                    <tr key={flight.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Plane className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {flight.airline}
                            </div>
                           
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {flight.departure} 
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {flight.arrival} 
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(flight.departureTime).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(flight.arrivalTime).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{flight.price}
                      </td>
                      
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {isAuthorized && ( // Only show action buttons if authorized
                            <>
                              <button
                                onClick={() => handleEdit(flight)}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Edit Flight Modal */}
        <EditFlightModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, flight: null })}
          flight={editModal.flight}
          onSave={handleEditSave}
          // Pass authorization status to the modal if it needs to disable its own inputs/buttons
          isAuthorized={isAuthorized}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManageFlights;
