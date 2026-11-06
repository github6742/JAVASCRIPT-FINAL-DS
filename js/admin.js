/* =========================================================
   admin.js — Lógica del panel de carga de productos
   ========================================================= */

const formularioProducto = document.getElementById("formularioProducto");
const contenedorAdminProductos = document.getElementById("contenedorAdminProductos");

let productosAdmin = obtenerProductosAdmin();

/* ---------- Render de productos cargados ---------- */
function renderizarProductosAdmin() {
  contenedorAdminProductos.innerHTML = "";

  if (productosAdmin.length === 0) {
    contenedorAdminProductos.innerHTML = "<p>No hay productos cargados.</p>";
    return;
  }

  productosAdmin.forEach((producto) => {
    const card = document.createElement("div");
    card.className = "cardProducto";
    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Código: ${producto.codigo}</p>
      <p>Marca: ${producto.marca}</p>
      <p>Categoría: ${producto.categoria}</p>
      <p class="precio">${formatearPrecio(producto.precio)}</p>
      <button class="botonEliminar" data-id="${producto.id}">Eliminar</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      eliminarProducto(producto.id);
    });
    contenedorAdminProductos.appendChild(card);
  });
}

/* ---------- Agregar producto ---------- */
function agregarProducto(e) {
  e.preventDefault();

  const codigo = document.getElementById("inputCodigo").value.trim().toUpperCase();
  const nombre = document.getElementById("inputNombre").value.trim().toUpperCase();
  const marca = document.getElementById("inputMarca").value.trim().toUpperCase();
  const categoria = document.getElementById("inputCategoria").value;
  const precio = parseFloat(document.getElementById("inputPrecio").value);

  /* Validaciones */
  if (!codigo || !nombre || !marca || !categoria || isNaN(precio) || precio <= 0) {
    mostrarToastError("Complete todos los campos correctamente");
    return;
  }

  if (productosAdmin.some((p) => p.codigo === codigo)) {
    mostrarToastError("Ya existe un producto con ese código");
    return;
  }

  if (productosAdmin.some((p) => p.nombre === nombre)) {
    mostrarToastError("Ya existe un producto con ese nombre");
    return;
  }

  /* Generar id único (evita colisiones con los del JSON base) */
  const nuevoId = Date.now();

  const nuevoProducto = {
    id: nuevoId,
    codigo,
    nombre,
    marca,
    categoria,
    precio
  };

  productosAdmin.push(nuevoProducto);
  guardarProductosAdmin(productosAdmin);
  renderizarProductosAdmin();
  formularioProducto.reset();
  mostrarToastAviso("Producto agregado correctamente");
}

/* ---------- Eliminar producto con confirmación ---------- */
async function eliminarProducto(idProducto) {
  const producto = productosAdmin.find((p) => p.id === idProducto);
  if (!producto) return;

  const resultado = await Swal.fire({
    title: "¿Eliminar producto?",
    text: `Se eliminará "${producto.nombre}" del catálogo.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c0392b"
  });

  if (!resultado.isConfirmed) return;

  productosAdmin = productosAdmin.filter((p) => p.id !== idProducto);
  guardarProductosAdmin(productosAdmin);
  renderizarProductosAdmin();
  mostrarToastAviso("Producto eliminado");
}

/* ---------- Eventos ---------- */
formularioProducto.addEventListener("submit", agregarProducto);

/* ---------- Arranque ---------- */
renderizarProductosAdmin();