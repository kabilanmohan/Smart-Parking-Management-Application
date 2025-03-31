import admin from 'firebase-admin';

// Middleware to check if the user is authenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token format' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying auth token:', error);
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ success: false, error: 'Server error during authentication' });
  }
};

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated' });
    }

    // Get the user's role from Firestore
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ success: false, error: 'Forbidden: User not found' });
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin authorization middleware error:', error);
    res.status(500).json({ success: false, error: 'Server error during authorization' });
  }
};