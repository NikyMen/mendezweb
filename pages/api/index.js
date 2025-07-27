import { connect } from '../../lib/db';
import Product from '../../models/product.js';

export default async function handler(req, res) {
  try {
    try {
      await connect();
    } catch (dbError) {
      console.error('Error al conectar a la base de datos en API:', dbError.message);
      // Continuamos con la ejecución aunque falle la conexión
    }
    
    try {
      const products = await Product.find({});
      res.status(200).json(products);
    } catch (queryError) {
      console.error('Error al consultar productos en API:', queryError.message);
      // Si hay error en la consulta, devolvemos array vacío
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error general en API de productos:', error.message);
    res.status(500).json({ error: 'Error al obtener productos', message: error.message });
  }
}