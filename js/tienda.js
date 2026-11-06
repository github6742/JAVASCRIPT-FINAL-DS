/* =========================================================
   tienda.js — Lógica de la tienda (catálogo + carrito + checkout)
   ========================================================= */

let productosDisponibles = [];
let carrito = obtenerCarrito();

/* ---------- Referencias al DOM ---------- */
const seccionCarga = document.getElementById("seccionCarga");
const seccionCatalogo = document.getElementById("seccionCatalogo");
const contenedorProductos = document.getElementById("contenedorProductos");
const selectCategoria = document.getElementById("selectCategoria");
const contenedorCarrito = document.getElementById("contenedorCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const botonVaciarCarrito = document.getElementById("botonVaciarCarrito");
const botonFinalizarCompra = document.getElementById("botonFinalizarCompra");

/* ---------- Inicialización ---------- */
async function iniciarTienda() {
  mostrarToastAviso("Cargando productos…");
  productosDisponibles = await obtenerTodosLosProductos();

  seccionCarga.classList.add("oculto");
  seccionCatalogo.classList.remove("oculto");

  if (productosDisponibles.length === 0) {
    mostrarToastError("No hay productos disponibles");
    return;
  }

  cargarCategorias();
  renderizarProductos(productosDisponibles);
  renderizarCarrito();
  mostrarToastAviso("Productos cargados con éxito");
}

/* ---------- Categorías dinámicas (Set + map) ---------- */
function cargarCategorias() {
  const categorias = [...new Set(productosDisponibles.map((p) => p.categoria))];
  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    selectCategoria.appendChild(option);
  });
}

/* ---------- Render de productos ---------- */
function renderizarProductos(productos) {
  contenedorProductos.innerHTML = "";

  if (productos.length === 0) {
    contenedorProductos.innerHTML = "<p>No hay productos en esta categoría.</p>";
    return;
  }

  productos.forEach((producto) => {
    const card = document.createElement("div");
    card.className = "cardProducto";
    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Marca: ${producto.marca}</p>
      <p>Categoría: ${producto.categoria}</p>
      <p class="precio">${formatearPrecio(producto.precio)}</p>
      <button class="botonPrimario" data-id="${producto.id}">Agregar al Carrito</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      agregarAlCarrito(producto.id);
    });
    contenedorProductos.appendChild(card);
  });
}

/* ---------- Filtro por categoría ---------- */
function filtrarPorCategoria(categoria) {
  const filtrados =
    categoria === ""
      ? productosDisponibles
      : productosDisponibles.filter((p) => p.categoria === categoria);
  renderizarProductos(filtrados);
}

/* ---------- Agregar al carrito (SIN delay) ---------- */
function agregarAlCarrito(idProducto) {
  const producto = productosDisponibles.find((p) => p.id === idProducto);
  if (!producto) return;

  const itemExistente = carrito.find((item) => item.id === idProducto);

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  guardarCarrito(carrito);
  renderizarCarrito();
  mostrarToastAviso(`${producto.nombre} agregado al carrito`);
}

/* ---------- Cambiar cantidad con + / − (sin input, sin NaN) ---------- */
function cambiarCantidad(idProducto, delta) {
  const item = carrito.find((item) => item.id === idProducto);
  if (!item) return;

  item.cantidad += delta;

  if (item.cantidad <= 0) {
    carrito = carrito.filter((item) => item.id !== idProducto);
  }

  guardarCarrito(carrito);
  renderizarCarrito();
}

/* ---------- Eliminar del carrito ---------- */
function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  guardarCarrito(carrito);
  renderizarCarrito();
  mostrarToastAviso("Producto eliminado del carrito");
}

/* ---------- Render del carrito ---------- */
function renderizarCarrito() {
  contenedorCarrito.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarrito.innerHTML = "<p>El carrito está vacío.</p>";
    totalCarrito.textContent = "Total: $0";
    return;
  }

  carrito.forEach((item) => {
    const div = document.createElement("div");
    div.className = "itemCarrito";
    div.innerHTML = `
      <div class="itemInfo">
        <h4>${item.nombre}</h4>
        <p>Precio unitario: ${formatearPrecio(item.precio)}</p>
      </div>
      <div class="itemCantidad">
        <button class="botonCantidad" data-accion="restar" data-id="${item.id}">−</button>
        <span class="cantidadValor">${item.cantidad}</span>
        <button class="botonCantidad" data-accion="sumar" data-id="${item.id}">+</button>
      </div>
      <div class="itemSubtotal">
        <p>Subtotal: ${formatearPrecio(item.precio * item.cantidad)}</p>
        <button class="botonEliminar" data-id="${item.id}">Eliminar</button>
      </div>
    `;
    contenedorCarrito.appendChild(div);
  });

  /* Listeners de los botones + / − */
  contenedorCarrito.querySelectorAll(".botonCantidad").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const delta = btn.dataset.accion === "sumar" ? 1 : -1;
      cambiarCantidad(id, delta);
    });
  });

  /* Listeners de eliminar */
  contenedorCarrito.querySelectorAll(".botonEliminar").forEach((btn) => {
    btn.addEventListener("click", () => eliminarDelCarrito(parseInt(btn.dataset.id)));
  });

  /* Total con reduce */
  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  totalCarrito.textContent = `Total: ${formatearPrecio(total)}`;
}

/* ---------- Vaciar carrito con SweetAlert ---------- */
async function vaciarCarrito() {
  if (carrito.length === 0) {
    mostrarToastAviso("El carrito ya está vacío");
    return;
  }

  const resultado = await Swal.fire({
    title: "¿Vaciar carrito?",
    text: "Se eliminarán todos los productos del carrito.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c0392b"
  });

  if (resultado.isConfirmed) {
    carrito = [];
    guardarCarrito(carrito);
    renderizarCarrito();
    mostrarToastAviso("Carrito vaciado");
  }
}

/* ---------- Checkout completo con SweetAlert ---------- */
async function finalizarCompra() {
  if (carrito.length === 0) {
    mostrarToastAviso("El carrito está vacío");
    return;
  }

  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

  const { value: formValues } = await Swal.fire({
    title: "Finalizar Compra",
    html: `
      <input id="swalNombre" class="swal2-input" placeholder="Nombre completo">
      <input id="swalEmail" class="swal2-input" placeholder="Email">
      <input id="swalDireccion" class="swal2-input" placeholder="Dirección de envío">
      <select id="swalPago" class="swal2-select">
        <option value="">Método de pago</option>
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta de crédito</option>
        <option value="transferencia">Transferencia</option>
      </select>
      <p style="margin-top:1rem; font-weight:bold;">Total a pagar: ${formatearPrecio(total)}</p>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Confirmar compra",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e8449",
    preConfirm: () => {
      const nombre = document.getElementById("swalNombre").value.trim();
      const email = document.getElementById("swalEmail").value.trim();
      const direccion = document.getElementById("swalDireccion").value.trim();
      const pago = document.getElementById("swalPago").value;

      if (!nombre || !email || !direccion || !pago) {
        Swal.showValidationMessage("Complete todos los campos");
        return false;
      }
      return { nombre, email, direccion, pago };
    }
  });

  if (!formValues) return;

  const numeroOrden = "ORD-" + Date.now();

  await Swal.fire({
    title: "¡Compra exitosa!",
    html: `
      <p>Gracias por tu compra, <strong>${formValues.nombre}</strong>.</p>
      <p>Número de orden: <strong>${numeroOrden}</strong></p>
      <p>Total: <strong>${formatearPrecio(total)}</strong></p>
      <p>Método de pago: <strong>${formValues.pago}</strong></p>
      <p>Envío a: <strong>${formValues.direccion}</strong></p>
    `,
    icon: "success",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#1e8449"
  });

  carrito = [];
  guardarCarrito(carrito);
  renderizarCarrito();
}

/* ---------- Eventos ---------- */
selectCategoria.addEventListener("change", (e) => filtrarPorCategoria(e.target.value));
botonVaciarCarrito.addEventListener("click", vaciarCarrito);
botonFinalizarCompra.addEventListener("click", finalizarCompra);

/* ---------- Arranque ---------- */
iniciarTienda();