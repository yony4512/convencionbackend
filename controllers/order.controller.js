const db = require('../db');

const createOrder = async (req, res) => {
    console.log('\n[CREATE_ORDER] =================================================');
    console.log('[CREATE_ORDER] Iniciando la creación del pedido...');
    console.log('[CREATE_ORDER] Timestamp:', new Date().toISOString());
        console.log('[CREATE_ORDER] req.user (JWT payload):', req.user);
    console.log('[CREATE_ORDER] req.body (Datos del pedido):', JSON.stringify(req.body, null, 2));

    const { items, total, paymentMethod, deliveryInfo } = req.body;
        const userId = req.user ? req.user.id : null;

    if (!items || !items.length || !total || !paymentMethod || !deliveryInfo) {
        console.error('[CREATE_ORDER] ERROR: Faltan datos en la petición.');
        return res.status(400).json({ message: 'Faltan datos para procesar el pedido.' });
    }

    const status = paymentMethod.toLowerCase().includes('efectivo') ? 'pendiente' : 'pagado';
    console.log(`[CREATE_ORDER] Estado determinado: ${status}`);

    let connection;
    try {
        console.log('[CREATE_ORDER] Obteniendo conexión de la base de datos...');
        connection = await db.getConnection();
        console.log('[CREATE_ORDER] Conexión obtenida exitosamente.');

        console.log('[CREATE_ORDER] Iniciando transacción...');
        await connection.beginTransaction();
        console.log('[CREATE_ORDER] Transacción iniciada.');

        const orderQuery = `
            INSERT INTO orders (user_id, total_amount, payment_method, delivery_address, customer_name, customer_email, customer_phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const orderValues = [
            userId,
            total,
            paymentMethod,
            deliveryInfo.address,
            deliveryInfo.name,
            deliveryInfo.email,
            deliveryInfo.phone,
            status
        ];

        console.log('[CREATE_ORDER] Ejecutando inserción en la tabla `orders`...');
        const [orderResult] = await connection.query(orderQuery, orderValues);
        const orderId = orderResult.insertId;
        console.log(`[CREATE_ORDER] Inserción en \`orders\` completada. Nuevo orderId: ${orderId}`);

        if (!orderId) {
            throw new Error('No se pudo obtener el ID del pedido insertado.');
        }

        const itemQuery = `
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ?;
        `;
        const itemsValues = items.map(item => [orderId, item.id, item.quantity, item.price]);

        console.log('[CREATE_ORDER] Ejecutando inserción en la tabla `order_items`...');
        await connection.query(itemQuery, [itemsValues]);
        console.log('[CREATE_ORDER] Inserción en `order_items` completada.');

        console.log('[CREATE_ORDER] Haciendo commit de la transacción...');
        await connection.commit();
        console.log('[CREATE_ORDER] Commit realizado con éxito.');

        const io = req.app.get('io');
        if (io) {
            console.log('[CREATE_ORDER] Notificando por Socket.IO...');
            const notificationPayload = {
                id: `order-${orderId}-${Date.now()}`,
                entityId: orderId,
                entityType: 'order',
                type: 'pedido',
                title: `Nuevo Pedido #${orderId}`,
                message: items.map(item => `${item.quantity}x ${item.name}`).join(', '),
                customer_name: deliveryInfo.name,
                isRead: false,
                createdAt: new Date().toISOString(),
                status: status,
                total_amount: total,
            };
            io.emit('new_notification', notificationPayload);
            console.log(`[CREATE_ORDER] Notificación de nuevo pedido emitida: ${orderId}`);
        } else {
            console.log('[CREATE_ORDER] Socket.IO no está disponible, no se enviará notificación.');
        }

        console.log(`[CREATE_ORDER] Pedido ${orderId} creado. Enviando respuesta al cliente...`);
        res.status(201).json({ message: 'Pedido creado exitosamente', orderId });
        console.log('[CREATE_ORDER] Respuesta enviada. Proceso finalizado con éxito.');

    } catch (error) {
        console.error('[CREATE_ORDER] !!!!!!!!!!!!!! ERROR CAPTURADO !!!!!!!!!!!!!!');
        console.error(error);
        if (connection) {
            console.log('[CREATE_ORDER] Intentando hacer rollback...');
            await connection.rollback();
            console.log('[CREATE_ORDER] Rollback realizado.');
        }
        res.status(500).json({ message: 'Error interno del servidor al procesar el pedido.' });
    } finally {
        if (connection) {
            console.log('[CREATE_ORDER] Liberando la conexión a la base de datos...');
            connection.release();
            console.log('[CREATE_ORDER] Conexión liberada.');
        }
        console.log('[CREATE_ORDER] =================================================\n');
    }
};



// Obtener todos los pedidos de un usuario
const getUserOrders = async (req, res) => {
  // Passport deserializa el usuario y lo adjunta a req.user. El middleware ensureAuthenticated garantiza que existe.
    const userId = req.user.id;

  try {
    // Usamos el objeto 'db' importado al principio del archivo, que es el pool de conexiones.
    // Esto es consistente con el resto de los controladores.
    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status,
        o.createdAt,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.createdAt DESC;
    `;
    
    // Ejecutamos la consulta directamente desde el pool de conexiones 'db'.
    const [orders] = await db.query(query, [userId]);

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Error al obtener los pedidos del usuario.' });
  }
};

// Obtener todos los pedidos (para el panel de administración)
const getAllOrders = async (req, res) => {
  // Verificación de rol explícita dentro del controlador
  if (req.user.role !== 'admin' && req.user.role !== 'cajero') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador o cajero.' });
  }
  try {
    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status,
        o.createdAt,
        o.customer_name,
        (SELECT GROUP_CONCAT(p.name SEPARATOR ', ') 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = o.id) AS items_summary
      FROM orders o
      ORDER BY o.createdAt DESC;
    `;
    
        const [orders] = await db.query(query);

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Error al obtener todos los pedidos.' });
  }
};

// Obtener un pedido por ID con todos sus detalles (para el modal del admin)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener los detalles principales del pedido
    const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    const order = orderRows[0];

    // Verificación de autorización: El usuario debe ser el dueño del pedido o un admin/staff.
        if (order.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para ver este pedido.' });
    }

    // 2. Obtener los productos asociados a ese pedido
    const itemsQuery = `
      SELECT oi.quantity, oi.price, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const [items] = await db.query(itemsQuery, [id]);

    // 3. Combinar todo en un solo objeto
    const fullOrderDetails = { ...order, items };

    res.status(200).json(fullOrderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Error al obtener los detalles del pedido.' });
  }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'El estado es requerido.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        const order = orderRows[0];

        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        await connection.commit();

        // --- Notificación por Socket.IO --- 
        const io = req.app.get('io');
        if (io) {
            const payload = {
                entityId: Number(id),
                entityType: 'order',
                status: status
            };
            io.emit('notification_status_update', payload);
            console.log(`[Socket.IO] Notificación de actualización de estado emitida para el pedido: ${id}`);
        }

        res.status(200).json({ message: 'Estado del pedido actualizado con éxito.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus };
