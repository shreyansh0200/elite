import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const VALID_ROLES = ['farmer', 'customer'];

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    username: user.username,
    role: user.role,
    location: user.location,
    city: user.city,
    avatarUrl: user.avatarUrl,
  };
}

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

export async function listHubCities(_req, res) {
  const managers = await User.find({ role: 'hubmanager', active: true, city: { $ne: '' } })
    .select('city name')
    .sort({ city: 1 })
    .lean();

  const seen = new Set();
  const cities = managers.filter((manager) => {
    const key = String(manager.city || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return res.json(cities);
}

export async function register(req, res) {
  const {
    name,
    phone,
    email,
    password,
    location = '',
    city = '',
    role = 'farmer',
  } = req.body;

  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCity = String(city || '').trim();

  if (!cleanName || String(password || '').length < 6 || !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: 'Name, a valid registration role, and a password of at least 6 characters are required',
    });
  }

  if (role === 'farmer' && !/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({
      message: 'Farmer phone must contain exactly 10 digits',
    });
  }

  if (role === 'farmer' && !cleanCity) {
    return res.status(400).json({ message: 'Select your city so AgriSync can route you to the correct hub.' });
  }

  if (role === 'customer' && !cleanPhone && !cleanEmail) {
    return res.status(400).json({
      message: 'Customer needs a phone number or email',
    });
  }

  const identifiers = [];
  if (cleanPhone) identifiers.push({ phone: cleanPhone });
  if (cleanEmail) identifiers.push({ email: cleanEmail });

  if (identifiers.length && (await User.findOne({ $or: identifiers }))) {
    return res.status(409).json({ message: 'An account already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: cleanName,
    phone: cleanPhone || undefined,
    email: cleanEmail || undefined,
    passwordHash,
    role,
    location: String(location || '').trim(),
    city: cleanCity,
  });

  return res.status(201).json({
    token: signToken(user),
    user: publicUser(user),
  });
}

export async function login(req, res) {
  const {
    role,
    phone,
    email,
    username,
    password,
  } = req.body;

  if (!['farmer', 'hubmanager', 'customer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid login role' });
  }

  let query;

  if (role === 'hubmanager') {
    query = {
      username: String(username || '').trim().toLowerCase(),
      role,
    };
  } else if (role === 'farmer') {
    query = {
      phone: String(phone || '').replace(/\D/g, ''),
      role,
    };
  } else {
    const identities = [];
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanPhone) identities.push({ phone: cleanPhone });
    if (cleanEmail) identities.push({ email: cleanEmail });

    if (!identities.length) {
      return res.status(400).json({
        message: 'Enter your phone number or email',
      });
    }

    query = { $or: identities, role };
  }

  const user = await User.findOne(query);

  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json({
    token: signToken(user),
    user: publicUser(user),
  });
}

export async function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}
