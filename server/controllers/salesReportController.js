import User from "../models/userModel.js";
import Workshop from "../models/Workshop.js";
import Conference from "../models/Conference.js";
import Trip from "../models/TripModel.js";
import Application from "../models/application.js";
import Payment from "../models/Payment.js";

/**
 * GET /api/sales-report
 * Query params:
 *  - eventType: 'all', 'workshops', 'conferences', 'trips', 'bazaars'
 *  - startDate: ISO date string (optional)
 *  - endDate: ISO date string (optional)
 */
const buildSalesReport = async ({ eventType = 'all', startDate, endDate, sortOrder = 'desc' } = {}) => {
  const report = {
    summary: {
      totalAttendees: 0,
      totalEvents: 0,
      totalRevenue: 0,
      workshops: { count: 0, attendees: 0, revenue: 0 },
      conferences: { count: 0, attendees: 0, revenue: 0 },
      trips: { count: 0, attendees: 0, revenue: 0 },
      bazaars: { count: 0, attendees: 0, revenue: 0 }
    },
    events: []
  };

  // Build date filter
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  // Helper to sum payments for a specific event
  const sumPaymentsForEvent = async (etype, eventId) => {
    if (!etype || !eventId) return 0;
    const payments = await Payment.find({ eventType: etype, eventId: eventId, status: 'completed' });
    return payments.reduce((s, p) => s + (p.amount || 0), 0);
  };

  // Fetch data based on eventType
  if (eventType === 'all' || eventType === 'workshops') {
    const workshopFilter = {};
    if (startDate || endDate) workshopFilter.startDateTime = dateFilter;

    const workshops = await Workshop.find(workshopFilter);

    for (const workshop of workshops) {
      // Count registered/attended users using registeredUsers when available
      const attendeeCount = Array.isArray(workshop.registeredUsers)
        ? workshop.registeredUsers.filter(r => r.status !== 'cancelled').length
        : await User.countDocuments({ 'attendedEvents.workshops': workshop._id });

      // Revenue: prefer Payments collection, fallback to price * attendees
      const paymentsSum = await sumPaymentsForEvent('workshop', workshop._id);
      const fallbackRevenue = (workshop.price || 0) * (attendeeCount || 0);
      const revenue = paymentsSum || fallbackRevenue || 0;

      report.summary.workshops.count++;
      report.summary.workshops.attendees += attendeeCount;
      report.summary.workshops.revenue += revenue;
      report.summary.totalEvents++;
      report.summary.totalAttendees += attendeeCount;
      report.summary.totalRevenue += revenue;

      report.events.push({
        type: 'Workshop',
        id: workshop._id,
        name: workshop.workshopName,
        date: workshop.startDateTime,
        location: workshop.location,
        attendees: attendeeCount,
        capacity: workshop.capacity || 0,
        faculty: workshop.faculty,
        price: workshop.price || 0,
        revenue
      });
    }
  }

  if (eventType === 'all' || eventType === 'conferences') {
    const conferenceFilter = {};
    if (startDate || endDate) conferenceFilter.startDateTime = dateFilter;

    const conferences = await Conference.find(conferenceFilter);

    for (const conference of conferences) {
      // Use registrationsCount from model as attendee count
      const attendeeCount = conference.registrationsCount || 0;

      // No payments tracked for conferences in Payment model -> revenue = 0 (could be extended)
      const revenue = 0;

      report.summary.conferences.count++;
      report.summary.conferences.attendees += attendeeCount;
      report.summary.conferences.revenue += revenue;
      report.summary.totalEvents++;
      report.summary.totalAttendees += attendeeCount;
      report.summary.totalRevenue += revenue;

      report.events.push({
        type: 'Conference',
        id: conference._id,
        name: conference.name,
        date: conference.startDateTime,
        attendees: attendeeCount,
        budget: conference.budget || 0,
        fundingSource: conference.fundingSource,
        revenue
      });
    }
  }

  if (eventType === 'all' || eventType === 'trips') {
    const tripFilter = {};
    if (startDate || endDate) tripFilter.startDateTime = dateFilter;

    const trips = await Trip.find(tripFilter);

    for (const trip of trips) {
      // Count active travelers
      const attendeeCount = Array.isArray(trip.Travelers)
        ? trip.Travelers.filter(t => t.status !== 'cancelled').length
        : await User.countDocuments({ 'attendedEvents.trips': trip._id });

      // Revenue: prefer Payments collection, fallback to travelers' amountPaid or virtual
      const paymentsSum = await sumPaymentsForEvent('trip', trip._id);
      const travelersPaid = Array.isArray(trip.Travelers)
        ? trip.Travelers.reduce((s, t) => s + (t.amountPaid || 0), 0)
        : 0;
      const revenue = paymentsSum || travelersPaid || (trip.totalRevenue || 0) || 0;

      report.summary.trips.count++;
      report.summary.trips.attendees += attendeeCount;
      report.summary.trips.revenue += revenue;
      report.summary.totalEvents++;
      report.summary.totalAttendees += attendeeCount;
      report.summary.totalRevenue += revenue;

      report.events.push({
        type: 'Trip',
        id: trip._id,
        name: trip.tripName,
        date: trip.startDateTime,
        destination: trip.Destination,
        attendees: attendeeCount,
        capacity: trip.capacity || 0,
        price: trip.price || 0,
        revenue
      });
    }
  }

  if (eventType === 'all' || eventType === 'bazaars') {
    const applicationFilter = { type: 'bazaar', status: 'approved' };
    if (startDate || endDate) applicationFilter.createdAt = dateFilter;

    const bazaarApplications = await Application.find(applicationFilter).populate('bazaarId');

    // Group by bazaar
    const bazaarMap = new Map();

    for (const app of bazaarApplications) {
      if (!app.bazaarId) continue;

      const bazaarId = app.bazaarId._id.toString();
      const attendeeCount = Array.isArray(app.attendees) ? app.attendees.length : 0;

      if (bazaarMap.has(bazaarId)) {
        bazaarMap.get(bazaarId).attendees += attendeeCount;
      } else {
        bazaarMap.set(bazaarId, {
          type: 'Bazaar',
          id: app.bazaarId._id,
          name: app.bazaarId.bazaarName,
          date: app.bazaarId.startDate,
          location: app.bazaarId.location,
          attendees: attendeeCount,
          revenue: 0
        });
      }
    }

    for (const bazaarData of bazaarMap.values()) {
      report.summary.bazaars.count++;
      report.summary.bazaars.attendees += bazaarData.attendees;
      report.summary.bazaars.revenue += bazaarData.revenue || 0;
      report.summary.totalEvents++;
      report.summary.totalAttendees += bazaarData.attendees;
      report.summary.totalRevenue += bazaarData.revenue || 0;
      report.events.push(bazaarData);
    }
  }

  // Always sort events by revenue (desc by default)
  report.events.sort((a, b) => {
    const ra = Number(a.revenue || 0);
    const rb = Number(b.revenue || 0);
    return sortOrder === 'asc' ? ra - rb : rb - ra;
  });

  return report;
};

export const getSalesReport = async (req, res) => {
  try {
    const { eventType = 'all', startDate, endDate, sortOrder = 'desc' } = req.query;
    const report = await buildSalesReport({ eventType, startDate, endDate, sortOrder });

    res.json({
      success: true,
      data: report,
      filters: { eventType, startDate, endDate, sortOrder }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate sales report' });
  }
};

/**
 * GET /api/sales-report/export
 * Same filters as above, but returns CSV data
 */
export const exportSalesReport = async (req, res) => {
  try {
  const { eventType = 'all', startDate, endDate, sortOrder = 'desc' } = req.query;

  // Reuse same logic to get report data (sorted by revenue)
  const report = await buildSalesReport({ eventType, startDate, endDate, sortOrder });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');

    // CSV header
    const headers = ['Event Type', 'Event Name', 'Date', 'Location', 'Attendees', 'Capacity', 'Price', 'Revenue'];
    const escape = (v) => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };

    let csv = headers.map(escape).join(',') + '\n';

    for (const e of report.events) {
      const row = [
        e.type || '',
        e.name || '',
        e.date ? new Date(e.date).toISOString() : '',
        e.location || e.destination || '',
        e.attendees || 0,
        e.capacity || '',
        e.price || '',
        e.revenue || 0
      ];
      csv += row.map(escape).join(',') + '\n';
    }

    res.send(csv);
    
  } catch (error) {
      const report = await buildSalesReport({ eventType, startDate, endDate });
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
};
