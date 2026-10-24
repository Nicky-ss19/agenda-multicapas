// Esta es la dirección del servicio web del profe. Con GET me da la lista
// de contactos y con POST guardo uno nuevo.
var URL_AGENDA = 'https://www.raydelto.org/agenda.php';

// Aquí guardo todos los contactos que llegan del servidor,
// así puedo buscar entre ellos sin tener que pedirlos otra vez.
var todosLosContactos = [];

// Se llama cuando carga la página y cuando le doy al botón Recargar
function cargarContactos() {
    var contenido = document.getElementById('contenido');
    contenido.innerHTML = '<p class="aviso">Cargando contactos...</p>';

    // fetch sin decirle el método usa GET por defecto
    fetch(URL_AGENDA)
        .then(function (respuesta) {
            if (!respuesta.ok) {
                throw new Error('El servidor respondió con el código ' + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function (datos) {
            todosLosContactos = datos;
            filtrarContactos();
        })
        .catch(function (error) {
            contenido.innerHTML = '<p class="aviso error">No se pudieron cargar los contactos. Revisa tu internet y dale a Recargar.</p>';
            document.getElementById('contador').textContent = '';
            console.error('Error al cargar los contactos:', error);
        });
}

// Pinta en pantalla la lista de contactos que le pase
function mostrarContactos(contactos) {
    var contenido = document.getElementById('contenido');
    contenido.innerHTML = '';

    document.getElementById('contador').textContent =
        '(' + contactos.length + ' de ' + todosLosContactos.length + ')';

    if (contactos.length === 0) {
        contenido.innerHTML = '<p class="aviso">No encontré ningún contacto con esa búsqueda.</p>';
        return;
    }

    // Los pongo al revés para que los más nuevos salgan arriba
    for (var i = contactos.length - 1; i >= 0; i--) {
        contenido.appendChild(crearTarjetaContacto(contactos[i]));
    }
}

// Arma la tarjetita de un contacto. Uso textContent y no innerHTML
// porque los datos los escribe cualquier persona en el servidor
// y así nadie me puede meter código raro en la página.
function crearTarjetaContacto(contacto) {
    var nombre = contacto.nombre || '';
    var apellido = contacto.apellido || '';
    var telefono = contacto.telefono || '';

    var tarjeta = document.createElement('div');
    tarjeta.className = 'contacto';

    var inicial = document.createElement('div');
    inicial.className = 'inicial';
    inicial.textContent = (nombre.trim().charAt(0) || '?').toUpperCase();

    var datos = document.createElement('div');
    datos.className = 'datos';

    var nombreCompleto = document.createElement('p');
    nombreCompleto.className = 'nombre-contacto';
    nombreCompleto.textContent = nombre + ' ' + apellido;

    var tel = document.createElement('p');
    tel.className = 'telefono';
    tel.textContent = telefono;

    datos.appendChild(nombreCompleto);
    datos.appendChild(tel);
    tarjeta.appendChild(inicial);
    tarjeta.appendChild(datos);
    return tarjeta;
}

// Le quita los acentos y lo pone en minúscula, así si busco "lopez"
// también me encuentra a "López"
function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Busca entre los contactos mientras escribo en el buscador
function filtrarContactos() {
    var texto = normalizar(document.getElementById('buscador').value.trim());

    if (texto === '') {
        mostrarContactos(todosLosContactos);
        return;
    }

    var encontrados = todosLosContactos.filter(function (contacto) {
        var todo = normalizar(contacto.nombre + ' ' + contacto.apellido + ' ' + contacto.telefono);
        return todo.indexOf(texto) !== -1;
    });
    mostrarContactos(encontrados);
}

// Muestra un mensajito debajo del formulario (verde si salió bien, rosado si no)
function mostrarMensaje(texto, tipo) {
    var mensaje = document.getElementById('mensajeFormulario');
    mensaje.textContent = texto;
    mensaje.className = 'mensaje ' + tipo;
}

// Se llama cuando le doy a "Guardar contacto"
function guardarContacto(evento) {
    evento.preventDefault(); // para que el formulario no recargue la página

    var nombre = document.getElementById('nombre').value.trim();
    var apellido = document.getElementById('apellido').value.trim();
    var telefono = document.getElementById('telefono').value.trim();

    // Reviso que no falte nada antes de mandarlo
    if (nombre === '' || apellido === '' || telefono === '') {
        mostrarMensaje('Llena los tres campos, por favor.', 'error');
        return;
    }

    // El teléfono solo puede tener números, espacios, guiones, paréntesis o un +
    if (!/^[0-9+\-\s()]{7,20}$/.test(telefono)) {
        mostrarMensaje('Ese teléfono no se ve bien. Usa solo números y guiones.', 'error');
        return;
    }

    var botonGuardar = document.getElementById('botonGuardar');
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando...';

    var nuevoContacto = {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono
    };

    // Ahora sí uso POST y mando el contacto como JSON en el cuerpo.
    // No le pongo el header Content-Type: application/json a propósito,
    // porque eso hace que el navegador mande primero una petición OPTIONS
    // (el famoso preflight de CORS) y si el servidor no la acepta, falla.
    fetch(URL_AGENDA, {
        method: 'POST',
        body: JSON.stringify(nuevoContacto)
    })
        .then(function (respuesta) {
            if (!respuesta.ok) {
                throw new Error('El servidor respondió con el código ' + respuesta.status);
            }
            mostrarMensaje('¡Listo! ' + nombre + ' se guardó en la agenda.', 'exito');
            document.getElementById('formContacto').reset();
            document.getElementById('buscador').value = '';
            cargarContactos(); // vuelvo a pedir la lista para que salga el nuevo
        })
        .catch(function (error) {
            mostrarMensaje('No se pudo guardar el contacto. Intenta otra vez.', 'error');
            console.error('Error al guardar el contacto:', error);
        })
        .finally(function () {
            botonGuardar.disabled = false;
            botonGuardar.textContent = 'Guardar contacto';
        });
}
