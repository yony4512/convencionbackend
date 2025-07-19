const { Router } = require('express');
const { createUser, getUsers, updateUser, updateUserStatus, deleteUser } = require('../controllers/user.controller');
const { ensureAdmin } = require('../middleware/auth');
const { authenticateJwt } = require('../middleware/authenticate');

const router = Router();

// GET /api/users - Obtener todos los usuarios (Solo Admin)
router.get('/', getUsers);

// POST /api/users - Crear un nuevo cajero (Solo Admin)
router.post('/', createUser);

// PUT /api/users/:id - Actualizar nombre de un usuario (Solo Admin)
router.put('/:id', authenticateJwt, ensureAdmin, updateUser);

// PATCH /api/users/:id/status - Actualizar estado de un usuario (Solo Admin)
router.patch('/:id/status', authenticateJwt, ensureAdmin, updateUserStatus);

// DELETE /api/users/:id - Eliminar un usuario (Solo Admin)
router.delete('/:id', authenticateJwt, ensureAdmin, deleteUser);

module.exports = router;
