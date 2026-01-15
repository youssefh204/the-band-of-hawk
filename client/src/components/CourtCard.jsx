import React from "react";

const CourtCard = ({ court }) => {
  // Function to get availability based on court type
  const getAvailabilityByType = (type) => {
    const availabilityMap = {
      "Tennis": "11:00 AM - 6:00 PM",
      "Basketball": "8:00 AM - 3:00 PM", 
      "Badminton": "8:00 AM - 9:00 PM",
      "Volleyball": "9:00 AM - 8:00 PM",
      "Squash": "7:30 AM - 10:30 PM",
      "default": "9:00 AM - 4:00 PM"
    };
    
    return availabilityMap[type] || availabilityMap.default;
  };

  const availability = getAvailabilityByType(court.type);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-64 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{court.name}</h3>
      <p className="text-gray-600">
        <strong>Type:</strong> {court.type}
      </p>
      <p className="text-gray-600">
        <strong>Availability:</strong> {availability}
      </p>
    </div>
  );
};

export default CourtCard;