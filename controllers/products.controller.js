const db = require('../db');

// Helper para transformar la data de la DB a la del Frontend


// Obtener todos los productos
const getProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json({ ok: true, products: rows });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener los productos.', error });
    }
};

// Obtener un solo producto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length <= 0) {
            return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
        }
        // Pasamos el objeto `req` también al obtener un solo producto
        res.json({ ok: true, product: rows[0] });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener el producto.', error });
    }
};

// Crear un nuevo producto
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, available } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
        }

        // Construir la URL completa de la imagen
        const imageUrl = req.file.filename;

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category, available, image) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, parseFloat(price), category, available === 'true' || available === true, imageUrl]
        );

        const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

        res.status(201).json({
            ...newProduct[0],
            id: newProduct[0].id.toString(),
            available: !!newProduct[0].available
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear el producto' });
    }
};

// Actualizar un producto existente
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, available } = req.body;

        // Obtener el producto actual para saber la imagen anterior
        const [currentProductRows] = await db.query('SELECT image FROM products WHERE id = ?', [id]);
        if (currentProductRows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        let imageUrl = currentProductRows[0].image;

        // Si se sube un nuevo archivo, se actualiza la URL de la imagen
        if (req.file) {
            imageUrl = req.file.filename;
            // Opcional: aquí se podría añadir lógica para borrar la imagen antigua del servidor
        }

        const [result] = await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, available = ?, image = ? WHERE id = ?',
            [name, description, parseFloat(price), category, available === 'true' || available === true, imageUrl, id]
        );

        if (result.affectedRows === 0) {
            // Esto es redundante por el chequeo de arriba, pero lo dejamos por seguridad
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

        res.json({
            ...updatedProduct[0],
            id: updatedProduct[0].id.toString(),
            available: !!updatedProduct[0].available
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ message: 'Error interno del servidor al actualizar el producto' });
    }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
        }

        res.json({ ok: true, message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al eliminar el producto.', error });
    }
};


// Obtener todas las categorías de productos únicas
const getProductCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
        // Mapeamos para obtener un array de strings en lugar de un array de objetos
        const categories = rows.map(row => row.category);
        res.json({ ok: true, categories });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener las categorías.', error });
    }
};

// Obtener todos los productos para el público (solo los disponibles)
const getPublicProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE available = true ORDER BY id DESC');
        res.json({ ok: true, products: rows });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener los productos públicos.', error });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductCategories,
    getPublicProducts
};
