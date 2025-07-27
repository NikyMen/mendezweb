// MÓDULOS EXTERNOS
import express from "express"
// import fs from "fs" // Ya no es necesario
import path from "path"
import { fileURLToPath } from "url"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import expressLayouts from "express-ejs-layouts"

// CONFIG PROPIA
import { SECRET_KEY } from "./config.js"
import Product from "./models/product.js"; // Importa el modelo Product
import Order from "./models/order.js";     // Importa el modelo Order
import { connect as connectToDatabase } from "./lib/db.js";
import authRouter from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Conectar a la base de datos al iniciar la aplicación
async function startServer() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    // No detenemos la aplicación, permitimos que continúe para que Vercel pueda manejar el error
  }
  
  // MIDDLEWARES
  app.use(expressLayouts)
  app.set("layout", "layout")
  app.set("view engine", "ejs")
  app.set("views", path.join(__dirname, "views"))
  
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(express.static(path.join(__dirname, "public")))
  
  app.use((req, res, next) => {
    const token = req.cookies.user
    if (!token) return next()
    try {
      res.locals.user = jwt.verify(token, SECRET_KEY)
    } catch {
      res.locals.user = null
    }
    next()
  })
  
  // RUTAS
  app.get("/", async (req, res) => {
    try {
      // Para la página de inicio, mostramos solo un número limitado de productos para el slider.
      // Así evitamos cargar miles de productos y romper el carrusel.
      let productos = [];
      try {
        productos = await Product.find({}).limit(12);
      } catch (error) {
        console.error('Error al obtener productos:', error.message);
        // Continuar con un array vacío si hay error
      }
      
      res.render("index", {
        username: res.locals.user?.username || null,
        user: res.locals.user,
        productos,
        termino: ""
      });
    } catch (error) {
      console.error('Error en la ruta principal:', error.message);
      res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
    }
  })
  
  app.get("/productos", async (req, res) => {
    try {
      const termino = req.query.buscar?.toLowerCase() || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 20; // Reducido para mostrar menos productos por página
      const offset = (page - 1) * limit;
    
      const query = {};
      if (termino) {
        query.nombre = { "$regex": termino, "$options": "i" };
      }
    
      let productos = [];
      let totalResultados = 0;
      
      try {
        productos = await Product.find(query)
          .skip(offset)
          .limit(limit);
        
        totalResultados = await Product.countDocuments(query);
      } catch (error) {
        console.error('Error al obtener productos:', error.message);
        // Continuar con arrays vacíos si hay error
      }
      
      const totalPaginas = Math.ceil(totalResultados / limit);
    
      res.render("productos", {
        productos,
        user: res.locals.user,
        paginaActual: page,
        totalPaginas,
        totalResultados,
        termino
      });
    } catch (error) {
      console.error('Error en la ruta de productos:', error.message);
      res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
    }
  });
  
  app.get("/producto/:codigo", async (req, res) => {
    try {
      let producto = null;
      
      try {
        producto = await Product.findOne({ codigo: req.params.codigo });
      } catch (error) {
        console.error('Error al buscar el producto:', error.message);
        // Continuar con producto null si hay error
      }
      
      if (!producto) return res.status(404).send("Producto no encontrado")
      
      res.render("producto", { producto, user: res.locals.user, termino: "" })
    } catch (error) {
      console.error('Error en la ruta de detalle de producto:', error.message);
      res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
    }
  })
  
  // ROUTERS
  app.use(authRouter);
  
  // CARRITO
  app.get("/carrito", async (req, res) => {
    try {
      const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
      const codigosProductos = Object.keys(carrito);
      let productosEnCarrito = [];
      let total = 0;
    
      if (codigosProductos.length > 0) {
        try {
          const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
          productosEnCarrito = productosEncontrados.map(p => {
            const cantidad = carrito[p.codigo];
            const subtotal = p.precio * cantidad;
            return { ...p.toObject(), cantidad, subtotal };
          });
          total = productosEnCarrito.reduce((acc, p) => acc + p.subtotal, 0);
        } catch (error) {
          console.error('Error al obtener productos del carrito:', error.message);
          // Continuar con array vacío si hay error
        }
      }
    
      res.render("carrito", { productos: productosEnCarrito, total, user: res.locals.user, termino: "" })
    } catch (error) {
      console.error('Error en la ruta del carrito:', error.message);
      res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
    }
  })
  
  app.post("/carrito/agregar", (req, res) => {
    const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
    const codigo = req.body.codigo
    const cantidad = parseInt(req.body.cantidad) || 1
    if (!codigo) return res.status(400).send("Código de producto requerido")
    carrito[codigo] = (carrito[codigo] || 0) + cantidad
    res.cookie("cart", JSON.stringify(carrito), { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 }); // Cookie de 3 días
    res.json({ ok: true })
  })
  
  app.post("/carrito/eliminar", (req, res) => {
    const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
    delete carrito[req.body.codigo]
    res.cookie("cart", JSON.stringify(carrito), { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
    res.redirect("/carrito")
  })
  
  app.post("/api/carrito/eliminar", (req, res) => {
    const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
    delete carrito[req.body.codigo]
    res.cookie("cart", JSON.stringify(carrito), { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true })
  })
  
  app.get("/carrito/json", async (req, res) => {
    try {
      const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
      const codigosProductos = Object.keys(carrito);
      let productosParaJson = [];
    
      if (codigosProductos.length > 0) {
        try {
          const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
          productosParaJson = productosEncontrados.map(p => {
            const cantidad = carrito[p.codigo];
            return { ...p.toObject(), cantidad, subtotal: p.precio * cantidad };
          });
        } catch (error) {
          console.error('Error al obtener productos para JSON del carrito:', error.message);
          // Continuar con array vacío si hay error
        }
      }
      res.json(productosParaJson)
    } catch (error) {
      console.error('Error en la ruta JSON del carrito:', error.message);
      res.status(500).json({ error: "Algo salió mal. Por favor, inténtalo de nuevo más tarde." });
    }
  })
  
  app.post("/carrito/finalizar", async (req, res) => {
    try {
      const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
      const nombre = req.body.nombre || "Usuario sin nombre"
      const telefono = req.body.telefono || "Sin número"
      const codigosProductos = Object.keys(carrito);
      let productosEnCarrito = [];
      let total = 0;
      
      try {
        if (codigosProductos.length > 0) {
          const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
          productosEnCarrito = productosEncontrados.map(p => ({ 
            ...p.toObject(), 
            cantidad: carrito[p.codigo], 
            subtotal: p.precio * carrito[p.codigo] 
          }));
          total = productosEnCarrito.reduce((acc, p) => acc + p.subtotal, 0);
        }
      } catch (error) {
        console.error('Error al obtener productos para finalizar compra:', error.message);
        // Si no podemos obtener los productos, usamos información básica del carrito
        productosEnCarrito = codigosProductos.map(codigo => ({
          codigo,
          nombre: `Producto ${codigo}`,
          precio: 0,
          cantidad: carrito[codigo],
          subtotal: 0
        }));
      }
    
      // Guardar el pedido en MongoDB
      try {
        const newOrder = new Order({
          nombre,
          telefono,
          productos: productosEnCarrito.map(p => ({ // Mapea a la estructura de OrderItemSchema
            codigo: p.codigo,
            nombre: p.nombre,
            precio: p.precio,
            cantidad: p.cantidad,
            subtotal: p.subtotal
          })),
          total
        });
        await newOrder.save();
        console.log("Pedido guardado en MongoDB:", newOrder);
      } catch (error) {
        console.error("Error al guardar el pedido en MongoDB:", error);
        // Continuamos con el proceso aunque no se pueda guardar en la base de datos
      }
    
      let mensaje = `Hola! Soy ${nombre}. Quiero comprar estos productos:\n`
      productosEnCarrito.forEach(p => {
        mensaje += `\n- ${p.nombre} (x${p.cantidad})`
        if (p.subtotal > 0) {
          mensaje += ` - $${p.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
        }
      })
      
      if (total > 0) {
        mensaje += `\n\nTotal: $${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
      } else {
        mensaje += "\n\nNo se pudo calcular el total debido a un error de conexión."
      }
      
      mensaje += `\nMi teléfono es: ${telefono}`
    
      const link = `https://wa.me/5493795036085?text=${encodeURIComponent(mensaje)}`
      
      // Continuar con el resto del proceso
      res.cookie("cart", "{}", { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
      res.redirect(link);
    } catch (error) {
      console.error('Error general en la finalización del carrito:', error.message);
      res.status(500).send("Algo salió mal al procesar tu pedido. Por favor, inténtalo de nuevo más tarde.");
    }
  })
  
    // Limpiar la cookie del carrito
    res.clearCookie("cart");
    res.redirect(link)
  })
  
  // PÁGINAS ESTÁTICAS
  app.get("/ofertas", async (req, res) => {
    try {
      // La página de ofertas también debería estar limitada o paginada para un mejor rendimiento.
      // Por ahora, la limitamos para evitar el mismo problema que en la página de inicio.
      let productosEnOferta = [];
      
      try {
        productosEnOferta = await Product.find({}).limit(20); // O filtra por un campo específico si lo tienes, ej: { enOferta: true }
      } catch (error) {
        console.error('Error al obtener productos en oferta:', error.message);
        // Continuar con array vacío si hay error
      }
      
      res.render("ofertas", { productos: productosEnOferta, user: res.locals.user, termino: "" })
    } catch (error) {
      console.error('Error en la ruta de ofertas:', error.message);
      res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
    }
  })
  
  app.get("/nosotros", (req, res) => res.render("nosotros", { user: res.locals.user, termino: "" }))
  app.post("/nosotros", (req, res) => {
    const { nombre, mensaje } = req.body
    console.log(`Mensaje recibido de ${nombre}: ${mensaje}`)
    res.redirect("/nosotros")
  })
  
  app.get("/ayuda", (req, res) => res.render("ayuda", { user: res.locals.user, termino: "" }))
  
  // INICIAR SERVIDOR
  
  // Middleware de manejo de errores.
  // Debe ser el ÚLTIMO middleware que se añade.
  app.use((error, req, res, next) => {
    console.error(error); // Loguea el error real en la consola del servidor.
  
    // Envía una respuesta genérica y segura al cliente.
    // No filtres detalles del error al cliente en producción.
    res.status(500).send("Algo salió mal. Por favor, inténtalo de nuevo más tarde.");
  });
  
}

startServer();

export default app