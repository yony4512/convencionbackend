const { MercadoPagoConfig } = require('mercadopago');
const dotenv = require('dotenv');

dotenv.config();

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error('FATAL ERROR: MERCADOPAGO_ACCESS_TOKEN no está definido en .env. La aplicación no podrá procesar pagos.');
}

// Inicializa el cliente de Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken,
  options: {
    timeout: 5000, // 5 segundos de timeout
  }
});

console.log('Mercado Pago client configured.');

module.exports = client;
