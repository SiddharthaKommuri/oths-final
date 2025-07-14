import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import StarRatingInput from "./StarRatingInput";

const EditHotelModal = ({ isOpen, onClose, hotel, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    location: "",
    pricePerNight: "",
    roomsAvailable: "",
    rating: 0,
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        id: hotel.id || hotel.hotelId || null,
        name: hotel.name || "",
        location: hotel.location || "",
        pricePerNight: hotel.pricePerNight || "",
        roomsAvailable: hotel.roomsAvailable || "",
        rating: hotel.rating || 0,
      });
    }
  }, [hotel]);

  if (!isOpen || !hotel) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedHotel = {
      ...formData,
      pricePerNight: parseFloat(formData.pricePerNight),
      roomsAvailable: parseInt(formData.roomsAvailable),
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedHotel);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />
        <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Hotel</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Night
                </label>
                <input
                  type="number"
                  value={formData.pricePerNight}
                  onChange={(e) =>
                    handleChange("pricePerNight", e.target.value)
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rooms Available
                </label>
                <input
                  type="number"
                  value={formData.roomsAvailable}
                  onChange={(e) =>
                    handleChange("roomsAvailable", e.target.value)
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <StarRatingInput
                rating={formData.rating}
                onRatingChange={(rating) => handleChange("rating", rating)}
              />
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditHotelModal;
