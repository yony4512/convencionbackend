const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

// --- CONFIGURACIÓN DEL NUEVO USUARIO ---
// Cambia estos valores por los del administrador que quieres crear
const newUser = {
  email: 'admin@convencion.com',
  name: 'Administrador',
  password: 'admin_password_123', // Elige una contraseña segura
  role: 'admin'
};
// ----------------------------------------

const createAdmin = async () => {
  let connection;
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Conexión exitosa.');

    // Verificar si el usuario ya existe
    console.log(`Verificando si el usuario ${newUser.email} ya existe...`);
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [newUser.email]);
    if (users.length > 0) {
      console.log('El usuario ya existe. No se realizaron cambios.');
      return;
    }

    // Encriptar la contraseña
    console.log('Encriptando contraseña...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newUser.password, saltRounds);
    console.log('Contraseña encriptada.');

    // Insertar el nuevo usuario
    console.log('Insertando nuevo administrador en la base de datos...');
    const query = 'INSERT INTO users (email, name, password, role, status) VALUES (?, ?, ?, ?, ?)';
    await connection.execute(query, [newUser.email, newUser.name, hashedPassword, newUser.role, 'active']);

    console.log('¡Usuario administrador creado exitosamente!');
    console.log(`  Email: ${newUser.email}`);
    console.log(`  Contraseña: ${newUser.password}`);

  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada.');
    }
  }
};

createAdmin();
