// Este archivo define las rutas de la API para crear y obtener reservas.
const { Router } = require('express');
const router = Router();

const reservationController = require('../controllers/reservation.controller');
const { authenticateJwt } = require('../middleware/authenticate');


// Ruta para crear una nueva reserva (público)
// NOTA: Esta ruta ahora está protegida por JWT debido a la configuración en index.js
router.post('/', authenticateJwt, reservationController.createReservation);

// Ruta para obtener todas las reservas (solo para administradores)
// 'authenticateJwt' se aplica en index.js, aquí solo verificamos el rol.
router.get('/all', authenticateJwt, reservationController.getAllReservations);

// Rutas que requieren autenticación de usuario general (ya aplicada en index.js)
router.get('/', authenticateJwt, reservationController.getReservations);
router.get('/:id', authenticateJwt, reservationController.getReservationById);
router.patch('/:id/status', authenticateJwt, reservationController.updateStatus);

module.exports = router;
