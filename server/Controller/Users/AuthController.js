const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'ipshopy-crm-secret-key';
const EXPIRES_IN = '24h';

const login = async (req, res) => {
  try {
    const { user } = req.body;
    if (!user || !user.id || !user.email || !user.role || !user.name) {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      SECRET,
      { expiresIn: EXPIRES_IN }
    );
    return res.status(200).json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

module.exports = { login };

