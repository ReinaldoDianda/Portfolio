/**
 * ============================================
 * CÁLCULO INTEGRAL - JAVASCRIPT PRINCIPAL
 * Versión: PARTE 1-A (Intuitivo e Interactivo)
 * ============================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando...');
    
    // ==========================================
    // 1. ANIMACIÓN DE PARTÍCULAS (HERO)
    // ==========================================
    
    function initHeroCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) {
            console.warn('Canvas no encontrado');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId = null;
        let mouseX = 0;
        let mouseY = 0;
        
        // Configuración
        const config = {
            particleCount: 80,
            particleMinSize: 2,
            particleMaxSize: 4,
            connectionDistance: 150,
            mouseRadius: 100,
            colors: ['#667eea', '#4facfe', '#a78bfa', '#60a5fa']
        };
        
        // Ajustar tamaño del canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        // Clase Partícula
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * (config.particleMaxSize - config.particleMinSize) + config.particleMinSize;
                this.speedX = (Math.random() - 0.5) * 2;
                this.speedY = (Math.random() - 0.5) * 2;
                this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            }
            
            update() {
                // Movimiento base
                this.x += this.speedX;
                this.y += this.speedY;
                
                // Rebote en bordes
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
                
                // Interacción con mouse
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < config.mouseRadius) {
                    const force = (config.mouseRadius - dist) / config.mouseRadius;
                    this.x -= dx * force * 0.03;
                    this.y -= dy * force * 0.03;
                }
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }
        
        // Inicializar partículas
        function initParticles() {
            particles = [];
            const count = Math.min(config.particleCount, Math.floor((canvas.width * canvas.height) / 15000));
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }
        
        // Dibujar conexiones
        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < config.connectionDistance) {
                        const opacity = (1 - dist / config.connectionDistance) * 0.5;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }
        
        // Loop de animación
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            drawConnections();
            animationId = requestAnimationFrame(animate);
        }
        
        // Event listeners
        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });
        
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                animate();
            }
        });
        
        // Iniciar
        resizeCanvas();
        initParticles();
        animate();
        
        console.log('✅ Canvas de partículas iniciado');
    }
    
    // ==========================================
    // 2. NAVBAR SCROLL EFFECT
    // ==========================================
    
    function initNavbar() {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
        
        // Cerrar menú móvil al hacer click
        const navLinks = document.querySelectorAll('.nav-link');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            });
        });
        
        console.log('✅ Navbar iniciado');
    }
    
    // ==========================================
// 3. TEMA 1.1 - CALCULADORA DE DIFERENCIAL
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
    
    // NUEVA FÓRMULA MÁS INTUITIVA
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
        calcular(); // Calcular automáticamente al mover el slider
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
    // 4. TEMA 1.2 - SIMULADOR DE ERRORES
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
            const scale = r / 15; // 15cm es el tamaño base
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
    // 5. TEMA 1.3 - CONSTRUCTOR DE SUMAS (SIGMA)
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
    // 6. TEMA 1.4 - GRÁFICO DE RIEMANN
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
        const exactArea = 8 / 3; // ∫₀² x² dx = 8/3
        
        let chart = null;
        
        function updateChart(n) {
            n = parseInt(n);
            const deltaX = (b - a) / n;
            
            // Calcular área aproximada (suma derecha)
            let approxArea = 0;
            const rectData = [];
            
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
            
            // Datos para las barras (stepped line)
            const stepLabels = [];
            const stepData = [];
            
            for (let i = 0; i <= n; i++) {
                const x = a + i * deltaX;
                stepLabels.push(x.toFixed(2));
                
                if (i < n) {
                    const xi = a + (i + 1) * deltaX; // Punto derecho
                    stepData.push(f(xi));
                } else {
                    stepData.push(null);
                }
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
                                // Encontrar a qué rectángulo pertenece
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
                    animation: {
                        duration: 300
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'x',
                                font: { weight: 'bold' }
                            },
                            ticks: {
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    const num = parseFloat(label);
                                    return num % 0.5 === 0 ? num : '';
                                },
                                maxRotation: 0
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            title: {
                                display: true,
                                text: 'f(x)',
                                font: { weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false
                        }
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
// 7. TEMA 1.5 - INTEGRAL DEFINIDA (Gráfico)
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
    
    // Función f(x) = x (línea simple para entender)
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
        integralNotacion.innerHTML = `$\\int_${a}^{${b}} x \\, dx$`;
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
// 8. TEMA 1.6 - VALOR MEDIO (Gráfico INTERACTIVO)
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
        
        // Área bajo la curva = integral de x de a hasta b = b²/2 - a²/2
        const area = (b * b / 2) - (a * a / 2);
        
        // Valor promedio = área / (b - a)
        const promedio = b > a ? area / (b - a) : 0;
        
        // Punto c donde f(c) = promedio → c = promedio (porque f(x) = x)
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
            
            // Rectángulo con altura = promedio (solo entre a y b)
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
// 9. TEMA 1.7 - TEOREMA FUNDAMENTAL (Demo)
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
    // 10. SMOOTH SCROLL
    // ==========================================
    
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        console.log('✅ Smooth scroll iniciado');
    }
    
    // ==========================================
    // 11. MATHJAX RE-RENDER
    // ==========================================
    
    function initMathJax() {
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise().then(() => {
                console.log('✅ MathJax renderizado');
            }).catch(err => {
                console.warn('MathJax error:', err);
            });
        }
    }
    // ==========================================
// 12. TEMA 2.1 - SUSTITUCIÓN (Selector)
// ==========================================

function initSustitucion() {
    const selector = document.getElementById('sustitucion-selector');
    const sustU = document.getElementById('sust-u');
    const sustDu = document.getElementById('sust-du');
    const sustIntegral = document.getElementById('sust-integral');
    const sustResultado = document.getElementById('sust-resultado');
    
    if (!selector || !sustU || !sustDu || !sustIntegral || !sustResultado) {
        console.warn('Elementos de sustitución no encontrados');
        return;
    }
    
    const ejemplos = {
        'ex2': {
            u: 'x²',
            du: '2x dx',
            integral: '∫ eᵘ du',
            resultado: 'eˣ² + C'
        },
        'sin': {
            u: 'sin(x)',
            du: 'cos(x) dx',
            integral: '∫ eᵘ du',
            resultado: 'e^{sin(x)} + C'
        },
        'ln': {
            u: 'ln(x)',
            du: '(1/x) dx',
            integral: '∫ u³ du',
            resultado: '(ln x)⁴ / 4 + C'
        },
        'sqrt': {
            u: 'x² + 1',
            du: '2x dx',
            integral: '∫ u^{-1/2} · (1/2) du',
            resultado: '√(x² + 1) + C'
        }
    };
    
    function actualizar() {
        const seleccion = selector.value;
        const datos = ejemplos[seleccion];
        
        sustU.textContent = datos.u;
        sustDu.textContent = datos.du;
        sustIntegral.textContent = datos.integral;
        sustResultado.textContent = datos.resultado;
    }
    
    selector.addEventListener('change', actualizar);
    
    // Inicializar
    actualizar();
    
    console.log('✅ Selector de sustitución iniciado');
}

// ==========================================
// 13. TEMA 2.2 - INTEGRACIÓN POR PARTES (Juego)
// ==========================================

function initPartes() {
    const integralDisplay = document.getElementById('partes-integral');
    const btnUx = document.getElementById('btn-u-x');
    const btnUln = document.getElementById('btn-u-ln');
    const btnDvX = document.getElementById('btn-dv-x');
    const btnDvLn = document.getElementById('btn-dv-ln');
    const feedback = document.getElementById('partes-feedback');
    const btnNueva = document.getElementById('partes-nueva');
    
    if (!integralDisplay || !btnUx || !btnUln || !feedback) {
        console.warn('Elementos de partes no encontrados');
        return;
    }
    
    const problemas = [
        {
            integral: '\\int x \\cdot \\ln(x) \\, dx',
            opciones: { u1: 'x', u2: 'ln(x)', dv1: 'x dx', dv2: 'ln(x) dx' },
            correctoU: 'ln',
            correctoDv: 'x',
            explicacion: '¡Correcto! ln(x) es Logarítmica (L), va primero en LIATE. Elegimos u = ln(x) y dv = x dx'
        },
        {
            integral: '\\int x \\cdot e^x \\, dx',
            opciones: { u1: 'x', u2: 'eˣ', dv1: 'x dx', dv2: 'eˣ dx' },
            correctoU: 'x',
            correctoDv: 'ex',
            explicacion: '¡Correcto! x es Algebraica (A), eˣ es Exponencial (E). La A va primero, así que u = x y dv = eˣ dx'
        },
        {
            integral: '\\int x^2 \\cdot \\sin(x) \\, dx',
            opciones: { u1: 'x²', u2: 'sin(x)', dv1: 'x² dx', dv2: 'sin(x) dx' },
            correctoU: 'x2',
            correctoDv: 'sin',
            explicacion: '¡Correcto! x² es Algebraica (A), sin(x) es Trigonométrica (T). La A va primero en LIATE.'
        }
    ];
    
    let problemaActual = 0;
    let seleccionU = null;
    let seleccionDv = null;
    
    function cargarProblema(index) {
        const prob = problemas[index];
        integralDisplay.innerHTML = `$${prob.integral}$`;
        
        // Actualizar botones según el problema
        if (index === 0) {
            btnUx.textContent = 'x';
            btnUx.dataset.valor = 'x';
            btnUln.textContent = 'ln(x)';
            btnUln.dataset.valor = 'ln';
            btnDvX.textContent = 'x dx';
            btnDvX.dataset.valor = 'x';
            btnDvLn.textContent = 'ln(x) dx';
            btnDvLn.dataset.valor = 'ln';
        } else if (index === 1) {
            btnUx.textContent = 'x';
            btnUx.dataset.valor = 'x';
            btnUln.textContent = 'eˣ';
            btnUln.dataset.valor = 'ex';
            btnDvX.textContent = 'x dx';
            btnDvX.dataset.valor = 'x';
            btnDvLn.textContent = 'eˣ dx';
            btnDvLn.dataset.valor = 'ex';
        } else {
            btnUx.textContent = 'x²';
            btnUx.dataset.valor = 'x2';
            btnUln.textContent = 'sin(x)';
            btnUln.dataset.valor = 'sin';
            btnDvX.textContent = 'x² dx';
            btnDvX.dataset.valor = 'x2';
            btnDvLn.textContent = 'sin(x) dx';
            btnDvLn.dataset.valor = 'sin';
        }
        
        // Resetear estado
        seleccionU = null;
        seleccionDv = null;
        [btnUx, btnUln, btnDvX, btnDvLn].forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        feedback.innerHTML = '<p class="text-muted">👆 Selecciona u y dv para ver si es correcto</p>';
        feedback.classList.remove('success', 'error');
        
        // Re-renderizar MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([integralDisplay]).catch(err => console.log('MathJax error:', err));
        }
    }
    
    function verificarRespuesta() {
        if (seleccionU === null || seleccionDv === null) return;
        
        const prob = problemas[problemaActual];
        const esCorrectoU = seleccionU === prob.correctoU;
        const esCorrectoDv = seleccionDv === prob.correctoDv;
        
        // Marcar botones U
        [btnUx, btnUln].forEach(btn => {
            if (btn.dataset.valor === seleccionU) {
                btn.classList.add(esCorrectoU ? 'correct' : 'incorrect');
            }
        });
        
        // Marcar botones Dv
        [btnDvX, btnDvLn].forEach(btn => {
            if (btn.dataset.valor === seleccionDv) {
                btn.classList.add(esCorrectoDv ? 'correct' : 'incorrect');
            }
        });
        
        if (esCorrectoU && esCorrectoDv) {
            feedback.innerHTML = `<p><i class="fas fa-check-circle me-2"></i>${prob.explicacion}</p>`;
            feedback.classList.remove('error');
            feedback.classList.add('success');
        } else {
            feedback.innerHTML = `<p><i class="fas fa-times-circle me-2"></i>No exactamente. Recuerda LIATE: Logaritmos → Inversas trig → Algebraicas → Trigonométricas → Exponenciales</p>`;
            feedback.classList.remove('success');
            feedback.classList.add('error');
        }
    }
    
    // Event listeners para botones U
    btnUx.addEventListener('click', function() {
        [btnUx, btnUln].forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        this.classList.add('selected');
        seleccionU = this.dataset.valor;
        verificarRespuesta();
    });
    
    btnUln.addEventListener('click', function() {
        [btnUx, btnUln].forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        this.classList.add('selected');
        seleccionU = this.dataset.valor;
        verificarRespuesta();
    });
    
    // Event listeners para botones Dv
    btnDvX.addEventListener('click', function() {
        [btnDvX, btnDvLn].forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        this.classList.add('selected');
        seleccionDv = this.dataset.valor;
        verificarRespuesta();
    });
    
    btnDvLn.addEventListener('click', function() {
        [btnDvX, btnDvLn].forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
        this.classList.add('selected');
        seleccionDv = this.dataset.valor;
        verificarRespuesta();
    });
    
    // Botón nueva integral
    btnNueva.addEventListener('click', function() {
        problemaActual = (problemaActual + 1) % problemas.length;
        cargarProblema(problemaActual);
    });
    
    // Inicializar
    cargarProblema(0);
    
    console.log('✅ Juego de partes iniciado');
}

// ==========================================
// 14. TEMA 2.3 - POTENCIAS SEN/COS (Estrategia)
// ==========================================

function initTrigPotencias() {
    const expSin = document.getElementById('exp-sin');
    const expCos = document.getElementById('exp-cos');
    const expSinValor = document.getElementById('exp-sin-valor');
    const expCosValor = document.getElementById('exp-cos-valor');
    const trigIntegral = document.getElementById('trig-integral');
    const trigEstrategia = document.getElementById('trig-estrategia');
    
    if (!expSin || !expCos || !trigIntegral || !trigEstrategia) {
        console.warn('Elementos de trig potencias no encontrados');
        return;
    }
    
    function actualizar() {
        const n = parseInt(expSin.value);
        const m = parseInt(expCos.value);
        
        expSinValor.textContent = n;
        expCosValor.textContent = m;
        
        // Construir la integral
        let integralStr = '\\int ';
        if (n > 0) integralStr += `\\sin^${n}(x)`;
        if (n > 0 && m > 0) integralStr += ' ';
        if (m > 0) integralStr += `\\cos^${m}(x)`;
        if (n === 0 && m === 0) integralStr += '1';
        integralStr += ' \\, dx';
        
        trigIntegral.innerHTML = `$${integralStr}$`;
        
        // Determinar estrategia
        let estrategiaHTML = '';
        
        if (n === 0 && m === 0) {
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ninguno">
                    <i class="fas fa-equals me-2"></i>Integral trivial
                </div>
                <p class="mt-2 small">$\\int 1 \\, dx = x + C$</p>
            `;
        } else if (n % 2 === 1 && n > 0) {
            // Sin es impar
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-impar">
                    <i class="fas fa-check-circle me-2"></i>Exponente IMPAR en sin
                </div>
                <p class="mt-2 small">Separa un $\\sin(x)$, usa $\\sin^2 = 1 - \\cos^2$, sustituye $u = \\cos(x)$</p>
            `;
        } else if (m % 2 === 1 && m > 0) {
            // Cos es impar
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-impar">
                    <i class="fas fa-check-circle me-2"></i>Exponente IMPAR en cos
                </div>
                <p class="mt-2 small">Separa un $\\cos(x)$, usa $\\cos^2 = 1 - \\sin^2$, sustituye $u = \\sin(x)$</p>
            `;
        } else if (n % 2 === 0 && m % 2 === 0) {
            // Ambos pares
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ambos-par">
                    <i class="fas fa-exclamation-circle me-2"></i>Ambos exponentes PARES
                </div>
                <p class="mt-2 small">Usa fórmulas de ángulo medio: $\\sin^2 x = \\frac{1-\\cos(2x)}{2}$ y $\\cos^2 x = \\frac{1+\\cos(2x)}{2}$</p>
            `;
        }
        
        trigEstrategia.innerHTML = estrategiaHTML;
        
        // Re-renderizar MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([trigIntegral, trigEstrategia]).catch(err => console.log('MathJax error:', err));
        }
    }
    
    expSin.addEventListener('input', actualizar);
    expCos.addEventListener('input', actualizar);
    
    // Inicializar
    actualizar();
    
    console.log('✅ Estrategia trig potencias iniciada');
}

// ==========================================
// 15. TEMA 2.4 - POTENCIAS TAN/SEC (Estrategia)
// ==========================================

function initTanSecPotencias() {
    const expTan = document.getElementById('exp-tan');
    const expSec = document.getElementById('exp-sec');
    const expTanValor = document.getElementById('exp-tan-valor');
    const expSecValor = document.getElementById('exp-sec-valor');
    const tansecIntegral = document.getElementById('tansec-integral');
    const tansecEstrategia = document.getElementById('tansec-estrategia');
    
    if (!expTan || !expSec || !tansecIntegral || !tansecEstrategia) {
        console.warn('Elementos de tan/sec potencias no encontrados');
        return;
    }
    
    function actualizar() {
        const n = parseInt(expTan.value);
        const m = parseInt(expSec.value);
        
        expTanValor.textContent = n;
        expSecValor.textContent = m;
        
        // Construir la integral
        let integralStr = '\\int ';
        if (n > 0) integralStr += `\\tan^${n}(x)`;
        if (n > 0 && m > 0) integralStr += ' ';
        if (m > 0) integralStr += `\\sec^${m}(x)`;
        if (n === 0 && m === 0) integralStr += '1';
        integralStr += ' \\, dx';
        
        tansecIntegral.innerHTML = `$${integralStr}$`;
        
        // Determinar estrategia
        let estrategiaHTML = '';
        
        if (n === 0 && m === 0) {
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ninguno">
                    <i class="fas fa-equals me-2"></i>Integral trivial
                </div>
                <p class="mt-2 small">$\\int 1 \\, dx = x + C$</p>
            `;
        } else if (m >= 2 && m % 2 === 0) {
            // Sec es par (≥2)
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-par">
                    <i class="fas fa-check-circle me-2"></i>sec tiene exponente PAR
                </div>
                <p class="mt-2 small">Guarda $\\sec^2 x$ para el du, convierte el resto a tan usando $\\sec^2 = 1 + \\tan^2$, y usa $u = \\tan x$</p>
            `;
        } else if (n >= 1 && n % 2 === 1) {
            // Tan es impar
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-impar">
                    <i class="fas fa-check-circle me-2"></i>tan tiene exponente IMPAR
                </div>
                <p class="mt-2 small">Guarda $\\sec x \\tan x$ para el du, convierte el resto a sec usando $\\tan^2 = \\sec^2 - 1$, y usa $u = \\sec x$</p>
            `;
        } else if (m === 0 && n > 0 && n % 2 === 0) {
            // Solo tan con exponente par
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ambos-par">
                    <i class="fas fa-exclamation-circle me-2"></i>Solo tan con exponente par
                </div>
                <p class="mt-2 small">Usa $\\tan^2 x = \\sec^2 x - 1$ repetidamente para reducir</p>
            `;
        } else if (n === 0 && m > 0 && m % 2 === 1) {
            // Solo sec con exponente impar
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ambos-par">
                    <i class="fas fa-exclamation-circle me-2"></i>Solo sec con exponente impar
                </div>
                <p class="mt-2 small">Requiere integración por partes o fórmulas de reducción</p>
            `;
        } else {
            estrategiaHTML = `
                <div class="estrategia-badge estrategia-ninguno">
                    <i class="fas fa-question-circle me-2"></i>Caso especial
                </div>
                <p class="mt-2 small">Puede requerir técnicas combinadas o fórmulas de reducción</p>
            `;
        }
        
        tansecEstrategia.innerHTML = estrategiaHTML;
        
        // Re-renderizar MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([tansecIntegral, tansecEstrategia]).catch(err => console.log('MathJax error:', err));
        }
    }
    
    expTan.addEventListener('input', actualizar);
    expSec.addEventListener('input', actualizar);
    
    // Inicializar
    actualizar();
    
    console.log('✅ Estrategia tan/sec potencias iniciada');
}

// ==========================================
// 16. TEMA 2.5 - PRODUCTOS SEN/COS (Gráfico)
// ==========================================

function initProductosSenCos() {
    const freqA = document.getElementById('freq-a');
    const freqB = document.getElementById('freq-b');
    const freqAValor = document.getElementById('freq-a-valor');
    const freqBValor = document.getElementById('freq-b-valor');
    const productoFormula = document.getElementById('producto-formula');
    const sumaFormula = document.getElementById('suma-formula');
    const canvas = document.getElementById('ondasChart');
    
    if (!freqA || !freqB || !canvas) {
        console.warn('Elementos de productos sen/cos no encontrados');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let chart = null;
    
    function actualizar() {
        const a = parseInt(freqA.value);
        const b = parseInt(freqB.value);
        
        freqAValor.textContent = a;
        freqBValor.textContent = b;
        
        // Actualizar fórmulas
        productoFormula.innerHTML = `$\\sin(${a}x)\\cos(${b}x)$`;
        
        const suma = a + b;
        const diff = Math.abs(a - b);
        const signo = a >= b ? '-' : '+';
        sumaFormula.innerHTML = `$\\frac{1}{2}[\\sin(${suma}x) ${a >= b ? '-' : '+'} \\sin(${diff}x)]$`;
        
        // Re-renderizar MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([productoFormula, sumaFormula]).catch(err => console.log('MathJax error:', err));
        }
        
        // Generar datos para el gráfico
        const labels = [];
        const productoData = [];
        const sumaData = [];
        
        for (let x = 0; x <= 2 * Math.PI; x += 0.05) {
            labels.push(x.toFixed(2));
            
            // Producto original
            const producto = Math.sin(a * x) * Math.cos(b * x);
            productoData.push(producto);
            
            // Suma equivalente
            const sumaCalc = 0.5 * (Math.sin((a + b) * x) + Math.sin((a - b) * x));
            sumaData.push(sumaCalc);
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
                        label: `sin(${a}x)·cos(${b}x)`,
                        data: productoData,
                        borderColor: '#667eea',
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.1
                    },
                    {
                        label: 'Fórmula de suma (verificación)',
                        data: sumaData,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        tension: 0.1
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
                                const label = parseFloat(this.getLabelForValue(value));
                                if (Math.abs(label - 0) < 0.1) return '0';
                                if (Math.abs(label - Math.PI) < 0.1) return 'π';
                                if (Math.abs(label - 2 * Math.PI) < 0.1) return '2π';
                                return '';
                            },
                            maxTicksLimit: 5
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        min: -1.2,
                        max: 1.2,
                        title: { display: true, text: 'y', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { usePointStyle: true, padding: 15 }
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }
    
    freqA.addEventListener('input', actualizar);
    freqB.addEventListener('input', actualizar);
    
    // Inicializar
    actualizar();
    
    console.log('✅ Gráfico de productos sen/cos iniciado');
}
    // ==========================================
// INICIALIZAR TODO
// ==========================================

// Unidad 1
initHeroCanvas();
initNavbar();
initDiferencial();
initErrores();
initSigma();
initRiemann();
initIntegralDefinida();
initValorMedio();
initTeoremaFundamental();

// Unidad 2
initSustitucion();
initPartes();
initTrigPotencias();
initTanSecPotencias();
initProductosSenCos();

// General
initSmoothScroll();
initMathJax();

console.log('🎉 Cálculo Integral - Todo iniciado correctamente');
        
        
});
