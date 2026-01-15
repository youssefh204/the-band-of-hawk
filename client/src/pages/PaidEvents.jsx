import { useState, useEffect } from 'react';
import { getAvailableWorkshops } from '../apis/workshopClient';
import { getAvailableTrips } from '../apis/tripClient';
import PaymentModal from '../components/PaymentModal';

export default function PaidEvents() {
  const [workshops, setWorkshops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    fetchPaidEvents();
  }, []);

  const fetchPaidEvents = async () => {
    try {
      // Get workshops with prices > 0
      const workshopsRes = await getAvailableWorkshops();
      const paidWorkshops = workshopsRes.data.data.filter(w => w.price > 0);
      setWorkshops(paidWorkshops);

      // Get trips with prices > 0
      const tripsRes = await getAvailableTrips();
      const paidTrips = tripsRes.data.data.filter(t => t.price > 0);
      setTrips(paidTrips);
    } catch (error) {
      console.error('Failed to fetch paid events:', error);
    }
  };

  const handleRegister = (event, type) => {
    setSelectedEvent(event);
    setEventType(type);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    setSelectedEvent(null);
    // Show success message or refresh
    alert('Registration successful! Check your email for receipt.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Paid Events</h1>
        
        {/* Paid Workshops */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Paid Workshops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map(workshop => (
              <div key={workshop._id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-2">{workshop.workshopName}</h3>
                <p className="text-white/70 mb-4">{workshop.shortDescription}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-white/80">📍 {workshop.location}</p>
                  <p className="text-white/80">📅 {new Date(workshop.startDateTime).toLocaleDateString()}</p>
                  <p className="text-white/80">👥 {workshop.availableSpots} spots left</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${workshop.price}
                  </div>
                  <button
                    onClick={() => handleRegister(workshop, 'workshop')}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Register & Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Paid Trips */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Paid Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <div key={trip._id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-2">{trip.tripName}</h3>
                <p className="text-white/70 mb-4">{trip.Destination}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-white/80">📍 {trip.Destination}</p>
                  <p className="text-white/80">📅 {new Date(trip.startDateTime).toLocaleDateString()}</p>
                  <p className="text-white/80">👥 {trip.availableSpots} spots left</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${trip.price}
                  </div>
                  <button
                    onClick={() => handleRegister(trip, 'trip')}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Register & Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Modal */}
        {showPaymentModal && selectedEvent && (
          <PaymentModal
            event={selectedEvent}
            eventType={eventType}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </div>
    </div>
  );
}