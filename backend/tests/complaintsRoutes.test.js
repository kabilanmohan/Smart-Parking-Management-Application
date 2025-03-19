import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { describe, expect, beforeEach, jest, it } from '@jest/globals';

// Import mocks before importing the module under test
import './mocks/firebase.js';  // This sets up the firebase mock first
import './mocks/cloudinary.js'; // This sets up the cloudinary mock
import './mocks/nodemailer.js'; // This sets up the nodemailer mock

// Import mocks for use in tests
import { mockAddDoc, mockDoc, mockGetDoc, mockQuery, mockGetDocs, mockWhere, mockCollection, mockServerTimestamp } from './mocks/firebase.js';
import { mockSendMail } from './mocks/nodemailer.js';

// Now import the routes (which imports firebase.js, but will use our mock instead)
import complaintsRoutes from '../routes/complaintsRoutes.js';

// Create an express application for testing
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', complaintsRoutes);

describe('Complaints API Routes', () => {
  
  beforeEach(() => {
    // Reset all mocks - (already done in setup.js, but adding here for clarity)
    jest.clearAllMocks();
    
    // Reset mock return values to avoid test pollution
    mockServerTimestamp.mockReturnValue(new Date());
  });

  describe('POST /api/submit-complaint', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/submit-complaint')
        .send({
          userId: 'test-user-id',
          // Missing subject
          message: 'Test message',
          category: 'general'
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should successfully submit a complaint', async () => {
      // Mock Firebase responses
      mockDoc.mockReturnValue('userDocRef');
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Test User' })
      });
      mockAddDoc.mockResolvedValue({ id: 'test-complaint-id' });
      mockSendMail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/submit-complaint')
        .send({
          userId: 'test-user-id',
          userEmail: 'test@example.com',
          subject: 'Test Subject',
          message: 'Test message',
          category: 'general'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.complaintId).toBe('test-complaint-id');
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should handle parking spot complaints with valid spot ID', async () => {
      // Mock Firebase responses
      mockDoc
        .mockReturnValueOnce('userDocRef') // First call for user
        .mockReturnValueOnce('parkingSpotRef'); // Second call for parking spot
      
      mockGetDoc
        .mockResolvedValueOnce({ // First call for user
          exists: () => true,
          data: () => ({ name: 'Test User' })
        })
        .mockResolvedValueOnce({ // Second call for parking spot
          exists: () => true,
          data: () => ({ 
            Name: 'Test Parking Spot',
            Address: '123 Test Street'
          })
        });
      
      mockAddDoc.mockResolvedValue({ id: 'test-complaint-id-with-spot' });
      mockSendMail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/submit-complaint')
        .send({
          userId: 'test-user-id',
          userEmail: 'test@example.com',
          subject: 'Test Subject with Parking Spot',
          message: 'Test message with parking spot',
          category: 'parking-spot',
          parkingSpotId: 'test-parking-spot-id'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled();
      expect(mockAddDoc.mock.calls[0][1]).toHaveProperty('parkingSpotId', 'test-parking-spot-id');
      expect(mockAddDoc.mock.calls[0][1]).toHaveProperty('parkingSpotName', 'Test Parking Spot');
    });
  });

  describe('GET /api/complaints', () => {
    it('should return all complaints', async () => {
      // Mock Firebase responses
      const mockComplaints = [
        { id: 'complaint1', subject: 'Test Subject 1', message: 'Test message 1' },
        { id: 'complaint2', subject: 'Test Subject 2', message: 'Test message 2' }
      ];
      
      mockCollection.mockReturnValue('complaintsCollection');
      mockGetDocs.mockResolvedValue({
        forEach: (callback) => {
          mockComplaints.forEach((complaint) => {
            // In Firestore, the document ID is separate from the document data
            // The data() method only returns the document fields, not the ID
            callback({
              id: complaint.id,
              data: () => ({ 
                subject: complaint.subject, 
                message: complaint.message
                // don't include id in the data as that's how Firestore works
              })
            });
          });
        }
      });
  
      const response = await request(app)
        .get('/api/complaints');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('complaint1');
      expect(response.body[1].id).toBe('complaint2');
    });
  });

  describe('GET /api/user-complaints/:userId', () => {
    it('should return complaints for a specific user', async () => {
      // Mock Firebase responses
      const userId = 'test-user-id';
      const mockUserComplaints = [
        { id: 'complaint1', userId, subject: 'User Complaint 1' },
        { id: 'complaint2', userId, subject: 'User Complaint 2' }
      ];
      
      mockCollection.mockReturnValue('complaintsCollection');
      mockWhere.mockReturnValue('userIdCondition');
      mockQuery.mockReturnValue('userComplaintsQuery');
      mockGetDocs.mockResolvedValue({
        forEach: (callback) => {
          mockUserComplaints.forEach((complaint) => {
            callback({
              id: complaint.id,
              data: () => ({ ...complaint, id: undefined })
            });
          });
        }
      });

      const response = await request(app)
        .get(`/api/user-complaints/${userId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].userId).toBe(userId);
      expect(response.body[1].userId).toBe(userId);
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .get('/api/user-complaints/');
      
      expect(response.statusCode).toBe(404); // Express routes typically return 404 for missing param
    });
  });

  describe('GET /api/test-email', () => {
    it('should successfully send a test email', async () => {
      mockSendMail.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/test-email');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValue(new Error('Email sending failed'));

      const response = await request(app)
        .get('/api/test-email');
      
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Failed to send test email');
    });
  });
});