import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Building,
  MapPin,
  DollarSign,
  Users,
  Star,
  Save,
  ArrowLeft,
} from "lucide-react";
import { hotelService } from "../../services/hotelService";
import { toast } from "react-toastify";

const CreateHotel = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    pricePerNight: "",
    roomsAvailable: "",
    rating: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const hotelData = {
        name: formData.name,
        location: formData.location,
        pricePerNight: parseFloat(formData.pricePerNight),
        roomsAvailable: parseInt(formData.roomsAvailable),
        rating: parseFloat(formData.rating),
      };

      await hotelService.registerHotel(hotelData, token, "HotelManager");

      
      toast.success("✅ Hotel registered successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      navigate("/hotel-manager/manage-hotels");
    } catch (err) {
      console.error("Failed to register hotel:", err);
      toast.error(
        "Failed to register hotel: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create New Hotel">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/hotel-manager")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Go back to Hotel Manager Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Hotel
            </h1>
            <p className="text-gray-600">Add a new hotel to your portfolio</p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="hotelName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="hotelName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder="e.g., Grand Plaza Hotel"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder="e.g., New York, NY"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pricePerNight"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Price Per Night <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="pricePerNight"
                    type="number"
                    step="0.01"
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      handleChange("pricePerNight", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder="299.99"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="roomsAvailable"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Rooms Available <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="roomsAvailable"
                    type="number"
                    value={formData.roomsAvailable}
                    onChange={(e) =>
                      handleChange("roomsAvailable", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hotel Rating (1.0 - 5.0)
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => handleChange("rating", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    placeholder="4.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
              <button
                type="button"
                onClick={() => navigate("/hotel-manager")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{submitting ? "Creating..." : "Create Hotel"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateHotel;
