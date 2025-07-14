import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import TicketCard from "../../components/ui/TicketCard";
import { MessageSquare, Send, Plus, Search } from "lucide-react";
import SupportTicketService from "../../services/SupportTicketService";
import { useAuth } from "../../contexts/AuthContext";

const TravelerSupport = () => {
  const { user, token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "OTHER",
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId;

  useEffect(() => {
    if (currentUserId && token) {
      loadTickets();
    } else {
      setLoading(false);
      setTickets([]);
      setError("Please log in to view your tickets.");
    }
  }, [currentUserId, token]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SupportTicketService.getUserTickets(
        currentUserId,
        token
      );
      setTickets(response.data);
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError("Failed to load tickets. Please try again.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!currentUserId || !token) {
      setError("Authentication error: User not logged in.");
      setSubmitting(false);
      return;
    }

    const ticketToCreate = {
      userId: currentUserId,
      issue: formData.subject,
      ticketCategory: formData.category,
      status: "OPEN",
    };

    try {
      await SupportTicketService.createTicket(ticketToCreate, token);
      alert("Support ticket created successfully! We'll get back to you soon.");
      loadTickets();
      setFormData({
        subject: "",
        category: "OTHER",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError("Failed to create ticket. Please try again.");
      alert("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      filters.status === "all" ||
      ticket.status.toLowerCase() === filters.status.toLowerCase();
    const matchesCategory =
      filters.category === "all" ||
      ticket.ticketCategory.toLowerCase() === filters.category.toLowerCase();
    const matchesSearch =
      !filters.search ||
      ticket.issue.toLowerCase().includes(filters.search.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = [
    { value: "HOTEL", label: "HOTEL" },
    { value: "FLIGHT", label: "FLIGHT" },
    { value: "PACKAGE", label: "PACKAGE" },
    { value: "OTHER", label: "OTHER" },
  ];

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      in_progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout title="Support Center">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-600">
              Get help with your bookings and account
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.all}
              </p>
              <p className="text-sm text-gray-600">Total Tickets</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {statusCounts.open}
              </p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {statusCounts.in_progress}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {statusCounts.resolved}
              </p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Create Support Ticket
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="input-field"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className="input-field"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? "Creating..." : "Create Ticket"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
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

        {/* Tickets List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} />
              ))
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tickets found
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.status !== "all" ||
                  filters.category !== "all" ||
                  filters.search
                    ? "Try adjusting your filters"
                    : "Create your first support ticket if you need help"}
                </p>
                {!showForm && tickets.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                  >
                    Create Your First Ticket
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TravelerSupport;
