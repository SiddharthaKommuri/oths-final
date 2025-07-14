import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Package, MapPin, Clock, DollarSign, Users, ArrowRight, ArrowLeft } from 'lucide-react';
 
// Import the services
import TravelPackageService from '../../services/TravelPackageService'; // Adjust path as needed
import HotelService from '../../services/hotelService'; // Adjust path as needed
import FlightService from '../../services/FlightService'; // Adjust path as needed
import { toast } from 'react-toastify'; // Import toast for notifications
 
const CreatePackage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    packageName: '',
    location: '',
    price: '',
    selectedHotels: [],
    selectedFlights: [],
    activities: [], // This will be populated from the 'activities' state
  });
 
  const [activities, setActivities] = useState([
    { id: 1, name: '', cost: '', included: true }
  ]);
 
  const [availableHotels, setAvailableHotels] = useState([]);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [errorHotels, setErrorHotels] = useState(null);
  const [errorFlights, setErrorFlights] = useState(null);
 
 
  // Fetch hotels and flights on component mount or when location/token changes
  useEffect(() => {
    const fetchHotelsAndFlights = async () => {
      if (!token) {
        setLoadingHotels(false);
        setLoadingFlights(false);
        setErrorHotels("Authentication token not found. Please log in.");
        setErrorFlights("Authentication token not found. Please log in.");
        toast.error("Authentication required to load hotels and flights.");
        return;
      }
 
      const location = formData.location.trim();
 
      // Only fetch hotels and flights if a location is provided and it's not the initial empty state
      if (location) {
        // Fetch Hotels (no change needed here as it already searches by location)
        try {
          setLoadingHotels(true);
          setErrorHotels(null);
          const response = await HotelService.searchHotels(location, token);
          setAvailableHotels(response.data || []);
        } catch (error) {
          console.error("Error fetching hotels:", error);
          setErrorHotels(`Failed to load hotels for "${location}". Please try again.`);
          toast.error("Failed to load hotels: " + (error.response?.data?.message || error.message));
          setAvailableHotels([]); // Clear hotels on error
        } finally {
          setLoadingHotels(false);
        }
 
        // Fetch Flights: Attempt to get flights where 'location' is the arrival city
        try {
          setLoadingFlights(true);
          setErrorFlights(null);
 
          // **** CRUCIAL CHANGE HERE ****
          // Calling the existing searchFlights method with empty string for departure
          // and formData.location for arrival.
          const flightsResult = await FlightService.searchFlights("", location, token);
         
          setAvailableFlights(flightsResult.data || []);
 
          if (flightsResult.data && flightsResult.data.length === 0) {
            setErrorFlights(`No flights found arriving at "${location}".`);
          }
 
        } catch (error) {
          console.error("Error fetching flights:", error);
          // The error message is updated to reflect the specific search
          setErrorFlights(`Failed to load flights arriving at "${location}". This might be due to backend requiring both departure and arrival, or no flights found.`);
          toast.error("Failed to load flights: " + (error.response?.data?.message || error.message));
          setAvailableFlights([]); // Clear flights on error
        } finally {
          setLoadingFlights(false);
        }
      } else {
        // Clear hotels/flights if location is empty
        setAvailableHotels([]);
        setAvailableFlights([]);
        setLoadingHotels(false);
        setLoadingFlights(false);
        setErrorHotels(null);
        setErrorFlights(null);
      }
    };
 
    // Only run this effect when currentStep is 2 (Hotels & Flights) or when location changes in step 1
    // This prevents unnecessary API calls when on other steps or when location is not yet set
    if (currentStep === 2 || (currentStep === 1 && formData.location.trim() !== '')) {
      fetchHotelsAndFlights();
    }
  }, [token, formData.location, currentStep]);
 
 
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
 
  const handleHotelToggle = (hotelId) => {
    setFormData(prev => ({
      ...prev,
      selectedHotels: prev.selectedHotels.includes(hotelId)
        ? prev.selectedHotels.filter(id => id !== hotelId)
        : [...prev.selectedHotels, hotelId]
    }));
  };
 
  const handleFlightToggle = (flightId) => {
    setFormData(prev => ({
      ...prev,
      selectedFlights: prev.selectedFlights.includes(flightId)
        ? prev.selectedFlights.filter(id => id !== flightId)
        : [...prev.selectedFlights, flightId]
    }));
  };
 
  const addActivity = () => {
    setActivities(prev => [
      ...prev,
      { id: Date.now(), name: '', cost: '', included: true }
    ]);
  };
 
  const removeActivity = (id) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };
 
  const updateActivity = (id, field, value) => {
    setActivities(prev => prev.map(activity =>
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };
 
  const handleSubmit = async () => {
    // Filter out activities without a name, but keep those with a name
    const validActivities = activities.filter(activity => activity.name.trim() !== '');
 
    // --- DEBUGGING LOGS FOR ACTIVITIES ---
    console.log("Original activities state:", activities);
    console.log("Valid activities after filter:", validActivities);
    const mappedActivities = validActivities.map(act => act.name);
    console.log("Mapped activities (should be strings):", mappedActivities);
    // --- END DEBUGGING LOGS ---
 
    // Create the DTO to match your TravelPackageDto structure
    const travelPackageDto = {
      packageName: formData.packageName,
      location: formData.location,
      price: parseFloat(formData.price),
      includedHotelIds: formData.selectedHotels,
      includedFlightIds: formData.selectedFlights,
      // CRUCIAL CHANGE: Map activities to an array of strings (activity names)
      activities: mappedActivities // Use the explicitly mapped array
    };
 
    // Log the final payload to inspect it in the browser's console
    console.log("Sending travel package DTO:", travelPackageDto);
 
    try {
      const response = await TravelPackageService.createPackage(travelPackageDto, token);
      console.log("Package created successfully:", response.data);
      toast.success('Package created successfully!'); // Use toast
      navigate('/travel-agent/manage-packages');
    } catch (error) {
      console.error("Error creating package:", error.response ? error.response.data : error.message);
      toast.error(`Failed to create package: ${error.response?.data?.message || 'An unexpected error occurred.'}`); // Use toast
    }
  };
 
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
 
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
 
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.packageName && formData.location && formData.price && parseFloat(formData.price) > 0;
      case 2:
        // Require both selectedHotels AND selectedFlights to have at least one item
        return formData.selectedHotels.length > 0 && formData.selectedFlights.length > 0;
      case 3:
        // Activities are optional for submission, but validate if entered
        // Ensure that if an activity name is entered, its cost is also a valid number
        const allActivitiesValid = activities.every(activity => {
          if (activity.name.trim() === '') {
            return true; // Empty activities are allowed and filtered out later
          }
          return !isNaN(parseFloat(activity.cost)) && parseFloat(activity.cost) >= 0;
        });
        return allActivitiesValid;
      default:
        return false;
    }
  };
 
  const renderStep1 = () => (
    <div className="space-y-6">
      <div> {/* This div wraps "Basic Information" section */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div> {/* Package Name field */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Name *
            </label>
            <input
              type="text"
              value={formData.packageName}
              onChange={(e) => handleChange('packageName', e.target.value)}
              className="input-field"
              placeholder="e.g., European Adventure"
              required
            />
          </div>
 
          <div> {/* Location field */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="input-field"
              placeholder="e.g., Paris, Rome, Barcelona"
              required
            />
          </div>
 
          <div className="md:col-span-2"> {/* Base Price field */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price Per Person *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2499"
                required
                min="0" // Ensure price is not negative
              />
            </div>
          </div> {/* Correctly closing md:col-span-2 div */}
        </div> {/* Correctly closing grid div */}
      </div> {/* Correctly closing the div wrapping "Basic Information" section */}
    </div> // Correctly closing space-y-6 div
  );
 
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Hotels & Flights</h3>
 
        {/* Hotels Selection */}
        <div className="mb-8">
          <h4 className="font-medium text-gray-900 mb-4">Available Hotels for {formData.location || 'selected location'}</h4>
          {loadingHotels && <p>Loading hotels...</p>}
          {errorHotels && <p className="text-red-500">{errorHotels}</p>}
          {!loadingHotels && availableHotels.length === 0 && !errorHotels && (
            <p>No hotels available for {formData.location}. Please refine your location or add hotels for this area.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableHotels.map((hotel) => (
              <div
                key={hotel.hotelId} // Use hotel.hotelId as key
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.selectedHotels.includes(hotel.hotelId)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleHotelToggle(hotel.hotelId)} // Only handle click on the div
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.selectedHotels.includes(hotel.hotelId)}
                    readOnly // Added readOnly to suppress the warning
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 pointer-events-none" // Make checkbox non-interactive directly
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{hotel.name}</h5>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                    {/* <p className="text-sm font-semibold text-primary-600">₹{hotel.price}/night</p> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* Flights Selection */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Available Flights to {formData.location || 'selected location'}</h4>
          {loadingFlights && <p>Loading flights...</p>}
          {errorFlights && <p className="text-red-500">{errorFlights}</p>}
          {!loadingFlights && availableFlights.length === 0 && !errorFlights && (
            <p>No flights available arriving at {formData.location}. Please refine your location or add flights for this area.</p>
          )}
          <div className="grid grid-cols-1 gap-4">
            {availableFlights.map((flight) => (
              <div
                key={flight.flightId} // Use flight.flightId as key
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.selectedFlights.includes(flight.flightId)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleFlightToggle(flight.flightId)} // Only handle click on the div
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.selectedFlights.includes(flight.flightId)}
                    readOnly // Added readOnly to suppress the warning
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 pointer-events-none" // Make checkbox non-interactive directly
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{flight.airline} {flight.flightNumber}</h5>
                        <p className="text-sm text-gray-600">{flight.departure} → {flight.arrival}</p> {/* Used departure/arrival as per flight data */}
                      </div>
                      <div className="text-right">
                        {/* <p className="font-semibold text-primary-600">${flight.price.toFixed(2)}</p> Format price */}
                        <p className="text-sm text-gray-600">
                          {`${new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${
                            new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
 
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities</h3>
 
        {/* Activities */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Package Activities</h4>
            <button
              type="button"
              onClick={addActivity}
              className="btn-secondary text-sm"
            >
              Add Activity
            </button>
          </div>
 
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Name
                    </label>
                    <input
                      type="text"
                      value={activity.name}
                      onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                      className="input-field"
                      placeholder="e.g., City Tour"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost
                    </label>
                    <input
                      type="number"
                      value={activity.cost}
                      onChange={(e) => updateActivity(activity.id, 'cost', e.target.value)}
                      className="input-field"
                      placeholder="50"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-4 h-full">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activity.included}
                        onChange={(e) => updateActivity(activity.id, 'included', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Included</span>
                    </label>
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivity(activity.id)}
                        className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
 
  const renderPreview = () => {
    // Filter availableHotels/Flights based on selected IDs
    const selectedHotels = availableHotels.filter(hotel => formData.selectedHotels.includes(hotel.hotelId)); // Use hotel.hotelId
    const selectedFlights = availableFlights.filter(flight => formData.selectedFlights.includes(flight.flightId)); // Use flight.flightId
    const validActivities = activities.filter(activity => activity.name.trim() !== ''); // Only show activities with a name
 
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Preview</h3>
 
        <div className="card p-6">
          <h4 className="text-xl font-bold text-gray-900 mb-2">{formData.packageName}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{formData.location}</span>
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedHotels.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Included Hotels</h5>
                <ul className="space-y-1">
                  {selectedHotels.map(hotel => (
                    <li key={hotel.hotelId} className="text-sm text-gray-600">• {hotel.name}</li>
                  ))}
                </ul>
              </div>
            )}
 
            {selectedFlights.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Included Flights</h5>
                <ul className="space-y-1">
                  {selectedFlights.map(flight => (
                    <li key={flight.flightId} className="text-sm text-gray-600"> {/* Use flight.flightId */}
                      • {flight.airline} {flight.flightNumber} ({flight.departure} → {flight.arrival})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
 
          {validActivities.length > 0 && (
            <div className="mt-6">
              <h5 className="font-semibold text-gray-900 mb-2">Activities</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {validActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {activity.name} {activity.included && <span className="text-green-600">(Included)</span>}
                    </span>
                    {/* Removed the activity cost display as per request */}
                  </div>
                ))}
              </div>
            </div>
          )}
 
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Base Price</span>
              <span className="text-2xl font-bold text-primary-600">₹{parseFloat(formData.price).toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600">per person</p>
          </div>
        </div>
      </div>
    );
  };
 
  return (
    <DashboardLayout title="Create Travel Package">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8"> {/* Added responsive padding */}
        {/* Progress Steps */}
        <div className="card p-6 rounded-xl shadow-md"> {/* Added styling */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600' // Changed to blue-600
                }`}>
                  {step}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step <= currentStep ? 'text-blue-600' : 'text-gray-500' // Changed to blue-600
                  }`}>
                    {step === 1 && 'Basic Info'}
                    {step === 2 && 'Hotels & Flights'}
                    {step === 3 && 'Activities & Review'}
                  </p>
                </div>
                {step < 3 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
 
        {/* Form Content */}
        <div className="card p-6 rounded-xl shadow-md"> {/* Added styling */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
 
        {/* Preview */}
        {currentStep === 3 && renderPreview()}
 
        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
 
          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid()} // Disable submit if not valid
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-5 h-5" />
              <span>Create Package</span>
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
 
export default CreatePackage;