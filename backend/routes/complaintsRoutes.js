import express from 'express';
import { db } from '../database/firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import process from 'process';
import { upload } from '../utils/cloudinary.js';

dotenv.config();

const router = express.Router();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vintageparking.com';

// Example of sending an HTML email

// Update the getComplaintEmailTemplate function

function getComplaintEmailTemplate(userData, complaintData, parkingSpotData) {
  // Ensure image URL uses HTTPS
  let secureImageUrl = complaintData.imageUrl;
  if (secureImageUrl && secureImageUrl.startsWith('http:')) {
    secureImageUrl = secureImageUrl.replace('http:', 'https:');
  }
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #C94B4B; color: white; padding: 10px 20px; }
      .content { padding: 20px; border: 1px solid #ddd; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
      .complaint-image { max-width: 100%; margin: 15px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>New Complaint: ${complaintData.subject}</h2>
      </div>
      <div class="content">
        <p><strong>From:</strong> ${userData.name} (${complaintData.userEmail})</p>
        <p><strong>Category:</strong> ${complaintData.category}</p>
        <p><strong>Subject:</strong> ${complaintData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${complaintData.message}</p>
        <p><strong>Complaint ID:</strong> ${complaintData.id}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        
        ${secureImageUrl ? `
          <p><strong>Attached Image:</strong></p>
          <img src="${secureImageUrl}" alt="Complaint Image" class="complaint-image">
        ` : ''}
        
        ${parkingSpotData ? `
          <h3>Related Parking Spot:</h3>
          <p><strong>Name:</strong> ${parkingSpotData.Name}</p>
          <p><strong>Address:</strong> ${parkingSpotData.Address || 'Not provided'}</p>
          <p><strong>ID:</strong> ${complaintData.parkingSpotId}</p>
        ` : ''}
      </div>
      <div class="footer">
        <p>© 2025 Vintage Parking Management — All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Endpoint to submit a complaint with optional image
 * POST /api/submit-complaint
 */
router.post('/submit-complaint', upload.single('image'), async (req, res) => {
  try {
    const { userId, userEmail, subject, message, category, parkingSpotId } = req.body;
    
    if (!userId || !subject || !message || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user data for more context
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : { name: 'Unknown User' };

    // If it's a parking spot complaint, get the parking spot details
    let parkingSpotData = null;
    if (parkingSpotId && parkingSpotId.trim() !== '') {
      const parkingSpotRef = doc(db, 'ParkingSpaces', parkingSpotId);
      const parkingSpotSnap = await getDoc(parkingSpotRef);
      if (parkingSpotSnap.exists()) {
        parkingSpotData = parkingSpotSnap.data();
      }
    }

    // Ensure image URL uses HTTPS if available
    let imageUrl = null;
    let imagePublicId = null;
    
    if (req.file) {
      imageUrl = req.file.path;
      imagePublicId = req.file.filename;
      
      // Ensure HTTPS for Cloudinary URLs
      if (imageUrl && imageUrl.startsWith('http:')) {
        imageUrl = imageUrl.replace('http:', 'https:');
      }
    }

    // Store complaint in Firestore with proper null handling
    const complaintData = {
      userId,
      userEmail,
      userName: userData.name,
      subject,
      message,
      category,
      // Only include parkingSpotId if it has a valid value
      ...(parkingSpotId && parkingSpotId.trim() !== '' ? { parkingSpotId } : {}),
      parkingSpotName: parkingSpotData?.Name || null,
      parkingSpotAddress: parkingSpotData?.Address || null,
      status: 'pending', // pending, in-progress, resolved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      assignedTo: null,
      notes: [],
      // Add image data if uploaded with secure URL
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null
    };
    
    // Add complaint to database
    const complaintRef = await addDoc(collection(db, 'complaints'), complaintData);
    
    // Update the email template to include image
    const emailSubject = `New Complaint: ${subject}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: emailSubject,
      html: getComplaintEmailTemplate(userData, { ...complaintData, id: complaintRef.id }, parkingSpotData)
    };
    
    // Send email asynchronously (don't wait for it to complete)
    transporter.sendMail(mailOptions)
      .catch(error => console.error('Failed to send email notification:', error));
    
    // Return success response with the complaint ID
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaintId: complaintRef.id,
      imageUrl: complaintData.imageUrl
    });
    
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ 
      error: 'Failed to submit complaint',
      details: error.message 
    });
  }
});

/**
 * Endpoint to get all complaints for admin
 * GET /api/complaints
 */
router.get('/complaints', async (req, res) => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const complaintsSnapshot = await getDocs(complaintsRef);
    
    const complaints = [];
    complaintsSnapshot.forEach(doc => {
      complaints.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(complaints);
    
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

/**
 * Endpoint to get user complaints
 * GET /api/user-complaints/:userId
 */
router.get('/user-complaints/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const complaints = [];
    querySnapshot.forEach(doc => {
      complaints.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(complaints);
    
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

/**
 * Endpoint to test email functionality
 * GET /api/test-email
 */
router.get('/test-email', async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: 'Test Email - Smart Parking Management',
      text: 'This is a test email from the Smart Parking Management Application. If you receive this, the email configuration is working correctly.'
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

export default router;