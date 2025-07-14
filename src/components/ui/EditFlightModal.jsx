import { useState, useEffect } from "react";
import { X, Save, CalendarDays, Clock } from "lucide-react"; // Added CalendarDays, Clock
import { useAuth } from "../../contexts/AuthContext";

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

const EditFlightModal = ({ isOpen, onClose, flight, onSave }) => {
  const { user, token } = useAuth(); // Get user and token from AuthContext
  const [formData, setFormData] = useState({
    airline: "",
    from: "",
    to: "",
    departureDate: "", // New: for date part of departureTime
    departureTimeOnly: "", // New: for time part of departureTime (HH:MM)
    arrivalDate: "",   // New: for date part of arrivalTime
    arrivalTimeOnly: "",   // New: for time part of arrivalTime (HH:MM)
    price: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  };

  useEffect(() => {
    if (flight) {
      // Parse LocalDateTime strings into date and time parts for form fields
      // Assuming backend sends ISO 8601 strings like "YYYY-MM-DDTHH:MM:SS"
      const depDateTime = flight.departureTime ? new Date(flight.departureTime) : null;
      const arrDateTime = flight.arrivalTime ? new Date(flight.arrivalTime) : null;

      setFormData({
        airline: flight.airline || "",
        from: flight.departure || "", // 'departure' from backend is 'from' on frontend (location/airport code)
        to: flight.arrival || "",     // 'arrival' from backend is 'to' on frontend (location/airport code)
        price: flight.price || "",
        // Format date to "YYYY-MM-DD" for input type="date"
        departureDate: depDateTime ? depDateTime.toISOString().split('T')[0] : "",
        // Format time to "HH:MM" for input type="time"
        departureTimeOnly: depDateTime ? depDateTime.toTimeString().slice(0, 5) : "",
        arrivalDate: arrDateTime ? arrDateTime.toISOString().split('T')[0] : "",
        arrivalTimeOnly: arrDateTime ? arrDateTime.toTimeString().slice(0, 5) : "",
      });
    }
  }, [flight]);

  // If the modal is not open or no flight data is provided, don't render anything.
  if (!isOpen || !flight) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // --- Authorization Check ---
    if (!user || !token) {
      showMessage("Authentication required to save changes. Please log in.", "error");
      setSubmitting(false);
      return;
    }
    // You might also want to add a role check here if only specific roles can edit flights
    // e.g., if (!user.roles || !user.roles.includes("ADMIN")) { showMessage("Not authorized", "error"); setSubmitting(false); return; }

    // Combine date and time to form LocalDateTime strings (ISO 8601 format)
    // Example: "2025-07-04T15:30:00"
    // Note: Seconds and milliseconds are often optional or defaulted by backend.
    // Appending ":00" for seconds to ensure full format.
    const fullDepartureTime = formData.departureDate && formData.departureTimeOnly
      ? `${formData.departureDate}T${formData.departureTimeOnly}:00`
      : null;

    const fullArrivalTime = formData.arrivalDate && formData.arrivalTimeOnly
      ? `${formData.arrivalDate}T${formData.arrivalTimeOnly}:00`
      : null;

    if (!fullDepartureTime || !fullArrivalTime) {
      showMessage("Please ensure both departure/arrival dates and times are provided.", "error");
      setSubmitting(false);
      return;
    }

    // Construct the updated flight object to send to the parent's onSave handler
    const updatedFlight = {
      ...flight, // Keep existing flight properties like flightId, createdAt, createdBy, availability, etc.
      airline: formData.airline,
      departure: formData.from, // Location/airport code
      arrival: formData.to,     // Location/airport code
      departureTime: fullDepartureTime, // LocalDateTime string
      arrivalTime: fullArrivalTime,     // LocalDateTime string
      price: parseFloat(formData.price),
      // 'updatedAt' and 'updatedBy' are typically set by the backend
    };

    try {
      // Call the onSave prop. The parent component (ManageFlights) is responsible
      // for calling FlightService.updateFlight with the token.
      await onSave(updatedFlight);
      // The parent component will handle success/error messages and closing the modal
    } catch (error) {
      // This catch block is primarily for errors that might occur *before* onSave is called
      // or if onSave itself throws an unhandled error.
      // Most API errors will be caught in the onSave handler in the parent.
      console.error("Error preparing to save flight:", error);
      showMessage("An unexpected error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if inputs should be disabled (e.g., if not logged in or submitting)
  const isFormDisabled = !user || !token || submitting;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <MessageDisplay
        message={message}
        type={messageType}
        onClose={() => setMessage(null)}
      />
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Flight</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Authorization Message */}
          {!user || !token ? (
            <div className="text-center py-4 mb-6 text-red-600 border border-red-300 bg-red-50 rounded-lg">
              <p className="font-semibold mb-2">Authorization Required</p>
              <p>You must be logged in with appropriate permissions to edit flights.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Airline
                  </label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => handleChange("airline", e.target.value)}
                    className="input-field"
                    required
                    disabled={isFormDisabled} // Disable input if not authorized or submitting
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    className="input-field"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Location (Airport Code)
                  </label>
                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) => handleChange("from", e.target.value)}
                    className="input-field"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Location (Airport Code)
                  </label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => handleChange("to", e.target.value)}
                    className="input-field"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                {/* Departure Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => handleChange("departureDate", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.departureTimeOnly}
                      onChange={(e) => handleChange("departureTimeOnly", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>

                {/* Arrival Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => handleChange("arrivalDate", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={formData.arrivalTimeOnly}
                      onChange={(e) => handleChange("arrivalTimeOnly", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                  disabled={submitting} // Disable cancel button too while submitting
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormDisabled}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{submitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditFlightModal;
