const bcrypt = require('bcrypt'); // Si no tienes bcrypt, puedes usar texto plano para pruebas
const jwt = require('jsonwebtoken');
const db = require('../db');
const { Router } = require('express');
const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    const user = rows[0];
    // Usar bcrypt.compare para validar la contraseña encriptada
    const isValid = user.password && await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Error en login local:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router; 