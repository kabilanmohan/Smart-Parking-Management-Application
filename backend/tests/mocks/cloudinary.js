import { jest } from '@jest/globals';

// Mock for Cloudinary

// Create a mock upload middleware
export const mockUpload = {
  single: jest.fn().mockImplementation(() => (req, res, next) => {
    // If test wants to simulate a file upload, it can set req.simulateFile = true
    if (req.simulateFile) {
      req.file = {
        path: 'https://res.cloudinary.com/demo/image/upload/v1234567890/test-image.jpg',
        filename: 'test-image-public-id'
      };
    }
    next();
  })
};

// Mock the cloudinary module
jest.mock('../../utils/cloudinary.js', () => ({
  upload: mockUpload,
  cloudinary: {
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}), { virtual: true });