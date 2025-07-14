import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StarRating from '../../components/ui/StarRating'; // Assuming this component exists
import ReviewCard from '../../components/ui/ReviewCard'; // Assuming this component exists
import { Star, Send, MessageSquare, Loader2 } from 'lucide-react'; // Added Loader2 for loading indicator
import { toast } from 'react-toastify'; // For toast notifications

import { useAuth } from '../../contexts/AuthContext'; // <--- ADDED THIS IMPORT

// Import your service files
import * as ReviewService from '../../services/ReviewService';
import * as BookingService from '../../services/BookingServiceSid'; // Corrected import to use named exports

import * as HotelService from '../../services/HotelServiceSid'; // Assuming this service exists
import FlightService from '../../services/FlightService'; // Corrected import: import default export directly

const TravelerReviews = () => {
  const { user, token, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // New state to store all fetched hotels and flights for name lookup
  const [allHotelsData, setAllHotelsData] = useState([]);
  const [allFlightsData, setAllFlightsData] = useState([]);

  const [formData, setFormData] = useState({
    serviceType: 'hotel',
    selectedServiceId: '',
    rating: 0,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingServiceNames, setLoadingServiceNames] = useState(false); // Combined loading for reviews and service names

  /**
   * Fetches reviews for the current user from the backend.
   * Also fetches all hotels and flights to enrich reviews with service names.
   */
  const loadReviewsAndEnrich = useCallback(async () => {
    if (!token || !user?.userId) {
      setLoadingReviews(false);
      setReviews([]);
      console.log("Authentication details missing for loading reviews.");
      return;
    }
    setLoadingReviews(true);
    setLoadingServiceNames(true); // Indicate that service names are being loaded

    try {
      console.log(`Attempting to fetch reviews for userId: ${user.userId}`);
      const reviewsResponse = await ReviewService.getReviewsByUserId(user.userId, token);
      console.log("Raw reviews response:", reviewsResponse);
      const fetchedReviews = reviewsResponse.reviews || [];
      console.log("Fetched reviews array:", fetchedReviews);

      // Fetch all hotels and flights to get their names
      const [hotelsResponse, flightsResponse] = await Promise.all([
        HotelService.getAllHotels(token),
        FlightService.getAllFlights(token)
      ]);

      console.log("Raw hotels response:", hotelsResponse);
      const hotels = hotelsResponse || [];
      setAllHotelsData(hotels); // Store all hotels in state
      console.log("All Hotels fetched:", hotels);

      console.log("Raw flights response:", flightsResponse);
      const flights = flightsResponse.data || []; // Assuming axios response
      setAllFlightsData(flights); // Store all flights in state
      console.log("All Flights fetched:", flights);

      const enrichedReviews = fetchedReviews.map(review => {
        let serviceName = 'N/A';
        let serviceType = 'unknown';

        if (review.hotelId) {
          const hotel = hotels.find(h => h.hotelId === review.hotelId);
          console.log(`Found hotel for review ${review.reviewId}:`, hotel);
          if (hotel && hotel.name) {
            serviceName = hotel.name;
            serviceType = 'hotel';
          } else {
            serviceName = `Hotel ID: ${review.hotelId}`;
            serviceType = 'hotel';
          }
        } else if (review.flightId) {
          const flight = flights.find(f => f.flightId === review.flightId);
          console.log(`Found flight for review ${review.reviewId}:`, flight);
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
        };
      });

      console.log("Enriched reviews array:", enrichedReviews);
      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Error loading reviews or service names:', error);
      toast.error('Failed to load your reviews: ' + (error.message || 'Unknown error'));
      setReviews([]);
    } finally {
      setLoadingReviews(false);
      setLoadingServiceNames(false); // Done loading service names
    }
  }, [token, user?.userId]);

  /**
   * Fetches all bookings for the current user from the backend.
   */
  const loadUserBookings = useCallback(async () => {
    if (!token || !user?.userId) {
      setLoadingBookings(false);
      setUserBookings([]);
      console.log("Authentication details missing for loading user bookings.");
      return;
    }
    setLoadingBookings(true);
    try {
      const response = await BookingService.getBookingsByUserId(user.userId, token, {
        pageNo: 0,
        pageSize: 1000,
        sortBy: 'createdAt',
        sortDir: 'Desc'
      });
      // console.log("Raw user bookings response:", response);
      // window.alert("User Bookings Response: " + JSON.stringify(response, null, 2));
      console.log("User Bookings Content:", response.content);
      setUserBookings(response.content || []);
    } catch (error) {
      console.error('Error loading user bookings:', error);
      toast.error('Failed to load your bookings to select services: ' + (error.message || 'Unknown error'));
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [token, user?.userId]);

  // Initial data load
  useEffect(() => {
    if (!authLoading) {
      loadReviewsAndEnrich();
      loadUserBookings();
    }
  }, [authLoading, loadReviewsAndEnrich, loadUserBookings]);

  // Effect to update available services for the dropdown when userBookings, serviceType,
  // allHotelsData, or allFlightsData changes.
  useEffect(() => {
    let services = [];
    if (formData.serviceType === 'hotel') {
      const uniqueHotels = new Map();
      userBookings.forEach(booking => {
        if ((booking.type === 'hotel' || booking.type === 'HOTEL') && booking.hotelId) {
          // Look up hotel name from allHotelsData
          console.log(`Processing booking for hotel ID: ${booking.hotelId}`);
          console.log(`All Hotels Data:`, allHotelsData);
          const hotel = allHotelsData.find(h => h.hotelId === booking.hotelId);
          console.log(`Found hotel for booking ${booking.bookingId}:`, hotel);
          const serviceName = hotel && hotel.name ? hotel.name : `Hotel ID: ${booking.hotelId}`;
          uniqueHotels.set(booking.hotelId, { id: booking.hotelId, name: serviceName });
        }
      });
      services = Array.from(uniqueHotels.values());
    } else if (formData.serviceType === 'flight') {
      const uniqueFlights = new Map();
      userBookings.forEach(booking => {
        if ((booking.type === 'flight' || booking.type === 'FLIGHT')&& booking.flightId) {
          // Look up flight airline from allFlightsData
          const flight = allFlightsData.find(f => f.flightId === booking.flightId);
          const serviceName = flight && flight.airline ? flight.airline : `Flight ID: ${booking.flightId}`;
          uniqueFlights.set(booking.flightId, { id: booking.flightId, name: serviceName });
        }
      });
      services = Array.from(uniqueFlights.values());
    }
    setAvailableServices(services);
    setFormData(prev => ({ ...prev, selectedServiceId: '' }));
  }, [userBookings, formData.serviceType, allHotelsData, allFlightsData]); // Added allHotelsData, allFlightsData to dependencies


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.error('Please select a rating.');
      return;
    }
    if (!formData.selectedServiceId) {
      toast.error(`Please select a ${formData.serviceType} to review.`);
      return;
    }
    if (formData.comment.length < 50) {
      toast.error('Review comment must be at least 50 characters long.');
      return;
    }

    setSubmitting(true);

    const reviewData = {
      userId: user.userId,
      hotelId: formData.serviceType === 'hotel' ? formData.selectedServiceId : null,
      flightId: formData.serviceType === 'flight' ? formData.selectedServiceId : null,
      rating: formData.rating,
      comment: formData.comment,
    };

    try {
      await ReviewService.postReview(reviewData, token);
      toast.success('Review submitted successfully!');
      loadReviewsAndEnrich(); // Reload and re-enrich reviews after submission
      setFormData({
        serviceType: 'hotel',
        selectedServiceId: '',
        rating: 0,
        comment: ''
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const serviceTypeOptions = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'flight', label: 'Flight' },
  ];

  const isLoading = authLoading || loadingReviews || loadingBookings || loadingServiceNames;

  return (
    <DashboardLayout title="Write Reviews">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Review Form */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Write a Review</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  className="input-field"
                  required
                  disabled={submitting || isLoading}
                >
                  {serviceTypeOptions.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="selectedServiceId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Service
                </label>
                <select
                  id="selectedServiceId"
                  value={formData.selectedServiceId}
                  onChange={(e) => handleChange('selectedServiceId', e.target.value)}
                  className="input-field"
                  required
                  disabled={submitting || isLoading || availableServices.length === 0}
                >
                  <option value="">
                    {isLoading ? 'Loading services...' : (availableServices.length === 0 ? 'No services booked yet' : 'Select a service')}
                  </option>
                  {availableServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => handleChange('rating', rating)}
                size="lg"
                disabled={submitting || isLoading}
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
                className="input-field"
                rows={5}
                placeholder="Share your experience to help other travelers..."
                required
                disabled={submitting || isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 50 characters ({formData.comment.length}/50)
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading || formData.comment.length < 50 || formData.rating === 0 || !formData.selectedServiceId}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Your Reviews</h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {reviews.length}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-700">Loading your reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Write your first review to help other travelers!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TravelerReviews;