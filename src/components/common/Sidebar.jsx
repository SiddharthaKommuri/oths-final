import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Users,
  Building,
  Plane,
  Package,
  MessageSquare,
  Settings,
  BarChart3,
  Calendar,
  Star,
  CreditCard,
  MapPin,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Users', path: '/admin/users' },
          { icon: Building, label: 'Hotels', path: '/admin/hotels' },
          { icon: Plane, label: 'Flights', path: '/admin/flights' },
          { icon: Package, label: 'Packages', path: '/admin/packages' },
          { icon: CreditCard, label: 'Bookings', path: '/admin/bookings' },
          { icon: MessageSquare, label: 'Support Tickets', path: '/admin/tickets' },
          { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
          { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ];
      
      case 'hotel_manager':
        return [
          { icon: Home, label: 'Dashboard', path: '/hotel-manager' },
          { icon: Building, label: 'My Hotels', path: '/hotel-manager/hotels' },
          { icon: Calendar, label: 'Availability', path: '/hotel-manager/availability' },
          { icon: CreditCard, label: 'Bookings', path: '/hotel-manager/bookings' },
          { icon: Star, label: 'Reviews', path: '/hotel-manager/reviews' },
          { icon: MessageSquare, label: 'Support', path: '/hotel-manager/support' },
          { icon: BarChart3, label: 'Analytics', path: '/hotel-manager/analytics' },
          { icon: Settings, label: 'Settings', path: '/hotel-manager/settings' },
        ];
      
      case 'travel_agent':
        return [
          { icon: Home, label: 'Dashboard', path: '/travel-agent' },
          { icon: Package, label: 'My Packages', path: '/travel-agent/packages' },
          { icon: MapPin, label: 'Itineraries', path: '/travel-agent/itineraries' },
          { icon: Users, label: 'Clients', path: '/travel-agent/clients' },
          { icon: CreditCard, label: 'Bookings', path: '/travel-agent/bookings' },
          { icon: MessageSquare, label: 'Messages', path: '/travel-agent/messages' },
          { icon: BarChart3, label: 'Performance', path: '/travel-agent/performance' },
          { icon: Settings, label: 'Settings', path: '/travel-agent/settings' },
        ];
      
      default: // traveler
        return [
          { icon: Home, label: 'Dashboard', path: '/traveler' },
          { icon: Building, label: 'Search Hotels', path: '/traveler/hotels' },
          { icon: Plane, label: 'Search Flights', path: '/search/flights' },
          { icon: Package, label: 'Packages', path: '/packages' },
          { icon: CreditCard, label: 'My Bookings', path: '/traveler/bookings' },
          { icon: Star, label: 'Reviews', path: '/traveler/reviews' },
          { icon: MessageSquare, label: 'Support', path: '/traveler/support' },
          { icon: Settings, label: 'Settings', path: '/traveler/settings' },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Travora</h2>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;