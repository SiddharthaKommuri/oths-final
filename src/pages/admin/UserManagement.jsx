import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, Search, Filter, Edit, Trash2, Plus, Mail, User } from 'lucide-react';
import * as UserService from '../../services/UserService'; // Import all functions from UserService
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook

const UserManagement = () => {
  // Destructure user, token, and loading (renamed to authLoading) from AuthContext
  const { user, token, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
  });
  const [loading, setLoading] = useState(true); // Component's own loading state for API calls
  const [error, setError] = useState(null); // Component's own error state for API calls

  // Use a memoized callback for fetching users
  const fetchUsers = useCallback(async () => {
    // If AuthContext is still loading, or if user/token are not available,
    // set component loading to true and return early.
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !token) {
      setLoading(false);
      setUsers([]);
      setFilteredUsers([]);
      setError('Please log in to view user data.');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Pass the token from useAuth directly to the service call
      const data = await UserService.getAllUsers(token);
      setUsers(data);
    } catch (err) {
      // Check if the error is due to unauthorized access (e.g., token expired/invalid)
      if (err.message && err.message.includes('Authentication token not found') || err.message.includes('Unauthorized')) {
        setError('Session expired or unauthorized. Please log in again.');
        // Optionally, trigger logout from AuthContext if you want to force re-login
        // logout(); // Assuming logout is also provided by useAuth
      } else {
        setError(err.message || 'Failed to load users.');
      }
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, token]); // Dependencies for useCallback: re-run when auth state changes

  // Effect to trigger fetching users when the dependencies of fetchUsers change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Depend on the memoized fetchUsers function

  // Effect to filter users whenever the raw users list or filters change
  useEffect(() => {
    filterUsers();
  }, [users, filters]); // Re-filter whenever users or filters change

  const filterUsers = () => {
    let currentFiltered = [...users];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      currentFiltered = currentFiltered.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.contactNumber && user.contactNumber.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.role !== 'all') {
      // Ensure role comparison is case-insensitive or matches backend enum exactly
      currentFiltered = currentFiltered.filter(user => user.role && user.role.toUpperCase() === filters.role.toUpperCase());
    }

    setFilteredUsers(currentFiltered);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'HOTEL_MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'TRAVEL_AGENT':
        return 'bg-purple-100 text-purple-800';
      case 'TRAVELER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleCounts = () => {
    return {
      all: users.length,
      ADMIN: users.filter(u => u.role === 'ADMIN').length,
      HOTEL_MANAGER: users.filter(u => u.role === 'HOTEL_MANAGER').length,
      TRAVEL_AGENT: users.filter(u => u.role === 'TRAVEL_AGENT').length,
      TRAVELER: users.filter(u => u.role === 'TRAVELER').length,
    };
  };

  const roleCounts = getRoleCounts();

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all users across the platform</p>
          </div>
          {/* <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add New User</span>
          </button> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{roleCounts.all}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{roleCounts.ADMIN}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{roleCounts.HOTEL_MANAGER}</p>
              <p className="text-sm text-gray-600">Hotel Managers</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{roleCounts.TRAVEL_AGENT}</p>
              <p className="text-sm text-gray-600">Travel Agents</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{roleCounts.TRAVELER}</p>
              <p className="text-sm text-gray-600">Travelers</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or contact number..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HOTEL_MANAGER">Hotel Manager</option>
              <option value="TRAVEL_AGENT">Travel Agent</option>
              <option value="TRAVELER">Traveler</option>
            </select>
          </div>
        </div>

        {/* Loading, Error, or Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p className="text-lg font-medium">Error: {error}</p>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    {/* Actions column if you add edit/delete functionality */}
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name} {/* Display full name from backend */}
                              </div>
                              <div className="text-sm text-gray-500">ID: {user.userId}</div> {/* Display userId */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role ? user.role.replace('_', ' ') : 'N/A'} {/* Ensure role exists before replacing */}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.contactNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        {/* Actions column */}
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-2">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
