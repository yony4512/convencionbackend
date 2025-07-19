const passport = require('passport');

// Middleware para verificar el token JWT para rutas API
const authenticateJwt = (req, res, next) => {
  // Si es una petición de pre-vuelo (OPTIONS), la aprobamos inmediatamente.
  // Esto es crucial para que CORS funcione correctamente con peticiones complejas (como las que llevan 'Authorization').
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // No Content
  }
  console.log('[LOG] Entrando a authenticateJwt');
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('[LOG] Error en authenticateJwt:', err);
      return next(err);
    }
    if (!user) {
      const message = info && info.message ? info.message : 'Acceso no autorizado.';
      console.warn('[LOG] Usuario no autenticado en authenticateJwt:', message);
      return res.status(401).json({ message });
    }
    // Si el usuario es válido, lo adjuntamos al objeto request
    console.log('[LOG] Usuario autenticado en authenticateJwt:', user);
        req.user = user;
    console.log('[LOG] Antes de llamar a next() en authenticateJwt');
    next();
    console.log('[LOG] Después de llamar a next() en authenticateJwt');
  })(req, res, next);
};

module.exports = {
  authenticateJwt,
};
