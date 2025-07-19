const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const db = require('../db');

module.exports = function(passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };

  passport.use('jwt', new JwtStrategy(opts, async (jwt_payload, done) => {
    console.log('[LOG] Callback de JwtStrategy ejecutado. Payload:', jwt_payload);
    try {
      const query = 'SELECT id, name, email, role FROM users WHERE id = ?';
      const [rows] = await db.query(query, [jwt_payload.id]);

      if (rows && rows.length > 0) {
        const user = rows[0];
        console.log('[JWT] Usuario encontrado:', user);
        return done(null, user); // El usuario existe, la autenticación es exitosa.
      } else {
        console.warn('[JWT] Usuario no encontrado para el id:', jwt_payload.id);
        return done(null, false, { message: 'El token es válido, pero el usuario ya no existe.' });
      }
    } catch (error) {
      console.error('[JWT] Error en la consulta a la base de datos:', error);
      return done(error, false); // Error en la base de datos.
    }
  }));
};
