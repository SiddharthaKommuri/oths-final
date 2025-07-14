// src/pages/ManagePackages.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import EditPackageModal from '../../components/ui/EditPackageModal';
import { Package, Edit, Search, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import TravelPackageService from '../../services/TravelPackageService';

const ManagePackages = () => {
  const { user, token } = useAuth();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [editModal, setEditModal] = useState({ isOpen: false, package: null });
  const [filters, setFilters] = useState({
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && token) {
      loadPackages();
    } else if (!user && !token) {
      setPackages([]);
      setFilteredPackages([]);
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    filterPackages();
  }, [packages, filters]);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting to load packages...");
      console.log("Current User from AuthContext:", user);
      console.log("Auth Token from AuthContext:", token ? 'Available' : 'Not Available');

      const packagesResponse = await TravelPackageService.getAllPackages(
        0,
        100, // Fetch a larger page size to get all packages, or implement pagination
        'packageId',
        'asc',
        token
      );
      const allFetchedPackages = packagesResponse.data.content;

      console.log("Raw packages fetched from backend:", allFetchedPackages);
      console.log("Type of allFetchedPackages:", typeof allFetchedPackages, "Is Array:", Array.isArray(allFetchedPackages));

      if (!Array.isArray(allFetchedPackages)) {
        console.error("Expected allFetchedPackages to be an array, but received:", allFetchedPackages);
        setError("Data format error from server. Please contact support.");
        setLoading(false);
        return;
      }

      // --- MODIFIED SECTION START ---
      // Since pkg.createdBy is always "system" and cannot be changed on backend,
      // we are removing the filter by createdBy to display all fetched packages.
      // If "My Packages" should only show packages actually created by the agent,
      // the backend's `createdBy` field *must* store the agent's userId.
      const agentPackages = allFetchedPackages; // Display all packages
      // --- MODIFIED SECTION END ---

      console.log("Packages after removing createdBy filtering:", agentPackages);
      setPackages(agentPackages);

    } catch (err) {
      console.error("Error loading packages in ManagePackages:", err);
      if (err.response) {
        console.error("Error Response Data:", err.response.data);
        console.error("Error Response Status:", err.response.status);
        console.error("Error Response Headers:", err.response.headers);
      }
      setError("Failed to load packages. Please ensure backend is running, API URL is correct, and you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];
    if (filters.search) {
      filtered = filtered.filter(pkg =>
        pkg.packageName.toLowerCase().includes(filters.search.toLowerCase()) ||
        pkg.location.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    setFilteredPackages(filtered);
  };

  const handleEdit = (pkg) => {
    setEditModal({ isOpen: true, package: pkg });
  };

  const handleEditSave = async (updatedPackage) => {
    try {
      await TravelPackageService.updatePackageById(updatedPackage.packageId, updatedPackage, token);
      console.log("Package updated successfully:", updatedPackage);
      loadPackages();
      setEditModal({ isOpen: false, package: null });
    } catch (err) {
      console.error("Error saving package update:", err);
      setError("Failed to update package. Please try again.");
    }
  };

  const handleDelete = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      setLoading(true);
      setError(null);
      try {
        await TravelPackageService.deletePackageById(packageId, token);
        console.log(`Package with ID ${packageId} deleted successfully.`);
        loadPackages();
      } catch (err) {
        console.error("Error deleting package:", err);
        setError("Failed to delete package. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const getBookingCount = (packageName) => {
    const allBookings = JSON.parse(localStorage.getItem('travora_bookings') || '[]');
    return allBookings.filter(booking =>
      booking.type === 'package' && booking.packageName === packageName
    ).length;
  };

  if (loading) {
    return (
      <DashboardLayout title="My Packages">
        <div className="text-center py-10">Loading packages...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Packages">
        <div className="text-center py-10 text-red-500">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Packages">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Travel Packages</h1>
            <p className="text-gray-600">View and manage all your created packages</p>
          </div>
          <Link to="/travel-agent/create-package" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Package</span>
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages by name or location..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
{/*                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.packageId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pkg.packageName}</div>
                            <div className="text-sm text-gray-500">Created {new Date(pkg.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pkg.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{pkg.price}
                      </td>
{/*                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getBookingCount(pkg.packageName)} bookings
                        </span>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.packageId)}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                      <p className="text-gray-600 mb-4">
                        {filters.search
                          ? 'Try adjusting your search filters'
                          : 'No packages created by you yet.'}
                      </p>
                      {!filters.search && (
                        <Link to="/travel-agent/create-package" className="btn-primary">
                          Create Your First Package
                        </Link>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <EditPackageModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, package: null })}
          package={editModal.package}
          onSave={handleEditSave}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManagePackages;