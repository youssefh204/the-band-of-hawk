import getTransporter from './nodemailer.js';

export const sendPaymentReceipt = async (email, name, payment, event) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"Campus Events" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: `Payment Receipt - ${event.workshopName || event.tripName || event.eventName || 'Event'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#ffffff; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              <tr><td style="text-align:center; padding:40px; background:#3b82f6; border-radius:8px 8px 0 0;">
                <h1 style="color:#fff; margin:0;">Payment Confirmed!</h1>
              </td></tr>

              <tr><td style="padding:40px;">
                <p style="color:#374151;">Hi ${name},</p>
                <p style="color:#374151;">Your payment has been processed successfully. Here's your receipt:</p>

                <div style="background:#f8fafc; padding:20px; border-radius:6px; margin:20px 0;">
                  <h3 style="color:#1f2937; margin-top:0;">Event Details</h3>
                  <p style="color:#4b5563;"><strong>Event:</strong> ${event.workshopName || event.tripName || event.eventName || 'Event'}</p>
                  <p style="color:#4b5563;"><strong>Type:</strong> ${payment.eventType}</p>
                  <p style="color:#4b5563;"><strong>Amount:</strong> $${payment.amount}</p>
                  <p style="color:#4b5563;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="color:#4b5563;"><strong>Payment ID:</strong> ${payment._id}</p>
                </div>

                ${payment.receiptUrl ? `
                <div style="text-align:center; margin:30px 0;">
                  <a href="${payment.receiptUrl}" 
                    style="padding:12px 24px; background:#3b82f6; color:white; text-decoration:none; border-radius:6px;">
                    View Detailed Receipt
                  </a>
                </div>
                ` : ''}

                <p style="color:#6b7280; font-size:14px;">
                  Thank you for your payment! We look forward to seeing you at the event.
                </p>
              </td></tr>

              <tr><td style="padding:20px; background:#f1f5f9; text-align:center; border-radius:0 0 8px 8px;">
                <p style="color:#64748b; font-size:12px;">This is an automated receipt. Please save it for your records.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendCertificateEmail = async (email, name, workshop, certificateId, options = {}) => {
  const transporter = await getTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateId}`;

  const mailOptions = {
    from: `"Campus Events" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: `🎓 Certificate of Attendance - ${workshop.workshopName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#ffffff; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              <tr><td style="text-align:center; padding:40px; background:linear-gradient(135deg, #10b981, #059669); border-radius:8px 8px 0 0;">
                <h1 style="color:#fff; margin:0; font-size:28px;">🎓 Certificate of Attendance</h1>
                <p style="color:#fff; margin:10px 0 0; opacity:0.9;">Congratulations on your achievement!</p>
              </td></tr>

              <tr><td style="padding:40px;">
                <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
                <p style="color:#374151;">Congratulations on your attendance at the workshop! Your certificate is ready.</p>

                <div style="background:#f0fdf4; padding:20px; border-radius:6px; margin:20px 0;">
                  <h3 style="color:#065f46; margin-top:0;">Workshop Details</h3>
                  <p style="color:#047857;"><strong>Workshop:</strong> ${workshop.workshopName}</p>
                  <p style="color:#047857;"><strong>Location:</strong> ${workshop.location}</p>
                  <p style="color:#047857;"><strong>Faculty:</strong> ${workshop.faculty}</p>
                  <p style="color:#047857;"><strong>Date of Attendance:</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="color:#047857;"><strong>Certificate ID:</strong> ${certificateId}</p>
                </div>

                <div style="text-align:center; margin:30px 0;">
                  <div style="background:#10b981; color:white; padding:15px 25px; border-radius:6px; display:inline-block; font-weight:bold;">
                    🎓 Certificate Generated Successfully
                  </div>
                </div>

                <p style="color:#6b7280; font-size:14px;">
                  This certificate verifies your attendance at the workshop. 
                  Keep it for your records and professional portfolio.
                </p>

                <div style="background:#f1f5f9; padding:15px; border-radius:6px; margin-top:20px;">
                  <p style="color:#64748b; font-size:12px; margin:0;">
                    <strong>Note:</strong> You can download your certificate from your account dashboard.
                    This certificate is also verifiable online using your Certificate ID.
                  </p>
                </div>
              </td></tr>

              <tr><td style="padding:20px; background:#f1f5f9; text-align:center; border-radius:0 0 8px 8px;">
                <p style="color:#64748b; font-size:12px;">
                  This is an official certificate issued by Campus Events.
                  © ${new Date().getFullYear()} Campus Events. All rights reserved.
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    ...options
  };

  return transporter.sendMail(mailOptions);
};

//Send application status notification to vendor
export const sendApplicationStatusEmail = async (email, vendorName, application, bazaar = null) => {
  const transporter = await getTransporter();

  const isApproved = application.status === 'approved';
  const eventName = application.type === 'bazaar' && bazaar
    ? bazaar.bazaarName
    : `${application.location} Booth`;

  const mailOptions = {
    from: `"The Band of the Hawk" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: `Application ${isApproved ? 'Approved' : 'Rejected'} - ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#0a0a0a; font-family:-apple-system,BlinkMacSystemFont;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#1a1a1a; border-radius:8px;">
              <tr><td style="text-align:center; padding:40px; background:${isApproved ? '#047857' : '#7f1d1d'}; border-radius:8px 8px 0 0;">
                <h1 style="color:#fff; margin:0;">Application ${isApproved ? 'Approved! 🎉' : 'Update'}</h1>
              </td></tr>

              <tr><td style="padding:40px;">
                <p style="color:#a1a1aa;">Hi ${vendorName},</p>
                <p style="color:#a1a1aa;">Your application for ${eventName} has been <strong style="color:${isApproved ? '#10b981' : '#ef4444'}">${application.status}</strong>.</p>

                <div style="background:#2a2a2a; padding:20px; border-radius:6px; margin:20px 0;">
                  <h3 style="color:#d1d5db; margin-top:0;">Application Details</h3>
                  <p style="color:#9ca3af;"><strong>Type:</strong> ${application.type}</p>
                  <p style="color:#9ca3af;"><strong>Booth Size:</strong> ${application.boothSize}</p>
                  ${application.type === 'booth' ? `<p style="color:#9ca3af;"><strong>Duration:</strong> ${application.duration} weeks</p>` : ''}
                  ${application.type === 'booth' ? `<p style="color:#9ca3af;"><strong>Location:</strong> ${application.location}</p>` : ''}
                  ${isApproved ? `<p style="color:#9ca3af;"><strong>Price:</strong> $${application.price}</p>` : ''}
                </div>

                ${isApproved ? `
                <div style="background:#065f46; padding:20px; border-radius:6px; margin:20px 0;">
                  <h3 style="color:#10b981; margin-top:0;">⚠️ Payment Required</h3>
                  <p style="color:#d1fadf;">Please complete payment within <strong>3 days</strong> to secure your spot.</p>
                  <p style="color:#d1fadf;"><strong>Payment Deadline:</strong> ${new Date(application.paymentDeadline).toLocaleDateString()}</p>
                  <p style="color:#d1fadf;"><strong>Amount Due:</strong> $${application.price}</p>
                </div>
                ` : `
                <div style="background:#2a2a2a; padding:15px; border-radius:6px;">
                  <p style="color:#fca5a5; margin:0;">Reason: ${application.adminNotes || 'Not specified'}</p>
                </div>
                `}

                <p style="color:#71717a; font-size:14px; margin-top:30px;">
                  ${isApproved ? 'Log in to your vendor dashboard to complete the payment.' : 'Thank you for your interest. Feel free to apply for future opportunities.'}
                </p>
              </td></tr>

              <tr><td style="padding:20px; background:#0a0a0a; text-align:center; border-radius:0 0 8px 8px;">
                <p style="color:#52525b; font-size:12px;">This is an automated email from The Band of the Hawk.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send QR code to visitor/attendee
export const sendVisitorQREmail = async (email, name, qrDataUrl, eventDetails) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"The Band of the Hawk" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: `Your QR Code - ${eventDetails.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#0a0a0a; font-family:-apple-system,BlinkMacSystemFont;">
        <table style="width:100%;">
          <tr><td align="center" style="padding:40px 0;">
            <table style="width:600px; background:#1a1a1a; border-radius:8px;">
              <tr><td style="text-align:center; padding:40px; background:#8b5cf6; border-radius:8px 8px 0 0;">
                <h1 style="color:#fff; margin:0;">Your Entry QR Code</h1>
              </td></tr>

              <tr><td style="padding:40px;">
                <p style="color:#a1a1aa;">Hi ${name},</p>
                <p style="color:#a1a1aa;">Your registration for <strong style="color:#fff;">${eventDetails.eventName}</strong> has been confirmed!</p>

                <div style="text-align:center; margin:30px 0;">
                  <img src="${qrDataUrl}" alt="QR Code" style="width:250px; height:250px; border:2px solid #8b5cf6; border-radius:8px;"/>
                </div>

                <div style="background:#2a2a2a; padding:20px; border-radius:6px; margin:20px 0;">
                  <p style="color:#d1d5db;"><strong>Event:</strong> ${eventDetails.eventName}</p>
                  <p style="color:#d1d5db;"><strong>Type:</strong> ${eventDetails.type}</p>
                  ${eventDetails.location ? `<p style="color:#d1d5db;"><strong>Location:</strong> ${eventDetails.location}</p>` : ''}
                </div>

                <div style="background:#3730a3; padding:15px; border-radius:6px;">
                  <p style="color:#c4b5fd; margin:0; font-size:14px;">
                    <strong>📱 Important:</strong> Please present this QR code at the entrance to ${eventDetails.eventName}.
                  </p>
                </div>

                <p style="color:#71717a; font-size:12px; margin-top:20px;">
                  Keep this email for your records. You can also save the QR code image to your device.
                </p>
              </td></tr>

              <tr><td style="padding:20px; background:#0a0a0a; text-align:center; border-radius:0 0 8px 8px;">
                <p style="color:#52525b; font-size:12px;">This is an automated email from The Band of the Hawk.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};