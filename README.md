# Backend API para la Aplicación de Convenciones

Este es el backend para la aplicación de convenciones. Es una API RESTful construida con Node.js y Express, diseñada para gestionar usuarios, productos, pedidos, pagos y más.

## Características

- API RESTful con Express.
- Autenticación de usuarios con JWT (JSON Web Tokens) y Passport.js.
- Integración con Google para inicio de sesión.
- Conexión a base de datos MySQL.
- Integración de pagos con Mercado Pago.
- Comunicación en tiempo real con WebSockets (Socket.IO).

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm
- Una base de datos MySQL

## Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone <URL-del-repositorio>
    cd convencion/backend
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del directorio `backend` y copia el contenido de `.env.example` (que crearemos a continuación). Luego, rellena los valores correspondientes.

4.  **Inicia la base de datos:**
    Asegúrate de que tu servidor MySQL esté en funcionamiento. Importa los archivos `init.sql` y `users.sql` para crear las tablas y datos necesarios.

5.  **Inicia el servidor en modo de desarrollo:**
    ```bash
    npm run dev
    ```
    El servidor se iniciará en el puerto que definas en tus variables de entorno (por defecto, el que se configure en el código si no se especifica `PORT`).

## Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Configuración del Servidor
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Configuración de la Base de Datos
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_DATABASE=polleria_db

# Secretos de Autenticación
JWT_SECRET=tu_secreto_super_largo_y_dificil_de_adivinar

# URLs de la Aplicación (para redirecciones y webhooks)
FRONTEND_URL=http://localhost:5174
API_BASE_URL=http://localhost:3001
PUBLIC_APP_URL=http://localhost:5174

# Credenciales de Servicios Externos
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_mercado_pago

# Credenciales de Google OAuth (Opcional, si usas login con Google)
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
```

## Scripts Disponibles

-   `npm run dev`: Inicia el servidor en modo de desarrollo con `nodemon`.
-   `npm start`: Inicia el servidor en modo de producción con `node`.
