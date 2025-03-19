import dotenv from 'dotenv';
import { afterEach, jest } from '@jest/globals';
dotenv.config({ path: '.env.test' });

// Reset any mocked functions after each test
afterEach(() => {
  jest.clearAllMocks();
});