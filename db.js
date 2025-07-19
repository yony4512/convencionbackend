const mysql = require('mysql2');
require('dotenv').config();

// Mostrar qué base se está usando realmente
console.log('DB_DATABASE env value =>', process.env.DB_DATABASE);

// Crear un pool de conexiones en lugar de una única conexión
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'polleria_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Usar la versión con Promesas del pool para poder usar async/await
const promisePool = pool.promise();

console.log('Pool de conexiones a MySQL creado.');

module.exports = promisePool;
