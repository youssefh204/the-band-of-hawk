import ExcelJS from 'exceljs';
import Workshop from '../models/Workshop.js';
import Trip from '../models/TripModel.js';
import User from '../models/userModel.js';

export const exportEventAttendees = async (req, res) => {
  try {
    const { eventType, eventId } = req.params;

    let event, registrations;

    if (eventType === 'workshop') {
      event = await Workshop.findById(eventId).populate('registeredUsers.userId', 'firstName lastName email studentId role');
      if (!event) return res.status(404).json({ success: false, message: 'Workshop not found' });
      registrations = event.registeredUsers.filter(r => r.status === "registered" || r.status === "attended");
    }
    else if (eventType === 'trip') {
      event = await Trip.findById(eventId).populate('Travelers.userId', 'firstName lastName email studentId role');
      if (!event) return res.status(404).json({ success: false, message: 'Trip not found' });
      registrations = event.Travelers.filter(r => r.status === "registered" || r.status === "attended");
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid eventType' });
    }

    // Create Excel sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendees');

    sheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Registration Status', key: 'status', width: 15 },
      { header: 'Registered At', key: 'date', width: 25 }
    ];

    registrations.forEach((reg) => {
      const user = reg.userId;
      sheet.addRow({
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        email: user?.email || "",
        studentId: user?.studentId || "",
        role: user?.role || "",
        status: reg.status,
        date: reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : ""
      });
    });

    sheet.getRow(1).font = { bold: true };

    // Response as download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${eventType}-export-${eventId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).json({ success: false, message: 'Error exporting sheet' });
  }
};
