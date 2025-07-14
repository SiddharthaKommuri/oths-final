import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Building, Users, CheckCircle, Loader2 } from "lucide-react";
import { hotelService } from "../../services/hotelService";
import { getBookingsByType } from "../../services/BookingServiceSid"; // ✅ Make sure this is imported
import { toast } from "react-toastify";

const AvailabilityTracker = () => {
  const { token, user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAvailabilityData = useCallback(async () => {
    if (!token || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedHotels = await hotelService.getAllHotels(token);
      const managerHotels = fetchedHotels.filter(
        (hotel) => hotel.createdBy === user.id
      );
      setHotels(managerHotels);

      const bookingResponse = await getBookingsByType("hotel", token);
      const allHotelBookings = bookingResponse.content || [];

      const stats = managerHotels.map((hotel) => {
        const confirmedBookings = allHotelBookings.filter(
          (booking) =>
            booking.hotelName === hotel.name && booking.status === "confirmed"
        );
        const bookedRooms = confirmedBookings.length;
        const availableRooms = Math.max(0, hotel.roomsAvailable - bookedRooms);

        return {
          ...hotel,
          bookedRooms,
          availableRooms,
        };
      });

      setAvailabilityData(stats);
    } catch (err) {
      console.error("Error loading availability data:", err);
      toast.error("Failed to load availability data.");
      setError("Failed to load availability data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadAvailabilityData();
  }, [loadAvailabilityData]);

  const totalAvailable = availabilityData.reduce(
    (sum, hotel) => sum + hotel.availableRooms,
    0
  );
  const totalBooked = availabilityData.reduce(
    (sum, hotel) => sum + hotel.bookedRooms,
    0
  );

  return (
    <DashboardLayout title="Room Availability">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Room Availability Tracker
          </h1>
          <p className="text-gray-600">
            Monitor bookings and room availability across your hotels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Hotels
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {availabilityData.length}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Available Rooms
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAvailable}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Booked Rooms
                </p>
                <p className="text-2xl font-bold text-red-600">{totalBooked}</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading availability data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availabilityData.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <Building className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hotels found
                </h3>
                <p className="text-gray-600">
                  Create your first hotel to begin tracking.
                </p>
              </div>
            ) : (
              availabilityData.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Rooms</span>
                      <span>{hotel.roomsAvailable}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available Rooms</span>
                      <span>{hotel.availableRooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Booked Rooms</span>
                      <span>{hotel.bookedRooms}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AvailabilityTracker;
