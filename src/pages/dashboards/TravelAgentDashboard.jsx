// src/pages/TravelAgentDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SummaryCard from '../../components/ui/SummaryCard';
import {
  Package,
  DollarSign,
  Star,
  Users,
  Plus,
  Eye,
  Edit,
} from 'lucide-react';

import TravelPackageService from '../../services/TravelPackageService'; // Adjust path as needed

const TravelAgentDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalBookings: 0,
  });
  const [recentPackages, setRecentPackages] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const packagesResponse = await TravelPackageService.getAllPackages(
        0,
        10,
        'packageId',
        'asc',
        token
      );

      const allPackages = packagesResponse.data.content;

      if (!Array.isArray(allPackages)) {
          console.error("Expected allPackages to be an array, but received:", allPackages);
          setError("Data format error from server. Please contact support.");
          setLoading(false);
          return;
      }

      console.log("All packages fetched from backend:", allPackages);
      console.log("Current user object from AuthContext:", user);

      // Access user.userId
      console.log("Current user ID (user?.userId):", user?.userId, "Type:", typeof user?.userId);
      const currentUserId = user?.userId ? Number(user.userId) : null;
      console.log("Converted user ID (currentUserId):", currentUserId, "Type:", typeof currentUserId);

      // --- MODIFIED SECTION START ---
      // If backend `createdBy` is always "system" and cannot be changed,
      // and you still want to display packages, you must remove or alter the filtering logic.
      // This change will display ALL packages fetched from the backend.
      const agentPackages = allPackages; // Simply assign all packages, no filtering by createdBy
      // --- MODIFIED SECTION END ---

      console.log("Agent packages after filtering (no longer filtering by createdBy):", agentPackages);

      // Get bookings for agent's packages (still using localStorage for simplicity)
      const allBookings = JSON.parse(localStorage.getItem('travora_bookings') || '[]');
      const packageBookings = allBookings.filter(booking =>
        booking.type === 'package' &&
        agentPackages.some(pkg => pkg.packageName === booking.packageName)
      );

      // Calculate stats
      const totalPackages = agentPackages.length;

      setStats({
        totalPackages,
        totalBookings: packageBookings.length,
      });

      // Set recent data
      setRecentPackages(agentPackages.slice(-3).reverse());
      setRecentBookings(packageBookings.slice(-5).reverse());

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      title: 'Create Package',
      description: 'Design a new travel package',
      link: '/travel-agent/create-package',
      color: 'blue'
    },
    {
      icon: Edit,
      title: 'Manage Packages',
      description: 'Edit existing packages',
      link: '/travel-agent/manage-packages',
      color: 'green'
    },
    {
      icon: Eye,
      title: 'View Bookings',
      description: 'Check package bookings',
      link: '/travel-agent/view-bookings',
      color: 'purple'
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <DashboardLayout title="Travel Agent Dashboard">
        <div className="text-center py-10">Loading dashboard data...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Travel Agent Dashboard">
        <div className="text-center py-10 text-red-500">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Travel Agent Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.username || user?.email}! 🌍
          </h1>
          <p className="text-purple-100">
            Create amazing travel experiences and manage your packages with ease.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Packages"
            value={stats.totalPackages}
            icon={Package}
            color="blue"
          />
          <SummaryCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Users}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Packages */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Packages</h2>
                <Link
                  to="/travel-agent/manage-packages"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {recentPackages.length > 0 ? (
                  recentPackages.map((pkg) => (
                    <div
                      key={pkg.packageId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{pkg.packageName}</h3>
                          <p className="text-sm text-gray-600">{pkg.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{pkg.price}</p>
                        <p className="text-sm text-gray-500">{pkg.status || 'N/A'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No packages created yet</p>
                    <Link to="/travel-agent/create-package" className="text-primary-600 hover:text-primary-700 text-sm">
                      Create your first package →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {/* <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.link}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(action.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-primary-600">
                          {action.title}
                        </p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div> */}

            {/* Recent Bookings */}
            {/* <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Bookings</h2>
              <div className="space-y-3">
                {recentBookings.length > 0 ? (
                  recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{booking.packageName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{booking.totalPrice}</p>
                        <p className="text-xs text-gray-500">{booking.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No bookings yet</p>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TravelAgentDashboard;