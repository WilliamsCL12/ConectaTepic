let carrito = []; // Variable para almacenar los archivos agregados al carrito
let lastScrollTop = 0;

const header = document.querySelector('header');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        // Scroll hacia abajo
        header.classList.add('header-hide');
    } else {
        // Scroll hacia arriba
        header.classList.remove('header-hide');
    }
    lastScrollTop = scrollTop;
});

// Evento al hacer clic en el botón "Agregar al Carrito"
document.getElementById('add-to-cart').addEventListener('click', async function() {
    const archivoInput = document.getElementById('file-upload');
    const archivo = archivoInput.files[0]; // Obtener el archivo cargado
    const tipoImpresion = document.querySelector('input[name="print-type"]:checked').value;
    const numCopias = parseInt(document.getElementById('num-copies').value);
    const engargolado = document.getElementById('binding').checked;
    const tamañoEngargolado = engargolado ? document.getElementById('binding-size').value : null;

    console.log('Archivo cargado:', archivo); // Mensaje de depuración

    if (archivo) {
        try {
            let numPaginas = await detectarPaginas(archivo);
            console.log('Número de páginas detectado:', numPaginas); // Mensaje de depuración
            if (numPaginas > 0) {
                carrito.push({ 
                    fileName: archivo.name, 
                    numPaginas, 
                    numCopias, 
                    tipoImpresion, 
                    engargolado, 
                    tamañoEngargolado 
                });
                actualizarCarrito(); // Actualiza la tabla del carrito
            } else {
                alert('No se pudo detectar el número de páginas del archivo.');
            }
        } catch (error) {
            console.error('Error al detectar el número de páginas:', error);
        }
    } else {
        alert('Por favor, carga un archivo.');
    }
});

// Evento para mostrar las opciones de engargolado al seleccionar la casilla correspondiente
document.getElementById('binding').addEventListener('change', function() {
    const opcionesEngargolado = document.getElementById('binding-options');
    opcionesEngargolado.style.display = this.checked ? 'block' : 'none';
});

// Evento al hacer clic en el botón "Calcular Total"
document.getElementById('calculate-total').addEventListener('click', function() {
    calcularTotales();
});

// Variables para guardar los totales (declaradas como globales)
let totalCostoSimple = 0;
let totalCostoDoble = 0;
let totalCostoEngargolado = 0;
let bindingDetailsHTML = '';
let totalCosto = 0;

// Evento al hacer clic en el botón "Imprimir Cotización"
document.getElementById('print-quote').addEventListener('click', function() {
    imprimirCotizacion();
});

// Función para generar la hoja de cotización y abrir la ventana de impresión
const printWindow = window.open('', '_blank');
function imprimirCotizacion() {
    const estilos = `
        <style>
            body { font-family: 'Poppins', sans-serif; margin: 0; padding: 20px; }
            h1, h2 { color: #6a1b9a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #6a1b9a; color: white; }
            #total { margin-top: 20px; font-weight: 700; }
        </style>
    `;

    const contenido = `
        <h1>Cotización de Impresiones</h1>
        <h2>Detalle de Impresiones</h2>
        <table>
            <thead>
                <tr>
                    <th>Tipo de Impresión</th>
                    <th>Total Páginas</th>
                    <th>Costo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Un Lado</td>
                    <td>${(totalCostoSimple*100)/totalCostoSimple}</td>
                    <td>$${totalCostoSimple.toFixed(2)} MXN</td>
                </tr>
                <tr>
                    <td>Ambos Lados</td>
                    <td>${totalCostoDoble > 0 ? totalCostoDoble / 1.50 : 0}</td>
                    <td>$${totalCostoDoble.toFixed(2)} MXN</td>
                </tr>
            </tbody>
        </table>
        <h2>Detalle de Engargolado</h2>
        <table>
            <thead>
                <tr>
                    <th>Tamaño de Engargolado</th>
                    <th>Copias</th>
                    <th>Costo</th>
                </tr>
            </thead>
            <tbody>
                ${bindingDetailsHTML}
            </tbody>
        </table>
        <h2>Total General</h2>
        <p id="total"><strong>$${totalCosto.toFixed(2)} MXN</strong></p>
    `;

    printWindow.document.write(`
        <html>
        <head>
            <title>Cotización de Impresiones</title>
            ${estilos}
        </head>
        <body>
            ${contenido}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}

// Función para calcular los totales de la cotización con desglose de bindigns por tipo
function calcularTotales() {
    let totalPaginasSimple = 0;
    let totalPaginasDoble = 0;
    totalCostoSimple = 0; // Reiniciar totalCostoSimple
    totalCostoDoble = 0; // Reiniciar totalCostoDoble
    totalCostoEngargolado = 0; // Reiniciar totalCostoEngargolado

    // Objeto para agrupar los engargolados por su tamaño (agrupando las cantidades de copias)
    let bindingTotals = {};

    carrito.forEach(item => {
        const totalPaginas = item.numPaginas * item.numCopias;
        if (item.tipoImpresion === 'simple') {
            totalPaginasSimple += totalPaginas;
        } else {
            totalPaginasDoble += totalPaginas;
        }

        if (item.engargolado) {
            let bindingKey = item.tamañoEngargolado; // Ejemplo: "8", "11", etc.
            // Si ya existe el registro para ese tamaño, acumula la cantidad
            if (bindingTotals[bindingKey]) {
                bindingTotals[bindingKey].copies += item.numCopias;
            } else {
                bindingTotals[bindingKey] = { copies: item.numCopias };
            }
        }
    });

    // Una vez agrupado, calcular el costo de cada engargolado según la cantidad total para ese tamaño
    for (const key in bindingTotals) {
        let copies = bindingTotals[key].copies;
        let cost = calcularCostoEngargolado(key, copies);
        bindingTotals[key].cost = cost;
        totalCostoEngargolado += cost;
    }

    // Cálculo para impresiones simples
    if (totalPaginasSimple >= 1 && totalPaginasSimple <= 29) {
        totalCostoSimple = totalPaginasSimple * 1.50;
    } else if (totalPaginasSimple >= 30 && totalPaginasSimple <= 49) {
        totalCostoSimple = totalPaginasSimple * 1.00;
    } else if (totalPaginasSimple >= 50 && totalPaginasSimple <= 99) {
        totalCostoSimple = totalPaginasSimple * 0.90;
    } else if (totalPaginasSimple >= 100 && totalPaginasSimple <= 499) {
        totalCostoSimple = totalPaginasSimple * 0.50;
    } else if (totalPaginasSimple >= 500) {
        totalCostoSimple = totalPaginasSimple * 0.40;
    }

    // Cálculo para impresiones dobles
    if (totalPaginasDoble >= 1 && totalPaginasDoble <= 29) {
        totalCostoDoble = totalPaginasDoble * 1.50;
    } else if (totalPaginasDoble >= 30 && totalPaginasDoble <= 49) {
        totalCostoDoble = totalPaginasDoble * 1.00;
    } else if (totalPaginasDoble >= 50 && totalPaginasDoble <= 99) {
        totalCostoDoble = totalPaginasDoble * 0.90;
    } else if (totalPaginasDoble >= 100 && totalPaginasDoble <= 499) {
        totalCostoDoble = totalPaginasDoble * 0.40;
    } else if (totalPaginasDoble >= 500) {
        totalCostoDoble = totalPaginasDoble * 0.22;
    }

    totalCosto = totalCostoSimple + totalCostoDoble + totalCostoEngargolado;
    let totaldepaginasunlado = totalPaginasSimple;
    let totaldepaginasdoslados = totalPaginasDoble;
    
    // Crear un listado detallado de engargolados por tipo con la cantidad total y el costo acumulado
    bindingDetailsHTML = '';
    for (const key in bindingTotals) {
        bindingDetailsHTML += `
            <tr>
                <td>${bindingTotals[key].copies} Del</td>
                <td>#${key}</td>
                <td>$${bindingTotals[key].cost.toFixed(2)} MXN</td>
                <br>
            
            </tr>
        `;
    }

    // Mostrar los resultados en el contenedor 'result'
    document.getElementById('result').innerHTML = `
        <p>Total Por Las ${totalPaginasSimple} Impresiones Simple: $${totalCostoSimple.toFixed(2)} MXN</p>
        <p>Total Por Las ${totalPaginasDoble} Impresiones Doble: $${totalCostoDoble.toFixed(2)} MXN</p>
        <p>Detalle de Engargolado:</p>
        <ul>${bindingDetailsHTML}</ul>
        <p><strong>Total Engargolado: $${totalCostoEngargolado.toFixed(2)} MXN</strong></p>
        <p><strong>Total General: $${totalCosto.toFixed(2)} MXN</strong></p>
    `;

    actualizarCarrito();
}



// Función para calcular el costo de engargolado según su tamaño y número de copias
function calcularCostoEngargolado(tamañoEngargolado, numCopias) {
    const preciosEngargolado = {
        '8': [16, 15, 14],
        '11': [18, 17, 16],
        '12': [18, 17, 16],
        '14': [20, 19, 18],
        '16': [20, 19, 18],
        '20': [24, 23, 22],
        '23': [24, 23, 22],
        '25': [24, 23, 22],
        '30': [35, 29, 28],
        '38': [35, 29, 28],
        '45': [38, 31, 30]
    };

    let precioPorCopia = 0;
    if (numCopias >= 1 && numCopias <= 24) {
        precioPorCopia = preciosEngargolado[tamañoEngargolado][0];
    } else if (numCopias >= 25 && numCopias <= 49) {
        precioPorCopia = preciosEngargolado[tamañoEngargolado][1];
    } else if (numCopias >= 50) {
        precioPorCopia = preciosEngargolado[tamañoEngargolado][2];
    }

    return precioPorCopia * numCopias;
}

// Función para detectar el número de páginas de un archivo
async function detectarPaginas(archivo) {
    console.log('Tipo de archivo:', archivo.type);

    if (archivo.type === 'application/pdf') {
        try {
            const tareaCarga = pdfjsLib.getDocument(URL.createObjectURL(archivo));
            const pdf = await tareaCarga.promise;
            console.log('Número de páginas en PDF:', pdf.numPages);
            return pdf.numPages;
        } catch (error) {
            console.error('Error al procesar el archivo PDF:', error);
            return 0;
        }
    } else if (archivo.type === 'application/msword' || archivo.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
            const arrayBuffer = await archivo.arrayBuffer();
            const resultado = await mammoth.extractRawText({ arrayBuffer });
            const numPaginas = resultado.value.split('\f').length;
            console.log('Número de páginas en Word:', numPaginas);
            return numPaginas;
        } catch (error) {
            console.error('Error al procesar el archivo Word:', error);
            return 0;
        }
    }
    return 0;
}

// Función para actualizar la tabla del carrito
function actualizarCarrito() {
    const listaCarrito = document.querySelector('#cart tbody');
    listaCarrito.innerHTML = '';

    carrito.forEach((item, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.fileName}</td>
            <td>${item.numPaginas}</td>
            <td>${item.numCopias}</td>
            <td>${item.tipoImpresion === 'simple' ? 'Un lado' : 'Ambos lados'}</td>
            <td>${item.engargolado ? `Sí (#${item.tamañoEngargolado})` : 'No'}</td>
            <td><button class="btn btn-delete">Eliminar</button></td>
        `;

        const botonEliminar = fila.querySelector('.btn-delete');
        botonEliminar.addEventListener('click', () => {
            carrito.splice(index, 1);
            calcularTotales();
        });

        listaCarrito.appendChild(fila);
    });
}
