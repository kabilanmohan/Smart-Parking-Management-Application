// Use the Jest globals instead of importing jest-mock
import { jest } from '@jest/globals';

// Mock for Firebase

// Mock functions
export const mockCollection = jest.fn();
export const mockAddDoc = jest.fn();
export const mockDoc = jest.fn();
export const mockGetDoc = jest.fn();
export const mockGetDocs = jest.fn();
export const mockQuery = jest.fn();
export const mockWhere = jest.fn();
export const mockServerTimestamp = jest.fn();

// Export a mock db object
export const db = {};

// Mock the firebase/firestore module
jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  addDoc: (...args) => mockAddDoc(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  serverTimestamp: () => mockServerTimestamp()
}));

// Mock the database module
jest.mock('../../database/firebase.js', () => ({
  db
}), { virtual: true });