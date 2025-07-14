import {
    Calendar,
    MapPin,
    Users, // Keep Users import as it might be used elsewhere or for other booking types if not explicitly removed from all
    Clock,
    CheckCircle,
    XCircle,
    Star,
    Building,
    Plane,
    Package,
    Award, // Keep Award import as it might be used elsewhere
  } from "lucide-react";
  import StatusBadge from "./StatusBadge";
   
  const BookingCard = ({ booking, onCancel, onModify, showActions = true }) => {
    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case "confirmed":
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        case "pending":
          return <Clock className="w-5 h-5 text-yellow-500" />;
        case "cancelled":
          return <XCircle className="w-5 h-5 text-red-500" />;
        default:
          return <Clock className="w-5 h-5 text-gray-500" />;
      }
    };
   
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };
   
    const bookingType = booking.type?.toLowerCase();
    // guestsCount is no longer directly displayed for packages, but keeping the variable for potential future use or other types
    const guestsCount = booking.guests || booking.passengers || 0;
    // Use itineraryPrice if available (for customized packages), otherwise fall back to booking.amount or booking.price
    const displayPrice =
      booking.itineraryPrice ||
      booking.amount ||
      booking.price ||
      booking.displayPrice;
   
    return (
      <div className="card p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(booking.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {/* Conditional display for the main title based on booking type */}
                {bookingType === "hotel"
                  ? booking.hotelName || "N/A"
                  : bookingType === "flight"
                  ? `${booking.airline || "N/A"} - ${booking.flightId || "N/A"}`
                  : bookingType === "package"
                  ? `${booking.packageName || "N/A"} ${
                      booking.itineraryCustomizationDetails ? "(Customized)" : ""
                    }` // Main Heading for package, indicating customization
                  : "N/A"}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {booking.type} Booking
              </p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>
   
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {bookingType === "hotel" && (
            <>
              {/* Hotel specific details */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Building className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Hotel Name</p>
                  <p className="text-sm font-medium">
                    {booking.hotelName || "N/A"}
                  </p>
                </div>
              </div>
   
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">
                    {booking.location || "N/A"}
                  </p>
                </div>
              </div>
   
              <div className="flex items-center space-x-2 text-gray-600">
                <Star className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="text-sm font-medium">
                    {booking.rating ? `${booking.rating} / 5` : "N/A"}
                  </p>
                </div>
              </div>
            </>
          )}
   
          {bookingType === "flight" && (
            <>
              {/* Flight specific details */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Plane className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Airline & Flight No.</p>
                  <p className="text-sm font-medium">
                    {booking.airline || "N/A"} - {booking.flightId || "N/A"}
                  </p>
                </div>
              </div>
   
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Departure</p>
                  <p className="text-sm font-medium">
                    {formatDate(booking.departureTime || booking.departureDate)}
                  </p>
                </div>
              </div>
   
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Return</p>
                  <p className="text-sm font-medium">
                    {formatDate(booking.arrivalTime || booking.returnDate)}
                  </p>
                </div>
              </div>
            </>
          )}
   
          {bookingType === "package" && (
            <>
              {/* Package Name */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Package className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Package Name</p>
                  <p className="text-sm font-medium">
                    {booking.packageName || "N/A"}
                  </p>
                </div>
              </div>
   
              {/* Location */}
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">
                    {booking.packageLocation || "N/A"}
                  </p>
                </div>
              </div>
   
              {/* Activities (if any) */}
              {booking.activities?.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <p className="text-xs text-gray-500">Activities</p>
                    <p className="text-sm font-medium">
                      {booking.activities.join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
   
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-primary-600">
              ₹{displayPrice ? displayPrice.toFixed(2) : "N/A"}
            </p>
          </div>
   
          {showActions && booking.status !== "cancelled" && (
            <div className="flex space-x-2">
              {onModify && (
                <button
                  onClick={() => onModify(booking)}
                  className="btn-secondary text-sm"
                >
                  Modify
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => onCancel(booking)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
   
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Booked on {formatDate(booking.createdAt)} • Booking ID: #
            {booking.id || booking.bookingId || "N/A"}
          </p>
        </div>
      </div>
    );
  };
   
  export default BookingCard;