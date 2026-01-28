/* ============================================
   UNIDAD3.JS - Funciones de Temas 3.1 - 3.11
   Proyecto: Cálculo Integral
   Universidad de Guayaquil
   
   VERIFICADO MATEMÁTICAMENTE ✓
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando módulo Unidad 3...');
    
    // ==========================================
    // 1. TEMA 3.1 - ÁREA ENTRE CURVAS
    // ==========================================
    
    function initAreaCurvas() {
        const selectF = document.getElementById('area-f');
        const selectG = document.getElementById('area-g');
        const interseccionesSpan = document.getElementById('area-intersecciones');
        const areaValorSpan = document.getElementById('area-valor');
        const canvas = document.getElementById('areaCurvasChart');
        
        if (!selectF || !selectG || !canvas) {
            console.warn('Elementos de área entre curvas no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Definir funciones
        const funciones = {
            'x': (x) => x,
            'sqrt': (x) => Math.sqrt(Math.max(0, x)),
            '2x': (x) => 2 * x,
            '1': (x) => 1,
            'x2': (x) => x * x,
            'x3': (x) => x * x * x,
            '0': (x) => 0
        };
        
        // Datos de intersecciones y áreas precalculados (VERIFICADOS)
        const casos = {
            'x-x2': { a: 0, b: 1, area: 1/6, intersecciones: 'x = 0, x = 1' },
            'x-x3': { a: 0, b: 1, area: 1/4, intersecciones: 'x = 0, x = 1' },  // CORREGIDO: era 1/4 - 1/4
            'x-0': { a: 0, b: 1, area: 0.5, intersecciones: 'x = 0 a x = 1' },
            'sqrt-x2': { a: 0, b: 1, area: 1/3, intersecciones: 'x = 0, x = 1' },
            'sqrt-x3': { a: 0, b: 1, area: 5/12, intersecciones: 'x = 0, x = 1' },
            'sqrt-0': { a: 0, b: 1, area: 2/3, intersecciones: 'x = 0 a x = 1' },
            '2x-x2': { a: 0, b: 2, area: 4/3, intersecciones: 'x = 0, x = 2' },
            '2x-x3': { a: 0, b: 1.414, area: 1, intersecciones: 'x = 0, x ≈ 1.41' },
            '2x-0': { a: 0, b: 1, area: 1, intersecciones: 'x = 0 a x = 1' },
            '1-x2': { a: -1, b: 1, area: 4/3, intersecciones: 'x = -1, x = 1' },
            '1-x3': { a: 0, b: 1, area: 3/4, intersecciones: 'x = 0 a x = 1' },
            '1-0': { a: 0, b: 1, area: 1, intersecciones: 'x = 0 a x = 1' }
        };
        
        function actualizar() {
            const fKey = selectF.value;
            const gKey = selectG.value;
            const casoKey = fKey + '-' + gKey;
            
            const f = funciones[fKey];
            const g = funciones[gKey];
            
            // Obtener datos del caso o usar valores por defecto
            let caso = casos[casoKey];
            if (!caso) {
                caso = { a: 0, b: 1, area: 0, intersecciones: 'Calcular manualmente' };
            }
            
            // Calcular área numéricamente si no está precalculada
            let areaNum = 0;
            const n = 1000;
            const h = (caso.b - caso.a) / n;
            for (let i = 0; i < n; i++) {
                const x = caso.a + i * h;
                const diff = Math.abs(f(x) - g(x));
                areaNum += diff * h;
            }
            
            // Actualizar información
            interseccionesSpan.textContent = caso.intersecciones;
            
            // Mostrar área como fracción si es conocida, o decimal si no
            if (caso.area !== 0 && casos[casoKey]) {
                const fracciones = {
                    [1/6]: '1/6 ≈ 0.167',
                    [1/4]: '1/4 ≈ 0.250',
                    [1/3]: '1/3 ≈ 0.333',
                    [2/3]: '2/3 ≈ 0.667',
                    [4/3]: '4/3 ≈ 1.333',
                    [3/4]: '3/4 ≈ 0.750',
                    [5/12]: '5/12 ≈ 0.417',
                    [0.5]: '1/2 = 0.5',
                    [1]: '1'
                };
                areaValorSpan.textContent = fracciones[caso.area] || areaNum.toFixed(3);
            } else {
                areaValorSpan.textContent = areaNum.toFixed(3);
            }
            
            // Generar datos para el gráfico
            const labels = [];
            const fData = [];
            const gData = [];
            
            const xMin = Math.min(0, caso.a - 0.2);
            const xMax = caso.b + 0.2;
            
            for (let x = xMin; x <= xMax; x += 0.02) {
                labels.push(x.toFixed(2));
                fData.push(f(x));
                gData.push(g(x));
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
                            label: 'Área entre curvas',
                            data: fData.map((y, i) => {
                                const x = parseFloat(labels[i]);
                                if (x >= caso.a && x <= caso.b) {
                                    return y;
                                }
                                return null;
                            }),
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                            borderColor: 'transparent',
                            fill: {
                                target: {
                                    value: 0
                                },
                                above: 'rgba(102, 126, 234, 0.3)'
                            },
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: 'f(x) - superior',
                            data: fData,
                            borderColor: '#ef4444',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: 'g(x) - inferior',
                            data: gData,
                            borderColor: '#3b82f6',
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
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return Number.isInteger(label) || label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
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
        
        selectF.addEventListener('change', actualizar);
        selectG.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Visualizador de área entre curvas iniciado');
    }
    
    // ==========================================
    // 2. TEMA 3.2 - VOLUMEN POR DISCOS
    // ==========================================
    
    function initVolumenDiscos() {
        const selectFuncion = document.getElementById('disco-funcion');
        const sliderA = document.getElementById('disco-a');
        const sliderB = document.getElementById('disco-b');
        const aValor = document.getElementById('disco-a-valor');
        const bValor = document.getElementById('disco-b-valor');
        const volumenSpan = document.getElementById('disco-volumen');
        const canvas = document.getElementById('discoChart');
        
        if (!selectFuncion || !sliderA || !sliderB || !canvas) {
            console.warn('Elementos de volumen por discos no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Definir funciones con sus integrales analíticas (VERIFICADAS)
        // V = π ∫[f(x)]² dx
        const funciones = {
            'x': { 
                f: (x) => x, 
                nombre: 'y = x', 
                // V = π ∫x² dx = π[x³/3] = π(b³-a³)/3
                integral: (a, b) => Math.PI * (Math.pow(b, 3) - Math.pow(a, 3)) / 3 
            },
            'sqrt': { 
                f: (x) => Math.sqrt(Math.max(0, x)), 
                nombre: 'y = √x', 
                // V = π ∫x dx = π[x²/2] = π(b²-a²)/2
                integral: (a, b) => Math.PI * (Math.pow(b, 2) - Math.pow(a, 2)) / 2 
            },
            '1': { 
                f: (x) => 1, 
                nombre: 'y = 1', 
                // V = π ∫1 dx = π(b-a)
                integral: (a, b) => Math.PI * (b - a) 
            },
            'sin': { 
                f: (x) => Math.sin(x), 
                nombre: 'y = sin(x)', 
                // Integración numérica
                integral: null 
            }
        };
        
        function actualizar() {
            const funcKey = selectFuncion.value;
            const a = parseFloat(sliderA.value);
            const b = parseFloat(sliderB.value);
            
            aValor.textContent = a.toFixed(1);
            bValor.textContent = b.toFixed(1);
            
            const func = funciones[funcKey];
            const f = func.f;
            
            // Calcular volumen
            let volumen;
            if (func.integral) {
                volumen = func.integral(a, b);
            } else {
                // Integración numérica: V = π ∫[f(x)]² dx
                volumen = 0;
                const n = 1000;
                const h = (b - a) / n;
                for (let i = 0; i < n; i++) {
                    const x = a + i * h;
                    const fx = f(x);
                    volumen += Math.PI * fx * fx * h;
                }
            }
            
            // Mostrar volumen
            if (funcKey === 'x' && a === 0) {
                const coef = (b * b * b / 3).toFixed(2);
                volumenSpan.textContent = `π·${coef}/3 ≈ ${volumen.toFixed(3)}`;
            } else if (funcKey === '1') {
                volumenSpan.textContent = `π·${(b-a).toFixed(1)} ≈ ${volumen.toFixed(3)}`;
            } else {
                volumenSpan.textContent = volumen.toFixed(3);
            }
            
            // Generar datos para el gráfico
            const labels = [];
            const curveData = [];
            const areaData = [];
            
            for (let x = 0; x <= Math.max(b + 0.5, 3); x += 0.05) {
                labels.push(x.toFixed(2));
                curveData.push(f(x));
                
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
                            label: 'Región a girar',
                            data: areaData,
                            backgroundColor: 'rgba(102, 126, 234, 0.4)',
                            borderColor: 'rgba(102, 126, 234, 0.8)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: func.nombre,
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
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return Number.isInteger(label) ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'y = f(x) = radio', font: { weight: 'bold' } },
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
        
        selectFuncion.addEventListener('change', actualizar);
        sliderA.addEventListener('input', actualizar);
        sliderB.addEventListener('input', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Calculadora de volumen por discos iniciada');
    }
    
    // ==========================================
    // 3. TEMA 3.3 - VOLUMEN POR ARANDELAS
    // ==========================================
    
    function initVolumenArandelas() {
        const selectR = document.getElementById('arandela-R');
        const selectr = document.getElementById('arandela-r');
        const intervaloSpan = document.getElementById('arandela-intervalo');
        const volumenSpan = document.getElementById('arandela-volumen');
        const canvas = document.getElementById('arandelaChart');
        
        if (!selectR || !selectr || !canvas) {
            console.warn('Elementos de volumen por arandelas no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Definir funciones
        const funciones = {
            'x': (x) => x,
            'sqrt': (x) => Math.sqrt(Math.max(0, x)),
            '1': (x) => 1,
            'x2': (x) => x * x,
            'x3': (x) => x * x * x,
            '0': (x) => 0
        };
        
        // Casos precalculados (VERIFICADOS Y CORREGIDOS)
        // V = π ∫[R² - r²] dx
        const casos = {
            'x-x2': { a: 0, b: 1, volumen: 2 * Math.PI / 15 },      // π∫(x²-x⁴)dx = π[x³/3 - x⁵/5] = π(1/3-1/5) = 2π/15
            'x-x3': { a: 0, b: 1, volumen: 4 * Math.PI / 21 },      // CORREGIDO: π∫(x²-x⁶)dx = π[x³/3 - x⁷/7] = π(1/3-1/7) = 4π/21
            'x-0': { a: 0, b: 1, volumen: Math.PI / 3 },            // π∫x²dx = π/3
            'sqrt-x2': { a: 0, b: 1, volumen: 3 * Math.PI / 10 },   // π∫(x-x⁴)dx = π[x²/2 - x⁵/5] = π(1/2-1/5) = 3π/10
            'sqrt-x3': { a: 0, b: 1, volumen: 5 * Math.PI / 14 },   // CORREGIDO: π∫(x-x⁶)dx = π[x²/2 - x⁷/7] = π(1/2-1/7) = 5π/14
            'sqrt-0': { a: 0, b: 1, volumen: Math.PI / 2 },         // π∫x dx = π/2
            '1-x2': { a: 0, b: 1, volumen: 4 * Math.PI / 5 },       // π∫(1-x⁴)dx = π[x - x⁵/5] = π(1-1/5) = 4π/5
            '1-x3': { a: 0, b: 1, volumen: 6 * Math.PI / 7 },       // π∫(1-x⁶)dx = π[x - x⁷/7] = π(1-1/7) = 6π/7
            '1-0': { a: 0, b: 1, volumen: Math.PI }                 // π∫1 dx = π
        };
        
        function actualizar() {
            const RKey = selectR.value;
            const rKey = selectr.value;
            const casoKey = RKey + '-' + rKey;
            
            const R = funciones[RKey];
            const r = funciones[rKey];
            
            // Obtener caso o calcular
            let caso = casos[casoKey];
            let a = 0, b = 1, volumen = 0;
            
            if (caso) {
                a = caso.a;
                b = caso.b;
                volumen = caso.volumen;
            } else {
                // Calcular numéricamente
                const n = 1000;
                const h = (b - a) / n;
                for (let i = 0; i < n; i++) {
                    const x = a + i * h;
                    const Rx = R(x);
                    const rx = r(x);
                    volumen += Math.PI * (Rx * Rx - rx * rx) * h;
                }
            }
            
            // Actualizar información
            intervaloSpan.textContent = `[${a}, ${b}]`;
            
            // Formatear volumen con fracciones
            const volFracciones = {
                [2 * Math.PI / 15]: '2π/15',
                [4 * Math.PI / 21]: '4π/21',
                [Math.PI / 3]: 'π/3',
                [3 * Math.PI / 10]: '3π/10',
                [5 * Math.PI / 14]: '5π/14',
                [Math.PI / 2]: 'π/2',
                [4 * Math.PI / 5]: '4π/5',
                [6 * Math.PI / 7]: '6π/7',
                [Math.PI]: 'π'
            };
            
            const fraccion = volFracciones[volumen];
            volumenSpan.textContent = fraccion ? `${fraccion} ≈ ${volumen.toFixed(3)}` : volumen.toFixed(3);
            
            // Generar datos para el gráfico
            const labels = [];
            const RData = [];
            const rData = [];
            
            for (let x = 0; x <= 1.2; x += 0.02) {
                labels.push(x.toFixed(2));
                RData.push(R(x));
                rData.push(r(x));
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
                            label: 'R(x) - Radio exterior',
                            data: RData,
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                            borderColor: '#667eea',
                            borderWidth: 3,
                            fill: true,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: 'r(x) - Radio interior',
                            data: rData,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: '#f59e0b',
                            borderWidth: 3,
                            fill: true,
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
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Radio', font: { weight: 'bold' } },
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
        
        selectR.addEventListener('change', actualizar);
        selectr.addEventListener('change', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Calculadora de volumen por arandelas iniciada');
    }
    
    // ==========================================
    // 4. TEMA 3.4 - VOLUMEN POR CAPAS CILÍNDRICAS
    // ==========================================
    
    function initVolumenCapas() {
        const selectFuncion = document.getElementById('capa-funcion');
        const sliderB = document.getElementById('capa-b');
        const bValor = document.getElementById('capa-b-valor');
        const formulaSpan = document.getElementById('capa-formula');
        const volumenSpan = document.getElementById('capa-volumen');
        const canvas = document.getElementById('capaChart');
        
        if (!selectFuncion || !sliderB || !canvas) {
            console.warn('Elementos de volumen por capas no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Definir funciones con sus volúmenes analíticos (VERIFICADOS)
        // V = 2π ∫ x·f(x) dx
        const funciones = {
            'x2': { 
                f: (x) => x * x, 
                nombre: 'x²',
                formula: (b) => `$2\\pi \\int_0^{${b}} x \\cdot x^2 \\, dx$`,
                // V = 2π ∫ x³ dx = 2π[x⁴/4] = πb⁴/2
                volumen: (b) => Math.PI * Math.pow(b, 4) / 2
            },
            'x': { 
                f: (x) => x, 
                nombre: 'x',
                formula: (b) => `$2\\pi \\int_0^{${b}} x \\cdot x \\, dx$`,
                // V = 2π ∫ x² dx = 2π[x³/3] = 2πb³/3
                volumen: (b) => 2 * Math.PI * Math.pow(b, 3) / 3
            },
            'sqrt': { 
                f: (x) => Math.sqrt(Math.max(0, x)), 
                nombre: '√x',
                formula: (b) => `$2\\pi \\int_0^{${b}} x \\cdot \\sqrt{x} \\, dx$`,
                // V = 2π ∫ x^(3/2) dx = 2π[2x^(5/2)/5] = 4πb^(5/2)/5
                volumen: (b) => 4 * Math.PI * Math.pow(b, 2.5) / 5
            },
            'sin': { 
                f: (x) => Math.sin(Math.PI * x), 
                nombre: 'sin(πx)',
                formula: (b) => `$2\\pi \\int_0^{${b}} x \\cdot \\sin(\\pi x) \\, dx$`,
                // Integración numérica
                volumen: null
            }
        };
        
        function actualizar() {
            const funcKey = selectFuncion.value;
            const b = parseFloat(sliderB.value);
            
            bValor.textContent = b.toFixed(1);
            
            const func = funciones[funcKey];
            const f = func.f;
            
            // Actualizar fórmula
            formulaSpan.innerHTML = func.formula(b.toFixed(1));
            
            // Calcular volumen
            let volumen;
            if (func.volumen) {
                volumen = func.volumen(b);
            } else {
                // Integración numérica
                volumen = 0;
                const n = 1000;
                const h = b / n;
                for (let i = 0; i < n; i++) {
                    const x = i * h;
                    volumen += 2 * Math.PI * x * f(x) * h;
                }
            }
            
            // Formatear volumen
            if (funcKey === 'x2' && b === 1) {
                volumenSpan.textContent = `π/2 ≈ ${volumen.toFixed(3)}`;
            } else if (funcKey === 'x' && b === 1) {
                volumenSpan.textContent = `2π/3 ≈ ${volumen.toFixed(3)}`;
            } else {
                volumenSpan.textContent = volumen.toFixed(3);
            }
            
            // Re-renderizar MathJax
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                MathJax.typesetPromise([formulaSpan]).catch(err => console.log('MathJax error:', err));
            }
            
            // Generar datos para el gráfico
            const labels = [];
            const curveData = [];
            const areaData = [];
            
            for (let x = 0; x <= Math.max(b + 0.5, 2); x += 0.02) {
                labels.push(x.toFixed(2));
                curveData.push(f(x));
                
                if (x <= b) {
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
                            label: 'Región a girar (alrededor de eje y)',
                            data: areaData,
                            backgroundColor: 'rgba(249, 115, 22, 0.3)',
                            borderColor: 'rgba(249, 115, 22, 0.8)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: `y = ${func.nombre}`,
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
                            title: { display: true, text: 'x (radio de cada capa)', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value, index) {
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'y = f(x) (altura)', font: { weight: 'bold' } },
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
        
        selectFuncion.addEventListener('change', actualizar);
        sliderB.addEventListener('input', actualizar);
        
        // Inicializar
        actualizar();
        
        console.log('✅ Calculadora de volumen por capas cilíndricas iniciada');
    }
    
    // ==========================================
    // 5. TEMA 3.5 - LONGITUD DE ARCO
    // ==========================================
    
    function initLongitudArco() {
        const selectFuncion = document.getElementById('arco-funcion');
        const sliderB = document.getElementById('arco-b');
        const bValor = document.getElementById('arco-b-valor');
        const horizontalSpan = document.getElementById('arco-horizontal');
        const longitudSpan = document.getElementById('arco-longitud');
        const diferenciaSpan = document.getElementById('arco-diferencia');
        const canvas = document.getElementById('arcoChart');
        
        if (!selectFuncion || !sliderB || !canvas) {
            console.warn('Elementos de longitud de arco no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Funciones y sus derivadas (VERIFICADAS)
        // L = ∫√(1 + (dy/dx)²) dx
        const funciones = {
            'x2': { 
                f: (x) => x * x, 
                df: (x) => 2 * x,
                nombre: 'y = x²'
            },
            'sqrt': { 
                f: (x) => Math.sqrt(Math.max(0, x)), 
                df: (x) => x > 0 ? 1 / (2 * Math.sqrt(x)) : 0,
                nombre: 'y = √x'
            },
            'sin': { 
                f: (x) => Math.sin(x), 
                df: (x) => Math.cos(x),
                nombre: 'y = sin(x)'
            },
            'x': { 
                f: (x) => x, 
                df: (x) => 1,
                nombre: 'y = x'
            }
        };
        
        function calcularLongitud(f, df, a, b, n = 1000) {
            const h = (b - a) / n;
            let longitud = 0;
            for (let i = 0; i < n; i++) {
                const x = a + i * h;
                const derivada = df(x);
                longitud += Math.sqrt(1 + derivada * derivada) * h;
            }
            return longitud;
        }
        
        function actualizar() {
            const funcKey = selectFuncion.value;
            const b = parseFloat(sliderB.value);
            const a = 0;
            
            bValor.textContent = b.toFixed(1);
            
            const func = funciones[funcKey];
            const longitud = calcularLongitud(func.f, func.df, a, b);
            const horizontal = b - a;
            const diferencia = ((longitud - horizontal) / horizontal) * 100;
            
            horizontalSpan.textContent = horizontal.toFixed(1);
            longitudSpan.textContent = longitud.toFixed(3);
            diferenciaSpan.textContent = diferencia >= 0 
                ? `+${diferencia.toFixed(1)}% más largo`
                : `${diferencia.toFixed(1)}% más corto`;
            
            // Generar datos para el gráfico
            const labels = [];
            const curveData = [];
            
            for (let x = 0; x <= b + 0.2; x += 0.02) {
                labels.push(x.toFixed(2));
                curveData.push(func.f(x));
            }
            
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: func.nombre,
                        data: curveData,
                        borderColor: '#667eea',
                        borderWidth: 4,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    scales: {
                        x: {
                            title: { display: true, text: 'x', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value) {
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            title: { display: true, text: 'y', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' }
                    }
                }
            });
        }
        
        selectFuncion.addEventListener('change', actualizar);
        sliderB.addEventListener('input', actualizar);
        
        actualizar();
        console.log('✅ Calculadora de longitud de arco iniciada');
    }
    
    // ==========================================
    // 6. TEMA 3.6 - ÁREA DE SUPERFICIE
    // ==========================================
    
    function initAreaSuperficie() {
        const selectFuncion = document.getElementById('superficie-funcion');
        const sliderB = document.getElementById('superficie-b');
        const bValor = document.getElementById('superficie-b-valor');
        const areaSpan = document.getElementById('superficie-area');
        const canvas = document.getElementById('superficieChart');
        
        if (!selectFuncion || !sliderB || !canvas) {
            console.warn('Elementos de área de superficie no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Funciones y derivadas (VERIFICADAS)
        // S = 2π ∫ f(x)·√(1 + (f'(x))²) dx
        const funciones = {
            'x': { 
                f: (x) => x, 
                df: (x) => 1,
                nombre: 'y = x'
            },
            'sqrt': { 
                f: (x) => Math.sqrt(Math.max(0.001, x)), 
                df: (x) => x > 0.001 ? 1 / (2 * Math.sqrt(x)) : 0,
                nombre: 'y = √x'
            },
            '1': { 
                f: (x) => 1, 
                df: (x) => 0,
                nombre: 'y = 1'
            },
            'sin': { 
                f: (x) => Math.sin(x) + 1.1,  // Desplazado para que siempre sea positivo
                df: (x) => Math.cos(x),
                nombre: 'y = sin(x) + 1.1'  // CORREGIDO: nombre coincide con función
            }
        };
        
        function calcularSuperficie(f, df, a, b, n = 1000) {
            const h = (b - a) / n;
            let superficie = 0;
            for (let i = 0; i < n; i++) {
                const x = a + i * h;
                const fx = f(x);
                const derivada = df(x);
                superficie += 2 * Math.PI * fx * Math.sqrt(1 + derivada * derivada) * h;
            }
            return superficie;
        }
        
        function actualizar() {
            const funcKey = selectFuncion.value;
            const b = parseFloat(sliderB.value);
            const a = 0;
            
            bValor.textContent = b.toFixed(1);
            
            const func = funciones[funcKey];
            const superficie = calcularSuperficie(func.f, func.df, a, b);
            
            areaSpan.textContent = superficie.toFixed(2) + ' u²';
            
            const labels = [];
            const curveData = [];
            
            for (let x = 0; x <= b + 0.2; x += 0.02) {
                labels.push(x.toFixed(2));
                curveData.push(func.f(x));
            }
            
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: func.nombre + ' (perfil a girar)',
                        data: curveData,
                        backgroundColor: 'rgba(102, 126, 234, 0.3)',
                        borderColor: '#667eea',
                        borderWidth: 3,
                        fill: true,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    scales: {
                        x: {
                            title: { display: true, text: 'x', font: { weight: 'bold' } },
                            ticks: {
                                callback: function(value) {
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'y = radio', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' }
                    }
                }
            });
        }
        
        selectFuncion.addEventListener('change', actualizar);
        sliderB.addEventListener('input', actualizar);
        
        actualizar();
        console.log('✅ Calculadora de área de superficie iniciada');
    }
    
     // ==========================================
    // 7. TEMA 3.7 - TRABAJO MECÁNICO (CORREGIDO)
    // ==========================================
    
  function initTrabajoMecanico() {
    const sliderK = document.getElementById('trabajo-k');
    const sliderX = document.getElementById('trabajo-x');
    const kValor = document.getElementById('trabajo-k-valor');
    const xValor = document.getElementById('trabajo-x-valor');
    const fuerzaSpan = document.getElementById('trabajo-fuerza');
    const trabajoSpan = document.getElementById('trabajo-w');
    const canvas = document.getElementById('trabajoChart');
    
    if (!sliderK || !sliderX || !canvas) {
        console.warn('Elementos de trabajo mecánico no encontrados');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let chart = null;
    
    function actualizar() {
        const k = parseFloat(sliderK.value);
        const xCm = parseFloat(sliderX.value);
        const xM = xCm / 100;
        
        kValor.textContent = k + ' N/m';
        xValor.textContent = xCm + ' cm';
        
        const fuerzaMax = k * xM;
        const trabajo = 0.5 * k * xM * xM;
        
        fuerzaSpan.textContent = fuerzaMax.toFixed(1) + ' N';
        trabajoSpan.textContent = trabajo.toFixed(2) + ' J';
        
        const numPuntos = 50;
        const labels = [];
        const fuerzaData = [];
        const areaData = [];
        
        for (let i = 0; i <= numPuntos; i++) {
            const xGraficoCm = (xCm / numPuntos) * i;
            const xGraficoM = xGraficoCm / 100;
            
            labels.push(xGraficoCm.toFixed(1));
            fuerzaData.push(k * xGraficoM);
            areaData.push(k * xGraficoM);
        }
        
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Trabajo W = área sombreada',
                        data: areaData,
                        backgroundColor: 'rgba(249, 115, 22, 0.4)',
                        borderColor: 'rgba(249, 115, 22, 0.8)',
                        borderWidth: 2,
                        fill: true,
                        pointRadius: 0,
                        tension: 0
                    },
                    {
                        label: 'F = kx (Ley de Hooke)',
                        data: fuerzaData,
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
                        title: { display: true, text: 'Desplazamiento (cm)', font: { weight: 'bold' } },
                        ticks: {
                            callback: function(value, index) {
                                if (index % 10 === 0) return this.getLabelForValue(value);
                                return '';
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Fuerza F (N)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 15 } }
                }
            }
        });
    }
    
    sliderK.addEventListener('input', actualizar);
    sliderX.addEventListener('input', actualizar);
    
    actualizar();
    console.log('✅ Calculadora de trabajo mecánico iniciada');
}
    
    // ==========================================
    // 8. TEMA 3.8 - PRESIÓN HIDROSTÁTICA (CORREGIDO)
    // ==========================================
    
   function initPresionHidrostatica() {
    const sliderProf = document.getElementById('presion-prof');
    const sliderAlto = document.getElementById('presion-alto');
    const sliderAncho = document.getElementById('presion-ancho');
    const profValor = document.getElementById('presion-prof-valor');
    const altoValor = document.getElementById('presion-alto-valor');
    const anchoValor = document.getElementById('presion-ancho-valor');
    const fuerzaSpan = document.getElementById('presion-fuerza');
    const equivSpan = document.getElementById('presion-equiv');
    const canvas = document.getElementById('presionChart');
    
    if (!sliderProf || !sliderAlto || !sliderAncho || !canvas) {
        console.warn('Elementos de presión hidrostática no encontrados');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let chart = null;
    
    const rho = 1000;
    const g = 9.8;
    
    function actualizar() {
        const profSuperior = parseFloat(sliderProf.value);
        const alto = parseFloat(sliderAlto.value);
        const ancho = parseFloat(sliderAncho.value);
        const profInferior = profSuperior + alto;
        
        profValor.textContent = profSuperior.toFixed(1) + ' m';
        altoValor.textContent = alto.toFixed(1) + ' m';
        anchoValor.textContent = ancho.toFixed(1) + ' m';
        
        const fuerza = rho * g * ancho * (profInferior * profInferior - profSuperior * profSuperior) / 2;
        const toneladas = fuerza / 9800;
        
        fuerzaSpan.textContent = fuerza.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' N';
        equivSpan.textContent = '≈ ' + toneladas.toFixed(1) + ' toneladas';
        
        const profMax = profInferior + 1;
        const numPuntos = 50;
        const labels = [];
        const presionData = [];
        const ventanaData = [];
        
        for (let i = 0; i <= numPuntos; i++) {
            const y = (profMax / numPuntos) * i;
            labels.push(y.toFixed(2));
            
            const presion = rho * g * y / 1000;
            presionData.push(presion);
            
            if (y >= profSuperior && y <= profInferior) {
                ventanaData.push(presion);
            } else {
                ventanaData.push(null);
            }
        }
        
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventana (' + profSuperior.toFixed(1) + 'm - ' + profInferior.toFixed(1) + 'm)',
                        data: ventanaData,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: '#1d4ed8',
                        borderWidth: 3,
                        fill: true,
                        pointRadius: 0,
                        tension: 0
                    },
                    {
                        label: 'Presión P = ρgh',
                        data: presionData,
                        borderColor: '#94a3b8',
                        borderWidth: 2,
                        borderDash: [5, 5],
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
                        title: { display: true, text: 'Profundidad (m)', font: { weight: 'bold' } },
                        ticks: {
                            callback: function(value, index) {
                                if (index % 10 === 0) return parseFloat(this.getLabelForValue(value)).toFixed(1);
                                return '';
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Presión (kPa)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 15 } }
                }
            }
        });
    }
    
    sliderProf.addEventListener('input', actualizar);
    sliderAlto.addEventListener('input', actualizar);
    sliderAncho.addEventListener('input', actualizar);
    
    actualizar();
    console.log('✅ Calculadora de presión hidrostática iniciada');
}
    
    // ==========================================
    // 9. TEMA 3.9 - CENTRO DE MASA
    // ==========================================
    
    function initCentroMasa() {
        const selectFuncion = document.getElementById('cm-funcion');
        const areaSpan = document.getElementById('cm-area');
        const coordsSpan = document.getElementById('cm-coords');
        const canvas = document.getElementById('cmChart');
        
        if (!selectFuncion || !canvas) {
            console.warn('Elementos de centro de masa no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        // Formas con valores precalculados (VERIFICADOS Y CORREGIDOS)
        // x̄ = (1/A) ∫ x·f(x) dx
        // ȳ = (1/A) ∫ [f(x)]²/2 dx
        const formas = {
            'lineal': {
                f: (x) => 1 - x,
                nombre: 'Triángulo: y = 1 - x',
                xMax: 1,
                area: 0.5,      // ∫(1-x)dx = [x - x²/2]₀¹ = 1/2
                xBar: 1/3,      // (1/(1/2))∫x(1-x)dx = 2·[x²/2 - x³/3]₀¹ = 2·(1/2 - 1/3) = 1/3
                yBar: 1/3       // (1/(1/2))∫(1-x)²/2 dx = [x - x² + x³/3]₀¹ = 1/3
            },
            'parabola': {
                f: (x) => 1 - x * x,
                nombre: 'Parábola: y = 1 - x²',
                xMax: 1,
                area: 2/3,      // ∫(1-x²)dx = [x - x³/3]₀¹ = 2/3
                xBar: 3/8,      // (3/2)∫x(1-x²)dx = (3/2)[x²/2 - x⁴/4]₀¹ = (3/2)(1/4) = 3/8
                yBar: 2/5       // (3/2)∫(1-x²)²/2 dx = (3/4)[x - 2x³/3 + x⁵/5]₀¹ = (3/4)(8/15) = 2/5
            },
            'sqrt': {
                f: (x) => Math.sqrt(Math.max(0, 1 - x)),
                nombre: 'Raíz: y = √(1-x)',
                xMax: 1,
                area: 2/3,      // ∫√(1-x)dx = 2/3
                xBar: 2/5,      // CORREGIDO: (3/2)∫x√(1-x)dx = (3/2)·(4/15) = 2/5
                yBar: 3/8       // (3/2)∫(1-x)/2 dx = (3/4)[x - x²/2]₀¹ = (3/4)(1/2) = 3/8
            },
            'constante': {
                f: (x) => 1,
                nombre: 'Rectángulo: y = 1',
                xMax: 1,
                area: 1,        // ∫1 dx = 1
                xBar: 0.5,      // (1/1)∫x dx = x²/2 |₀¹ = 1/2
                yBar: 0.5       // (1/1)∫1/2 dx = 1/2
            }
        };
        
        function actualizar() {
            const formaKey = selectFuncion.value;
            const forma = formas[formaKey];
            
            areaSpan.textContent = forma.area.toFixed(3) + ' u²';
            coordsSpan.textContent = `(${forma.xBar.toFixed(3)}, ${forma.yBar.toFixed(3)})`;
            
            // Generar datos para el gráfico
            const labels = [];
            const curveData = [];
            
            for (let x = 0; x <= forma.xMax + 0.1; x += 0.02) {
                labels.push(x.toFixed(2));
                if (x <= forma.xMax) {
                    curveData.push(forma.f(x));
                } else {
                    curveData.push(null);
                }
            }
            
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: forma.nombre,
                            data: curveData,
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                            borderColor: '#667eea',
                            borderWidth: 3,
                            fill: true,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: 'Centro de masa',
                            data: labels.map((l, i) => {
                                const x = parseFloat(l);
                                // Mostrar punto solo cerca del centro de masa
                                if (Math.abs(x - forma.xBar) < 0.03) {
                                    return forma.yBar;
                                }
                                return null;
                            }),
                            borderColor: '#ef4444',
                            backgroundColor: '#ef4444',
                            pointRadius: 10,
                            pointStyle: 'crossRot',
                            showLine: false
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
                                callback: function(value) {
                                    const label = parseFloat(this.getLabelForValue(value));
                                    return label % 0.5 === 0 ? label : '';
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            max: 1.2,
                            title: { display: true, text: 'y', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' }
                    }
                }
            });
        }
        
        selectFuncion.addEventListener('change', actualizar);
        actualizar();
        
        console.log('✅ Calculadora de centro de masa iniciada');
    }
    
     // ==========================================
    // 10. TEMA 3.10 - MOMENTOS DE INERCIA (MEJORADO)
    // ==========================================
    
    function initMomentoInercia() {
    const selectForma = document.getElementById('inercia-forma');
    const selectEje = document.getElementById('inercia-eje');
    const areaSpan = document.getElementById('inercia-area');
    const inerciaSpan = document.getElementById('inercia-I');
    const canvas = document.getElementById('inerciaChart');
    
    if (!selectForma || !selectEje || !canvas) {
        console.warn('Elementos de momento de inercia no encontrados');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let chart = null;
    
    const formas = {
        'rectangulo': { f: (x) => 1, nombre: 'Rectángulo', xMax: 1, area: 1, Iy: 1/3, Ix: 1/3 },
        'triangulo': { f: (x) => 1 - x, nombre: 'Triángulo', xMax: 1, area: 0.5, Iy: 1/12, Ix: 1/12 },
        'parabola': { f: (x) => 1 - x * x, nombre: 'Parábola', xMax: 1, area: 2/3, Iy: 2/15, Ix: 16/105 }
    };
    
    function actualizar() {
        const formaKey = selectForma.value;
        const ejeKey = selectEje.value;
        const forma = formas[formaKey];
        
        const I = ejeKey === 'y' ? forma.Iy : forma.Ix;
        
        areaSpan.textContent = forma.area.toFixed(3) + ' u²';
        inerciaSpan.textContent = I.toFixed(4) + ' u⁴';
        
        const labels = [];
        const curveData = [];
        const numPuntos = 50;
        
        for (let i = 0; i <= numPuntos; i++) {
            const x = (forma.xMax / numPuntos) * i;
            labels.push(x.toFixed(2));
            curveData.push(forma.f(x));
        }
        
        if (chart) chart.destroy();
        
        const ejeColor = ejeKey === 'y' ? '#8b5cf6' : '#f59e0b';
        const ejeNombre = ejeKey === 'y' ? 'Eje Y (rotación)' : 'Eje X (rotación)';
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: forma.nombre,
                        data: curveData,
                        backgroundColor: 'rgba(102, 126, 234, 0.3)',
                        borderColor: '#667eea',
                        borderWidth: 3,
                        fill: true,
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
                        title: { display: true, text: 'x', font: { weight: 'bold', color: ejeKey === 'y' ? ejeColor : '#666' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 1.2,
                        title: { display: true, text: 'y', font: { weight: 'bold', color: ejeKey === 'x' ? ejeColor : '#666' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Eje de rotación: ' + ejeNombre, color: ejeColor, font: { size: 14, weight: 'bold' } }
                }
            }
        });
    }
    
    selectForma.addEventListener('change', actualizar);
    selectEje.addEventListener('change', actualizar);
    actualizar();
    
    console.log('✅ Calculadora de momento de inercia iniciada');
}
    
    // ==========================================
    // 11. TEMA 3.11 - APLICACIONES EN ECONOMÍA
    // ==========================================
    
    function initEconomia() {
        const sliderA = document.getElementById('eco-a');
        const sliderB = document.getElementById('eco-b');
        const sliderC = document.getElementById('eco-c');
        const sliderD = document.getElementById('eco-d');
        const aValor = document.getElementById('eco-a-valor');
        const bValor = document.getElementById('eco-b-valor');
        const cValor = document.getElementById('eco-c-valor');
        const dValor = document.getElementById('eco-d-valor');
        const equilibrioSpan = document.getElementById('eco-equilibrio');
        const ecSpan = document.getElementById('eco-EC');
        const epSpan = document.getElementById('eco-EP');
        const canvas = document.getElementById('economiaChart');
        
        if (!sliderA || !sliderB || !sliderC || !sliderD || !canvas) {
            console.warn('Elementos de economía no encontrados');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let chart = null;
        
        function actualizar() {
            const a = parseFloat(sliderA.value);
            const b = parseFloat(sliderB.value);
            const c = parseFloat(sliderC.value);
            const d = parseFloat(sliderD.value);
            
            aValor.textContent = a;
            bValor.textContent = b;
            cValor.textContent = c;
            dValor.textContent = d;
            
            // Curva de demanda: D(q) = a - b·q
            // Curva de oferta: S(q) = c + d·q
            // Equilibrio: a - b·q = c + d·q → q₀ = (a - c) / (b + d)
            
            const q0 = (a - c) / (b + d);
            const p0 = a - b * q0;
            
            // Verificar que el equilibrio sea válido
            if (q0 <= 0 || p0 <= 0) {
                equilibrioSpan.textContent = 'No hay equilibrio válido';
                ecSpan.textContent = '-';
                epSpan.textContent = '-';
                return;
            }
            
            // Excedente del consumidor (VERIFICADO):
            // EC = ∫₀^q₀ (D(q) - p₀) dq = ∫₀^q₀ (a - bq - p₀) dq
            // Como p₀ = a - bq₀, entonces a - p₀ = bq₀
            // EC = ∫₀^q₀ (bq₀ - bq) dq = b[q₀·q - q²/2]₀^q₀ = b(q₀² - q₀²/2) = bq₀²/2
            const EC = (b * q0 * q0) / 2;
            
            // Excedente del productor (VERIFICADO):
            // EP = ∫₀^q₀ (p₀ - S(q)) dq = ∫₀^q₀ (p₀ - c - dq) dq
            // Como p₀ = c + dq₀, entonces p₀ - c = dq₀
            // EP = ∫₀^q₀ (dq₀ - dq) dq = d[q₀·q - q²/2]₀^q₀ = d(q₀² - q₀²/2) = dq₀²/2
            const EP = (d * q0 * q0) / 2;
            
            equilibrioSpan.textContent = `(${q0.toFixed(2)}, $${p0.toFixed(2)})`;
            ecSpan.textContent = `$${EC.toFixed(2)}`;
            epSpan.textContent = `$${EP.toFixed(2)}`;
            
            // Generar datos para el gráfico
            const qMax = Math.min(a / b, 15);
            const labels = [];
            const demandaData = [];
            const ofertaData = [];
            const ecArea = [];
            const epArea = [];
            
            for (let q = 0; q <= qMax; q += 0.2) {
                labels.push(q.toFixed(1));
                const D = Math.max(0, a - b * q);
                const S = c + d * q;
                
                demandaData.push(D);
                ofertaData.push(S);
                
                // Áreas de excedentes (solo hasta q₀)
                if (q <= q0) {
                    ecArea.push(D);
                    epArea.push(S);
                } else {
                    ecArea.push(null);
                    epArea.push(null);
                }
            }
            
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Excedente consumidor',
                            data: ecArea,
                            backgroundColor: 'rgba(34, 197, 94, 0.3)',
                            borderColor: 'transparent',
                            fill: {
                                target: { value: p0 },
                                above: 'rgba(34, 197, 94, 0.3)'
                            },
                            pointRadius: 0,
                            tension: 0
                        },
                        {
                            label: 'Excedente productor',
                            data: epArea,
                            backgroundColor: 'rgba(59, 130, 246, 0.3)',
                            borderColor: 'transparent',
                            fill: {
                                target: { value: p0 },
                                below: 'rgba(59, 130, 246, 0.3)'
                            },
                            pointRadius: 0,
                            tension: 0
                        },
                        {
                            label: 'Demanda: D(q) = ' + a + ' - ' + b + 'q',
                            data: demandaData,
                            borderColor: '#22c55e',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0
                        },
                        {
                            label: 'Oferta: S(q) = ' + c + ' + ' + d + 'q',
                            data: ofertaData,
                            borderColor: '#3b82f6',
                            borderWidth: 3,
                            fill: false,
                            pointRadius: 0,
                            tension: 0
                        },
                        {
                            label: `Precio equilibrio: $${p0.toFixed(2)}`,
                            data: labels.map(() => p0),
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [5, 5],
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
                            title: { display: true, text: 'Cantidad (q)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Precio ($)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top',
                            labels: { 
                                usePointStyle: true,
                                padding: 10,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }
        
        sliderA.addEventListener('input', actualizar);
        sliderB.addEventListener('input', actualizar);
        sliderC.addEventListener('input', actualizar);
        sliderD.addEventListener('input', actualizar);
        
        actualizar();
        console.log('✅ Calculadora de excedentes económicos iniciada');
    }
    
    // ==========================================
    // INICIALIZAR MÓDULO UNIDAD 3
    // ==========================================
    
    // Parte 3-A (Temas 3.1 - 3.4)
    initAreaCurvas();
    initVolumenDiscos();
    initVolumenArandelas();
    initVolumenCapas();
    
    // Parte 3-B (Temas 3.5 - 3.8)
    initLongitudArco();
    initAreaSuperficie();
    initTrabajoMecanico();
    initPresionHidrostatica();
    
    // Parte 3-C (Temas 3.9 - 3.11)
    initCentroMasa();
    initMomentoInercia();
    initEconomia();
    
    console.log('✅ Módulo Unidad 3 completo - 11 temas cargados');
    
});