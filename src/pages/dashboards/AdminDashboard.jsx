import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Users,
  Building,
  Plane,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  BarChart3,
  Activity,
  IndianRupee,
} from 'lucide-react';


import { useAuth } from '../../contexts/AuthContext';
import * as UserService from '../../services/UserService'; 
import BookingService from '../../services/BookingService'; 
import * as HotelService from '../../services/HotelServiceSid'; 
import SupportTicketService from '../../services/SupportTicketService'; 
import PaymentService from '../../services/PaymentService'; 

const AdminDashboard = () => {
  const { user, token, loading: authLoading } = useAuth();

  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0, 
    activeHotels: 0,
    pendingTickets: 0,
    monthlyGrowth: 0, 
    paymentsResponse:0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  
  const [recentActivity] = useState([
    {
      id: 1,
      type: 'booking',
      message: 'New hotel booking by John Doe',
      time: '2 minutes ago',
      amount: '$299',
    },
    {
      id: 2,
      type: 'user',
      message: 'New user registration: Jane Smith',
      time: '5 minutes ago',
    },
    {
      id: 3,
      type: 'hotel',
      message: 'Hotel "Ocean View Resort" updated availability',
      time: '10 minutes ago',
    },
    {
      id: 4,
      type: 'support',
      message: 'New support ticket #1234 created',
      time: '15 minutes ago',
    },
  ]);

  const [topPerformers] = useState([
    { name: 'Grand Plaza Hotel', bookings: 234, revenue: '$45,600' },
    { name: 'Ocean View Resort', bookings: 198, revenue: '$39,200' },
    { name: 'Mountain Lodge', bookings: 156, revenue: '$31,200' },
    { name: 'City Center Hotel', bookings: 142, revenue: '$28,400' },
  ]);

  
  const fetchDashboardStats = useCallback(async () => {
    
    if (authLoading) {
      setLoadingStats(true);
      return;
    }

    
    if (!user || !token) {
      setLoadingStats(false);
      setStatsError("Authentication required to view dashboard statistics.");
      return;
    }

    setLoadingStats(true);
    setStatsError(null);

    try {
      
      const [
        usersData,
        bookingsResponse, 
        hotelsData,
        pendingTicketsResponse, 
        paymentsResponse
      ] = await Promise.all([
        UserService.getAllUsers(token),
        BookingService.getAllBookings(0, 1, 'bookingId', 'Asc', token), 
        HotelService.getAllHotels(token),
        SupportTicketService.getTicketsByStatus('OPEN', token), 
        PaymentService.getAllPayments(token)
      ]);

      
      
      
      console.log(bookingsResponse.data.content);
      
      const allPayments = paymentsResponse.data.payments || [];
      const currentRevenue = allPayments.reduce((sum, payment) => {
        
        if (payment.paymentStatus && payment.paymentStatus.toLowerCase() !== 'cancelled') {
          return sum + (payment.amount || 0);
        }
        return sum;
      }, 0);

      setStats({
        totalUsers: usersData.length,
        totalBookings: bookingsResponse.data.totalElements, 
        totalRevenue: currentRevenue, 
        activeHotels: hotelsData.length,
        pendingTickets: pendingTicketsResponse.data.length, 
        monthlyGrowth: 0, 
      });

    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setStatsError(err.message || "Failed to load dashboard statistics.");
      setStats({
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeHotels: 0,
        pendingTickets: 0,
        monthlyGrowth: 0,
      }); 
    } finally {
      setLoadingStats(false);
    }
  }, [authLoading, user, token]); 

  
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]); 

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'user':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'hotel':
        return <Building className="w-5 h-5 text-orange-600" />;
      case 'support':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type) => {
    switch (type) {
      case 'booking':
        return 'bg-green-100';
      case 'user':
        return 'bg-blue-100';
      case 'hotel':
        return 'bg-orange-100';
      case 'support':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="card p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Admin Control Center 🎛️
          </h1>
          <p className="text-gray-300">
            Monitor and manage your travel booking platform operations
          </p>
        </div>

        {/* Loading and Error Indicators for Stats */}
        {loadingStats ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        ) : statsError ? (
          <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p className="text-lg font-medium">Error: {statsError}</p>
            <p className="text-gray-600">Please ensure the backend services are running and you are logged in with appropriate permissions.</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500 mt-1">
                    </p>
                  </div>
                  <IndianRupee className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600"> Hotels</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeHotels.toLocaleString()}</p>
                  </div>
                  <Building className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingTickets.toLocaleString()}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-red-600" />
                </div>
              </div>

             
            </div>

            
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
