const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller.js');
const { authenticateJwt } = require('../middleware/authenticate');



// --- Rutas Públicas y de Clientes ---

// Crear un nuevo pedido (requiere estar logueado como cliente, JWT o sesión).
// La autenticación se maneja globalmente en index.js
router.post('/', authenticateJwt, createOrder);



// Obtener los pedidos del usuario autenticado (cliente).
router.get('/my-orders', authenticateJwt, getUserOrders);

// --- Rutas de Administrador ---

// Obtener TODOS los pedidos (requiere ser admin).
// Esta es la ruta que fallaba. Ahora usa los middlewares correctos en el orden correcto.
router.get('/all', authenticateJwt, getAllOrders);

// Obtener un pedido específico por ID (requiere ser admin).
router.get('/:id', authenticateJwt, getOrderById);

// Actualizar el estado de un pedido (requiere ser admin o staff).
router.patch('/:id/status', authenticateJwt, updateOrderStatus);

module.exports = router;
