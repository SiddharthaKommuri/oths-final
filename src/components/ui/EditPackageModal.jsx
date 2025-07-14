import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
 
const EditPackageModal = ({ isOpen, onClose, package: pkg, onSave }) => {
  
  const [formData, setFormData] = useState({
    packageName: '',
    location: '',
    includedHotelIds: '', 
    includedFlightIds: '', 
    activities: '',      
    price: '',
  });
 
  
  useEffect(() => {
    if (pkg) {
      setFormData({
        packageName: pkg.packageName || '',
        location: pkg.location || '',
        
        includedHotelIds: Array.isArray(pkg.includedHotelIds) ? pkg.includedHotelIds.join(', ') : '',
        includedFlightIds: Array.isArray(pkg.includedFlightIds) ? pkg.includedFlightIds.join(', ') : '',
        activities: Array.isArray(pkg.activities) ? pkg.activities.join(', ') : '',
        price: pkg.price || '',
      });
    }
  }, [pkg]);
 
  
  if (!isOpen || !pkg) return null;
 
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
 
  
  const handleSubmit = (e) => {
    e.preventDefault();
 
    
    const parsedHotelIds = formData.includedHotelIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '') 
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id)); 
 
    const parsedFlightIds = formData.includedFlightIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));
 
    const parsedActivities = formData.activities
      .split(',')
      .map(activity => activity.trim())
      .filter(activity => activity !== '');
 
    
    const updatedPackage = {
      packageId: pkg.packageId, 
      packageName: formData.packageName,
      location: formData.location,
      includedHotelIds: parsedHotelIds,
      includedFlightIds: parsedFlightIds,
      activities: parsedActivities,
      price: parseFloat(formData.price), 
      
      createdBy: pkg.createdBy, 
      status: pkg.status,       
    };
 
    
    onSave(updatedPackage);
  };
 
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
 
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Package</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
 
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Name
                </label>
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) => handleChange('packageName', e.target.value)}
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
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Included Hotel IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.includedHotelIds}
                  onChange={(e) => handleChange('includedHotelIds', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 1, 2, 3"
                  required
                />
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Included Flight IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.includedFlightIds}
                  onChange={(e) => handleChange('includedFlightIds', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 101, 102"
                  required
                />
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.activities}
                  onChange={(e) => handleChange('activities', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Hiking, Sightseeing"
                  required
                />
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="input-field"
                  step="0.01" 
                  required
                />
              </div>
            </div>
 
            {/* Removed Description and Additional Information fields */}
 
            {/* Actions */}
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
 
export default EditPackageModal;