import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtConfig } from '../config/jwt.js';

const generateToken = (id) => jwt.sign({ id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'staff' });
    res.status(201).json({ success: true, token: generateToken(user._id), user });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    res.json({ success: true, token: generateToken(user._id), user });
  } catch (err) { next(err); }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
