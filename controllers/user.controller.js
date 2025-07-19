const pool = require('../db');
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
  console.log('[LOG] Entrando a createUser. Body:', req.body);
  const { name, email, password } = req.body;
  console.log('createUser llamado con:', { name, email, password });

  if (!name || !email || !password) {
    console.log('Faltan datos requeridos');
    return res.status(400).json({ message: 'Nombre, correo electrónico y contraseña son requeridos.' });
  }

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Resultado de búsqueda de usuario existente:', existingUser);
    if (existingUser.length > 0) {
      console.log('El correo ya está registrado');
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // Encriptar la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password encriptado:', hashedPassword);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)',
      [name, email, 'cashier', hashedPassword]
    );
    console.log('Resultado de inserción:', result);

        const newUser = {
      id: result.insertId,
      name,
      email,
      role: 'cashier',
      status: 'active' // Por defecto, los nuevos usuarios están activos
    };

    res.status(201).json(newUser);
    console.log('[LOG] Usuario creado exitosamente');
  } catch (error) {
    console.error('[LOG] Error en createUser:', error);
    console.error('Error al crear el cajero:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getUsers = async (req, res) => {
    try {
        // Ahora también seleccionamos el campo 'status'
        const [users] = await pool.query('SELECT id, name, email, role, status, createdAt FROM users');
        res.json({ ok: true, users });
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'El nombre y el correo electrónico son requeridos.' });
  }

  try {
    // Verificar si se quiere actualizar el email y que no esté en uso por otro usuario
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado por otro usuario.' });
    }

    // Si se envía una nueva contraseña, la encripta y la actualiza
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, hashedPassword, id]);
    } else {
      await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    }
    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Estado no válido.' });
  }

  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  updateUserStatus,
  deleteUser
};
