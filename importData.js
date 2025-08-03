import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()


async function main() {
  console.log('Iniciando la importación de datos...')

  try {
    // 1. Limpiar la tabla de productos existente
    await prisma.product.deleteMany({})
    console.log('Tabla de productos limpiada.')

    // 2. Leer el archivo JSON de productos
    const productosPath = path.join(process.cwd(), 'db', 'productos_actualizados.json')
    const productosData = JSON.parse(fs.readFileSync(productosPath, 'utf-8'))
    console.log(`Se encontraron ${productosData.length} productos en el archivo JSON.`)

    // 3. Filtrar productos duplicados por 'codigo'
    const productosUnicos = [];
    const codigosVistos = new Set();
    for (const p of productosData) {
      if (!codigosVistos.has(p.codigo)) {
        productosUnicos.push(p);
        codigosVistos.add(p.codigo);
      }
    }
    console.log(`Se encontraron ${productosUnicos.length} productos únicos.`)

    // 4. Preparar los datos para Prisma (asegurando que el precio sea un número)
    const productosParaCrear = productosUnicos.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      precio: parseFloat(p.precio) || 0, // Convierte a número, si falla pone 0
      imagen: p.imagen,
      descripcion: p.descripcion
    }));

    // 5. Insertar los nuevos productos en la base de datos
    const result = await prisma.product.createMany({
      data: productosParaCrear,
    })

    console.log(`¡Importación completada! Se crearon ${result.count} nuevos productos.`)

  } catch (error) {
    console.error('Error durante la importación de datos:', error)
    process.exit(1)
  } finally {
    // 6. Desconectar el cliente de Prisma
    await prisma.$disconnect()
  }
}

main()
