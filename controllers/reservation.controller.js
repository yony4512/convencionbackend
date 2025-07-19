// NEW FILE
const db = require('../db');

// -- Helpers -------------------------------------------------------------
const isWithinSchedule = (dateObj) => {
  // dateObj is JS Date with chosen reservation date+time (local time)
  const day = dateObj.getDay(); // 0=Sun .. 6=Sat
  const hour = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const timeValue = hour * 60 + minutes;

  // Convert ranges to minutes from 00:00 for easy comparison
  const inRange = (startH, startM, endH, endM) => {
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    return timeValue >= start && timeValue <= end;
  };

  switch (day) {
    case 0: // Sunday
      return inRange(12, 0, 22, 0);
    case 5: // Friday
    case 6: // Saturday
      return inRange(11, 0, 23, 0);
    default: // Mon-Thu
      return inRange(11, 0, 22, 0);
  }
};

// -----------------------------------------------------------------------
exports.createReservation = async (req, res) => {
  const { date, time, people, customer } = req.body; // date yyyy-mm-dd, time HH:mm, customer{name,email,phone}
  const userId = req.user ? req.user.id : null;

  if (!date || !time || !people || !customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ message: 'Faltan datos para la reserva.' });
  }

  // Debug
  console.log('[Reserva] Payload recibido', { date, time, people, customer, userId });

  // Validar horario
  const dateTime = new Date(`${date}T${time}:00`);
  if (isNaN(dateTime.getTime()) || !isWithinSchedule(dateTime)) {
    return res.status(400).json({ message: 'La hora seleccionada está fuera del horario de atención.' });
  }

  let connection;
  try {
    connection = await db.getConnection();

    const insert = `INSERT INTO reservations (user_id, customer_name, customer_email, customer_phone, people, \`date\`, \`time\`, status, advance_paid)
                    VALUES (?,?,?,?,?,?,?, 'pendiente', 1)`; // adelantado pagado (simulado)
    const values = [userId, customer.name, customer.email, customer.phone, people, date, time];
    const [result] = await connection.query(insert, values);

    const reservationId = result.insertId;
    console.log(`[Reserva] Insertada con id ${reservationId}`);

    // Emitir socket
    const io = req.app.get('io');
    if (io) {
      // Estandarizar el payload de la notificación
      const notificationPayload = {
        id: `res-${reservationId}-${Date.now()}`, // ID único para la notificación
        entityId: reservationId, // ID de la entidad (la reserva)
        entityType: 'reservation', // Tipo de la entidad
        type: 'reserva', // Tipo de notificación para el ícono y la lógica de la UI
        title: `Nueva Reserva #${reservationId}`,
        message: `${people} personas para el ${date} a las ${time}`,
        customer_name: customer.name,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pendiente',
      };
      io.emit('new_notification', notificationPayload);
    }

    res.status(201).json({ ok: true, reservationId });
  } catch (err) {
    console.error('Error creando reserva:', err);
    res.status(500).json({ message: 'Error al crear la reserva.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getReservations = async (req, res) => {
  try {
    const userId = req.user?.role === 'admin' ? null : req.user.id;
    let query = 'SELECT * FROM reservations ORDER BY createdAt DESC';
    let params = [];
    if (userId) {
      query = 'SELECT * FROM reservations WHERE user_id = ? ORDER BY createdAt DESC';
      params = [userId];
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo reservas:', err);
    res.status(500).json({ message: 'Error.' });
  }
};

exports.getAllReservations = async (req, res) => {
  // Verificación de rol explícita dentro del controlador
  if (req.user.role !== 'admin' && req.user.role !== 'cajero') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador o cajero.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM reservations ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo todas las reservas:', err);
    res.status(500).json({ message: 'Error al obtener las reservas.' });
  }
};

exports.getReservationById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }
    const reservation = rows[0];

    // Verificación de autorización: El usuario debe ser el dueño de la reserva o un admin/staff.
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para ver esta reserva.' });
    }

    res.json(reservation);
  } catch (err) {
    console.error(`Error obteniendo la reserva ${id}:`, err);
    res.status(500).json({ message: 'Error al obtener la reserva.' });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // confirmada / cancelada
  if (!['confirmada','cancelada'].includes(status)) return res.status(400).json({ message: 'Estado inválido.' });
  try {
    await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);

    // socket
    const io = req.app.get('io');
    if (io) {
      io.emit('notification_status_update', {
        entityId: Number(id),
        entityType: 'reservation',
        status: status
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando reserva:', err);
    res.status(500).json({ message: 'Error.' });
  }
};
