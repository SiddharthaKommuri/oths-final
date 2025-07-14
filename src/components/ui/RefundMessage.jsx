import { CheckCircle, Clock, DollarSign } from 'lucide-react';

const RefundMessage = ({ booking, onClose }) => {
  // Add defensive check for booking object
  if (!booking) return null;
  
  const refundAmount = booking.totalPrice || booking.price;
  const processingDays = '3-5 business days';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Refund Initiated Successfully
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your booking has been cancelled and refund has been initiated.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{booking.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Refund Amount:</span>
                  <span className="font-semibold text-green-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${refundAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing Time:</span>
                  <span className="font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {processingDays}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Refund will be processed to your original payment method</li>
                <li>• You'll receive an email confirmation shortly</li>
                <li>• Contact support if you don't see the refund in {processingDays}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={onClose}
                className="w-full btn-primary"
              >
                Got it, thanks!
              </button>
              
              <button
                onClick={() => window.open('mailto:support@travora.com', '_blank')}
                className="w-full btn-secondary text-sm"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundMessage;