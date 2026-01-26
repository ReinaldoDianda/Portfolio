/* ============================================
   UNIDAD1.JS - Funciones de Temas 1.1 - 1.7
   Proyecto: Cálculo Integral
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando módulo Unidad 1...');
    
    // ==========================================
    // 1. TEMA 1.1 - CALCULADORA DE DIFERENCIAL
    // ==========================================
    
    function initDiferencial() {
        const radioInicial = document.getElementById('radio-inicial');
        const deltaRadio = document.getElementById('delta-radio');
        const deltaRadioValor = document.getElementById('delta-radio-valor');
        const btnCalcular = document.getElementById('btn-calcular-diferencial');
        const precioOriginal = document.getElementById('precio-original');
        const cambioAproximado = document.getElementById('cambio-aproximado');
        const cambioReal = document.getElementById('cambio-real');
        const barraPrecision = document.getElementById('barra-precision');
        
        if (!radioInicial || !deltaRadio || !btnCalcular) {
            console.warn('Elementos de diferencial no encontrados');
            return;
        }
        
        // Función precio: P = r² (radio al cuadrado)
        const precio = (r) => r * r;
        
        // Derivada: P' = 2r
        const derivadaPrecio = (r) => 2 * r;
        
        // Función para calcular todo
        function calcular() {
            const r = parseFloat(radioInicial.value);
            const dr = parseFloat(deltaRadio.value);
            
            // Validar que r sea positivo
            if (r <= 0 || isNaN(r)) {
                precioOriginal.textContent = '$0.00';
                cambioAproximado.textContent = '+$0.00';
                cambioReal.textContent = '+$0.00';
                return;
            }
            
            // Precio original
            const P0 = precio(r);
            
            // Cambio aproximado (usando diferencial): dP = P'(r) × dr = 2r × dr
            const dP = derivadaPrecio(r) * dr;
            
            // Cambio real: P(r + dr) - P(r)
            const P1 = precio(r + dr);
            const deltaP = P1 - P0;
            
            // Precisión (qué tan cerca está la aproximación del valor real)
            let precision = 0;
            if (deltaP !== 0) {
                precision = Math.max(0, 100 - Math.abs((dP - deltaP) / deltaP * 100));
            } else {
                precision = 100;
            }
            
            // Mostrar resultados
            precioOriginal.textContent = `$${P0.toFixed(2)}`;
            cambioAproximado.textContent = `+$${dP.toFixed(2)}`;
            cambioReal.textContent = `+$${deltaP.toFixed(2)}`;
            
            // Actualizar barra de precisión
            barraPrecision.style.width = `${precision}%`;
            barraPrecision.textContent = `${precision.toFixed(0)}%`;
            
            // Color de la barra según precisión
            barraPrecision.classList.remove('bg-success', 'bg-warning', 'bg-danger');
            if (precision >= 90) {
                barraPrecision.classList.add('bg-success');
            } else if (precision >= 70) {
                barraPrecision.classList.add('bg-warning');
            } else {
                barraPrecision.classList.add('bg-danger');
            }
        }
        
        // Actualizar valor mostrado del slider cuando se mueve
        deltaRadio.addEventListener('input', function() {
            deltaRadioValor.textContent = parseFloat(this.value).toFixed(2);
            calcular();
        });
        
        // Event listeners
        btnCalcular.addEventListener('click', calcular);
        radioInicial.addEventListener('input', calcular);
        radioInicial.addEventListener('change', calcular);
        
        // Calcular valores iniciales
        calcular();
        
        console.log('✅ Calculadora de diferencial iniciada');
    }
    
    // ==========================================
    // 2. TEMA 1.2 - SIMULADOR DE ERRORES
    // ==========================================
    
    function initErrores() {
        const radioPizza = document.getElementById('radio-pizza');
        const radioPizzaValor = document.getElementById('radio-pizza-valor');
        const errorMedicion = document.getElementById('error-medicion');
        const errorMedicionValor = document.getElementById('error-medicion-valor');
        const pizzaVisual = document.getElementById('pizza-visual');
        const pizzaAreaTexto = document.getElementById('pizza-area-texto');
        const pizzaError = document.getElementById('pizza-error');
        const insightError = document.getElementById('insight-error');
        
        if (!radioPizza || !errorMedicion) {
            console.warn('Elementos de errores no encontrados');
            return;
        }
        
        function calcularErrores() {
            const r = parseFloat(radioPizza.value);
            const dr = parseFloat(errorMedicion.value);
            
            // Área = πr²
            const area = Math.PI * r * r;
            
            // Error en área (usando diferencial): dA = 2πr × dr
            const errorArea = 2 * Math.PI * r * dr;
            
            // Error porcentual en radio
            const errorPctRadio = (dr / r) * 100;
            
            // Error porcentual en área
            const errorPctArea = (errorArea / area) * 100;
            
            // Actualizar UI
            radioPizzaValor.textContent = r;
            errorMedicionValor.textContent = `±${dr.toFixed(1)}`;
            
            // Actualizar visual de pizza
            const scale = r / 15;
            pizzaVisual.style.transform = `scale(${scale})`;
            pizzaAreaTexto.textContent = `${area.toFixed(1)} cm²`;
            
            pizzaError.textContent = `±${errorArea.toFixed(1)} cm² (±${errorPctArea.toFixed(1)}%)`;
            
            // Insight
            const multiplicador = (errorPctArea / errorPctRadio).toFixed(1);
            insightError.textContent = `Un error del ${errorPctRadio.toFixed(1)}% en el radio causa un error del ${errorPctArea.toFixed(1)}% en el área. ¡El error se multiplica por ${multiplicador}!`;
        }
        
        radioPizza.addEventListener('input', calcularErrores);
        errorMedicion.addEventListener('input', calcularErrores);
        
        // Calcular inicial
        calcularErrores();
        
        console.log('✅ Simulador de errores iniciado');
    }
    
    // ==========================================
    // 3. TEMA 1.3 - CONSTRUCTOR DE SUMAS (SIGMA)
    // ==========================================
    
    function initSigma() {
        const sigmaInicio = document.getElementById('sigma-inicio');
        const sigmaFin = document.getElementById('sigma-fin');
        const sigmaFormula = document.getElementById('sigma-formula');
        const sigmaNotacion = document.getElementById('sigma-notacion-visual');
        const sigmaExpansion = document.getElementById('sigma-expansion');
        const sigmaTotal = document.getElementById('sigma-total');
        
        if (!sigmaInicio || !sigmaFin || !sigmaFormula) {
            console.warn('Elementos de sigma no encontrados');
            return;
        }
        
        function calcularSigma() {
            const inicio = parseInt(sigmaInicio.value);
            const fin = parseInt(sigmaFin.value);
            const formula = sigmaFormula.value;
            
            if (inicio > fin) {
                sigmaExpansion.textContent = '(inicio debe ser ≤ fin)';
                sigmaTotal.textContent = '?';
                return;
            }
            
            // Limitar para no hacer expansiones muy largas
            const maxTerminos = 10;
            const mostrarTodos = (fin - inicio + 1) <= maxTerminos;
            
            // Función para evaluar cada término
            const evaluar = (i) => {
                switch(formula) {
                    case 'i': return i;
                    case 'i*2': return i * 2;
                    case 'i*i': return i * i;
                    case '2*i+1': return 2 * i + 1;
                    default: return i;
                }
            };
            
            // Nombre de la fórmula para mostrar
            const nombreFormula = {
                'i': 'i',
                'i*2': '2i',
                'i*i': 'i²',
                '2*i+1': '(2i+1)'
            };
            
            // Calcular suma y construir expansión
            let suma = 0;
            let terminos = [];
            
            for (let i = inicio; i <= fin; i++) {
                const valor = evaluar(i);
                suma += valor;
                
                if (mostrarTodos || i <= inicio + 2 || i >= fin - 1) {
                    terminos.push(valor);
                } else if (i === inicio + 3) {
                    terminos.push('...');
                }
            }
            
            // Actualizar notación MathJax
            sigmaNotacion.innerHTML = `$$ \\sum_{i=${inicio}}^{${fin}} ${nombreFormula[formula]} $$`;
            
            // Actualizar expansión
            sigmaExpansion.textContent = '= ' + terminos.join(' + ');
            
            // Actualizar total
            sigmaTotal.textContent = suma;
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([sigmaNotacion]).catch(err => console.log('MathJax error:', err));
            }
        }
        
        sigmaInicio.addEventListener('input', calcularSigma);
        sigmaFin.addEventListener('input', calcularSigma);
        sigmaFormula.addEventListener('change', calcularSigma);
        
        // Calcular inicial
        calcularSigma();
        
        console.log('✅ Constructor de sumas iniciado');
    }
    
    // ==========================================
    // 4. TEMA 1.4 - GRÁFICO DE RIEMANN
    // ==========================================
    
    function initRiemann() {
        const canvas = document.getElementById('riemannChart');
        const slider = document.getElementById('riemann-n');
        const nValor = document.getElementById('riemann-n-valor');
        const aproxValor = document.getElementById('riemann-aprox');
        const errorValor = document.getElementById('riemann-error');
        const insight = document.getElementById('riemann-insight');
        
        if (!canvas || !slider) {
            console.warn('Elementos de Riemann no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Función f(x) = x²
        const f = (x) => x * x;
        
        // Límites
        const a = 0, b = 2;
        const exactArea = 8 / 3;
        
        let chart = null;
        
        function updateChart(n) {
            n = parseInt(n);
            const deltaX = (b - a) / n;
            
            // Calcular área aproximada (suma derecha)
            let approxArea = 0;
            
            for (let i = 1; i <= n; i++) {
                const xi = a + i * deltaX;
                const height = f(xi);
                approxArea += height * deltaX;
            }
            
            // Calcular error
            const error = ((approxArea - exactArea) / exactArea) * 100;
            
            // Actualizar etiquetas
            nValor.textContent = n;
            aproxValor.textContent = approxArea.toFixed(3);
            errorValor.textContent = Math.abs(error).toFixed(1) + '%';
            
            // Cambiar color del error
            if (Math.abs(error) < 5) {
                errorValor.style.color = '#22c55e';
            } else if (Math.abs(error) < 15) {
                errorValor.style.color = '#f59e0b';
            } else {
                errorValor.style.color = '#ef4444';
            }
            
            // Actualizar insight
            if (n >= 30) {
                insight.innerHTML = '<i class="fas fa-check-circle"></i> ¡Excelente! Con muchos rectángulos, la aproximación es muy precisa';
                insight.style.background = '#dcfce7';
                insight.style.color = '#166534';
            } else if (n >= 10) {
                insight.innerHTML = '<i class="fas fa-arrow-up"></i> Bien, pero aún puedes mejorar. Sigue subiendo...';
                insight.style.background = '#fef3c7';
                insight.style.color = '#92400e';
            } else {
                insight.innerHTML = '<i class="fas fa-arrow-up"></i> Sube el número de rectángulos y observa cómo el error disminuye';
                insight.style.background = '#fef3c7';
                insight.style.color = '#92400e';
            }
            
            // Preparar datos para el gráfico
            const labels = [];
            const curveData = [];
            
            // Puntos para la curva suave
            for (let x = a; x <= b; x += 0.05) {
                labels.push(x.toFixed(2));
                curveData.push(f(x));
            }
            
            // Destruir gráfico anterior
            if (chart) {
                chart.destroy();
            }
            
            // Crear nuevo gráfico
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Rectángulos',
                            data: labels.map(x => {
                                const xNum = parseFloat(x);
                                const rectIndex = Math.floor((xNum - a) / deltaX);
                                if (xNum >= a && xNum < b && rectIndex < n) {
                                    const xi = a + (rectIndex + 1) * deltaX;
                                    return f(xi);
                                }
                                return null;
                            }),
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                            borderColor: 'rgba(102, 126, 234, 0.8)',
                            borderWidth: 2,
                            fill: true,
                            stepped: 'before',
                            pointRadius: 0
                        },
                        {
                            label: 'f(x) = x²',
                            data: curveData,
                            borderColor: '#ef4444',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    scales: {
                        x: {
                            title: { display: true, text: 'x', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const num = parseFloat(label);
                                    return num % 0.5 === 0 ? num : '';
                                },
                                maxRotation: 0
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            title: { display: true, text: 'f(x)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
                        },
                        tooltip: { enabled: true, mode: 'index', intersect: false }
                    }
                }
            });
        }
        
        // Event listener del slider
        slider.addEventListener('input', function() {
            updateChart(this.value);
        });
        
        // Inicializar
        updateChart(4);
        
        console.log('✅ Gráfico de Riemann iniciado');
    }
    
    // ==========================================
    // 5. TEMA 1.5 - INTEGRAL DEFINIDA (Gráfico)
    // ==========================================
    
    function initIntegralDefinida() {
        const canvas = document.getElementById('integralChart');
        const limiteA = document.getElementById('limite-a');
        const limiteB = document.getElementById('limite-b');
        const limiteAValor = document.getElementById('limite-a-valor');
        const limiteBValor = document.getElementById('limite-b-valor');
        const integralNotacion = document.getElementById('integral-notacion');
        const integralValor = document.getElementById('integral-valor');
        
        if (!canvas || !limiteA || !limiteB) {
            console.warn('Elementos de integral definida no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Función f(x) = x
        const f = (x) => x;
        
        // Integral de x = x²/2
        const integral = (a, b) => (b * b / 2) - (a * a / 2);
        
        function updateChart() {
            const a = parseFloat(limiteA.value);
            const b = parseFloat(limiteB.value);
            
            // Actualizar etiquetas
            limiteAValor.textContent = a;
            limiteBValor.textContent = b;
            
            // Calcular integral
            const area = integral(a, b);
            
            // Actualizar notación y valor
            integralNotacion.innerHTML = `$\\int_{${a}}^{${b}} x \\, dx$`;
            integralValor.textContent = area.toFixed(2);
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([integralNotacion]).catch(err => console.log('MathJax error:', err));
            }
            
            // Preparar datos para el gráfico
            const labels = [];
            const curveData = [];
            const areaData = [];
            
            for (let x = 0; x <= 5; x += 0.1) {
                labels.push(x.toFixed(1));
                curveData.push(f(x));
                
                // Área solo entre a y b
                if (x >= a && x <= b) {
                    areaData.push(f(x));
                } else {
                    areaData.push(null);
                }
            }
            
            // Destruir gráfico anterior
            if (chart) {
                chart.destroy();
            }
            
            // Crear gráfico
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Área bajo la curva',
                            data: areaData,
                            backgroundColor: 'rgba(102, 126, 234, 0.4)',
                            borderColor: 'rgba(102, 126, 234, 0.8)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 0,
                            tension: 0.1
                        },
                        {
                            label: 'f(x) = x',
                            data: curveData,
                            borderColor: '#ef4444',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    scales: {
                        x: {
                            title: { display: true, text: 'x', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const num = parseFloat(label);
                                    return num % 1 === 0 ? num : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            max: 6,
                            title: { display: true, text: 'f(x)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { usePointStyle: true, padding: 15 }
                        }
                    }
                }
            });
        }
        
        // Event listeners
        limiteA.addEventListener('input', updateChart);
        limiteB.addEventListener('input', updateChart);
        
        // Inicializar
        updateChart();
        
        console.log('✅ Gráfico de integral definida iniciado');
    }
    
    // ==========================================
    // 6. TEMA 1.6 - VALOR MEDIO (Gráfico)
    // ==========================================
    
    function initValorMedio() {
        const canvas = document.getElementById('valorMedioChart');
        const sliderB = document.getElementById('vm-slider-b');
        const valorB = document.getElementById('vm-b-valor');
        const vmArea = document.getElementById('vm-area');
        const vmPromedio = document.getElementById('vm-promedio');
        const vmPuntoC = document.getElementById('vm-punto-c');
        
        if (!canvas || !sliderB) {
            console.warn('Elementos de valor medio no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Función f(x) = x
        const f = (x) => x;
        
        // Límite inferior fijo
        const a = 0;
        
        function updateChart() {
            const b = parseFloat(sliderB.value);
            
            // Actualizar label del slider
            valorB.textContent = b;
            
            // Área bajo la curva = b²/2 - a²/2
            const area = (b * b / 2) - (a * a / 2);
            
            // Valor promedio = área / (b - a)
            const promedio = b > a ? area / (b - a) : 0;
            
            // Punto c donde f(c) = promedio
            const puntoC = promedio;
            
            // Actualizar valores en pantalla
            vmArea.textContent = area.toFixed(2) + ' u²';
            vmPromedio.textContent = promedio.toFixed(2);
            vmPuntoC.textContent = puntoC.toFixed(2);
            
            // Preparar datos para el gráfico
            const labels = [];
            const curveData = [];
            const rectData = [];
            
            for (let x = 0; x <= 5; x += 0.1) {
                labels.push(x.toFixed(1));
                curveData.push(f(x));
                
                // Rectángulo con altura = promedio
                if (x >= a && x <= b) {
                    rectData.push(promedio);
                } else {
                    rectData.push(null);
                }
            }
            
            // Destruir gráfico anterior
            if (chart) {
                chart.destroy();
            }
            
            // Crear gráfico
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Rectángulo (área = ' + area.toFixed(2) + ')',
                            data: rectData,
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                            borderColor: 'rgba(102, 126, 234, 0.8)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 0,
                            stepped: true
                        },
                        {
                            label: 'f(x) = x',
                            data: curveData,
                            borderColor: '#ef4444',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    scales: {
                        x: {
                            title: { display: true, text: 'x', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const num = parseFloat(label);
                                    return num % 1 === 0 ? num : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            max: 6,
                            title: { display: true, text: 'f(x)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { usePointStyle: true, padding: 15 }
                        }
                    }
                }
            });
        }
        
        // Event listener del slider
        sliderB.addEventListener('input', updateChart);
        
        // Inicializar
        updateChart();
        
        console.log('✅ Gráfico de valor medio iniciado');
    }
    
    // ==========================================
    // 7. TEMA 1.7 - TEOREMA FUNDAMENTAL (Demo)
    // ==========================================
    
    function initTeoremaFundamental() {
        const selector = document.getElementById('selector-funcion');
        const funcionOriginal = document.getElementById('funcion-original');
        const funcionDerivada = document.getElementById('funcion-derivada');
        const funcionIntegrada = document.getElementById('funcion-integrada');
        
        if (!selector || !funcionOriginal || !funcionDerivada || !funcionIntegrada) {
            console.warn('Elementos de teorema fundamental no encontrados');
            return;
        }
        
        const funciones = {
            'x2': {
                original: 'f(x) = x^2',
                derivada: "f'(x) = 2x",
                integrada: '\\int 2x\\,dx = x^2 + C'
            },
            'x3': {
                original: 'f(x) = x^3',
                derivada: "f'(x) = 3x^2",
                integrada: '\\int 3x^2\\,dx = x^3 + C'
            },
            'sinx': {
                original: 'f(x) = \\sin(x)',
                derivada: "f'(x) = \\cos(x)",
                integrada: '\\int \\cos(x)\\,dx = \\sin(x) + C'
            },
            'ex': {
                original: 'f(x) = e^x',
                derivada: "f'(x) = e^x",
                integrada: '\\int e^x\\,dx = e^x + C'
            }
        };
        
        function actualizar() {
            const seleccion = selector.value;
            const datos = funciones[seleccion];
            
            funcionOriginal.innerHTML = `$${datos.original}$`;
            funcionDerivada.innerHTML = `$${datos.derivada}$`;
            funcionIntegrada.innerHTML = `$${datos.integrada}$`;
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([funcionOriginal, funcionDerivada, funcionIntegrada])
                    .catch(err => console.log('MathJax error:', err));
            }
        }
        
        selector.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Demo de teorema fundamental iniciado');
    }
    
    // ==========================================
    // INICIALIZAR MÓDULO UNIDAD 1
    // ==========================================
    
    initDiferencial();
    initErrores();
    initSigma();
    initRiemann();
    initIntegralDefinida();
    initValorMedio();
    initTeoremaFundamental();
    
    console.log('✅ Módulo Unidad 1 cargado');
    
});