/* ============================================
   INDEX.JS - Funciones exclusivas de index.html
   Proyecto: Cálculo Integral
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando módulo index...');
    
    // ==========================================
    // 1. ANIMACIÓN DE PARTÍCULAS (HERO)
    // ==========================================
    
    function initHeroCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) {
            console.warn('Canvas no encontrado - no estamos en index.html');
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
    // INICIALIZAR MÓDULO INDEX
    // ==========================================
    
    initHeroCanvas();
    
    console.log('✅ Módulo index cargado');
    
});