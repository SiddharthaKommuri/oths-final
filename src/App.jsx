import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Home from './pages/Home';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import HotelSearch from './pages/search/HotelSearch';

// Dashboard Pages
import TravelerDashboard from './pages/dashboards/TravelerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TravelAgentDashboard from './pages/dashboards/TravelAgentDashboard';
import HotelManagerDashboard from './pages/dashboards/HotelManagerDashboard';

// Traveler Pages
import TravelerHotels from './pages/traveler/TravelerHotels';
import TravelerFlights from './pages/traveler/TravelerFlights';
import TravelerPackages from './pages/traveler/TravelerPackages';
import TravelerBookings from './pages/traveler/TravelerBookings';
import TravelerReviews from './pages/traveler/TravelerReviews';
import TravelerSupport from './pages/traveler/TravelerSupport';

// Travel Agent Pages
import CreatePackage from './pages/travel-agent/CreatePackage';
import ManagePackages from './pages/travel-agent/ManagePackages';
import ViewBookings from './pages/travel-agent/ViewBookings';

// Hotel Manager Pages
import CreateHotel from './pages/hotel-manager/CreateHotel';
import ManageHotels from './pages/hotel-manager/ManageHotels';
import ViewHotelBookings from './pages/hotel-manager/ViewBookings';
import HotelManagerHotels from './pages/hotel-manager/HotelManagerHotels';
import AvailabilityTracker from './pages/hotel-manager/AvailabilityTracker';
import HotelBookings from './pages/hotel-manager/HotelBookings';
import HotelReviews from './pages/hotel-manager/HotelReviews';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import CreateFlight from './pages/admin/CreateFlight';
import ManageFlights from './pages/admin/ManageFlights';
import SupportTickets from './pages/admin/SupportTickets';
import HotelManagement from './pages/admin/HotelManagement';
import PackageManagement from './pages/admin/PackageManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import TravelPackageItinerary from './pages/travel-agent/TravelPackageItinerary';

// Layout wrapper for pages with header/footer
const PublicLayout = ({ children }) => (
  <>
    <Header />
    <main className="min-h-screen">{children}</main>
    <Footer />
  </>
);

// Auth redirect component
const AuthRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Redirect to appropriate dashboard based on role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'hotel_manager':
      return <Navigate to="/hotel-manager" replace />;
    case 'travel_agent':
      return <Navigate to="/travel-agent" replace />;
    default:
      return <Navigate to="/traveler" replace />;
  }
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            isAuthenticated ? <AuthRedirect /> : (
              <PublicLayout>
                <Home />
              </PublicLayout>
            )
          } />
          
          <Route path="/auth/login" element={
            isAuthenticated ? <AuthRedirect /> : <LoginPage />
          } />
          
          <Route path="/auth/signup" element={
            isAuthenticated ? <AuthRedirect /> : <SignupPage />
          } />

          {/* Legacy routes for backward compatibility */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

          {/* Search Routes */}
          <Route path="/search/hotels" element={
            <PublicLayout>
              <HotelSearch />
            </PublicLayout>
          } />

          {/* Traveler Routes */}
          <Route path="/traveler" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerDashboard />
            </PrivateRoute>
          } />

          <Route path="/traveler/hotels" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerHotels />
            </PrivateRoute>
          } />

          <Route path="/traveler/flights" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerFlights />
            </PrivateRoute>
          } />

          <Route path="/traveler/packages" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerPackages />
            </PrivateRoute>
          } />

          <Route path="/traveler/bookings" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerBookings />
            </PrivateRoute>
          } />

          <Route path="/traveler/reviews" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerReviews />
            </PrivateRoute>
          } />

          <Route path="/traveler/support" element={
            <PrivateRoute allowedRoles={['traveler']}>
              <TravelerSupport />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin/users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <UserManagement />
            </PrivateRoute>
          } />

          <Route path="/admin/flights/create" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CreateFlight />
            </PrivateRoute>
          } />

          <Route path="/admin/flights/manage" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ManageFlights />
            </PrivateRoute>
          } />

          <Route path="/admin/support-tickets" element={
            <PrivateRoute allowedRoles={['admin']}>
              <SupportTickets />
            </PrivateRoute>
          } />

          <Route path="/admin/hotels" element={
            <PrivateRoute allowedRoles={['admin']}>
              <HotelManagement />
            </PrivateRoute>
          } />

          <Route path="/admin/packages" element={
            <PrivateRoute allowedRoles={['admin']}>
              <PackageManagement />
            </PrivateRoute>
          } />

          <Route path="/admin/reviews" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ReviewManagement />
            </PrivateRoute>
          } />

          {/* Travel Agent Routes */}
          <Route path="/travel-agent" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <TravelAgentDashboard />
            </PrivateRoute>
          } />

          <Route path="/travel-agent/packages" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <ManagePackages />
            </PrivateRoute>
          } />
          <Route path="/travel-agent/itineraries" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <TravelPackageItinerary />
            </PrivateRoute>
          } />

          <Route path="/travel-agent/manage-packages" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <ManagePackages />
            </PrivateRoute>
          } />

          <Route path="/travel-agent/create-package" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <CreatePackage />
            </PrivateRoute>
          } />

          <Route path="/travel-agent/bookings" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <ViewBookings />
            </PrivateRoute>
          } />

          <Route path="/travel-agent/view-bookings" element={
            <PrivateRoute allowedRoles={['travel_agent']}>
              <ViewBookings />
            </PrivateRoute>
          } />

          {/* Hotel Manager Routes */}
          <Route path="/hotel-manager" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <HotelManagerDashboard />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/create-hotel" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <CreateHotel />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/manage-hotels" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <ManageHotels />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/view-bookings" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <ViewHotelBookings />
            </PrivateRoute>
          } />

          {/* New Hotel Manager Routes */}
          <Route path="/hotel-manager/hotels" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <HotelManagerHotels />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/availability" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <AvailabilityTracker />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/bookings" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <HotelBookings />
            </PrivateRoute>
          } />

          <Route path="/hotel-manager/reviews" element={
            <PrivateRoute allowedRoles={['hotel_manager']}>
              <HotelReviews />
            </PrivateRoute>
          } />

          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                  <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
                  <button
                    onClick={() => window.history.back()}
                    className="btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </PublicLayout>
          } />

          {/* Catch all route */}
          <Route path="*" element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="btn-primary"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </PublicLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;