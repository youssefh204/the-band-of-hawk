// server/utils/certificateScheduler.js
import cron from 'node-cron';
import Workshop from '../models/Workshop.js';
import { sendCertificatesLogic } from '../controllers/certificateController.js'; // Will be created in next step

// export const startCertificateScheduler = () => {
//   // Schedule to run every minute
//   cron.schedule('* * * * *', async () => {
//     console.log('--- Running certificate auto-send job ---');
//     const now = new Date();

//     try {
//       // Find workshops that have ended and whose certificates haven't been auto-sent yet
//       const completedWorkshops = await Workshop.find({
//         endDateTime: { $lt: now },
//         certificatesAutoSent: false
//       });

//       if (completedWorkshops.length === 0) {
//         console.log('No completed workshops found for auto-sending certificates.');
//         return;
//       }

//       for (const workshop of completedWorkshops) {
//         console.log(`Processing auto-send for workshop: ${workshop.workshopName} (ID: ${workshop._id})`);
        
//         try {
//           // Call the core logic to send certificates
//           const sentCount = await sendCertificatesLogic(workshop._id); 

//           // Mark workshop as having had certificates auto-sent
//           workshop.certificatesAutoSent = true;
//           await workshop.save();
//           console.log(`✅ Finished auto-sending for workshop: ${workshop.workshopName}. Sent ${sentCount} certificates.`);
//         } catch (workshopError) {
//           console.error(`❌ Error processing auto-send for workshop ${workshop.workshopName} (ID: ${workshop._id}):`, workshopError);
//           // Continue to next workshop even if one fails
//         }
//       }
//       console.log('--- Certificate auto-send job completed ---');
//     } catch (error) {
//       console.error('❌ Error during certificate auto-send job:', error);
//     }
//   });
// };