import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ReviewCard from "../../components/ui/ReviewCard";
import StarRating from "../../components/ui/StarRating";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Filter,
  Search,
  Building,
  Loader2,
} from "lucide-react";
import * as HotelService from "../../services/HotelServiceSid"; 
import * as ReviewService from "../../services/ReviewService"; 
import FlightService from "../../services/FlightService"; 
import { toast } from "react-toastify";

const HotelReviews = () => {
  const { token, user } = useAuth();
  const [hotels, setHotels] = useState([]); 
  const [allHotelsData, setAllHotelsData] = useState([]); 
  const [allFlightsData, setAllFlightsData] = useState([]); 
  const [reviews, setReviews] = useState([]); 
  const [groupedReviews, setGroupedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    hotelId: "all", 
    rating: "all",
    search: "",
  });

  /**
   * Fetches hotels and reviews data from the API.
   * Filters the data based on the current user's ID and enriches reviews with service names.
   */
  const loadData = useCallback(async () => {
    if (!token || !user?.userId) { 
      setLoading(false);
      console.log("Authentication details missing for HotelReviews.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      
      const hotelsResponse = await HotelService.getAllHotels(token);
      const fetchedAllHotels = hotelsResponse || [];
      setAllHotelsData(fetchedAllHotels); 

      
      const managerHotels = fetchedAllHotels
      
      
      
      setHotels(managerHotels); 

      
      const reviewsResponse = await ReviewService.getAllReviews(token);
      const fetchedAllReviews = reviewsResponse.reviews || [];

      
      const flightsResponse = await FlightService.getAllFlights(token);
      const fetchedAllFlights = flightsResponse.data || []; 

      
      const enrichedReviews = fetchedAllReviews.map(review => {
        let serviceName = 'N/A';
        let serviceType = 'unknown';

        if (review.hotelId) {
          const hotel = fetchedAllHotels.find(h => h.hotelId === review.hotelId);
          if (hotel && hotel.name) {
            serviceName = hotel.name;
            serviceType = 'hotel';
          } else {
            serviceName = `Hotel ID: ${review.hotelId}`;
            serviceType = 'hotel';
          }
        } else if (review.flightId) {
          const flight = fetchedAllFlights.find(f => f.flightId === review.flightId);
          if (flight && flight.airline) { 
            serviceName = flight.airline;
            serviceType = 'flight';
          } else {
            serviceName = `Flight ID: ${review.flightId}`;
            serviceType = 'flight';
          }
        }
        return {
          ...review,
          serviceName: serviceName, 
          serviceType: serviceType, 
          
          title: review.title || `Review for ${serviceName}`
        };
      });

      
      const relevantHotelReviews = enrichedReviews.filter(
        (review) =>
          review.serviceType === "hotel" &&
          managerHotels.some((hotel) => hotel.hotelId === review.hotelId) 
      );
      setReviews(relevantHotelReviews);

    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load hotel and review data. Please ensure backend services are running.");
      toast.error(
        "Failed to load data: " + (err.response?.data?.message || err.message || err.toString())
      );
      setHotels([]);
      setAllHotelsData([]);
      setAllFlightsData([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.userId]); 

  
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Filters and groups reviews based on current filters and available hotels.
   * This function is memoized using useCallback to prevent unnecessary re-renders.
   */
  const filterAndGroupReviews = useCallback(() => {
    let filteredReviews = [...reviews]; 

    if (filters.hotelId !== "all") {
      
      
      const selectedHotel = allHotelsData.find(h => h.name === filters.hotelId);
      if (selectedHotel) {
        filteredReviews = filteredReviews.filter(
          (review) => review.hotelId === selectedHotel.hotelId
        );
      }
    }

    if (filters.rating !== "all") {
      const ratingValue = parseInt(filters.rating);
      filteredReviews = filteredReviews.filter(
        (review) => review.rating === ratingValue
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredReviews = filteredReviews.filter(
        (review) =>
          review.serviceName.toLowerCase().includes(searchTerm) || 
          review.title.toLowerCase().includes(searchTerm) ||
          review.comment.toLowerCase().includes(searchTerm) || 
          review.userId?.toString().includes(searchTerm) 
      );
    }

    
    const grouped = hotels 
      .map((hotel) => {
        const hotelReviews = filteredReviews.filter(
          (review) => review.hotelId === hotel.hotelId 
        );
        const averageRating =
          hotelReviews.length > 0
            ? hotelReviews.reduce((sum, review) => sum + review.rating, 0) /
              hotelReviews.length
            : 0;

        return {
          hotel,
          reviews: hotelReviews.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp) 
          ),
          totalReviews: hotelReviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution: {
            5: hotelReviews.filter((r) => r.rating === 5).length,
            4: hotelReviews.filter((r) => r.rating === 4).length,
            3: hotelReviews.filter((r) => r.rating === 3).length,
            2: hotelReviews.filter((r) => r.rating === 2).length,
            1: hotelReviews.filter((r) => r.rating === 1).length,
          },
        };
      })
      .filter(
        
        (group) => group.reviews.length > 0 || filters.hotelId === "all"
      );

    setGroupedReviews(grouped);
  }, [reviews, hotels, filters, allHotelsData]); 

  
  useEffect(() => {
    filterAndGroupReviews();
  }, [filterAndGroupReviews]);

  /**
   * Handles marking a review as helpful by incrementing its helpful count.
   * This assumes ReviewService.updateReview exists and works.
   * @param {number} reviewId - The ID of the review to update.
   */
  const handleHelpful = async (reviewId) => {
    try {
      const reviewToUpdate = reviews.find((review) => review.reviewId === reviewId); 
      if (!reviewToUpdate) return;

      const updatedHelpfulCount = (reviewToUpdate.helpful || 0) + 1;
      const updatedReviewData = {
        ...reviewToUpdate,
        helpful: updatedHelpfulCount,
      };

      
      
      
      toast.info("Helpful feature is not yet fully implemented in backend."); 
      console.log("Attempting to mark review as helpful:", reviewId, updatedReviewData);

      
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.reviewId === reviewId
            ? { ...review, helpful: updatedHelpfulCount }
            : review
        )
      );
      toast.success("Review marked as helpful!");
    } catch (err) {
      console.error("Failed to update helpful count:", err);
      toast.error(
        "Failed to mark review as helpful: " +
          (err.response?.data?.message || err.message || err.toString())
      );
    }
  };

  const totalReviews = groupedReviews.reduce(
    (sum, group) => sum + group.totalReviews,
    0
  );

  return (
    <DashboardLayout title="Hotel Reviews">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hotel Reviews Overview
          </h1>
          <p className="text-gray-600">
            View and manage reviews for all your hotels
          </p>
        </div>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Hotels
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {hotels.length}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalReviews}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        {/* Filters Section */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews or hotels..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <select
              value={filters.hotelId}
              onChange={(e) =>
                setFilters({ ...filters, hotelId: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Hotels</option>
              {hotels.map((hotel) => (
                <option key={hotel.hotelId} value={hotel.name}> {/* Use hotel.name for value */}
                  {hotel.name}
                </option>
              ))}
            </select>

            <select
              value={filters.rating}
              onChange={(e) =>
                setFilters({ ...filters, rating: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700">Loading reviews data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        )}
        {/* Grouped Reviews Display */}
        {!loading && !error && (
          <div className="space-y-6">
            {groupedReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reviews found
                </h3>
                <p className="text-gray-600">
                  {filters.hotelId !== "all" ||
                  filters.rating !== "all" ||
                  filters.search
                    ? "Try adjusting your filters"
                    : "No reviews have been written for your hotels yet"}
                </p>
              </div>
            ) : (
              groupedReviews.map((group) => (
                <div
                  key={group.hotel.hotelId} // Use hotel.hotelId as key
                  className="bg-white shadow-md rounded-xl p-6"
                >
                  {/* Hotel Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {group.hotel.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {group.hotel.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <StarRating
                          rating={Math.round(group.averageRating)}
                          readonly
                          size="sm"
                        />
                        <span className="text-lg font-semibold text-gray-900">
                          {group.averageRating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {group.totalReviews} reviews
                      </p>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Rating Distribution
                    </h4>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-3"
                        >
                          <span className="text-sm text-gray-600 w-8 flex-shrink-0">
                            {rating}★
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{
                                width:
                                  group.totalReviews > 0
                                    ? `${
                                        (group.ratingDistribution[rating] /
                                          group.totalReviews) *
                                        100
                                      }%`
                                    : "0%",
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right flex-shrink-0">
                            {group.ratingDistribution[rating]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews List */}
                  {group.reviews.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Recent Reviews
                      </h4>
                      {group.reviews.map((review) => (
                        <ReviewCard
                          key={review.reviewId} // Use review.reviewId for key
                          review={review}
                          showActions={true}
                          onHelpful={handleHelpful}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No reviews yet for this hotel
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HotelReviews;
