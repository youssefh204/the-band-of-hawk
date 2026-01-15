import React from "react";
import { Link } from "react-router-dom";
import CourtList from "../components/CourtList";

const CourtsPage = () => {
  return (
    <div className="animate-gradient-x bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 min-h-screen flex flex-col items-center p-8">
      {/* Header with Return to Home Button */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <Link 
          to="/home"
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg backdrop-blur-xl border border-white/30 transition-all hover:scale-105 flex items-center gap-2"
        >
          ⬅️ Return to Home
        </Link>
        
        {/* Empty div for spacing balance */}
        <div className="w-32"></div>
      </div>

      <div className="bg-purple-900 bg-opacity-80 rounded-lg shadow-lg p-8 w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-white mb-4">Campus Courts</h1>
        <p className="text-lg text-center text-gray-300 mb-8">
          Explore the availability of basketball, tennis, and football courts on campus.
        </p>
        <CourtList />
      </div>
    </div>
  );
};

export default CourtsPage;