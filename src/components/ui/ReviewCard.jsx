import React from 'react';
import { Star, ThumbsUp, Calendar, CheckCircle } from 'lucide-react';
import StarRating from './StarRating'; 

const ReviewCard = ({ review, showActions = false, onHelpful }) => {
  if (!review) {
    return null; 
  }

  const formatDate = (dateString) => {
    
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'hotel':
        return '🏨';
      case 'flight':
        return '✈️';
      case 'package': 
        return '📦';
      default:
        return '⭐';
    }
  };

  
  
  const displayServiceType = review.serviceType || (review.hotelId ? 'hotel' : (review.flightId ? 'flight' : 'unknown'));
  const displayServiceName = review.serviceName || (review.hotelId ? `Hotel ID: ${review.hotelId}` :
                               (review.flightId ? `Flight ID: ${review.flightId}` : 'N/A'));

  
  const reviewText = review.comment || 'No comment provided.';
  
  
  const reviewTitle = review.title || `Review for ${displayServiceName}`; 

  
  
  const displayDate = review.timestamp;
  const isVerified = review.verified || false; 
  const helpfulCount = review.helpful || 0; 

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getServiceTypeIcon(displayServiceType)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{reviewTitle}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {displayServiceType} • {displayServiceName}
            </p>
          </div>
        </div>
        {isVerified && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <StarRating rating={review.rating} readonly size="sm" />
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">{reviewText}</p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(displayDate)}</span>
        </div>

        {showActions && (
          <button
            onClick={() => onHelpful && onHelpful(review.reviewId)} // Use review.reviewId for the key
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({helpfulCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
