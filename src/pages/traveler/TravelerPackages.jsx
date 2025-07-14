import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PackageCard from '../../components/ui/PackageCard';
import CustomizePackageModal from '../../components/ui/CustomizePackageModal';
import PaymentModal from '../../components/ui/PaymentModal';
import { saveBooking } from '../../data/mockData'; 
import PackageService from '../../services/TravelPackageService'; 
import { Search, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
 


import imageUdaipur from '../../assets/image.jfif'; 
import imageSrinagar from '../../assets/pexels-photonova-2907578.jpg'; 
 
const TravelerPackages = () => {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customizeModal, setCustomizeModal] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: 'all'
  });
  
  const [packageBookingData, setPackageBookingData] = useState({
    travelers: 1,
    customizationDetails: 'No customization', 
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, loading: authLoading, user, logout } = useAuth();

  useEffect(() => {
    const fetchPackages = async () => {
      if (authLoading) {
        console.log("Auth context still loading, waiting to fetch packages...");
        return;
      }

      if (!isAuthenticated || !token) {
        console.warn("User not authenticated or token missing. Redirecting to login.");
        navigate('/login', { state: { from: location.pathname } });
        return;
      }

      try {
        console.log("Attempting to fetch packages with token:", token);
        
        const response = await PackageService.getAllPackages(0, 10, "packageId", "asc", token);
        
        const packagesWithImages = response.data.content.map(pkg => {
          let assignedImage = '';
          const lowerCaseLocation = pkg.location?.toLowerCase();

          switch (lowerCaseLocation) {
            case 'udaipur':
              assignedImage = imageUdaipur;
              break;
            case 'srinagar':
              assignedImage = imageSrinagar;
              break;
            default:
              assignedImage = 'https://via.placeholder.com/400x200?text=Travel+Package';
          }

          return { ...pkg, image: assignedImage };
        });

        setPackages(packagesWithImages);
        filterPackages({ ...filters, packages: packagesWithImages });
        console.log("Packages fetched successfully!");
      } catch (error) {
        console.error("Error fetching packages:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Your session has expired or you are not authorized. Please log in again.");
          logout();
          navigate('/login', { state: { from: location.pathname } });
        } else {
          toast.error("Failed to load packages. Please try again later.");
        }
      }
    };
    fetchPackages();
  }, [authLoading, isAuthenticated, token, navigate, logout, location.pathname, filters]);

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    filterPackages({ ...filters, search: searchTerm, packages: packages });
  };

  const filterPackages = (currentFilters) => {
    let sourcePackages = currentFilters.packages || packages;
    let filtered = [...sourcePackages];

    if (currentFilters.search) {
      const searchTermLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(pkg =>
        pkg.packageName?.toLowerCase().includes(searchTermLower) || 
        pkg.location?.toLowerCase().includes(searchTermLower) ||
        pkg.description?.toLowerCase().includes(searchTermLower)
      );
    }

    if (currentFilters.location !== 'all') {
      filtered = filtered.filter(pkg => pkg.location?.toLowerCase() === currentFilters.location.toLowerCase());
    }

    setFilteredPackages(filtered);
  };

  const handleCustomize = (pkg) => {
    setSelectedPackage(pkg);
    setCustomizeModal(true);
  };

  const handleBookDirect = (pkg) => {
    console.log("TravelerPackages: handleBookDirect triggered.");
    
    if (!user || !token) {
      toast.error("Please log in to book a package.");
      console.log("TravelerPackages: Booking aborted due to missing user or token.");
      return;
    }

    const directBookingData = {
      travelers: 1,
      customizationDetails: 'No customization',
    };

    setSelectedPackage(pkg); 
    setPackageBookingData(directBookingData); 
    setIsPaymentModalOpen(true); 
    console.log("TravelerPackages: Payment modal set to open for direct booking.");
  };

  const handleCustomizeConfirm = (customizedPackage) => {
    console.log("TravelerPackages: handleCustomizeConfirm triggered.");
    
    if (!user || !token) {
      toast.error("Please log in to book a package.");
      console.log("TravelerPackages: Booking aborted due to missing user or token.");
      setCustomizeModal(false); 
      return;
    }

    
    const customizationString = customizedPackage.selectedActivities && customizedPackage.selectedActivities.length > 0
      ? `Customized activities: ${customizedPackage.selectedActivities.join(', ')}`
      : 'No specific activities selected';

    
    const customizedBookingData = {
      travelers: customizedPackage.travelers, 
      customizationDetails: customizationString,
    };

    
    const finalSelectedPackage = {
      ...selectedPackage, 
      price: customizedPackage.totalPrice, 
      
    };

    setSelectedPackage(finalSelectedPackage); 
    setPackageBookingData(customizedBookingData); 
    setCustomizeModal(false); 
    setIsPaymentModalOpen(true); 
    console.log("TravelerPackages: Payment modal set to open for customized package.");
  };

  

  const locations = [...new Set(packages.map(pkg => pkg.location))];

  return (
    <DashboardLayout title="Travel Packages">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="card p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages, destinations..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.location}
              onChange={(e) => {
                const newFilters = { ...filters, location: e.target.value };
                setFilters(newFilters);
                filterPackages(newFilters);
              }}
              className="input-field"
            >
              <option value="all">All Destinations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredPackages.length} packages found
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.packageId || pkg.id}
              package={pkg}
              onCustomize={handleCustomize}
              onBook={handleBookDirect}
            />
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}

        <CustomizePackageModal
          isOpen={customizeModal}
          onClose={() => setCustomizeModal(false)}
          package={selectedPackage}
          onConfirm={handleCustomizeConfirm}
        />

       
        <PaymentModal
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)}
          selectedItem={selectedPackage} 
          bookingType="itinerary"          
          searchData={packageBookingData} 
          user={user}                    
          token={token}                  
          navigate={navigate}            
        />
      </div>
    </DashboardLayout>
  );
};

export default TravelerPackages;