const express = require('express');
const router = express.Router();
const { Preference, MercadoPagoConfig } = require('mercadopago');
const { authenticateJwt } = require('../middleware/authenticate');
const db = require('../db'); // Importar la conexión a la BD

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

// Verificación de variables de entorno al iniciar
if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.FRONTEND_URL || !process.env.API_BASE_URL) {
    console.error('CRITICAL ERROR: Missing required environment variables for payment processing. Please check your .env file.');
}

// Ruta para crear una preferencia de pago
router.post('/create-preference', authenticateJwt, async (req, res) => {
  console.log('\n[MP PREFERENCE] =================================================');
  console.log('[MP PREFERENCE] Received request to create preference.');
  console.log('[MP PREFERENCE] Timestamp:', new Date().toISOString());
  console.log('[MP PREFERENCE] Request Body:', JSON.stringify(req.body, null, 2));

  const { cart, deliveryFee, deliveryInfo } = req.body;
  const userId = req.user.id;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'El carrito es inválido.' });
  }

  let connection;
  try {
    console.log('[MP PREFERENCE] Step 1: Getting DB connection...');
    connection = await db.getConnection();
    await connection.beginTransaction();
    console.log('[MP PREFERENCE] --> DB connection and transaction started successfully.');

    const total = cart.reduce((sum, i) => sum + Number(i.price ?? 0) * i.quantity, 0) + Number(deliveryFee);

    console.log('[MP PREFERENCE] Step 2: Creating local order in DB...');
    const orderQuery = `
      INSERT INTO orders (user_id, total_amount, payment_method, delivery_address, customer_name, customer_email, customer_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const orderValues = [
      userId, total, 'Mercado Pago', deliveryInfo.address,
      deliveryInfo.name, deliveryInfo.email, deliveryInfo.phone, 'pending_payment'
    ];
    const [orderResult] = await connection.query(orderQuery, orderValues);
    const orderId = orderResult.insertId;
    console.log(`[MP PREFERENCE] --> Local order created with ID: ${orderId}`);

    const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?;`;
    const itemsValues = cart.map(item => [orderId, item.id, item.quantity, item.price]);
    await connection.query(itemQuery, [itemsValues]);
    console.log('[MP PREFERENCE] --> Order items inserted.');

    const preferenceBody = {
      items: cart.map(p => ({
        id: p.id,
        title: p.name,
        quantity: Number(p.quantity),
        unit_price: Number(p.price),
        currency_id: 'PEN',
      })),
      shipments: {
        cost: Number(deliveryFee) || 0,
        mode: 'not_specified',
      },
      payer: { name: req.user.name, email: req.user.email },
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' } // Corresponde a PagoEfectivo
        ]
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success?order_id=${orderId}`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure?order_id=${orderId}`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending?order_id=${orderId}`,
      },
      notification_url: `${process.env.API_BASE_URL}/api/payment/webhook`,
      external_reference: orderId.toString(),
    };
    console.log('[MP PREFERENCE] Step 3: Creating Mercado Pago preference with body:', JSON.stringify(preferenceBody, null, 2));
    
    const preference = new Preference(client);
    const preferenceResult = await preference.create({ body: preferenceBody });
    console.log('[MP PREFERENCE] --> Mercado Pago preference created successfully.');

    console.log('[MP PREFERENCE] Step 4: Updating local order with preference ID...');
    await connection.query('UPDATE orders SET mp_preference_id = ? WHERE id = ?', [preferenceResult.id, orderId]);
    console.log('[MP PREFERENCE] --> Local order updated.');

    await connection.commit();
    console.log('[MP PREFERENCE] --> DB transaction committed.');

    console.log('[MP PREFERENCE] Step 5: Sending init_point to frontend.');
    res.json({ init_point: preferenceResult.init_point });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error detallado al crear preferencia:', {
      message: error.message,
      cause: error.cause ? JSON.stringify(error.cause, null, 2) : 'No cause available',
      stack: error.stack
    });
    res.status(500).json({ error: 'No se pudo generar el enlace de pago.' });
  } finally {
    if (connection) connection.release();
  }
});

// Ruta para recibir webhooks de Mercado Pago
router.post('/webhook', async (req, res) => {
  console.log('[Webhook MP] Notificación recibida:', req.query);

  const paymentId = req.query['data.id'];
  const type = req.query.type;

  if (type !== 'payment') {
    return res.status(200).send('Not a payment notification');
  }

  try {
    // Obtener la información del pago desde Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
    });
    if (!paymentResponse.ok) throw new Error('Failed to fetch payment from Mercado Pago');
    
    const payment = await paymentResponse.json();
    const orderId = payment.external_reference;

    if (payment.status === 'approved') {
      console.log(`[Webhook MP] Pago aprobado para la orden ${orderId}. Actualizando estado...`);
      await db.query("UPDATE orders SET status = 'pagado' WHERE id = ?", [orderId]);
      
      // Opcional: Notificar por Socket.IO que el pago fue exitoso
      const io = req.app.get('io');
      if (io) {
        io.emit('payment_success', { orderId });
        console.log(`[Socket.IO] Notificación de pago exitoso emitida para la orden: ${orderId}`);
      }
    }

    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
