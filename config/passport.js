const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = function(passport) {
  // Estrategia de Google unificada para la aplicación web (clientes)
  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_BASE_URL}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : null;

    if (!email) {
      return done(new Error('No se encontró un correo en el perfil de Google.'), null);
    }

    try {
      // 1. Buscar si el usuario ya existe por su google_id
      let [userRows] = await db.query('SELECT * FROM users WHERE google_id = ?', [id]);
      if (userRows.length > 0) {
        return done(null, userRows[0]);
      }

      // 2. Si no, buscar si existe por email (para asociar cuentas)
      [userRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (userRows.length > 0) {
        // Si el usuario existe pero no tiene google_id, lo actualizamos.
        await db.query('UPDATE users SET google_id = ? WHERE email = ?', [id, email]);
        return done(null, userRows[0]);
      }

      // 3. Si no existe de ninguna forma, crear un nuevo usuario como 'cliente'
      const newUser = {
        google_id: id,
        email: email,
        name: displayName,
        role: 'cliente', // Por defecto, los registros de Google son clientes
        status: 'active',
      };

      const [result] = await db.query('INSERT INTO users SET ?', [newUser]);
      const finalUser = { id: result.insertId, ...newUser };
      return done(null, finalUser);

    } catch (error) {
      console.error('Error en la estrategia de Google unificada:', error);
      return done(error, null);
    }
  }));

  // Las funciones serializeUser y deserializeUser no son necesarias para un flujo JWT puro.
  // Se eliminan para evitar confusiones y mantener el código limpio.
};
