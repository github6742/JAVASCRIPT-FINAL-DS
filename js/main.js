/* =========================================================
   main.js — Utilidades compartidas entre tienda y admin
   ========================================================= */

const URL_PRODUCTOS = "./data/productos.json";
const CLAVE_STORAGE_PRODUCTOS = "productosAdmin";
const CLAVE_STORAGE_CARRITO = "carritoCompras";

/* ---------- Toasts (Toastify) ---------- */
function mostrarToastAviso(texto) {
  Toastify({
    text: texto,
    duration: 2500,
    gravity: "top",
    position: "right",
    style: { background: "linear-gradient(to right, #1e8449, #27ae60)" }
  }).showToast();
}

function mostrarToastError(texto) {
  Toastify({
    text: texto,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: { background: "linear-gradient(to right, #c0392b, #e74c3c)" }
  }).showToast();
}

/* ---------- Storage helpers ---------- */
function obtenerProductosAdmin() {
  return JSON.parse(localStorage.getItem(CLAVE_STORAGE_PRODUCTOS)) || [];
}

function guardarProductosAdmin(productos) {
  localStorage.setItem(CLAVE_STORAGE_PRODUCTOS, JSON.stringify(productos));
}

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem(CLAVE_STORAGE_CARRITO)) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_STORAGE_CARRITO, JSON.stringify(carrito));
}

/* ---------- Fetch con async/await + try/catch/finally ---------- */
async function cargarProductosBase() {
  try {
    const respuesta = await fetch(URL_PRODUCTOS);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }
    const productos = await respuesta.json();
    return productos;
  } catch (error) {
    mostrarToastError("No se pudieron cargar los productos: " + error.message);
    return [];
  } finally {
    // finally se ejecuta siempre (éxito o error)
  }
}

/* ---------- Combina JSON + productos cargados por admin ---------- */
async function obtenerTodosLosProductos() {
  const productosBase = await cargarProductosBase();
  const productosAdmin = obtenerProductosAdmin();
  return [...productosBase, ...productosAdmin];
}

/* ---------- Formateo de precios ---------- */
function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(precio);
}