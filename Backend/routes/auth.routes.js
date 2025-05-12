const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google authentication
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, given_name, family_name } = payload;
    
    // Check if user exists
    let result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    let user = result.rows[0];
    
    if (!user) {
      // Create new user
      const newUser = {
        email,
        first_name: given_name || name.split(' ')[0],
        last_name: family_name || name.split(' ').slice(1).join(' '),
        profile_picture: picture,
        password: uuidv4(), // Generate random password
        google_id: payload.sub,
      };
      
      result = await pool.query(
        'INSERT INTO Users (email, first_name, last_name, profile_picture, password, google_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [newUser.email, newUser.first_name, newUser.last_name, newUser.profile_picture, newUser.password, newUser.google_id]
      );
      
      user = result.rows[0];
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// Apple authentication
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, fullName } = req.body;
    
    // In a real implementation, you would verify the Apple identity token
    // This is a simplified version
    
    // Extract user info from the token
    // Note: In a real implementation, you would decode and verify the JWT
    const appleUserId = 'apple-' + uuidv4(); // In real implementation, extract from token
    const email = `${appleUserId}@privaterelay.appleid.com`; // In real implementation, extract from token
    
    // Check if user exists
    let result = await pool.query('SELECT * FROM Users WHERE apple_id = $1', [appleUserId]);
    let user = result.rows[0];
    
    if (!user) {
      // Create new user
      const newUser = {
        email,
        first_name: fullName?.firstName || 'Apple',
        last_name: fullName?.lastName || 'User',
        password: uuidv4(), // Generate random password
        apple_id: appleUserId,
      };
      
      result = await pool.query(
        'INSERT INTO Users (email, first_name, last_name, password, apple_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [newUser.email, newUser.first_name, newUser.last_name, newUser.password, newUser.apple_id]
      );
      
      user = result.rows[0];
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});