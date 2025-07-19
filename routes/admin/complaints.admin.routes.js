const { Router } = require('express');
const { getAllComplaints, getComplaintById, updateComplaintStatus } = require('../../controllers/complaint.controller.js');
const { ensureAdmin } = require('../../middleware/auth.js');

const router = Router();

// --- Rutas de Administración ---
// Las siguientes rutas requieren autenticación (aplicada en index.js) y rol de administrador.

// Ruta para obtener todas las reclamaciones (Admin)
router.get('/', ensureAdmin, getAllComplaints);

// Ruta para obtener una reclamación por su ID (Admin)
router.get('/:id', ensureAdmin, getComplaintById);

// Ruta para actualizar el estado de un reclamo (Admin)
router.patch('/:id/status', ensureAdmin, updateComplaintStatus);

module.exports = router;
