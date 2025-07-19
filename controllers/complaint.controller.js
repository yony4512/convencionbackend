const db = require('../db');

const createComplaint = async (req, res) => {
  console.log('Datos recibidos para el reclamo:', req.body); // Log para depuración

  const {
    consumer_name,
    consumer_lastname,
    consumer_document_type,
    consumer_document_number,
    consumer_phone,
    consumer_email,
    consumer_address,
    consumer_is_minor,
    item_type,
    item_amount,
    item_description,
    complaint_type,
    complaint_details,
    consumer_request,
  } = req.body;

  // Validación para campos obligatorios
  if (!consumer_name || !consumer_lastname || !consumer_document_type || !consumer_document_number || !consumer_phone || !consumer_email || !consumer_address || !complaint_details || !consumer_request) {
    return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios.' });
  }

  try {
    // Asegurarse de que item_amount sea null si está vacío, en lugar de un string vacío
    const finalItemAmount = item_amount === '' || item_amount === null ? null : parseFloat(item_amount);

    const [result] = await db.execute(
      `INSERT INTO complaints (
        consumer_name, consumer_lastname, consumer_document_type, consumer_document_number,
        consumer_phone, consumer_email, consumer_address, consumer_is_minor,
        item_type, item_amount, item_description, complaint_type,
        complaint_details, consumer_request
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        consumer_name,
        consumer_lastname,
        consumer_document_type,
        consumer_document_number,
        consumer_phone,
        consumer_email,
        consumer_address,
        consumer_is_minor,
        item_type,
        finalItemAmount,
        item_description,
        complaint_type,
        complaint_details,
        consumer_request
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Reclamación registrada con éxito.',
    });
  } catch (error) {
    console.error('Error al registrar el reclamo:', error);
    // Devolvemos el error específico para facilitar la depuración en el frontend
    return res.status(500).json({ message: error.message || 'Error interno del servidor.' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const [complaints] = await db.query('SELECT id, consumer_name, consumer_lastname, complaint_type, status, createdAt FROM complaints ORDER BY createdAt DESC');
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error al obtener las reclamaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getComplaintById = async (req, res) => {
  const { id } = req.params;
  try {
    const [complaint] = await db.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (complaint.length === 0) {
      return res.status(404).json({ message: 'Reclamación no encontrada.' });
    }
    res.status(200).json(complaint[0]);
  } catch (error) {
    console.error(`Error al obtener la reclamación ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validar que el estado sea uno de los valores permitidos
  const allowedStatus = ['pendiente', 'en proceso', 'atendido'];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reclamación no encontrada.' });
    }

    res.status(200).json({ message: 'Estado del reclamo actualizado con éxito.' });
  } catch (error) { 
    console.error(`Error al actualizar el estado del reclamo ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { createComplaint, getAllComplaints, getComplaintById, updateComplaintStatus };
