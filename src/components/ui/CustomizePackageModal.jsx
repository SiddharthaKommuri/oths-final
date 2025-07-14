import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

const CustomizePackageModal = ({ isOpen, onClose, package: pkg, onConfirm }) => {
  const [selectedActivities, setSelectedActivities] = useState({});
  const [travelers, setTravelers] = useState(1); // Added state for travelers
  const [totalPrice, setTotalPrice] = useState(0); // Added state for total price

  useEffect(() => {
    if (pkg) {
      const initialSelected = pkg.activities.reduce((acc, activityName) => {
        acc[activityName] = true; // Default to true
        return acc;
      }, {});
      setSelectedActivities(initialSelected);
      setTravelers(1); // Reset travelers to 1 when package changes
      setTotalPrice(pkg.price * 1); // Initialize total price with base price * 1 traveler
    }
  }, [pkg]);

  useEffect(() => {
    // Recalculate total price whenever selectedActivities or travelers change
    if (pkg) {
      // The total price is the package's base price multiplied by the number of travelers.
      // If activities had individual prices, you would sum them up here too.
      setTotalPrice((pkg.price || 0) * travelers);
    }
  }, [selectedActivities, travelers, pkg]); // Added pkg to dependencies for robustness

  if (!isOpen || !pkg) return null;

  const toggleActivity = (activityName) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityName]: !prev[activityName]
    }));
  };

  const handleConfirm = () => {
    const customizedPackage = {
      ...pkg, // Spread original package details
      selectedActivities: pkg.activities.filter(activityName => selectedActivities[activityName]),
      travelers: travelers, // Pass the selected number of travelers
      price: totalPrice, // CRUCIAL FIX: Update the 'price' property with the calculated totalPrice
      totalPrice: totalPrice // Also keep totalPrice for clarity if needed by parent
    };
    onConfirm(customizedPackage);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Customize Your Package</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 gap-6">
            <div className="col-span-1">
              <div className="mb-6">
                {/* <img src={pkg.image} alt={pkg.name} className="w-full h-48 object-cover rounded-lg mb-4" /> */}
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{pkg.packageName || pkg.name}</h4> {/* Use packageName first */}
                <p className="text-gray-600 mb-4">{pkg.description}</p>

                {/* Number of Travelers */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Number of Travelers</h5>
                  <input
                    type="number"
                    min="1"
                    value={travelers}
                    onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field w-full"
                  />
                </div>

                {/* Activities Selection */}
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Select Activities</h5>
                  <div className="space-y-3">
                    {pkg.activities && pkg.activities.length > 0 ? (
                      pkg.activities.map((activityName) => (
                        <div
                          key={activityName}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedActivities[activityName]
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleActivity(activityName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedActivities[activityName] || false}
                                onChange={() => toggleActivity(activityName)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{activityName}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No customizable activities available for this package.</p>
                    )}
                  </div>
                </div>

                {/* Total Price Display */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <span className="text-xl font-semibold text-gray-900">Total Price:</span>
                  <span className="text-2xl font-bold text-primary-600">₹{totalPrice.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleConfirm}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Package className="w-5 h-5" />
                    <span>Book Customized Package</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizePackageModal;
