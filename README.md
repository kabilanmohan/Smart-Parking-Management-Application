## Overview

This full-stack application combines a React frontend with a Node.js backend, utilizing Firebase's Firestore for database functionality and integrating various third-party APIs to deliver a powerful and intuitive parking management system.

## Features

### For Users
- **Account Management**: Create accounts, manage profiles, and view booking history
- **Parking Space Discovery**: Find available parking spots with real-time availability
- **Interactive Maps**: Navigate to parking locations using integrated mapping
- **Reservations**: Book parking spaces in advance
- **Payments**: Secure payment processing with PayPal integration
- **Notifications**: Get alerts about reservations, availability, and payments
- **Feedback System**: Submit and view feedback with sentiment analysis
- **Occupancy Predictions**: Access AI-powered predictions about parking space availability

### For Administrators
- **Dashboard**: Comprehensive administrative control panel
- **Parking Setup**: Configure and manage parking spaces
- **User Management**: Handle user accounts and requests
- **Booking Oversight**: View and manage all system bookings
- **Analytics**: Access usage patterns and business insights
- **Payment Tracking**: Monitor and manage payment transactions

## Technical Architecture

### Frontend
- **Framework**: React.js
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Hooks
- **Payment Processing**: PayPal SDK integration
- **Authentication**: Firebase Authentication

### Backend
- **Server**: Node.js with Express.js
- **API Endpoints**: RESTful architecture
- **Authentication Middleware**: JWT-based auth
- **Scheduled Tasks**: Automated processes for notifications and cleanups

### Database
- **Primary Database**: Firebase Firestore
- **Data Structure**: Collections for users, parking spaces, bookings, payments, and feedback

### Integrations
- **Maps**: Google Maps API for location services
- **AI/ML**: HuggingFace for sentiment analysis and predictions
- **File Storage**: Cloudinary for image uploads
- **Email Service**: NodeMailer for notifications

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Firebase account
- API keys for integrated services

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   VITE_API_URL=your_backend_url
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=8000
   NODE_ENV=development
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   HUGGINGFACE_API_KEY=your_huggingface_key
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Usage Guide

### User Journey
1. Register or log in to your account
2. Browse available parking locations on the dashboard
3. Select a parking space and view details
4. Book a space by selecting date/time and completing payment
5. Receive confirmation and navigate to your parking spot using maps
6. Access your booking history and manage your reservations

### Admin Journey
1. Log in through the admin portal
2. Access the administrator dashboard
3. Manage parking spaces, user accounts, and bookings
4. Review feedback and analytics
5. Process payment reports and handle user requests

## API Documentation

The backend provides RESTful API endpoints for the following operations:

- **Authentication**: `/api/auth/` - User registration, login, and authorization
- **Parking Spaces**: `/api/parking-spaces/` - CRUD operations for parking locations
- **Bookings**: `/api/bookings/` - Reservation management
- **Payments**: `/api/payments/` - Payment processing and history
- **Feedback**: `/api/analyze-feedback/` - Sentiment analysis for user feedback

## Testing

- **Unit Tests**: Run with Jest
  ```bash
  npm run test
  ```
- **Load Testing**: Run with K6
  ```bash
  k6 run load-tests/main.js
  ```

## Technology Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **APIs**: Google Maps API, HuggingFace
- **Frameworks/Libraries**: NodeMailer, Cloudinary
- **Testing**: Jest (Unit Testing), K6 (Load Testing)

## Contributing

We welcome contributions to the Crimson Parking Management Application! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License.

---

For any questions or feedback, please mail us at applicationsmartparking@gmail.com