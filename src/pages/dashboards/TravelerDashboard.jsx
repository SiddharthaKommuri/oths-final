import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import BookingCard from "../../components/ui/BookingCard";
import {
  Calendar,
  MapPin,
  CreditCard,
  Star,
  Plane,
  Building,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
 
import { getBookingsByUserId } from "../../services/BookingServiceSid";
import { getReviewsByUserId } from "../../services/ReviewService";
import HotelService from "../../services/hotelService";
import FlightService from "../../services/FlightService";
import * as TravelPackageService from "../../services/TravelPackageService";
import * as ItineraryService from "../../services/ItineraryServiceSid";
import PaymentService from "../../services/PaymentService";
 
const TravelerDashboard = () => {
  const { user, token, authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    reviewsWritten: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    let isMounted = true;
 
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      setError(null);
      try {
        if (!user?.userId) {
          throw new Error("User ID is not available.");
        }
 
        const bookingsResponse = await getBookingsByUserId(user.userId, token, {
          pageSize: 100,
        });
        const bookings = bookingsResponse?.content || [];
 
        const reviewsResponse = await getReviewsByUserId(user.userId, token);
        let reviewsCount = 0;
       
        if (reviewsResponse) {
          if (reviewsResponse.totalElements !== undefined) {
           
            reviewsCount = reviewsResponse.totalElements;
          } else if (Array.isArray(reviewsResponse.content)) {
           
            reviewsCount = reviewsResponse.content.length;
          } else if (Array.isArray(reviewsResponse)) {
           
            reviewsCount = reviewsResponse.length;
          }
         
        }
 
       
        const hotelBookings = bookings.filter(
          (b) => b.type?.toLowerCase() === "hotel" && b.hotelId
        );
        const uniqueHotelIds = [
          ...new Set(hotelBookings.map((b) => b.hotelId)),
        ];
 
        let hotelsData = {};
        if (uniqueHotelIds.length > 0) {
          for (const hotelId of uniqueHotelIds) {
            try {
              const hotelDetail = await HotelService.getHotelById(
                hotelId,
                token
              );
              if (hotelDetail.data) {
                hotelsData[hotelId] = hotelDetail.data;
              }
            } catch (hotelErr) {
              console.warn(
                `Could not fetch details for hotelId ${hotelId}:`,
                hotelErr
              );
              hotelsData[hotelId] = {
                name: "Hotel Not Found",
                location: "N/A",
                rating: null,
              };
            }
          }
        }
 
       
        const flightBookings = bookings.filter(
          (b) => b.type?.toLowerCase() === "flight" && b.flightId
        );
        const uniqueFlightIds = [
          ...new Set(flightBookings.map((b) => b.flightId)),
        ];
 
        let flightsData = {};
        if (uniqueFlightIds.length > 0) {
          for (const flightId of uniqueFlightIds) {
            try {
              const flightDetail = await FlightService.getFlightById(
                flightId,
                token
              );
              if (flightDetail.data) {
                flightsData[flightId] = flightDetail.data;
              }
            } catch (flightErr) {
              console.warn(
                `Could not fetch details for flightId ${flightId}:`,
                flightErr
              );
              flightsData[flightId] = {
                airline: "Airline Not Found",
                flightNumber: "N/A",
              };
            }
          }
        }
 
       
        const packageBookings = bookings.filter(
          (b) => b.type?.toLowerCase() === "package" && b.packageId
        );
        const uniquePackageIds = [
          ...new Set(packageBookings.map((b) => b.packageId)),
        ];
 
        let packagesData = {};
        if (uniquePackageIds.length > 0) {
          for (const packageId of uniquePackageIds) {
            try {
              const packageDetailResponse =
                await TravelPackageService.getPackageById(packageId, token);
              if (packageDetailResponse.data) {
               
                packagesData[packageId] = packageDetailResponse.data;
              }
            } catch (packageErr) {
              console.warn(
                `Could not fetch details for packageId ${packageId}:`,
                packageErr
              );
              packagesData[packageId] = {
                packageName: "Package Not Found",
                location: "N/A",
              };
            }
          }
        }
 
       
        const itineraryBookings = bookings.filter(
          (b) => b.type?.toLowerCase() === "package" && b.itineraryId
        );
        const uniqueItineraryIds = [
          ...new Set(itineraryBookings.map((b) => b.itineraryId)),
        ];
 
        let itinerariesData = {};
        if (uniqueItineraryIds.length > 0) {
          for (const itineraryId of uniqueItineraryIds) {
            try {
              const itineraryDetailResponse =
                await ItineraryService.getItineraryById(itineraryId, token);
              if (itineraryDetailResponse.data) {
               
                itinerariesData[itineraryId] = itineraryDetailResponse.data;
              }
            } catch (itineraryErr) {
              console.warn(
                `Could not fetch details for itineraryId ${itineraryId}:`,
                itineraryErr
              );
              itinerariesData[itineraryId] = {
                customizationDetails: "N/A",
                price: null,
              };
            }
          }
        }
 
       
        let userPayments = [];
        try {
          const paymentResponse = await PaymentService.getPaymentsByUserId(
            user.userId,
            token
          );
          if (
            paymentResponse.data &&
            Array.isArray(paymentResponse.data.payments)
          ) {
            userPayments = paymentResponse.data.payments;
          } else if (Array.isArray(paymentResponse.data)) {
            userPayments = paymentResponse.data;
          } else {
            console.warn(
              "PaymentService.getPaymentsByUserId did not return an array of payments in 'data.payments' or 'data':",
              paymentResponse
            );
          }
        } catch (paymentErr) {
          console.warn("Could not fetch user payments:", paymentErr);
        }
 
       
        const paymentMap = new Map();
        userPayments.forEach((payment) => {
          if (payment.bookingId) {
            paymentMap.set(payment.bookingId, payment);
          } else {
            console.warn("Payment object missing bookingId:", payment);
          }
        });
 
       
        const hydratedBookings = bookings.map((booking) => {
          let hydratedBooking = { ...booking };
 
         
          if (
            hydratedBooking.type?.toLowerCase() === "hotel" &&
            hydratedBooking.hotelId &&
            hotelsData[hydratedBooking.hotelId]
          ) {
            const hotelDetails = hotelsData[hydratedBooking.hotelId];
            hydratedBooking = {
              ...hydratedBooking,
              hotelName: hotelDetails.name || hotelDetails.hotelName,
              location: hotelDetails.location,
              rating: hotelDetails.rating,
              displayPrice: hotelDetails.pricePerNight,
              createdAt: hotelDetails.createdAt || hydratedBooking.createdAt,
            };
          }
 
         
          if (
            hydratedBooking.type?.toLowerCase() === "flight" &&
            hydratedBooking.flightId &&
            flightsData[hydratedBooking.flightId]
          ) {
            const flightDetails = flightsData[hydratedBooking.flightId];
            hydratedBooking = {
              ...hydratedBooking,
              airline: flightDetails.airline,
             
              flightId:
                flightDetails.flightId ||
                flightDetails.flightNumber ||
                hydratedBooking.flightId,
              flightNumber: flightDetails.flightNumber,
              departureTime: flightDetails.departureTime,
              arrivalTime: flightDetails.arrivalTime,
              displayPrice: flightDetails.price,
              createdAt: flightDetails.createdAt || hydratedBooking.createdAt,
            };
          }
 
         
          if (
            hydratedBooking.type?.toLowerCase() === "package" &&
            hydratedBooking.packageId &&
            packagesData[hydratedBooking.packageId]
          ) {
            const packageDetails = packagesData[hydratedBooking.packageId];
            hydratedBooking = {
              ...hydratedBooking,
              packageName: packageDetails.packageName,
              packageLocation: packageDetails.location,
              includedHotelIds: packageDetails.includedHotelIds,
              includedFlightIds: packageDetails.includedFlightIds,
              activities: packageDetails.activities,
            };
          }
 
         
          if (
            hydratedBooking.type?.toLowerCase() === "package" &&
            hydratedBooking.itineraryId &&
            itinerariesData[hydratedBooking.itineraryId]
          ) {
            const itineraryDetails =
              itinerariesData[hydratedBooking.itineraryId];
            hydratedBooking = {
              ...hydratedBooking,
              itineraryCustomizationDetails:
                itineraryDetails.customizationDetails,
              itineraryPrice: itineraryDetails.price,
             
              displayPrice: itineraryDetails.price,
             
              packageName:
                itineraryDetails.packageName ||
                hydratedBooking.packageName ||
                "Custom Itinerary",
              packageLocation:
                itineraryDetails.location ||
                hydratedBooking.packageLocation ||
                "Various Locations",
            };
          }
 
         
          if (
            hydratedBooking.bookingId &&
            paymentMap.has(hydratedBooking.bookingId)
          ) {
            hydratedBooking = {
              ...hydratedBooking,
              paymentDetails: paymentMap.get(hydratedBooking.bookingId),
            };
          }
          return hydratedBooking;
        });
 
        if (isMounted) {
          setStats({
            totalBookings: hydratedBookings.length,
            reviewsWritten: reviewsCount,
          });
         
          setRecentBookings(hydratedBookings.slice(-3).reverse());
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load dashboard data.");
        }
      } finally {
        if (isMounted) {
          setDashboardLoading(false);
        }
      }
    };
 
   
   
    if (!authLoading) {
      if (user?.userId && token) {
        loadDashboardData();
      } else {
       
       
        setDashboardLoading(false);
      }
    }
 
    return () => {
      isMounted = false;
    };
  }, [user, token, authLoading]);
 
  const quickActions = [
    {
      icon: Building,
      title: "Search Hotels",
      description: "Find and book hotels worldwide",
      link: "/traveler/hotels",
      color: "blue",
    },
    {
      icon: Plane,
      title: "Search Flights",
      description: "Book flights to your destination",
      link: "/traveler/flights",
      color: "green",
    },
    {
      icon: Package,
      title: "Travel Packages",
      description: "Explore curated travel packages",
      link: "/traveler/packages",
      color: "purple",
    },
    {
      icon: Star,
      title: "Leave Reviews",
      description: "Share your travel experiences",
      link: "/traveler/reviews",
      color: "yellow",
    },
  ];
 
  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      yellow: "bg-yellow-100 text-yellow-600",
    };
    return colors[color] || colors.blue;
  };
 
 
  if (authLoading || dashboardLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }
 
 
  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64 text-red-600">
          <p>Error: {error}</p>
        </div>
      </DashboardLayout>
    );
  }
 
 
  if (!user?.userId) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64 text-gray-600">
          <p>Please log in to view your dashboard.</p>
          {/* You might want a button to redirect to login here */}
        </div>
      </DashboardLayout>
    );
  }
 
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName}! ✈️
          </h1>
          <p className="text-primary-100">
            Ready for your next adventure? Let's plan something amazing
            together.
          </p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalBookings}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  All time
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
          </div>
 
         
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Bookings
                </h2>
                <Link
                  to="/traveler/bookings"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>
 
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <BookingCard
                      key={booking.id || booking.bookingId}
                      booking={booking}
                      showActions={false}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings yet</p>
                    <p className="text-gray-400 text-sm">
                      Start planning your first trip!
                    </p>
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
 
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Travel Tips
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Pro Tip
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Book flights 6-8 weeks in advance for the best deals
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🏨 Hotel Tip
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Check cancellation policies before booking
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">
                    🛡️ Safety Tip
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Consider travel insurance for international trips
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
 
export default TravelerDashboard;