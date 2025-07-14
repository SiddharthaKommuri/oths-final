import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReviewCard from '../../components/ui/ReviewCard'; // Assuming you have this component
import StarRating from '../../components/ui/StarRating'; // Assuming you have this component
import { Star, MessageSquare, Search, Filter, Building, Plane, Package, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getAllReviews, postReview } from '../../services/ReviewService'; // Import review services
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth to get user info and token
import { getHotelById } from '../../services/HotelServiceSid'; // Assuming you have this for hotel names
 import flightService from '../../services/FlightService'; // Assuming you have this for flight names
import { getPackageById } from '../../services/PackageServiceSid'; // Assuming you have this for package names
import { getUserById } from '../../services/UserService'

const ReviewManagement = () => {
  const { user, token, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    serviceType: 'all',
    rating: 'all',
    serviceName: 'all' // This will be dynamic based on fetched data
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Create Review Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    hotelId: '',
    flightId: '',
    rating: 5, // Default rating
    comment: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null); // Corrected initialization

  // State to store resolved service names (hotelId/flightId/packageId -> name)
  const [serviceNamesMap, setServiceNamesMap] = useState({});
  // State to store resolved user emails (userId -> email)
  const [userEmailsMap, setUserEmailsMap] = useState({});


  // Effect to fetch reviews from backend
  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getAllReviews(token);
        // Assuming response.reviews holds the list of ReviewDTOs
        setReviews(response.reviews || []);
      } catch (err) {
        if (err.message && err.message.includes('Unauthorized')) {
          setError('Session expired or unauthorized. Please log in again.');
          localStorage.removeItem('travora_auth_token');
          localStorage.removeItem('travora_user_data');
          // Optionally, redirect to login page here
        } else {
          setError(err.message || 'Failed to load reviews.');
        }
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]); // Re-fetch when token changes

  // Effect to resolve service names (Hotel, Flight, Package) and user emails
  useEffect(() => {
    const resolveNamesAndEmails = async () => {
      const newServiceNamesMap = { ...serviceNamesMap };
      const newUserEmailsMap = { ...userEmailsMap };
      const promises = [];

      reviews.forEach(review => {
        console.log("Processing review:", review); // DEBUG LOG: Log each review object
        console.log(`Review IDs - Hotel: ${review.hotelId}, Flight: ${review.flightId}, Package: ${review.packageId}`); // DEBUG LOG: Specific ID check

        // Resolve Service Names
        if (review.hotelId && !newServiceNamesMap[review.hotelId]) {
          if (typeof getHotelById === 'function') {
            promises.push(
              getHotelById(review.hotelId, token)
                .then(hotel => {
                  console.log(`Fetched hotel ${review.hotelId}:`, hotel); // DEBUG LOG
                  newServiceNamesMap[review.hotelId] = hotel.name;
                })
                .catch(err => {
                  console.error(`Failed to fetch hotel name for ID ${review.hotelId}:`, err);
                  newServiceNamesMap[review.hotelId] = `Hotel ${review.hotelId} (Not Found)`; // More specific fallback
                })
            );
          } else {
            console.warn(`getHotelById function not available for hotel ID ${review.hotelId}.`);
            newServiceNamesMap[review.hotelId] = `Hotel ${review.hotelId} (Service Unavailable)`; // Fallback
          }
        }
        if (review.flightId && !newServiceNamesMap[review.flightId]) {
          if (typeof FlightService.getFlightById === 'function') {
            promises.push(
              FlightService.getFlightById(review.flightId, token)
                .then(flight => {
                  console.log(`Fetched flight ${review.flightId}:`, flight); // DEBUG LOG
                  // Ensure 'airline' and 'flightId' (or 'flightNumber' if that's the property) exist on the flight object
                  newServiceNamesMap[review.flightId] = flight.airline + ' ' + (flight.flightNumber || flight.flightId);
                })
                .catch(err => {
                  console.error(`Failed to fetch flight name for ID ${review.flightId}:`, err);
                  newServiceNamesMap[review.flightId] = `Flight ${review.flightId} (Not Found)`; // More specific fallback
                })
            );
          } else {
            console.warn(`FlightService.getFlightById function not available for flight ID ${review.flightId}.`);
            newServiceNamesMap[review.flightId] = `Flight ${review.flightId} (Service Unavailable)`; // Fallback
          }
        }
        if (review.packageId && !newServiceNamesMap[review.packageId]) {
          if (typeof getPackageById === 'function') {
            promises.push(
              getPackageById(review.packageId, token)
                .then(pkg => {
                  console.log(`Fetched package ${review.packageId}:`, pkg); // DEBUG LOG
                  newServiceNamesMap[review.packageId] = pkg.packageName;
                })
                .catch(err => {
                  console.error(`Failed to fetch package name for ID ${review.packageId}:`, err);
                  newServiceNamesMap[review.packageId] = `Package ${review.packageId} (Not Found)`; // More specific fallback
                })
            );
          } else {
            console.warn(`getPackageById function not available for package ID ${review.packageId}.`);
            newServiceNamesMap[review.packageId] = `Package ${review.packageId} (Service Unavailable)`; // Fallback
          }
        }

        // Resolve User Emails
        if (review.userId && !newUserEmailsMap[review.userId]) {
          if (typeof getUserById === 'function') {
            promises.push(
              getUserById(review.userId, token)
                .then(user => {
                  console.log(`Fetched user ${review.userId}:`, user); // DEBUG LOG
                  newUserEmailsMap[review.userId] = user.email;
                })
                .catch(err => {
                  console.error(`Failed to fetch user email for ID ${review.userId}:`, err);
                  newUserEmailsMap[review.userId] = `User ${review.userId} (Not Found)`; // More specific fallback
                })
            );
          } else {
            console.warn(`getUserById function not available for user ID ${review.userId}.`);
            newUserEmailsMap[review.userId] = `User ${review.userId} (Service Unavailable)`; // Fallback
          }
        }
      });

      await Promise.allSettled(promises);
      setServiceNamesMap(newServiceNamesMap);
      setUserEmailsMap(newUserEmailsMap);
      console.log("Service names and user emails resolved:", newServiceNamesMap, newUserEmailsMap); // Final map state
    };

    if (reviews.length > 0 && token) {
      resolveNamesAndEmails();
    }
  }, [reviews, token]); // Re-run when reviews or token changes


  // Effect to filter reviews locally
  useEffect(() => {
    filterReviews();
  }, [reviews, filters, serviceNamesMap, userEmailsMap]); // Re-filter when reviews, filters, service names, or user emails map changes

  const filterReviews = () => {
    let currentReviews = Array.isArray(reviews) ? reviews : [];
    let filtered = [...currentReviews];

    // Map backend DTO to a unified frontend structure for filtering
    const mappedReviews = filtered.map(review => {
      let serviceType = 'unknown';
      let serviceId = null;

      if (review.hotelId) {
        serviceType = 'hotel';
        serviceId = review.hotelId;
      } else if (review.flightId) {
        serviceType = 'flight';
        serviceId = review.flightId;
      } else if (review.packageId) {
        serviceType = 'package';
        serviceId = review.packageId;
      }

      return {
        id: review.reviewId,
        serviceType: serviceType, // Now correctly derived
        serviceId: serviceId,
        serviceName: serviceNamesMap[serviceId] || 'Loading Name...', // Use resolved name or loading
        rating: review.rating,
        title: review.comment ? review.comment.substring(0, 50) + (review.comment.length > 50 ? '...' : '') : 'No Title',
        review: review.comment,
        date: review.timestamp || review.createdDate,
        userEmail: userEmailsMap[review.userId] || `User ${review.userId || 'N/A'}`,
        helpful: 0,
        verified: true
      };
    });

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = mappedReviews.filter(review =>
        (review.serviceName && review.serviceName.toLowerCase().includes(searchTerm)) ||
        (review.title && review.title.toLowerCase().includes(searchTerm)) ||
        (review.review && review.review.toLowerCase().includes(searchTerm)) ||
        (review.userEmail && review.userEmail.toLowerCase().includes(searchTerm))
      );
    } else {
      filtered = mappedReviews;
    }


    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(review => review.serviceType === filters.serviceType);
    }

    if (filters.rating !== 'all') {
      const ratingValue = parseInt(filters.rating);
      filtered = filtered.filter(review => review.rating === ratingValue);
    }

    if (filters.serviceName !== 'all') {
      filtered = filtered.filter(review => review.serviceName === filters.serviceName);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredReviews(filtered);
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'hotel':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'flight':
        return <Plane className="w-5 h-5 text-green-600" />;
      case 'package':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Star className="w-5 h-5 text-gray-600" />;
    }
  };

  // Collect unique service names from the resolved map for filter dropdown
  const serviceNames = [...new Set(Object.values(serviceNamesMap).filter(Boolean))].sort();


  const getStatsCounts = () => {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    return {
      total: totalReviews,
      hotel: reviews.filter(r => r.hotelId).length,
      flight: reviews.filter(r => r.flightId).length,
      package: reviews.filter(r => r.packageId).length, // Assuming packageId might exist in DTO
      averageRating: Math.round(averageRating * 10) / 10,
      verified: reviews.filter(r => r.verified).length // This will always be 0/total as 'verified' is hardcoded
    };
  };

  const stats = getStatsCounts();

  // --- Create Review Modal Logic ---
  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      setError('You must be logged in to post a review.');
      return;
    }
    setShowCreateModal(true);
    setNewReviewData({
      hotelId: '',
      flightId: '',
      rating: 5,
      comment: ''
    });
    setCreateError(null);
    setCreateSuccess(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateLoading(false);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const handleNewReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReviewData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateReviewSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    // Determine if it's a hotel or flight review
    let hotelId = newReviewData.hotelId ? parseInt(newReviewData.hotelId) : null;
    let flightId = newReviewData.flightId ? parseInt(newReviewData.flightId) : null;

    if (hotelId && flightId) {
      setCreateError("Please provide either a Hotel ID or a Flight ID, not both.");
      setCreateLoading(false);
      return;
    }
    if (!hotelId && !flightId) {
      setCreateError("Please provide either a Hotel ID or a Flight ID.");
      setCreateLoading(false);
      return;
    }

    try {
      const reviewDto = {
        userId: user.userId, // Use the logged-in user's ID
        hotelId: hotelId,
        flightId: flightId,
        rating: parseInt(newReviewData.rating),
        comment: newReviewData.comment,
      };

      const createdReview = await postReview(reviewDto, token);
      setCreateSuccess(`Review posted successfully! ID: ${createdReview.review.reviewId}`);
      // Re-fetch all reviews to update the list
      const response = await getAllReviews(token);
      setReviews(response.reviews || []);
      setNewReviewData({ // Reset form
        hotelId: '',
        flightId: '',
        rating: 5,
        comment: ''
      });
    } catch (err) {
      setCreateError(err.message || 'Failed to post review.');
      console.error("Post review error:", err);
    } finally {
      setCreateLoading(false);
    }
  };


  return (
    <DashboardLayout title="Review Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
            <p className="text-gray-600">View and manage all reviews across the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hotel Reviews</p>
                <p className="text-2xl font-bold text-blue-600">{stats.hotel}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flight Reviews</p>
                <p className="text-2xl font-bold text-green-600">{stats.flight}</p>
              </div>
              <Plane className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Package Reviews</p>
                <p className="text-2xl font-bold text-purple-600">{stats.package}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Services</option>
              <option value="hotel">Hotels</option>
              <option value="flight">Flights</option>
            </select>

            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={filters.serviceName}
              onChange={(e) => setFilters({ ...filters, serviceName: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Services</option>
              {serviceNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg text-gray-600">Loading reviews...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-red-600">
                      <p className="text-lg font-medium">Error: {error}</p>
                      <p className="text-gray-600">Please try again later.</p>
                    </td>
                  </tr>
                ) : filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-600 max-w-md line-clamp-2">{review.review}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getServiceIcon(review.serviceType)}
                          <div className="ml-2">
                            {/* <div className="text-sm font-medium text-gray-900">{review.serviceName}</div> */}
                            <div className="text-sm text-gray-500 capitalize">{review.serviceType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="ml-2 text-sm text-gray-900">{review.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {review.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.date ? new Date(review.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                      <p className="text-gray-600">
                        {filters.search || filters.serviceType !== 'all' || filters.rating !== 'all' || filters.serviceName !== 'all'
                          ? 'Try adjusting your filters'
                          : 'No reviews have been submitted yet'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Review Modal */}
      {/* {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Post New Review</h2>
              <button onClick={handleCloseCreateModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateReviewSubmit} className="space-y-4">
              <div>
                <label htmlFor="hotelId" className="block text-sm font-medium text-gray-700">Hotel ID (Optional)</label>
                <input
                  type="number"
                  id="hotelId"
                  name="hotelId"
                  value={newReviewData.hotelId}
                  onChange={handleNewReviewChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 123"
                />
              </div>
              <div>
                <label htmlFor="flightId" className="block text-sm font-medium text-gray-700">Flight ID (Optional)</label>
                <input
                  type="number"
                  id="flightId"
                  name="flightId"
                  value={newReviewData.flightId}
                  onChange={handleNewReviewChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 456"
                />
              </div>
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={newReviewData.rating}
                  onChange={handleNewReviewChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  max="5"
                  required
                />
              </div>
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={newReviewData.comment}
                  onChange={handleNewReviewChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                ></textarea>
              </div>

              {createLoading && (
                <div className="flex items-center justify-center py-2">
                  <div className="w-6 h-6 border-4 border-t-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                  <p className="text-blue-600">Posting review...</p>
                </div>
              )}

              {createError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center" role="alert">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center" role="alert">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{createSuccess}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="btn-secondary px-4 py-2 rounded-md"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-md"
                  disabled={createLoading}
                >
                  Post Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </DashboardLayout>
  );
};

export default ReviewManagement;