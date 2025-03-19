import { jest } from '@jest/globals';

// Mock for Nodemailer

// Mock sendMail function
export const mockSendMail = jest.fn().mockResolvedValue({
  messageId: 'test-message-id'
});

// Mock transporter
export const mockTransporter = {
  sendMail: mockSendMail
};

// Mock the nodemailer module
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue(mockTransporter)
}));