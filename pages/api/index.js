import { connect } from '../../lib/db';
import Product from '../../models/Product';

export default async function handler(req, res) {
  try {
    await connect();
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}