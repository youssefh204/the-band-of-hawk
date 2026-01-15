import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateCertificate = async (user, workshop, certificateId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4'
      });
      
      const filename = `certificate_${certificateId}.pdf`;
      const certificatesDir = path.join(__dirname, '../uploads/certificates');
      const filePath = path.join(certificatesDir, filename);
      
      // Ensure directory exists
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Certificate design
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');
      
      // Border
      doc.strokeColor('#3b82f6')
         .lineWidth(15)
         .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .stroke();
      
      // Title
      doc.fontSize(32)
         .fill('#1e293b')
         .text('CERTIFICATE OF COMPLETION', 0, 150, { 
           align: 'center',
           width: doc.page.width 
         });
      
      // Subtitle
      doc.fontSize(18)
         .fill('#64748b')
         .text('This is to certify that', 0, 220, {
           align: 'center',
           width: doc.page.width
         });
      
      // Student Name
      doc.fontSize(36)
         .fill('#3b82f6')
         .text(`${user.firstName} ${user.lastName}`, 0, 260, {
           align: 'center',
           width: doc.page.width
         });
      
      // Workshop details
      doc.fontSize(16)
         .fill('#475569')
         .text(`has successfully completed the workshop`, 0, 320, {
           align: 'center',
           width: doc.page.width
         });
      
      doc.fontSize(24)
         .fill('#1e293b')
         .text(`"${workshop.workshopName}"`, 0, 350, {
           align: 'center',
           width: doc.page.width
         });
      
      // Date and details
      doc.fontSize(14)
         .fill('#64748b')
         .text(`Completed on: ${new Date().toLocaleDateString()}`, 0, 420, {
           align: 'center',
           width: doc.page.width
         });
      
      doc.text(`Location: ${workshop.location} | Faculty: ${workshop.faculty}`, 0, 450, {
        align: 'center',
        width: doc.page.width
      });
      
      // Certificate ID
      doc.fontSize(12)
         .fill('#94a3b8')
         .text(`Certificate ID: ${certificateId}`, 0, 500, {
           align: 'center',
           width: doc.page.width
         });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(`/uploads/certificates/${filename}`);
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
};