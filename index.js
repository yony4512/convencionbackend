// Basic Imports
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Local Imports
const db = require('./db');
require('./config/passport')(passport); // Configura las estrategias de Passport (Google, etc.)
require('./config/passport-jwt')(passport); // Configura la estrategia JWT de Passport
require('./config/mercadopago.js'); // Mercado Pago configuration

// Rutas de testimonios
const testimonialsRoutes = require('./routes/testimonials');
const complaintRoutes = require('./routes/complaints.routes.js');
const localAuthRoutes = require('./routes/localAuth.routes');

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware Configuration (Order is Critical) ---

// 1. CORS: Allow requests from frontend origins
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Parsers: Handle JSON, URL-encoded data, and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Endpoint para testimonios
app.use('/api/testimonials', testimonialsRoutes);

// 3. Passport Initialization (sin sesiones)
app.use(passport.initialize());

// --- Static Files ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// --- API Routes ---
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const paymentRoutes = require('./routes/payment.routes');
const reservationsRoutes = require('./routes/reservations.routes.js');
const complaintsRoutes = require('./routes/complaints.routes.js');
const complaintsAdminRoutes = require('./routes/admin/complaints.admin.routes.js');
const { authenticateJwt } = require('./middleware/authenticate');

app.use('/api/auth', localAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reservations', reservationsRoutes);

// Rutas de Quejas: Públicas para crear, privadas para administrar
app.use('/api/complaints', complaintsRoutes); // Rutas públicas (POST)
app.use('/api/complaints', authenticateJwt, complaintsAdminRoutes); // Rutas de admin (GET, PATCH)
app.use('/api/users', userRoutes);

// Endpoint de prueba para depuración de autenticación JWT
app.post('/api/test-auth', authenticateJwt, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.get('/api', (req, res) => res.json({ message: '¡Bienvenido a la API de la Pollería!' }));

// --- Socket.IO Configuration ---
const io = new Server(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// --- Server Startup ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT} y Socket.IO escuchando`);
  try {
    const connection = await db.getConnection();
    console.log('Conectado a la base de datos exitosamente!');
    connection.release();
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  }
});