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
        
        // Función precio: P = 2r³
        const precio = (r) => 2 * Math.pow(r, 3);
        
        // Derivada: P' = 6r²
        const derivadaPrecio = (r) => 6 * Math.pow(r, 2);
        
        // Actualizar valor del slider
        deltaRadio.addEventListener('input', () => {
            deltaRadioValor.textContent = parseFloat(deltaRadio.value).toFixed(2);
        });
        
        // Calcular diferencial
        function calcular() {
            const r = parseFloat(radioInicial.value);
            const dr = parseFloat(deltaRadio.value);
            
            // Precio original
            const P0 = precio(r);
            
            // Cambio aproximado (usando diferencial)
            const dP = derivadaPrecio(r) * dr;
            
            // Cambio real
            const P1 = precio(r + dr);
            const deltaP = P1 - P0;
            
            // Precisión
            const precision = Math.max(0, 100 - Math.abs((dP - deltaP) / deltaP * 100));
            
            // Mostrar resultados
            precioOriginal.textContent = `$${P0.toFixed(2)}`;
            cambioAproximado.textContent = `+$${dP.toFixed(2)}`;
            cambioReal.textContent = `+$${deltaP.toFixed(2)}`;
            
            barraPrecision.style.width = `${precision}%`;
            barraPrecision.textContent = `${precision.toFixed(0)}%`;
            
            // Color de la barra según precisión
            if (precision >= 90) {
                barraPrecision.className = 'progress-bar bg-success';
            } else if (precision >= 70) {
                barraPrecision.className = 'progress-bar bg-warning';
            } else {
                barraPrecision.className = 'progress-bar bg-danger';
            }
        }
        
        btnCalcular.addEventListener('click', calcular);
        radioInicial.addEventListener('change', calcular);
        deltaRadio.addEventListener('input', calcular);
        
        // Calcular inicial
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
            const barData = [];
            
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
    // 7. SMOOTH SCROLL
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
    // 8. MATHJAX RE-RENDER
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
    // INICIALIZAR TODO
    // ==========================================
    
    initHeroCanvas();
    initNavbar();
    initDiferencial();
    initErrores();
    initSigma();
    initRiemann();
    initSmoothScroll();
    initMathJax();
    
    console.log('🎉 Cálculo Integral - Todo iniciado correctamente');
    
});
