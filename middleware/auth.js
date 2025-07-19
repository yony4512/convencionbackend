const ensureAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Administrador' || req.user.role === 'administrator')) {
    return next();
  }
  res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
};

const ensureAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: 'No autorizado' });
};

const ensureStaff = (req, res, next) => {
  if (req.user && (
      req.user.role === 'admin' || req.user.role === 'Administrador' || req.user.role === 'administrator' ||
      req.user.role === 'cajero' || req.user.role === 'Cajero' || req.user.role === 'cashier'
    )) {
    return next();
  }
  res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador o cajero.' });
};

module.exports = { ensureAdmin, ensureAuthenticated, ensureStaff };
