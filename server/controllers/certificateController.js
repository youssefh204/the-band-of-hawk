import User from '../models/userModel.js';
import Workshop from '../models/Workshop.js';
import Certificate from '../models/Certificate.js';
import { sendCertificateEmail } from '../config/emailTemplates.js';
import crypto from 'crypto';
import { generateCertificate as generatePdf } from '../utils/certificateGenerator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const requestCertificateAndSendEmail = async (req, res) => {
  try {
    const { workshopId } = req.body;
    const userId = req.user.id;

    console.log('🎓 Requesting and sending certificate:', { userId, workshopId });

    const user = await User.findById(userId);
    const workshop = await Workshop.findById(workshopId);

    if (!user || !workshop) {
      return res.status(404).json({ success: false, message: 'User or workshop not found' });
    }

    // Check if workshop has ended
    const workshopEnd = new Date(workshop.endDateTime);
    const now = new Date();
    
    if (now < workshopEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate not available yet. Workshop has not ended.' 
      });
    }

    const registration = user.eventRegistrations.workshops.find(
      reg => reg.workshopId.toString() === workshopId
    );

    if (!registration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration not found for this workshop.' 
      });
    }

    // If status is registered, mark as attended
    if (registration.status === "registered") {
      registration.status = "attended";
      await user.save();
      console.log(`User ${userId} registration for workshop ${workshopId} status updated to 'attended'.`);
    } else if (registration.status !== "attended") {
      // If status is not 'registered' or 'attended', then it's not eligible
      return res.status(400).json({ 
        success: false, 
        message: 'You must be registered and attended this workshop to receive a certificate.' 
      });
    }

    // Check if certificate already exists and was sent
    let certificate = await Certificate.findOne({ userId, workshopId });
    if (certificate && registration.certificateSent) {
      return res.json({
        success: true,
        message: 'Certificate already generated and sent to your email.',
        data: { 
          certificateUrl: certificate.filePath,
          certificateId: certificate.certificateId
        }
      });
    }

    // Generate certificate data and PDF
    const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const verificationCode = crypto.randomBytes(8).toString('hex');
    
    const generatedFilePath = await generatePdf(user, workshop, certificateId); // generatePdf returns path like /uploads/certificates/filename.pdf

    // Save/Update certificate record
    if (!certificate) {
      certificate = new Certificate({
        certificateId,
        userId,
        workshopId,
        filePath: generatedFilePath,
        verificationCode,
        userName: `${user.firstName} ${user.lastName}`,
        workshopName: workshop.workshopName,
        issuedAt: new Date()
      });
    } else {
      certificate.filePath = generatedFilePath; // Update if already exists but PDF wasn't generated
      certificate.verificationCode = verificationCode;
      certificate.issuedAt = new Date();
    }
    await certificate.save();

    console.log('✅ Certificate generated and record saved:', certificateId);

    // Send certificate email with attachment
    const absoluteFilePath = path.join(__dirname, '..', generatedFilePath); // Construct absolute path
    await sendCertificateEmail(user.email, user.firstName, workshop, certificateId, {
        attachments: [
            {
                filename: `${certificateId}.pdf`,
                path: absoluteFilePath,
                contentType: 'application/pdf'
            }
        ]
    });

    // Mark certificate as sent in user's registration
    registration.certificateSent = true;
    await user.save();
    
    console.log('✅ Certificate email sent to:', user.email);

    res.json({
      success: true,
      message: 'Certificate generated and sent to your email successfully!',
      data: { 
        certificateUrl: generatedFilePath,
        certificateId: certificate.certificateId,
        verificationCode: certificate.verificationCode
      }
    });

  } catch (error) {
    console.error('Request certificate and send email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendCertificateToEmail = async (req, res) => {
  try {
    const { workshopId } = req.body;
    const userId = req.user.id;

    console.log('📧 Sending certificate email:', { userId, workshopId });

    const user = await User.findById(userId);
    const workshop = await Workshop.findById(workshopId);

    if (!user || !workshop) {
      return res.status(404).json({ success: false, message: 'User or workshop not found' });
    }

    // Check if certificate exists
    const certificate = await Certificate.findOne({ userId, workshopId });
    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found. Please generate it first.' 
      });
    }

    // Send certificate email using the function from emailTemplates.js
    await sendCertificateEmail(user.email, user.firstName, workshop, certificate.certificateId);

    // Mark certificate as sent
    certificate.sentAt = new Date();
    await certificate.save();

    console.log('✅ Certificate email sent to:', user.email);

    res.json({
      success: true,
      message: 'Certificate sent to your email successfully'
    });
  } catch (error) {
    console.error('Send certificate email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id })
      .populate('workshopId')
      .sort({ issuedAt: -1 });

    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markWorkshopAttended = async (req, res) => {
  try {
    const { workshopId, userId } = req.params;

    console.log('✅ Marking workshop as attended:', { userId, workshopId });

    const user = await User.findById(userId);
    const workshop = await Workshop.findById(workshopId);

    if (!user || !workshop) {
      return res.status(404).json({ success: false, message: 'User or workshop not found' });
    }

    // Find the registration
    const registration = user.eventRegistrations.workshops.find(
      reg => reg.workshopId.toString() === workshopId
    );

    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registration not found for this workshop' 
      });
    }

    // Mark as attended
    registration.status = "attended";
    await user.save();

    console.log('✅ Workshop marked as attended');

    res.json({
      success: true,
      message: 'Workshop marked as attended successfully',
      data: { registration }
    });
  } catch (error) {
    console.error('Mark workshop attended error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendCertificatesLogic = async (workshopId) => {
  const workshop = await Workshop.findById(workshopId);

  if (!workshop) {
    throw new Error('Workshop not found');
  }

  const users = await User.find({ 'eventRegistrations.workshops.workshopId': workshopId });
  let certificatesSentCount = 0;

  for (const user of users) {
    const registration = user.eventRegistrations.workshops.find(
      reg => reg.workshopId.toString() === workshopId.toString() && reg.status === 'attended' && !reg.certificateSent
    );

    if (registration) {
      const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const verificationCode = crypto.randomBytes(8).toString('hex');
      
      const filePath = await generatePdf(user, workshop, certificateId);

      const certificate = new Certificate({
        certificateId,
        userId: user._id,
        workshopId,
        filePath,
        verificationCode,
        userName: `${user.firstName} ${user.lastName}`,
        workshopName: workshop.workshopName,
        issuedAt: new Date()
      });
      await certificate.save();

      const absoluteFilePath = path.join(__dirname, '..', filePath);

      await sendCertificateEmail(user.email, user.firstName, workshop, certificateId, {
          attachments: [
              {
                  filename: `${certificateId}.pdf`,
                  path: absoluteFilePath,
                  contentType: 'application/pdf'
              }
          ]
      });

      registration.certificateSent = true;
      await user.save();
      
      certificatesSentCount++;
    }
  }
  return certificatesSentCount;
};

export const sendWorkshopCertificates = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }

    // Check if workshop has ended
    const workshopEnd = new Date(workshop.endDateTime);
    const now = new Date();
    if (now < workshopEnd) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send certificates yet. Workshop has not ended.'
      });
    }

    const certificatesSentCount = await sendCertificatesLogic(workshopId);

    res.json({
      success: true,
      message: `${certificatesSentCount} certificates sent successfully.`
    });

  } catch (error) {
    console.error('Send workshop certificates error:', error);
    res.status(500).json({ success: false, message: 'Failed to send certificates', error: error.message });
  }
};