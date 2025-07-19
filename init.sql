CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` enum('menu','complementos','bebidas','combos') NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `delivery_address` VARCHAR(255) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('pendiente', 'confirmado', 'en_preparacion', 'listo_para_recoger', 'en_camino', 'entregado', 'cancelado', 'pagado', 'pending_payment') NOT NULL DEFAULT 'pendiente',
  `mp_preference_id` VARCHAR(255) NULL DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  people INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status ENUM('pendiente','confirmada','cancelada') DEFAULT 'pendiente',
  advance_paid TINYINT(1) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `complaints` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  consumer_name        VARCHAR(255) NOT NULL,
  consumer_lastname    VARCHAR(255) NOT NULL,
  consumer_document_type   VARCHAR(50) NOT NULL,
  consumer_document_number VARCHAR(50) NOT NULL,
  consumer_phone   VARCHAR(50) NOT NULL,
  consumer_email   VARCHAR(255) NOT NULL,
  consumer_address VARCHAR(255) NOT NULL,
  consumer_is_minor BOOLEAN NOT NULL,
  item_type ENUM('producto','servicio') NOT NULL,
  item_amount DECIMAL(10,2) NULL,
  item_description TEXT NULL,
  complaint_type ENUM('reclamo','queja') NOT NULL,
  complaint_details TEXT NOT NULL,
  consumer_request  TEXT NOT NULL,
  status ENUM('pendiente','en proceso','atendido') DEFAULT 'pendiente',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL, -- Si quieres enlazar con tu tabla de usuarios
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  rating INT NOT NULL, -- 1 a 5 estrellas
  comment TEXT NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL, -- para avatar personalizado o futuro
  location VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);