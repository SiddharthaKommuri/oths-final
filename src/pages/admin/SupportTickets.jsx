import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { MessageSquare, Search, Filter, User, Clock, CheckCircle, Edit } from 'lucide-react';
import SupportTicketService from '../../services/SupportTicketService';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook

const SupportTickets = () => {
  const { token, user } = useAuth(); // Get token and user from AuthContext
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ticketCategories = [
    { value: 'HOTEL', label: 'Hotel' },
    { value: 'FLIGHT', label: 'Flight' },
    { value: 'PACKAGE', label: 'Package' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Load tickets on component mount or when token changes
  useEffect(() => {
    // Only load tickets if a token is available
    if (token) {
      loadTickets();
    } else {
      setLoading(false);
      setError("Authentication token not found. Please log in.");
    }
  }, [token]); // Depend on token

  // Filter tickets whenever the raw tickets data or filters change
  useEffect(() => {
    filterTickets();
  }, [tickets, filters]); // Depend on tickets and filters

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass the token to the service call
      const response = await SupportTicketService.getAllTickets(token);
      setTickets(response.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      // More specific error message for 401/403
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("You are not authorized to view these tickets. Please log in with appropriate permissions.");
      } else {
        setError("Failed to load tickets. Please try again.");
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (filters.search) {
      filtered = filtered.filter(ticket =>
        ticket.ticketId.toString().includes(filters.search) ||
        ticket.issue.toLowerCase().includes(filters.search.toLowerCase()) ||
        (ticket.remarks && ticket.remarks.toLowerCase().includes(filters.search.toLowerCase())) ||
        // Assuming userId might be a number, ensure it's converted to string for includes
        (ticket.userId && ticket.userId.toString().includes(filters.search))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status.toUpperCase() === filters.status.toUpperCase());
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticketCategory.toUpperCase() === filters.category.toUpperCase());
    }

    // Sort by createdAt in descending order (latest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    const currentTicket = tickets.find(t => t.ticketId === ticketId);

    if (!currentTicket) return;

    // 1. If the ticket is already RESOLVED, prevent any status change.
    if (currentTicket.status === 'RESOLVED') {
      alert(`Ticket #${ticketId} is already RESOLVED and its status cannot be changed.`);
      // Revert the UI selection by reloading tickets or manually updating state if you don't want a full reload
      loadTickets(); // Simpler to just reload for consistency
      return;
    }

    // 2. If trying to change to RESOLVED, ask for confirmation.
    if (newStatus === 'RESOLVED') {
      const confirmResolve = window.confirm(
        `Are you sure you want to mark Ticket #${ticketId} as RESOLVED? This action cannot be undone.`
      );
      if (!confirmResolve) {
        loadTickets(); // Revert UI selection if user cancels
        return;
      }
    }

    try {
      // Prepare the data payload, keeping existing remarks and assignedAgentId if they exist
      const data = {
        status: newStatus.toUpperCase(),
        assignedAgentId: currentTicket.assignedAgentId, // Keep existing agent assignment
        remarks: currentTicket.remarks // Keep existing remarks
      };
      // Pass the token to the service call
      await SupportTicketService.assignAgentAndStatus(ticketId, data, token);
      loadTickets(); // Reload to reflect changes and enforce disabled state for RESOLVED tickets
      alert(`Ticket ${ticketId} status updated to ${newStatus.toUpperCase()}.`);
    } catch (err) {
      console.error("Error updating ticket status:", err);
      setError("Failed to update ticket status. Please try again.");
    }
  };

  const updateRemarks = async (ticketId) => {
    const currentTicket = tickets.find(t => t.ticketId === ticketId);

    // If the ticket is RESOLVED, prevent remarks change.
    if (currentTicket && currentTicket.status === 'RESOLVED') {
      alert(`Remarks for ticket ${ticketId} cannot be changed as it is RESOLVED.`);
      return;
    }

    const newRemarks = prompt('Enter new remarks for this ticket:', currentTicket.remarks || '');
    if (newRemarks === null) { // User clicked cancel on prompt
      return;
    }

    try {
      const data = {
        status: currentTicket.status, // Keep existing status
        assignedAgentId: currentTicket.assignedAgentId, // Keep existing agent
        remarks: newRemarks // Send the new remarks
      };
      // Pass the token to the service call
      await SupportTicketService.assignAgentAndStatus(ticketId, data, token);
      loadTickets();
      alert(`Remarks for ticket ${ticketId} updated successfully.`);
    } catch (err) {
      console.error("Error updating remarks:", err);
      setError("Failed to update remarks. Please try again.");
    }
  };

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      in_progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout title="Support Tickets">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage all support tickets from users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.open}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.in_progress}</p>
              </div>
              <User className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, issue, remarks, or user ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {ticketCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading and Error Indicators */}
        {loading && (
          <div className="text-center p-8">
            <p className="text-lg text-gray-600">Loading tickets...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-8 text-red-600 border border-red-300 bg-red-50 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Tickets Table */}
        {!loading && !error && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.ticketId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{ticket.ticketId}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{ticket.issue}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{ticket.userId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {ticket.ticketCategory?.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                              {ticket.remarks || 'No remarks yet.'}
                            </p>
                            <button
                              onClick={() => updateRemarks(ticket.ticketId)}
                              disabled={ticket.status === 'RESOLVED'} // Disabled if already RESOLVED
                              className={`p-1 rounded-full text-gray-500 hover:bg-gray-200 ${ticket.status === 'RESOLVED' ? 'cursor-not-allowed opacity-50' : ''}`}
                              title="Edit Remarks"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={ticket.status}
                            onChange={(e) => updateTicketStatus(ticket.ticketId, e.target.value)}
                            disabled={ticket.status === 'RESOLVED'} // Disabled if already RESOLVED
                            className={`text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 ${ticket.status === 'RESOLVED' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">
                        <div className="py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                          <p className="text-gray-600">
                            {filters.search || filters.status !== 'all' || filters.category !== 'all'
                              ? 'Try adjusting your filters'
                              : 'No support tickets have been created yet'}
                          </p>
                        </div>
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

export default SupportTickets;