// ... [unchanged imports]
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import EditHotelModal from "../../components/ui/EditHotelModal";
import {
  Building,
  Edit,
  Trash2,
  Search,
  Plus,
  Star,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { hotelService } from "../../services/hotelService";
import { toast } from "react-toastify";

const ManageHotels = () => {
  const { token, user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [editModal, setEditModal] = useState({ isOpen: false, hotel: null });
  const [filters, setFilters] = useState({ search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedHotels = await hotelService.getAllHotels(token);
      setHotels(fetchedHotels);
    } catch (err) {
      console.error("Failed to load hotels:", err);
      setError("Failed to load hotels. Please try again.");
      toast.error(
        "Failed to load hotels: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const filterHotels = useCallback(() => {
    let filtered = [...hotels];
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchTerm) ||
          hotel.location.toLowerCase().includes(searchTerm)
      );
    }
    setFilteredHotels(filtered);
  }, [hotels, filters.search]);

  useEffect(() => {
    filterHotels();
  }, [filterHotels]);

  const handleEdit = (hotel) => {
    setEditModal({ isOpen: true, hotel });
  };

  const handleEditSave = async (updatedHotel) => {
    if (!updatedHotel.id) {
      toast.error("Hotel ID is missing");
      return;
    }

    try {
      await hotelService.updateHotel(
        updatedHotel.id,
        updatedHotel,
        token,
        "HotelManager"
      );

      // Update hotels
      const updatedList = hotels.map((hotel) =>
        hotel.id === updatedHotel.id ? { ...hotel, ...updatedHotel } : hotel
      );

      setHotels(updatedList); // Update full list
      setEditModal({ isOpen: false, hotel: null });
      toast.success("Hotel updated successfully!");

      // ✅ Re-run filter after hotels update
      const searchTerm = filters.search.toLowerCase();
      const filtered = updatedList.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchTerm) ||
          hotel.location.toLowerCase().includes(searchTerm)
      );
      setFilteredHotels(filtered);
    } catch (err) {
      console.error("Failed to update hotel:", err);
      toast.error(
        "Failed to update hotel: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDelete = async (hotelId) => {
    console.log("Deleting hotel with ID:", hotelId); // ✅ Add this line

    if (!hotelId) {
      toast.error("Hotel ID is undefined. Cannot delete.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await hotelService.deleteHotel(hotelId, token, "HotelManager");
      setHotels((prevHotels) => prevHotels.filter((h) => h.id !== hotelId));
      setFilteredHotels((prevFiltered) =>
        prevFiltered.filter((h) => h.id !== hotelId)
      );
      toast.success("Hotel deleted successfully!");
    } catch (err) {
      console.error("Failed to delete hotel:", err);
      toast.error(
        "Failed to delete hotel: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <DashboardLayout title="Manage Hotels">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Hotels</h1>
            <p className="text-gray-600">Edit and manage your hotel listings</p>
          </div>
          <Link
            to="/hotel-manager/create-hotel"
            className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Hotel</span>
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotels by name or location..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading hotels...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
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
                      Price/Night
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rooms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHotels.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-6 text-gray-500"
                      >
                        No hotels found.
                      </td>
                    </tr>
                  ) : (
                    filteredHotels.map((hotel, index) => (
                      <tr
                        key={hotel.id || hotel.hotelId || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {hotel.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Created{" "}
                                {new Date(hotel.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {hotel.location}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          ${hotel.pricePerNight?.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {hotel.roomsAvailable || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm text-gray-900">
                              {hotel.rating?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(hotel)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              aria-label={`Edit ${hotel.name}`}
                            >
                              <Edit className="w-4 h-4" />
                              <span className="ml-1 hidden sm:inline">
                                Edit
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(hotel.id || hotel.hotelId)
                              }
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                              aria-label={`Delete ${hotel.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="ml-1 hidden sm:inline">
                                Delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <EditHotelModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, hotel: null })}
          hotel={editModal.hotel}
          onSave={handleEditSave}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManageHotels;
