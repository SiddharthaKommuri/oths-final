import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  Home,
  Users,
  Building,
  Plane,
  Package,
  MessageSquare,
  BarChart3,
  Calendar,
  Star,
  CreditCard,
  MapPin,
  TrendingUp,
  Eye,
} from "lucide-react";

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getSidebarItems = () => {
    switch (user?.role) {
      case "admin":
        return [
          { icon: Home, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Users', path: '/admin/users' },
          { icon: Building, label: 'Hotels', path: '/admin/hotels' },
          { icon: Plane, label: 'Flights', path: '/admin/flights/manage' },
          { icon: Package, label: 'Packages', path: '/admin/packages' },
          { icon: MessageSquare, label: 'Support Tickets', path: '/admin/support-tickets' },
          { icon: Star, label: 'Reviews', path: '/admin/reviews' },
          
        ];

      case "hotel_manager":
        return [
          { icon: Home, label: "Dashboard", path: "/hotel-manager" },
          { icon: Building, label: "My Hotels", path: "/hotel-manager/hotels" },
         
          {
            icon: CreditCard,
            label: "Bookings",
            path: "/hotel-manager/bookings",
          },
          { icon: Star, label: "Reviews", path: "/hotel-manager/reviews" },
        ];

      case "travel_agent":
        return [
          { icon: Home, label: "Dashboard", path: "/travel-agent" },
          {
            icon: Package,
            label: "My Packages",
            path: "/travel-agent/packages",
          },
          {
            icon: MapPin,
            label: "Itineraries",
            path: "/travel-agent/itineraries",
          },
         
          // {
          //   icon: CreditCard,
          //   label: "Bookings",
          //   path: "/travel-agent/bookings",
          // },
          
          
        ];

      default: // traveler
        return [
          { icon: Home, label: "Dashboard", path: "/traveler" },
          { icon: Building, label: "Hotels", path: "/traveler/hotels" },
          { icon: Plane, label: "Flights", path: "/traveler/flights" },
          { icon: Package, label: "Packages", path: "/traveler/packages" },
          {
            icon: CreditCard,
            label: "My Bookings",
            path: "/traveler/bookings",
          },
          { icon: Star, label: "Reviews", path: "/traveler/reviews" },
          { icon: MessageSquare, label: "Support", path: "/traveler/support" },
         
        ];
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Travora</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    }`}
                    onClick={() => setSidebarOpen(false)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="hidden md:block font-medium">
                    {user?.firstName}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
