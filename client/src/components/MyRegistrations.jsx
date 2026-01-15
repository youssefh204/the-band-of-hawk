// components/MyRegistrations.jsx
import { useState, useEffect } from 'react';
import { getMyRegistrations, cancelWorkshopRegistration, cancelTripRegistration } from '../apis/registrationClient';
import { requestWorkshopCertificate } from '../apis/certificateClient';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState({ workshops: [], trips: [] });
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false); // New loading state for certificate requests
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await getMyRegistrations();
      setRegistrations(res.data.eventRegistrations);
    } catch (err) {
      setError('Failed to fetch registrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId, eventType, eventName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for ${eventName}?`)) {
      return;
    }

    setLoading(true);
    try {
      if (eventType === 'workshop') {
        await cancelWorkshopRegistration(eventId);
      } else {
        await cancelTripRegistration(eventId);
      }
      alert('Registration cancelled successfully. Refund processed to your wallet.');
      fetchRegistrations(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCertificate = async (workshopId, workshopName) => {
    if (!window.confirm(`Do you want to request your certificate for ${workshopName}? It will be sent to your registered email.`)) {
      return;
    }

    setCertLoading(true); // Use specific loading for certificate
    try {
      const res = await requestWorkshopCertificate(workshopId);
      alert(res.data.message);
      fetchRegistrations(); // Refresh registrations to show certificateSent status
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request certificate.');
    } finally {
      setCertLoading(false);
    }
  };

  if (loading) {
    return <div>Loading your registrations...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Registrations</h2>

      {/* Workshops */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Workshops</h3>
        <div className="space-y-3">
          {registrations.workshops?.map(reg => reg.workshopId ? (
            <div key={reg._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{reg.workshopId.workshopName}</h4>
                  <p className="text-white/70 text-sm">
                    {new Date(reg.workshopId.startDateTime).toLocaleDateString()} • {reg.workshopId.location}
                  </p>
                  <p className={`text-sm font-semibold ${reg.status === 'registered' ? 'text-green-400' : (reg.status === 'attended' ? 'text-blue-400' : 'text-yellow-400')}`}>
                    Status: {reg.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {reg.status === 'registered' && (
                    <button
                      onClick={() => handleCancel(reg.workshopId._id, 'workshop', reg.workshopId.workshopName)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {/* Get Certificate Button */}
                  {!reg.certificateSent && new Date() > new Date(reg.workshopId.endDateTime) && (
                    <button
                      onClick={() => handleGetCertificate(reg.workshopId._id, reg.workshopId.workshopName)}
                      disabled={certLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                      {certLoading ? 'Sending Certificate...' : 'Certificate'}
                    </button>
                  )}
                  {/* If certificate is not sent but end date hasn't passed */}
                  {!reg.certificateSent && new Date() <= new Date(reg.workshopId.endDateTime) && (
                    <span className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm flex items-center justify-center gap-1">
                      Available after event ends
                    </span>
                  )}
                  {reg.certificateSent && (
                    <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Certificate Sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ): null)}
        </div>
      </div>

      {/* Trips */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Trips</h3>
        <div className="space-y-3">
          {registrations.trips?.map(reg => reg.tripId ? (
            <div key={reg._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{reg.tripId.tripName}</h4>
                  <p className="text-white/70 text-sm">
                    {new Date(reg.tripId.startDateTime).toLocaleDateString()} • {reg.tripId.Destination}
                  </p>
                   <p className={`text-sm font-semibold ${reg.status === 'registered' ? 'text-green-400' : 'text-yellow-400'}`}>
                    Status: {reg.status}
                  </p>
                </div>
                <div className="flex gap-2">
                   {reg.status === 'registered' && (
                    <button
                      onClick={() => handleCancel(reg.tripId._id, 'trip', reg.tripId.tripName)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ): null)}
        </div>
      </div>
    </div>
  );
}