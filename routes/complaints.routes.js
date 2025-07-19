const { Router } = require('express');
const { createComplaint } = require('../controllers/complaint.controller.js');

const router = Router();

// Ruta para crear una nueva reclamación (Pública)
router.post('/', createComplaint);

module.exports = router;
