import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { EmailService } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
}

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, display_name, role: requestedRole } = req.body;

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Determine role
    const count = await User.count();
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@beatvault.dj', 'bbeatonportdj@gmail.com'];
    const isAdminEmail = adminEmails.includes(email);

    let role = 'user';
    if (count === 0 || isAdminEmail) {
      role = 'admin';
    } else if (requestedRole === 'producer') {
      role = 'producer';
    }

    // Create user
    const user = await User.create({
      email,
      password_hash,
      display_name,
      role,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send Welcome email (non-blocking)
    EmailService.sendWelcomeEmail(user.email, user.display_name);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Error during registration:', message);
    return res.status(500).json({ error: message || 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Error during login:', message);
    return res.status(500).json({ error: message || 'Server error during login' });
  }
};

export const oauthLogin = async (req: Request, res: Response) => {
  try {
    const { provider, email, display_name, oauth_id, role: requestedRole } = req.body;

    if (!provider || !email || !oauth_id) {
      return res.status(400).json({ error: 'Provider, email, and oauth_id are required' });
    }

    let user = await User.findOne({
      where: { oauth_provider: provider, oauth_id },
    });

    if (!user) {
      // Check if user exists with the same email
      user = await User.findOne({ where: { email } });
      
      if (user) {
        // Link account
        user.oauth_provider = provider;
        user.oauth_id = oauth_id;
        if (!user.display_name) user.display_name = display_name || email.split('@')[0];
        await user.save();
      } else {
        // Create new OAuth user
        const count = await User.count();
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@beatvault.dj', 'bbeatonportdj@gmail.com'];
        const isAdminEmail = adminEmails.includes(email);
        let role = 'user';
        if (count === 0 || isAdminEmail) {
          role = 'admin';
        } else if (requestedRole === 'producer') {
          role = 'producer';
        }

        user = await User.create({
          email,
          display_name: display_name || email.split('@')[0],
          role,
          oauth_provider: provider,
          oauth_id,
        });

        // Send welcome email
        EmailService.sendWelcomeEmail(user.email, user.display_name);
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Error during OAuth login:', message);
    return res.status(500).json({ error: message || 'Server error during OAuth login' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return res.status(500).json({ error: message || 'Server error fetching profile' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { userId, role } = req.body;
    if (!userId || !role || !['user', 'producer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid userId and role (user/producer/admin) required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();

    return res.json({
      message: 'User role updated successfully',
      user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role },
    });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const users = await User.findAll({
      attributes: ['id', 'email', 'display_name', 'role', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    return res.json(users);
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { display_name } = req.body;
    if (!display_name) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.display_name = display_name;
    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return res.status(500).json({ error: message || 'Server error updating profile' });
  }
};
