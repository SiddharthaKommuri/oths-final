import { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import PaymentService from '../../services/PaymentService'; // Correct import for your PaymentService
import BookingService from '../../services/BookingService'; // This is the line in question
import * as ItineraryService from '../../services/ItineraryServiceSid'; // Corrected import for ItineraryService

const PaymentModal = ({
  isOpen,
  onClose,
  selectedItem, // The hotel, flight, or package object
  bookingType,  // 'hotel', 'flight', 'package'
  searchData,   // Contains checkIn, checkOut dates for hotels/flights, or other relevant search params
  user,         // User object from AuthContext (now correctly destructured)
  token,        // Token from AuthContext
  navigate,     // navigate function from react-router-dom
}) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    zipCode: '',
  });
  const [processing, setProcessing] = useState(false);

  // Ensure essential props are present, including user.userId
  if (!isOpen || !selectedItem || !user || !user.userId || !token) {
    console.log("PaymentModal: Not rendering. Missing props:", { isOpen, selectedItem, user, token });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const calculateNights = () => {
    if (!searchData.checkIn || !searchData.checkOut) return 1;
    const checkIn = new Date(searchData.checkIn);
    const checkOut = new Date(searchData.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      // Assuming ISO string like "2025-07-07T10:00:00"
      const date = new Date(isoString);
      // Format to HH:MM AM/PM
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      console.error("Error formatting time:", e);
      return 'Invalid Time';
    }
  };

  const getBookingDetailsForDisplay = () => {
    let name = '';
    let dates = '';
    let guests = 1; // Default guests
    let total = 0;
    let flightDetails = null; // Object to hold flight-specific details
    let packageDetails = null;

    if (bookingType === 'hotel') {
      name = selectedItem.name;
      dates = `${searchData.checkIn} to ${searchData.checkOut}`;
      guests = searchData.guests || 1; // Assuming searchData might have guests
      total = selectedItem.pricePerNight * calculateNights();
    } else if (bookingType === 'flight') {
      name = `${selectedItem.airline} Flight `;
      dates = `${searchData.departureDate} to ${searchData.arrivalDate || selectedItem.departureDate}`; // Adjust as per your flight searchData
      guests = searchData.passengers || 1; // Assuming searchData might have passengers
      total = selectedItem.price * guests; // Assuming price per person
      flightDetails = {
        origin: selectedItem.origin || 'N/A',
        destination: selectedItem.destination || 'N/A',
        departureTime: selectedItem.departureTime ? formatTime(selectedItem.departureTime) : 'N/A',
        arrivalTime: selectedItem.arrivalTime ? formatTime(selectedItem.arrivalTime) : 'N/A',
      };
    } else if (bookingType === 'package' || bookingType === 'itinerary') {
      name = selectedItem.packageName;
      dates = `${selectedItem.startDate|| 'N/A'} to ${selectedItem.endDate|| 'N/A'}`; // Assuming package has start/end dates
      guests = searchData.travelers || 1; // Assuming searchData might have travelers
      total = selectedItem.price * guests; // Assuming package price is per person
      packageDetails = {
        location: selectedItem.location || 'N/A',
        customization: searchData.customizationDetails || 'No customization details provided',
      };
    }

    return { name, dates, guests, total, flightDetails, packageDetails };
  };

  const displayDetails = getBookingDetailsForDisplay();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("PaymentModal: handleSubmit triggered.");
    setProcessing(true);

    // Access user.userId directly from the 'user' prop
    if (!user || !user.userId || !token) {
      console.log("PaymentModal: Authentication details missing:", { userId: user?.userId, token });
      toast.error("Authentication details missing. Please log in.");
      setProcessing(false);
      onClose();
      return;
    }
    if (!selectedItem || !displayDetails.total || displayDetails.total <= 0) {
      console.log("PaymentModal: Invalid booking details or amount.", { selectedItem, total: displayDetails.total });
      toast.error("Invalid booking details or amount.");
      setProcessing(false);
      onClose();
      return;
    }

    let createdBooking = null; // To store the booking created in step 1

    try {
      // Step 1: Create a PENDING booking first to get a bookingId
      // Set paymentId to null for initial booking creation, assuming BookingDto allows nullable Long or object
      let initialBookingPayload = {
        userId: user.userId,
        type: bookingType.toUpperCase(),
        status: "PENDING", // Initial status
        bookingDate: new Date().toISOString(),
        totalAmount: displayDetails.total,
        numberOfTravelers: displayDetails.guests,
        paymentId: 999999, // Set paymentId to null initially
      };

      if (bookingType === 'hotel') {
        initialBookingPayload = {
          ...initialBookingPayload,
          hotelId: selectedItem.hotelId,
          hotelName: selectedItem.name,
          location: selectedItem.location,
          checkInDate: searchData.checkIn,
          checkOutDate: searchData.checkOut,
        };
      } else if (bookingType === 'flight') {
        initialBookingPayload = {
          ...initialBookingPayload,
          flightId: selectedItem.flightId,
          airline: selectedItem.airline,
          
          origin: selectedItem.departure,
          destination: selectedItem.arrival,
          departureDate: searchData.departureDate,
          returnDate: searchData.arrivalDate || null,
        };
      } else if (bookingType === 'package' || bookingType === 'itinerary') {
        initialBookingPayload = {
          ...initialBookingPayload,
          itineraryId: selectedItem.packageId || selectedItem.id, // Use packageId or id
          packageName: selectedItem.packageName || selectedItem.name,
          location: selectedItem.location,
          startDate: selectedItem.startDate, // Use startDate from selectedItem
          endDate: selectedItem.endDate,     // Use endDate from selectedItem
        };
      }

      console.log("PaymentModal: Attempting to create initial booking with payload:", initialBookingPayload);
      const bookingCreationResponse = await BookingService.createBooking(initialBookingPayload, token);
      console.log("PaymentModal: Booking creation response (raw):", bookingCreationResponse.data);
      
      createdBooking = bookingCreationResponse.data; // Assuming response.data is the created BookingDto
      console.log("PaymentModal: Created Booking Object:", createdBooking);

      const bookingId = createdBooking?.bookingId; // Get the generated booking ID, safely
      console.log("PaymentModal: Extracted bookingId:", bookingId);

      if (!bookingId) {
        throw new Error("Booking ID not returned after initial booking creation. Check backend response structure.");
      }
      toast.info("Booking initiated. Proceeding to payment...");

      // Step 2: Process Payment using the obtained bookingId
      // IMPORTANT: If backend Payment Service has @NotNull on paymentId AND expects a Long,
      // we must send a temporary numeric ID. If it truly auto-generates and doesn't need it,
      // then the backend DTO needs to be fixed. For now, sending a temporary Long.
      // const temporaryPaymentId = Math.floor(Date.now() / 1000); // A large integer as a temporary ID
      // console.log("PaymentModal: Generated Temporary Numeric Payment ID for Payment Service:", temporaryPaymentId);

      const paymentPayload = {
        userId: user.userId,
        bookingId: bookingId, // Pass the bookingId here
         // Pass the client-generated temporary numeric paymentId
        amount: displayDetails.total,
        paymentMethod: "Credit Card",
        paymentStatus: "Completed", // This refers to the payment transaction status
        paymentDate: new Date().toISOString(),
      };

      console.log("PaymentModal: Sending payment request with payload:", paymentPayload);
      const paymentResponse = await PaymentService.createPayment(paymentPayload, token);
      console.log("PaymentModal: Payment API response (raw):", paymentResponse);
      
      // The backend should ideally return the actual auto-generated paymentId.
      // Use the received paymentId or fall back to the temporary one if not returned.
      const actualPaymentId = paymentResponse.data.paymentRef?.paymentId || paymentResponse.data?.id ;
      console.log("PaymentModal: Actual Payment ID received from backend:", actualPaymentId);
      if (!actualPaymentId) {
        throw new Error("Payment ID not confirmed by payment service. Check backend response structure.");
      }
      toast.success("Payment processed successfully!");

      let generatedItineraryId = null;
      // Step 3 (Re-ordered): Create Itinerary (ONLY FOR PACKAGE BOOKINGS)
      // This happens *before* the final booking update, so we can get the generated itinerary ID.
      if (bookingType === 'package' || bookingType === 'itinerary') {
        const itineraryPayload = {
          userId: user.userId, // Use the string version of userId
          customizationDetails: searchData.customizationDetails || 'No customization details provided',
          price: displayDetails.total, // Total price of the package
          travelPackageId: selectedItem.packageId || selectedItem.id, // Use packageId or id
        };
        console.log("PaymentModal: Attempting to create itinerary with payload:", itineraryPayload);
        const itineraryCreationResponse = await ItineraryService.createItinerary(itineraryPayload, token);
        console.log("PaymentModal: Itinerary creation response (raw):", itineraryCreationResponse.data);
        
        // Capture the actual itineraryId generated by the backend
        generatedItineraryId = itineraryCreationResponse?.itineraryId || itineraryCreationResponse.data?.id;
        if (!generatedItineraryId) {
            throw new Error("Itinerary ID not returned after itinerary creation.");
        }
        toast.success("Itinerary created successfully!");
      }
      // Step 3: Update the booking with the actual paymentId and CONFIRMED status
      const updatedBookingPayload = {
        ...createdBooking, // Start with the initially created booking data
        paymentId: actualPaymentId, // Use the actual/received paymentId
        status: "CONFIRMED", // Update status to CONFIRMED
      };
      if (generatedItineraryId) {
        updatedBookingPayload.itineraryId = generatedItineraryId; // Update the itineraryId in the booking
      }
      console.log("PaymentModal: Updating booking with actual paymentId and status:", updatedBookingPayload);
      // Assuming your BookingService.updateBookingById takes id and DTO
      await BookingService.updateBookingById(bookingId, updatedBookingPayload, token);
      toast.success(`${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} booked and confirmed!`);


      // Step 4: Create Itinerary (ONLY FOR PACKAGE BOOKINGS)
      // if (bookingType === 'package' || bookingType === 'itinerary') {
      //   const itineraryPayload = {
      //     userId: user.userId, // Use the string version of userId
      //     customizationDetails: searchData.customizationDetails || 'No customization details provided',
      //     price: displayDetails.total, // Total price of the package
      //     travelPackageId: selectedItem.packageId || selectedItem.id, // Use packageId or id
      //   };
      //   console.log("PaymentModal: Attempting to create itinerary with payload:", itineraryPayload);
      //   const res = await ItineraryService.createItinerary(itineraryPayload, token);
      //   console.log("PaymentModal: Itinerary creation response (raw):", res.data);
      //   toast.success("Itinerary created successfully!");
      // }

      onClose(); // Close modal on success
      navigate("/traveler/bookings"); // Navigate to general bookings page

    } catch (error) {
      console.error("PaymentModal: Booking/Payment failed:", error);
      let errorMessage = `Failed to process ${bookingType} booking.`;
      if (error.response) {
        console.error("PaymentModal: Error Response Data:", error.response.data);
        console.error("PaymentModal: Error Response Status:", error.response.status);
        console.error("PaymentModal: Error Response Headers:", error.response.headers);
        errorMessage += ` ${error.response.data?.message || error.response.data?.error || 'Server error'}`;
      } else if (error.message) {
        errorMessage += ` ${error.message}`;
      }
      toast.error(errorMessage);

      // IMPORTANT: If payment failed but booking was created, mark booking as FAILED/CANCELLED
      if (createdBooking && createdBooking.id) {
          try {
              console.log(`PaymentModal: Payment failed for booking ${createdBooking.id}. Attempting to update booking status to FAILED.`);
              await BookingService.updateBookingById(createdBooking.id, { ...createdBooking, status: "FAILED" }, token);
              toast.info(`Booking ${createdBooking.id} status updated to FAILED due to payment error.`);
          } catch (updateError) {
              console.error("PaymentModal: Failed to update booking status to FAILED after payment error:", updateError);
              toast.error("Failed to update booking status after payment error. Please contact support.");
          }
      }
    } finally {
      setProcessing(false);
      console.log("PaymentModal: handleSubmit finished.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Details</span>
            </h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{displayDetails.name}</span>
                </div>
                {bookingType === 'flight' && displayDetails.flightDetails && (
                  <>
                    <div className="flex justify-between">
                      <span>From/To:</span>
                      <span className="font-medium">{displayDetails.flightDetails.departure} to {displayDetails.flightDetails.arrival}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Departure Time:</span>
                      <span className="font-medium">{displayDetails.flightDetails.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrival Time:</span>
                      <span className="font-medium">{displayDetails.flightDetails.arrivalTime}</span>
                    </div>
                  </>
                )}
                {bookingType === 'package' || bookingType === 'itinerary' && displayDetails.packageDetails && (
                  <>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium">{displayDetails.packageDetails.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customization:</span>
                      <span className="font-medium break-words text-right max-w-[150px]">{displayDetails.packageDetails.customization}</span>
                    </div>
                  </>
                )}
                {/* <div className="flex justify-between">
                  <span>Dates:</span>
                  <span className="font-medium">{displayDetails.dates}</span>
                </div> */}
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span className="font-medium">{displayDetails.guests}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary-600">₹{displayDetails.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  name="billingAddress"
                  value={paymentData.billingAddress}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={paymentData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={paymentData.zipCode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="10001"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                <Lock className="w-4 h-4 text-green-600" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay ₹${displayDetails.total?.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
