import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an event guest (event participant)
    if (decoded.role === 'event_guest' || decoded.userType === 'event_guest') {
      // Fetch event participant from database
      const participant = await prisma.eventParticipant.findUnique({
        where: { id: decoded.userId }
      });

      if (!participant || !participant.isActive) {
        return res.status(401).json({ success: false, error: 'Participant not found or inactive' });
      }

      req.user = {
        id: participant.id,
        email: participant.email,
        role: 'event_guest',
        name: participant.name,
        phone: participant.phone,
        userType: 'event_guest'
      };
      next();
      return;
    }
    
    // Fetch regular user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: true,
        adminProfile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

