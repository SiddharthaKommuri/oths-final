import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import FlightService from "../../services/FlightService";
import { useAuth } from "../../contexts/AuthContext"; 
import { MapPin, Clock, DollarSign, Save, ArrowLeft, CalendarDays } from "lucide-react"; 


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

const CreateFlight = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    airline: "",
    from: "", 
    to: "",   
    departureDate: "", 
    departureTimeOnly: "", 
    arrivalDate: "",   
    arrivalTimeOnly: "",   
    price: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); 

  const ADMIN_ROLE = "ADMIN"; 

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user || !token) {
      showMessage("Authentication required to create flights. Please log in as an administrator.", "error");
      setSubmitting(false);
      return;
    }

    try {
      
      
      
      
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

      const flightToSend = {
        airline: formData.airline,
        departure: formData.from, 
        arrival: formData.to,     
        departureTime: fullDepartureTime, 
        arrivalTime: fullArrivalTime,     
        price: parseFloat(formData.price),
        availability: true, 
        
      };

      const response = await FlightService.addFlight(
        flightToSend,
        ADMIN_ROLE,
        token
      );

      console.log("Flight created successfully:", response.data);
      showMessage("Flight created successfully!", "success");
      setTimeout(() => navigate("/admin/flights/manage"), 1500);

    } catch (error) {
      console.error("Error creating flight:", error);
      const errorMessage = error.response?.data?.message || "Failed to create flight. Please check your input.";
      showMessage(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormDisabled = !user || !token || submitting;

  return (
    <DashboardLayout title="Create Flight">
      <MessageDisplay
        message={message}
        type={messageType}
        onClose={() => setMessage(null)}
      />

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/flights/manage")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Flight
            </h1>
            <p className="text-gray-600">Add a new flight to the system</p>
          </div>
        </div>

        <div className="card p-6">
          {!user || !token ? (
            <div className="text-center py-8 text-red-600 border border-red-300 bg-red-50 rounded-lg">
              <p className="font-semibold mb-2">Authorization Required</p>
              <p>You must be logged in as an administrator to create flights.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Flight Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Airline *
                  </label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => handleChange("airline", e.target.value)}
                    className="input-field"
                    placeholder="e.g., Indigo"
                    required
                    disabled={isFormDisabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 450"
                      min="1"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Location (Airport Code) *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.from}
                      onChange={(e) => handleChange("from", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., DEL"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Location (Airport Code) *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.to}
                      onChange={(e) => handleChange("to", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., BOM"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Info - Departure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date *
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
                    Departure Time *
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
              </div>

              {/* Schedule Info - Arrival */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date *
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
                    Arrival Time *
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

              {/* Submit */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate("/admin/flights/manage")}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
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
                  <span>{submitting ? "Creating..." : "Create Flight"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateFlight;
