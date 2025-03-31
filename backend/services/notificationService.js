import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import process from 'process';

// Load env variables at the beginning
dotenv.config();

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

/**
 * Check for parking spaces that have gone from 0 to positive availability
 * and send notifications to users who requested them
 */
const checkAvailabilityAndNotify = async () => {
  const db = admin.firestore();
  console.log('Running availability check and notifications');
  
  try {
    // Get all parking spaces with available slots > 0
    const parkingSpacesSnapshot = await db.collection('ParkingSpaces')
      .where('AvailableSlots', '>', 0)
      .get();
    
    if (parkingSpacesSnapshot.empty) {
      console.log('No parking spaces with available slots');
      return;
    }
    
    // For each parking space, check if there are active notifications
    const batch = db.batch();
    let notificationCount = 0;
    
    for (const parkingSpaceDoc of parkingSpacesSnapshot.docs) {
      const parkingSpaceId = parkingSpaceDoc.id;
      const parkingSpaceData = parkingSpaceDoc.data();
      
      // Skip if we don't know the previous state
      if (parkingSpaceData.AvailableSlots <= 0) continue;
      
      // Get active notifications for this parking space
      const notificationsSnapshot = await db.collection('notifications')
        .where('parkingSpaceId', '==', parkingSpaceId)
        .where('active', '==', true)
        .where('notificationType', '==', 'availability')
        .get();
      
      if (notificationsSnapshot.empty) continue;
      
      // Process notifications
      console.log(`Found ${notificationsSnapshot.size} active notifications for parking space ${parkingSpaceId}`);
      
      const emailPromises = [];
      
      notificationsSnapshot.forEach(doc => {
        const notification = doc.data();
        
        // Prepare email
        const mailOptions = {
          from: '"Smart Parking App" <noreply@smartparking.com>',
          to: notification.userEmail,
          subject: `Parking Available at ${notification.parkingSpaceName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #C94B4B;">Parking Spot Available!</h2>
              <p>Good news! A parking spot is now available at ${notification.parkingSpaceName}.</p>
              <p><strong>Available spots:</strong> ${parkingSpaceData.AvailableSlots}</p>
              <p><strong>Location:</strong> ${parkingSpaceData.Address || 'No address provided'}</p>
              <div style="margin: 30px 0;">
                <a href="${process.env.CORS_ORIGIN}/parking-lot?id=${parkingSpaceId}" 
                   style="background-color: #C94B4B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Book Now
                </a>
              </div>
              <p style="color: #666; font-size: 12px;">
                You are receiving this email because you requested to be notified when this parking space has availability.
              </p>
            </div>
          `,
        };
        
        // Add email to promises array
        emailPromises.push(transporter.sendMail(mailOptions));
        
        // Mark notification as inactive
        batch.update(doc.ref, { 
          active: false,
          notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          availableSpotsAtNotification: parkingSpaceData.AvailableSlots
        });
        
        notificationCount++;
      });
      
      // Send all emails for this parking space
      if (emailPromises.length > 0) {
        await Promise.all(emailPromises);
      }
    }
    
    // Commit all the batch updates
    if (notificationCount > 0) {
      await batch.commit();
      console.log(`Successfully sent ${notificationCount} notifications`);
    }
    
    return { success: true, notificationsSent: notificationCount };
  } catch (error) {
    console.error('Error processing notifications:', error);
    return { success: false, error: error.message };
  }
};

export {
  checkAvailabilityAndNotify
};