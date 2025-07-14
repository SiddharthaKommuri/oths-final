import { Package, Users, DollarSign, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import StatusBadge from './StatusBadge';

const BookingStatsCard = ({ package: pkg }) => {
  const conversionRate = pkg.bookingCount > 0 ? (pkg.confirmedBookings / pkg.bookingCount * 100).toFixed(1) : 0;

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
            <p className="text-sm text-gray-600">{pkg.location}</p>
          </div>
        </div>
        <StatusBadge status={pkg.status} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Total Bookings</span>
          </div>
          <span className="font-semibold text-gray-900">{pkg.bookingCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
          <span className="font-semibold text-green-600">₹{pkg.revenue.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Conversion</span>
          </div>
          <span className="font-semibold text-blue-600">{conversionRate}%</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="font-semibold text-green-600">{pkg.confirmedBookings}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="font-semibold text-yellow-600">{pkg.pendingBookings}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cancelled</p>
            <p className="font-semibold text-red-600">{pkg.cancelledBookings}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-1">Base Price</div>
        <div className="text-lg font-bold text-primary-600">₹{pkg.basePrice}</div>
      </div>
    </div>
  );
};

export default BookingStatsCard;