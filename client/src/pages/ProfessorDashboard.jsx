import React, { useEffect, useState } from 'react';
// ❌ REMOVED: import { useNavigate } from 'react-router-dom'; (No longer needed)
import { getProfessorWorkshops } from '../apis/workshopClient';
import './ProfessorDashboard.css'; 

const ProfessorDashboard = () => {
  // ❌ REMOVED: const navigate = useNavigate();

  // 1. STATE DEFINITIONS
  const [activeWorkshops, setActiveWorkshops] = useState([]);
  const [archivedWorkshops, setArchivedWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null); 

  // 2. LOAD DATA
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProfessorWorkshops();
        
        // Handle response safely
        const active = data?.active || (data?.success ? data.active : []);
        const archived = data?.archived || (data?.success ? data.archived : []);
        
        setActiveWorkshops(active || []);
        setArchivedWorkshops(archived || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load workshops. Are you logged in as a Professor?');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 3. HELPER FUNCTIONS
  const handleViewParticipants = (workshop) => {
    setSelectedWorkshop(workshop);
  };

  const closePopup = () => {
    setSelectedWorkshop(null);
  };

  // Safe Name Generator (Prevents "White Page" crash if user data is missing)
  const getStudentName = (userObj) => {
    if (!userObj) return "Unknown Student";
    if (userObj.name) return userObj.name;
    if (userObj.firstName || userObj.lastName) {
        return `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
    }
    return "No Name Available";
  };

  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="dashboard-container">
      
      {/* HEADER (Button Removed) */}
      <div className="dashboard-header">
        <h1>🎓 Professor Dashboard</h1>
        <p>Manage your workshops and view participant details.</p>
        {/* ❌ REMOVED: Back to Home Button */}
      </div>

      {/* --- SECTION 1: ACTIVE WORKSHOPS --- */}
      <div className="dashboard-section">
        <h2>Active Workshops</h2>
        {activeWorkshops.length === 0 ? (
          <p className="no-data">You have no active workshops.</p>
        ) : (
          <table className="workshop-table">
            <thead>
              <tr>
                <th>Workshop Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Spots Left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeWorkshops.map((ws) => (
                <tr key={ws._id}>
                  <td><strong>{ws.workshopName}</strong></td>
                  <td>{new Date(ws.startDateTime).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${ws.status}`}>
                      {ws.status ? ws.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                  <td>
                    {ws.remainingSpots} / {ws.capacity}
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => handleViewParticipants(ws)}
                    >
                      👥 Participants
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- SECTION 2: ARCHIVED WORKSHOPS --- */}
      <div className="dashboard-section archived">
        <h2>📂 Archived (Past Events)</h2>
        {archivedWorkshops.length === 0 ? (
          <p className="no-data">No past events found.</p>
        ) : (
          <table className="workshop-table">
            <thead>
              <tr>
                <th>Workshop Name</th>
                <th>Date Ended</th>
                <th>Final Status</th>
              </tr>
            </thead>
            <tbody>
              {archivedWorkshops.map((ws) => (
                <tr key={ws._id}>
                  <td>{ws.workshopName}</td>
                  <td>{new Date(ws.endDateTime).toLocaleDateString()}</td>
                  <td>{ws.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- SECTION 3: PARTICIPANTS POPUP (MODAL) --- */}
      {selectedWorkshop && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Participants: {selectedWorkshop.workshopName}</h3>
              <button onClick={closePopup} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              {selectedWorkshop.registeredUsers && selectedWorkshop.registeredUsers.length > 0 ? (
                <ul className="participants-list">
                  {selectedWorkshop.registeredUsers.map((reg, index) => {
                    const user = reg.userId;
                    const isPopulated = user && typeof user === 'object';

                    return (
                      <li key={index}>
                        {isPopulated ? (
                          <div className="p-info">
                            <span className="p-name">{getStudentName(user)}</span>
                            <span className="p-email">{user.email || 'No Email'}</span>
                          </div>
                        ) : (
                          <span className="p-id">
                             User ID: {user ? user : "Deleted User"} 
                          </span>
                        )}
                        <span className={`p-status ${reg.status}`}>{reg.status}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="no-data">No students have registered yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;