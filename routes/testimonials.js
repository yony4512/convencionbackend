const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener los últimos 10 testimonios
router.get('/', async (req, res) => {
  try {
        const [rows] = await db.query('SELECT * FROM testimonials WHERE rating >= 3 ORDER BY created_at DESC LIMIT 3');
    res.json({ ok: true, testimonials: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Error al obtener testimonios' });
  }
});

// Guardar un nuevo testimonio
router.post('/', async (req, res) => {
  try {
    const { user_id, name, email, rating, comment, location } = req.body;
    const image_url = null; // Por ahora, avatar por defecto en frontend
    
    // Asegurarse de que rating sea un número
    const ratingInt = parseInt(rating, 10);

    await db.query(
      'INSERT INTO testimonials (user_id, name, email, rating, comment, image_url, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id || null, name, email, ratingInt, comment, image_url, location]
    );
    res.json({ ok: true, message: '¡Gracias por tu comentario!' });
  } catch (err) {
    console.error('Error al guardar testimonio:', err); // Log detallado del error
    res.status(500).json({ ok: false, error: 'Error al guardar testimonio' });
  }
});

module.exports = router;
