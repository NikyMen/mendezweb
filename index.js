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
import Product from "./models/Product.js"; // Importa el modelo Product
import Order from "./models/Order.js";     // Importa el modelo Order
import connectToDatabase from "./lib/db.js";
import authRouter from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

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
  // Para la página de inicio, mostramos solo un número limitado de productos para el slider.
  // Así evitamos cargar miles de productos y romper el carrusel.
  const productos = await Product.find({}).limit(12);
  res.render("index", {
    username: res.locals.user?.username || null,
    user: res.locals.user,
    productos,
    termino: ""
  })
})

app.get("/productos", async (req, res) => {
  const termino = req.query.buscar?.toLowerCase() || "";
  const page = parseInt(req.query.page) || 1;
  const limit = 20; // Reducido para mostrar menos productos por página
  const offset = (page - 1) * limit;

  const query = {};
  if (termino) {
    query.nombre = { "$regex": termino, "$options": "i" };
  }

  const productos = await Product.find(query)
    .skip(offset)
    .limit(limit);

  const totalResultados = await Product.countDocuments(query);
  const totalPaginas = Math.ceil(totalResultados / limit);

  res.render("productos", {
    productos,
    user: res.locals.user,
    paginaActual: page,
    totalPaginas,
    totalResultados,
    termino
  });
});

app.get("/producto/:codigo", async (req, res) => {
  const producto = await Product.findOne({ codigo: req.params.codigo });
  if (!producto) return res.status(404).send("Producto no encontrado")
  res.render("producto", { producto, user: res.locals.user, termino: "" })
})

// ROUTERS
app.use(authRouter);

// CARRITO
app.get("/carrito", async (req, res) => {
  const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
  const codigosProductos = Object.keys(carrito);
  let productosEnCarrito = [];
  let total = 0;

  if (codigosProductos.length > 0) {
    const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
    productosEnCarrito = productosEncontrados.map(p => {
      const cantidad = carrito[p.codigo];
      const subtotal = p.precio * cantidad;
      return { ...p.toObject(), cantidad, subtotal };
    });
    total = productosEnCarrito.reduce((acc, p) => acc + p.subtotal, 0);
  }

  res.render("carrito", { productos: productosEnCarrito, total, user: res.locals.user, termino: "" })
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
  const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
  const codigosProductos = Object.keys(carrito);
  let productosParaJson = [];

  if (codigosProductos.length > 0) {
    const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
    productosParaJson = productosEncontrados.map(p => {
      const cantidad = carrito[p.codigo];
      return { ...p.toObject(), cantidad, subtotal: p.precio * cantidad };
    });
  }
  res.json(productosParaJson)
})

app.post("/carrito/finalizar", async (req, res) => {
  const carrito = req.cookies.cart ? JSON.parse(req.cookies.cart) : {};
  const nombre = req.body.nombre || "Usuario sin nombre"
  const telefono = req.body.telefono || "Sin número"
  const codigosProductos = Object.keys(carrito);
  const productosEncontrados = await Product.find({ 'codigo': { $in: codigosProductos } });
  const productosEnCarrito = productosEncontrados.map(p => ({ ...p.toObject(), cantidad: carrito[p.codigo], subtotal: p.precio * carrito[p.codigo] }));
  const total = productosEnCarrito.reduce((acc, p) => acc + p.subtotal, 0)

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
    // Puedes manejar el error de forma más robusta aquí, por ejemplo, enviando un mensaje al usuario
  }

  let mensaje = `Hola! Soy ${nombre}. Quiero comprar estos productos:\n`
  productosEnCarrito.forEach(p => {
    mensaje += `\n- ${p.nombre} (x${p.cantidad}) - $${p.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  })
  mensaje += `\n\nTotal: $${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}\nMi teléfono es: ${telefono}`

  const link = `https://wa.me/5493795036085?text=${encodeURIComponent(mensaje)}`

  // Limpiar la cookie del carrito
  res.clearCookie("cart");
  res.redirect(link)
})

// PÁGINAS ESTÁTICAS
app.get("/ofertas", async (req, res) => {
  // La página de ofertas también debería estar limitada o paginada para un mejor rendimiento.
  // Por ahora, la limitamos para evitar el mismo problema que en la página de inicio.
  const productosEnOferta = await Product.find({}).limit(20); // O filtra por un campo específico si lo tienes, ej: { enOferta: true }
  res.render("ofertas", { productos: productosEnOferta, user: res.locals.user, termino: "" })
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

export default app
