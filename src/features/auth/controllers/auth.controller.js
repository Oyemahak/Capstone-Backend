import User from '../../../models/User.js';
import { signToken } from '../../../utils/jwt.js';

export async function register(req, res) {
  const { name, email, password, role = 'client' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password, role, status: 'pending' });
  const data = user.toObject();
  delete data.password;

  return res.status(201).json({
    message: 'Registered. Awaiting approval by admin.',
    user: data
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.status !== 'active') return res.status(403).json({ message: 'Account not approved yet' });

  const token = signToken(user);

  return res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
}

export async function me(req, res) {
  // req.user is set by your auth middleware when token is valid
  return res.json({ user: req.user });
}