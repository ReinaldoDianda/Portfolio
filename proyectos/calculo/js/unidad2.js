/* ============================================
   UNIDAD2.JS - Funciones de Temas 2.1 - 2.15
   Proyecto: Cálculo Integral
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando módulo Unidad 2...');
    
    // ==========================================
    // 1. TEMA 2.1 - SUSTITUCIÓN (Selector)
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
    // 2. TEMA 2.2 - INTEGRACIÓN POR PARTES (Juego)
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
    // 3. TEMA 2.3 - POTENCIAS SEN/COS (Estrategia)
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
    // 4. TEMA 2.4 - POTENCIAS TAN/SEC (Estrategia)
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
    // 5. TEMA 2.5 - PRODUCTOS SEN/COS (Gráfico)
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
            const diff = a - b;  // Puede ser negativo
            // Si diff es negativo, sin(diff*x) = -sin(|diff|*x), entonces el signo cambia
            const diffAbs = Math.abs(diff);
            const signo = diff >= 0 ? '+' : '-';
            sumaFormula.innerHTML = `$\\frac{1}{2}[\\sin(${suma}x) ${signo} \\sin(${diffAbs}x)]$`;
            
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
    // 6. TEMA 2.6 - FUNCIONES HIPERBÓLICAS (Gráfico)
    // ==========================================
    
    function initHiperbolicas() {
        const selector = document.getElementById('hiper-funcion');
        const trigDesc = document.getElementById('hiper-trig-desc');
        const hiperDesc = document.getElementById('hiper-hiper-desc');
        const canvas = document.getElementById('hiperbolicasChart');
        
        if (!selector || !canvas) {
            console.warn('Elementos de hiperbólicas no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        const descripciones = {
            'sin-sinh': {
                trig: 'Oscila entre -1 y 1, periódica',
                hiper: 'Crece sin límite, no es periódica'
            },
            'cos-cosh': {
                trig: 'Oscila entre -1 y 1, periódica',
                hiper: 'Siempre ≥ 1, forma de catenaria'
            },
            'tan-tanh': {
                trig: 'Tiene asíntotas, va de -∞ a +∞',
                hiper: 'Acotada entre -1 y 1, suave'
            }
        };
        
        function actualizar() {
            const seleccion = selector.value;
            const desc = descripciones[seleccion];
            
            trigDesc.textContent = desc.trig;
            hiperDesc.textContent = desc.hiper;
            
            // Generar datos
            const labels = [];
            const trigData = [];
            const hiperData = [];
            
            const xMin = -3;
            const xMax = 3;
            const step = 0.1;
            
            for (let x = xMin; x <= xMax; x += step) {
                labels.push(x.toFixed(1));
                
                if (seleccion === 'sin-sinh') {
                    trigData.push(Math.sin(x));
                    hiperData.push(Math.sinh(x));
                } else if (seleccion === 'cos-cosh') {
                    trigData.push(Math.cos(x));
                    hiperData.push(Math.cosh(x));
                } else if (seleccion === 'tan-tanh') {
                    // Limitar tan para evitar infinitos
                    const tanVal = Math.tan(x);
                    trigData.push(Math.abs(tanVal) > 10 ? null : tanVal);
                    hiperData.push(Math.tanh(x));
                }
            }
            
            // Nombres para la leyenda
            const nombres = {
                'sin-sinh': { trig: 'sin(x)', hiper: 'sinh(x)' },
                'cos-cosh': { trig: 'cos(x)', hiper: 'cosh(x)' },
                'tan-tanh': { trig: 'tan(x)', hiper: 'tanh(x)' }
            };
            
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
                            label: nombres[seleccion].trig + ' (trigonométrica)',
                            data: trigData,
                            borderColor: '#667eea',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0.1
                        },
                        {
                            label: nombres[seleccion].hiper + ' (hiperbólica)',
                            data: hiperData,
                            borderColor: '#f59e0b',
                            borderWidth: 3,
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
                                    return Number.isInteger(label) ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            min: seleccion === 'tan-tanh' ? -2 : -5,
                            max: seleccion === 'tan-tanh' ? 2 : 10,
                            title: { display: true, text: 'y', font: { weight: 'bold' } },
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
        
        selector.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Gráfico de hiperbólicas iniciado');
    }
    
    // ==========================================
    // 7. TEMA 2.7 - SUSTITUCIÓN TRIGONOMÉTRICA
    // ==========================================
    
    function initTrigSub() {
        const tipoSelector = document.getElementById('trigsub-tipo');
        const aInput = document.getElementById('trigsub-a');
        const expresionDiv = document.getElementById('trigsub-expresion');
        const sustitucionDiv = document.getElementById('trigsub-sustitucion');
        
        if (!tipoSelector || !aInput || !expresionDiv || !sustitucionDiv) {
            console.warn('Elementos de sustitución trigonométrica no encontrados');
            return;
        }
        
        const casos = {
            'a2-x2': {
                expresion: (a) => `\\sqrt{${a*a} - x^2}`,
                sustitucion: (a) => `x = ${a}\\sin\\theta`,
                dx: (a) => `dx = ${a}\\cos\\theta \\, d\\theta`,
                simplifica: (a) => `${a}\\cos\\theta`
            },
            'a2+x2': {
                expresion: (a) => `\\sqrt{${a*a} + x^2}`,
                sustitucion: (a) => `x = ${a}\\tan\\theta`,
                dx: (a) => `dx = ${a}\\sec^2\\theta \\, d\\theta`,
                simplifica: (a) => `${a}\\sec\\theta`
            },
            'x2-a2': {
                expresion: (a) => `\\sqrt{x^2 - ${a*a}}`,
                sustitucion: (a) => `x = ${a}\\sec\\theta`,
                dx: (a) => `dx = ${a}\\sec\\theta\\tan\\theta \\, d\\theta`,
                simplifica: (a) => `${a}\\tan\\theta`
            }
        };
        
        function actualizar() {
            const tipo = tipoSelector.value;
            const a = parseInt(aInput.value) || 3;
            const caso = casos[tipo];
            
            expresionDiv.innerHTML = `$${caso.expresion(a)}$`;
            sustitucionDiv.innerHTML = `
                <div class="sust-principal">Sustituye: $${caso.sustitucion(a)}$</div>
                <div class="sust-dx">Entonces: $${caso.dx(a)}$</div>
                <div class="sust-simplifica">La raíz se convierte en: $${caso.simplifica(a)}$</div>
            `;
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([expresionDiv, sustitucionDiv])
                    .catch(err => console.log('MathJax error:', err));
            }
        }
        
        tipoSelector.addEventListener('change', actualizar);
        aInput.addEventListener('input', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Selector de sustitución trigonométrica iniciado');
    }
    
    // ==========================================
    // 8. TEMA 2.8 - FRACCIONES PARCIALES
    // ==========================================
    
    function initFraccionesParciales() {
        const selector = document.getElementById('fp-selector');
        const originalDiv = document.getElementById('fp-original');
        const factorizadoDiv = document.getElementById('fp-factorizado');
        const descompuestoDiv = document.getElementById('fp-descompuesto');
        
        if (!selector || !originalDiv || !factorizadoDiv || !descompuestoDiv) {
            console.warn('Elementos de fracciones parciales no encontrados');
            return;
        }
        
        const casos = {
            'caso1': {
                original: '\\frac{1}{x^2-1}',
                factorizado: '\\frac{1}{(x-1)(x+1)}',
                descompuesto: '\\frac{1/2}{x-1} - \\frac{1/2}{x+1}'
            },
            'caso2': {
                original: '\\frac{x}{(x-1)^2}',
                factorizado: '\\frac{x}{(x-1)^2}',
                descompuesto: '\\frac{1}{x-1} + \\frac{1}{(x-1)^2}'
            },
            'caso3': {
                original: '\\frac{1}{x(x^2+1)}',
                factorizado: '\\frac{1}{x(x^2+1)}',
                descompuesto: '\\frac{1}{x} - \\frac{x}{x^2+1}'
            }
        };
        
        function actualizar() {
            const seleccion = selector.value;
            const caso = casos[seleccion];
            
            originalDiv.innerHTML = `$${caso.original}$`;
            factorizadoDiv.innerHTML = `$${caso.factorizado}$`;
            descompuestoDiv.innerHTML = `$${caso.descompuesto}$`;
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([originalDiv, factorizadoDiv, descompuestoDiv])
                    .catch(err => console.log('MathJax error:', err));
            }
        }
        
        selector.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Descomponedor de fracciones parciales iniciado');
    }
    
    // ==========================================
    // 9. TEMA 2.9 - SUSTITUCIÓN DE WEIERSTRASS
    // ==========================================
    
    function initWeierstrass() {
        const xSlider = document.getElementById('weier-x');
        const xValor = document.getElementById('weier-x-valor');
        const xRad = document.getElementById('weier-x-rad');
        const tValor = document.getElementById('weier-t');
        const sinDirecto = document.getElementById('weier-sin-directo');
        const sinFormula = document.getElementById('weier-sin-formula');
        const cosDirecto = document.getElementById('weier-cos-directo');
        const cosFormula = document.getElementById('weier-cos-formula');
        
        if (!xSlider || !xValor || !tValor) {
            console.warn('Elementos de Weierstrass no encontrados');
            return;
        }
        
        function actualizar() {
            const xDeg = parseInt(xSlider.value);
            const xRadians = xDeg * Math.PI / 180;
            
            // Mostrar valores de x
            xValor.textContent = xDeg + '°';
            
            // Mostrar x en radianes como fracción de π
            if (xDeg === 0) {
                xRad.textContent = '0';
            } else if (xDeg === 30) {
                xRad.textContent = 'π/6';
            } else if (xDeg === 45) {
                xRad.textContent = 'π/4';
            } else if (xDeg === 60) {
                xRad.textContent = 'π/3';
            } else if (xDeg === 90) {
                xRad.textContent = 'π/2';
            } else if (xDeg === 120) {
                xRad.textContent = '2π/3';
            } else if (xDeg === 135) {
                xRad.textContent = '3π/4';
            } else if (xDeg === 150) {
                xRad.textContent = '5π/6';
            } else if (xDeg === 180) {
                xRad.textContent = 'π';
            } else {
                xRad.textContent = (xRadians).toFixed(3);
            }
            
            // Calcular t = tan(x/2)
            const t = Math.tan(xRadians / 2);
            
            // Calcular sin y cos directo
            const sinDirect = Math.sin(xRadians);
            const cosDirect = Math.cos(xRadians);
            
            // Calcular sin y cos con fórmula de Weierstrass
            const sinWeier = (2 * t) / (1 + t * t);
            const cosWeier = (1 - t * t) / (1 + t * t);
            
            // Mostrar valores (manejar infinitos cerca de 180°)
            if (xDeg >= 170) {
                tValor.textContent = '→ ∞';
                sinFormula.textContent = sinDirect.toFixed(3);
                cosFormula.textContent = cosDirect.toFixed(3);
            } else {
                tValor.textContent = t.toFixed(3);
                sinFormula.textContent = sinWeier.toFixed(3);
                cosFormula.textContent = cosWeier.toFixed(3);
            }
            
            sinDirecto.textContent = sinDirect.toFixed(3);
            cosDirecto.textContent = cosDirect.toFixed(3);
        }
        
        xSlider.addEventListener('input', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Calculadora de Weierstrass iniciada');
    }
    
    // ==========================================
    // 10. TEMA 2.10 - RACIONALIZACIÓN
    // ==========================================
    
    function initRacionalizacion() {
        const tipoSelector = document.getElementById('racion-tipo');
        const sustDiv = document.getElementById('racion-sust');
        const xDiv = document.getElementById('racion-x');
        const dxDiv = document.getElementById('racion-dx');
        const notaDiv = document.getElementById('racion-nota');
        
        if (!tipoSelector || !sustDiv || !xDiv || !dxDiv) {
            console.warn('Elementos de racionalización no encontrados');
            return;
        }
        
        const casos = {
            'sqrt': {
                sust: 'u = \\sqrt{x}',
                x: 'x = u^2',
                dx: 'dx = 2u \\, du',
                nota: 'La raíz cuadrada desaparece completamente'
            },
            'cbrt': {
                sust: 'u = \\sqrt[3]{x}',
                x: 'x = u^3',
                dx: 'dx = 3u^2 \\, du',
                nota: 'La raíz cúbica desaparece completamente'
            },
            'sqrt-lin': {
                sust: 'u = \\sqrt{2x + 1}',
                x: 'x = \\frac{u^2 - 1}{2}',
                dx: 'dx = u \\, du',
                nota: 'La raíz de la expresión lineal desaparece'
            },
            'multi': {
                sust: 'u = \\sqrt[6]{x}',
                x: 'x = u^6',
                dx: 'dx = 6u^5 \\, du',
                nota: 'Usa el MCM de los índices (2 y 3 → 6) para eliminar ambas raíces'
            }
        };
        
        function actualizar() {
            const tipo = tipoSelector.value;
            const caso = casos[tipo];
            
            sustDiv.innerHTML = `$${caso.sust}$`;
            xDiv.innerHTML = `$${caso.x}$`;
            dxDiv.innerHTML = `$${caso.dx}$`;
            notaDiv.innerHTML = `<i class="fas fa-info-circle me-2"></i>${caso.nota}`;
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([sustDiv, xDiv, dxDiv])
                    .catch(err => console.log('MathJax error:', err));
            }
        }
        
        tipoSelector.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Generador de racionalización iniciado');
    }
    // ==========================================
    // INICIALIZAR MÓDULO UNIDAD 2
    // ==========================================
    
    // Parte 2-A (Temas 2.1 - 2.5)
    initSustitucion();
    initPartes();
    initTrigPotencias();
    initTanSecPotencias();
    initProductosSenCos();
    
    // Parte 2-B (Temas 2.6 - 2.10)
    initHiperbolicas();
    initTrigSub();
    initFraccionesParciales();
    initWeierstrass();
    initRacionalizacion();
    
    console.log('✅ Módulo Unidad 2 cargado');
    
});