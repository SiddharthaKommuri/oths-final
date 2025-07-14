import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Plus,
  Edit,
  Eye,
  Building,
  DollarSign,
  Users,
  Loader2,
  IndianRupee, 
} from "lucide-react";
import hotelService from "../../services/hotelService";
import * as BookingService from "../../services/BookingServiceSid"; 
import PaymentService from "../../services/PaymentService"; 
import { toast } from "react-toastify"; 



const getColorClasses = (c) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return colors[c] || colors.blue;
};


const SummaryCard = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="card p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(
          color
        )}`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

const HotelManagerDashboard = () => {
  const { token, user, loading: authLoading } = useAuth(); 

  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRevenue: 0,
    totalBookings: 0,
  });

  const [recentHotels, setRecentHotels] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const loadDashboardData = useCallback(async () => {
    console.log("loadDashboardData: Starting data fetch...");
    
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!token || !user?.userId) {
      setLoading(false);
      setError("Authentication required. Please log in.");
      console.log("loadDashboardData: Authentication missing.");
      return;
    }

    
    if (user.role !== 'hotel_manager') {
      setLoading(false);
      setError("Access Denied: You must be a Hotel Manager to view this page.");
      setStats({ totalHotels: 0, totalRevenue: 0, totalBookings: 0 });
      setRecentHotels([]);
      setRecentBookings([]);
      console.log("loadDashboardData: Access denied for user role:", user.role);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("loadDashboardData: Fetching hotels, bookings, and payments concurrently...");
      const [allHotelsResponse, allBookingsResponse, allPaymentsResponse] = await Promise.all([
        hotelService.getAllHotels(token),
        BookingService.getAllBookings(token, { pageNo: 0, pageSize: 1000 }), 
        PaymentService.getAllPayments(token), 
      ]);

      console.log("loadDashboardData: Fetched All Hotels (raw):", allHotelsResponse);
      console.log("loadDashboardData: Fetched All Bookings Raw Response:", allBookingsResponse);
      console.log("loadDashboardData: Fetched All Payments Raw Response:", allPaymentsResponse);

      
      
      
      
      
      
      const managerHotels = allHotelsResponse.filter(
        (hotel) => {
          console.log(`Filtering hotel: ${hotel.name} (ID: ${hotel.hotelId}), createdBy: "${hotel.createdBy}" (Type: ${typeof hotel.createdBy})`);
          console.log(`Current user.userId: "${user.userId}" (Type: ${typeof user.userId})`);
          return hotel.createdBy === "HotelManager"; 
        }
      );
      setRecentHotels(
        [...managerHotels]
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.updatedAt || 0) - 
              new Date(a.createdAt || a.updatedAt || 0)
          )
          .slice(0, 2)
      );
      setStats((prev) => ({
        ...prev,
        totalHotels: managerHotels.length,
      }));
      console.log("loadDashboardData: Manager's Hotels (filtered):", managerHotels);


      
      const allBookingsContent = allBookingsResponse.content || []; 
      
      const hotelBookings = allBookingsContent.filter(
        (booking) =>
          booking.type === "hotel" && 
          managerHotels.some((hotel) => String(hotel.hotelId) === String(booking.hotelId)) 
      );
      console.log("loadDashboardData: Processed Filtered Hotel Bookings:", hotelBookings);


      
      let fetchedPayments = [];
      if (allPaymentsResponse.data && Array.isArray(allPaymentsResponse.data.content)) {
        fetchedPayments = allPaymentsResponse.data.content;
        console.log("loadDashboardData: Payments found in .data.content.");
      } else if (allPaymentsResponse.data && Array.isArray(allPaymentsResponse.data.payments)) {
        fetchedPayments = allPaymentsResponse.data.payments;
        console.log("loadDashboardData: Payments found in .data.payments.");
      } else if (Array.isArray(allPaymentsResponse.data)) {
        fetchedPayments = allPaymentsResponse.data;
        console.log("loadDashboardData: Payments found directly in .data.");
      } else {
        console.warn("loadDashboardData: Unexpected payment API response structure. Payments not found in expected paths.", allPaymentsResponse);
        toast.warn("Could not load payment data for revenue calculation. Check console for details.");
      }
      console.log("loadDashboardData: Processed Fetched Payments:", fetchedPayments);

      
      const paymentMap = new Map();
      fetchedPayments.forEach(payment => {
        if (payment.bookingId !== undefined && payment.bookingId !== null) {
          paymentMap.set(String(payment.bookingId), payment);
        } else {
          console.warn("Payment object missing bookingId, skipping:", payment);
        }
      });
      console.log("loadDashboardData: Payment Map created with size:", paymentMap.size);

      
      let totalRevenue = 0;
      console.log("loadDashboardData: Starting revenue calculation loop...");
      hotelBookings.forEach(booking => {
        console.log("  Processing booking:", booking);
        const associatedPayment = paymentMap.get(String(booking.bookingId));
        console.log("  Associated payment for booking:", associatedPayment);
        if (associatedPayment) {
          console.log("  Payment status:", associatedPayment.paymentStatus, "Amount:", associatedPayment.amount);
          if (associatedPayment.paymentStatus && String(associatedPayment.paymentStatus).toLowerCase() === "completed") {
            totalRevenue += (associatedPayment.amount || 0); 
            console.log("  Payment is COMPLETED. Added amount. Current totalRevenue:", totalRevenue);
          } else {
            console.log("  Payment is NOT completed. Skipping revenue addition.");
          }
        } else {
          console.log("  No associated payment found for this booking.");
        }
      });

      setStats((prev) => ({
        ...prev,
        totalBookings: hotelBookings.length,
        totalRevenue: totalRevenue,
      }));
      setRecentBookings(
        [...hotelBookings]
          .sort((a, b) => new Date(b.createdAt || b.bookingDate || 0) - new Date(a.createdAt || a.bookingDate || 0)) 
          .slice(0, 5) 
      );
      console.log("loadDashboardData: Dashboard stats updated:", { totalHotels: managerHotels.length, totalBookings: hotelBookings.length, totalRevenue: totalRevenue });

    } catch (error) {
      console.error("loadDashboardData: Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      toast.error(
        "Failed to load dashboard data: " + (error.response?.data?.message || error.message || "Unknown error")
      );
      setStats({ totalHotels: 0, totalRevenue: 0, totalBookings: 0 });
      setRecentHotels([]);
      setRecentBookings([]);
    } finally {
      setLoading(false);
      console.log("loadDashboardData: Data fetch complete.");
    }
  }, [token, user, authLoading]); 

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]); 

  const quickActions = [
    {
      icon: Plus,
      title: "Add New Hotel",
      description: "Create a new hotel listing",
      link: "/hotel-manager/create-hotel",
      color: "blue",
    },
    {
      icon: Edit,
      title: "Manage Hotels",
      description: "Edit existing hotels",
      link: "/hotel-manager/manage-hotels",
      color: "green",
    },
    {
      icon: Eye,
      title: "View Bookings",
      description: "Check hotel bookings",
      link: "/hotel-manager/bookings", 
      color: "purple",
    },
  ];

  return (
    <DashboardLayout title="Hotel Manager Dashboard">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8"> {/* Added responsive padding */}
        <div className="card p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName}! 🏨
          </h1>
          <p className="text-blue-100">
            Manage your hotels and track bookings with your dashboard.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <SummaryCard
                title="Total Hotels"
                value={stats.totalHotels}
                icon={Building}
                color="blue"
                trend="Managed by you"
              />
              
              <SummaryCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon={Users}
                color="purple"
                trend="For your hotels"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Recent Hotels
                    </h2>
                    <Link
                      to="/hotel-manager/manage-hotels"
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View All →
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {recentHotels.length > 0 ? (
                      recentHotels.map((hotel) => (
                        <div
                          key={hotel.hotelId}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {hotel.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {hotel.location}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{hotel.pricePerNight?.toFixed(2) || "0.00"}/night
                            </p>
                            <p className="text-sm text-gray-500">
                              {hotel.roomsAvailable} rooms
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hotels created yet</p>
                        <Link
                          to="/hotel-manager/create-hotel"
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Create your first hotel →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={index}
                          to={action.link}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(
                              action.color
                            )}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 group-hover:text-primary-600">
                              {action.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {action.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

              
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HotelManagerDashboard;
