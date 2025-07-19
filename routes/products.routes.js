const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductCategories,
  getPublicProducts 
} = require('../controllers/products.controller.js');

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta de destino para las subidas
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Crear un nombre de archivo único para evitar sobrescribir
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: ¡Solo se permiten archivos de imagen (jpeg, jpg, png, gif)!'));
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Límite de 5MB
});

const router = Router();

// Obtener todas las categorías
router.get('/categories', getProductCategories);

// OBTENER todos los productos para el público (solo disponibles)
router.get('/public', getPublicProducts);

// OBTENER todos los productos
router.get('/', getProducts);

// OBTENER un solo producto por ID
router.get('/:id', getProductById);

// CREAR un nuevo producto con subida de imagen
router.post('/', upload.single('image'), createProduct);

// ACTUALIZAR un producto por ID con subida de imagen
router.put('/:id', upload.single('image'), updateProduct);

// ELIMINAR un producto por ID
router.delete('/:id', deleteProduct);

module.exports = router;
