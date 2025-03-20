import http from 'k6/http';
import { sleep, check } from 'k6';

// Test configuration
export const options = {
  // Basic stress test
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users over 1 minute
    { duration: '3m', target: 50 },  // Stay at 50 users for 3 minutes
    { duration: '1m', target: 0 },   // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests can fail
  },
};

// Base URL
const BASE_URL = 'http://localhost:3000';

export default function() {
  // Test the complaints endpoint
  const complaintsResponse = http.get(`${BASE_URL}/api/complaints`);
  check(complaintsResponse, {
    'complaints status 200': (r) => r.status === 200,
    'complaints response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Test the feedbacks endpoint
  const feedbacksResponse = http.get(`${BASE_URL}/api/feedbacks/parking-space-123`);
  check(feedbacksResponse, {
    'feedbacks status 200': (r) => r.status === 200,
    'feedbacks response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Add test for POST endpoints - complaints submission
  const payload = JSON.stringify({
    userId: 'load-test-user',
    userEmail: 'test@example.com',
    subject: 'Load Test Subject',
    message: 'This is a load test message',
    category: 'general'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const submitComplaintResponse = http.post(
    `${BASE_URL}/api/submit-complaint`, 
    payload, 
    params
  );
  
  check(submitComplaintResponse, {
    'submit complaint status 201': (r) => r.status === 201,
    'submit complaint response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}