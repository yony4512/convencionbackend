const { Router } = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { authenticateJwt } = require('../middleware/authenticate');

const router = Router();

// --- UNIFIED GOOGLE AUTH (JWT Flow for Web App) ---

// @desc    Initiate Google Auth
// @route   GET /api/auth/google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false,
    prompt: 'select_account' // Forzar la selección de cuenta
  })
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }), 
  (req, res) => {
    // El middleware de passport nos pasa el 'user' en req.user
    const user = req.user;

    if (!user) {
        const errorUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5174'}/login?error=user_not_found`;
        return res.redirect(errorUrl);
    }

    // Asegurarnos de que solo los clientes puedan iniciar sesión a través de la web.
    // Si el rol es admin o cashier, se les niega el acceso por esta vía.
    if (user.role === 'admin' || user.role === 'cashier') {
        const errorUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5174'}/login?error=invalid_role`;
        return res.redirect(errorUrl);
    }

    // Generar el token JWT para el cliente
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, // Será 'cliente' o null
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Redirigir al callback del frontend con el token
    const redirectUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5174'}/auth/google/callback?token=${token}`;
    res.redirect(redirectUrl);
  }
);

// @desc    Get current authenticated user profile from JWT
// @route   GET /api/auth/profile
router.get('/profile', authenticateJwt, (req, res) => {
  // The authenticateJwt middleware has already verified the token
  // and attached the user payload to req.user.
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Token inválido o no proporcionado.' });
  }
});

// @desc    Log out user (for session-based auth)
// @route   GET /api/auth/logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ ok: true, message: 'Sesión cerrada' });
    });
  });
});

module.exports = router;
