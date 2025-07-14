import React from "react";
import { Star } from "lucide-react";
 
const HotelCard = ({ hotel, onBook }) => {
  return (
    <div className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
        <p className="text-sm text-gray-600">{hotel.location}</p>
        <p className="text-md font-medium text-primary-600 mt-1">
          ₹{hotel.pricePerNight} / night
        </p>
 
        {/* ⭐ Rating Display */}
        <div className="flex items-center text-yellow-500 text-sm mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(hotel.rating)
                  ? "fill-yellow-400"
                  : "fill-gray-300"
              }`}
            />
          ))}
          <span className="ml-1 text-gray-600">({hotel.rating || 0})</span>
        </div>
      </div>
 
      <button
        className="btn-primary mt-3 md:mt-0"
        onClick={() => onBook(hotel)}
      >
        Book
      </button>
    </div>
  );
};
 
export default HotelCard;