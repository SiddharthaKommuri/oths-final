import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  Eye, // Import the Eye icon for viewing remarks
} from "lucide-react";
import React, { useState } from 'react'; // Import useState
import StatusBadge from "./StatusBadge";
import RemarksModal from "./RemarksModal"; // Import the RemarksModal component

const TicketCard = ({ ticket, onUpdate }) => {
  // onUpdate prop is not used in this component itself, but kept as it was there.

  // State for the Remarks Modal
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [currentRemarksForModal, setCurrentRemarksForModal] = useState('');

  const formatDate = (dateString) => {
    // Check if dateString is valid before formatting
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const getCategoryIcon = (category) => {
    // Updated to match your TicketCategory enum values (HOTEL, FLIGHT, PACKAGE, OTHER)
    switch (
      category?.toUpperCase() // Convert to uppercase for consistent matching
    ) {
      case "HOTEL":
        return "🏨";
      case "FLIGHT":
        return "✈️";
      case "PACKAGE":
      case "OTHER": // Group PACKAGE and OTHER for same icon if desired, or add specific for PACKAGE
        return "📦"; // Using package icon for both PACKAGE and OTHER for simplicity
      default:
        return "❓";
    }
  };

  // Function to open the remarks modal
  const openRemarksModal = (remarks) => {
    setCurrentRemarksForModal(remarks);
    setIsRemarksModalOpen(true);
  };

  // Function to close the remarks modal
  const closeRemarksModal = () => {
    setIsRemarksModalOpen(false);
    setCurrentRemarksForModal('');
  };

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">
            {getCategoryIcon(ticket.ticketCategory)}
          </span>{" "}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              #{ticket.ticketId} - {ticket.issue}{" "}
            </h3>
            {/* Display truncated remarks with a "View All" button */}
            <div className="flex items-center mt-2 space-x-2">
              <p className="text-gray-600 text-sm line-clamp-2 flex-grow">
                {ticket.remarks ? ticket.remarks : 'No admin remarks yet.'}
              </p>
              {ticket.remarks && ( // Only show the button if remarks exist
                <button
                  onClick={() => openRemarksModal(ticket.remarks)}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
                  title="View full remarks"
                >
                  <Eye className="w-4 h-4 mr-1" /> View All
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="font-medium">{formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <div>
            <p className="text-xs text-gray-500">Updated</p>
            <p className="font-medium">
              {ticket.updatedAt ? formatDate(ticket.updatedAt) : "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4" />
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="font-medium capitalize">
              {ticket.ticketCategory?.toLowerCase().replace("_", " ")}
            </p>{" "}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <div>
            <p className="text-xs text-gray-500">User ID</p>{" "}
            <p className="font-medium">{ticket.userId}</p>{" "}
          </div>
        </div>
      </div>

      {ticket.status === "RESOLVED" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>Resolved:</strong> This ticket has been marked as
              resolved. If you need further assistance, please create a new
              ticket.
            </p>
          </div>
        </div>
      )}

      {ticket.status === "IN_PROGRESS" && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>In Progress:</strong> Our support team is working on your
              request. You'll receive an update soon.
            </p>
          </div>
        </div>
      )}

      {/* Remarks Modal integrated into the TicketCard */}
      <RemarksModal
        isOpen={isRemarksModalOpen}
        remarks={currentRemarksForModal}
        onClose={closeRemarksModal}
      />
    </div>
  );
};

export default TicketCard;