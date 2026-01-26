/* ============================================
   COMMON.JS - Funciones compartidas
   Proyecto: Cálculo Integral
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Cálculo Integral - Iniciando módulo común...');
    
    // ==========================================
    // 1. NAVBAR SCROLL EFFECT
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
    // 2. SMOOTH SCROLL
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
    // 3. MATHJAX RE-RENDER
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
    // INICIALIZAR MÓDULO COMÚN
    // ==========================================
    
    initNavbar();
    initSmoothScroll();
    initMathJax();
    
    console.log('✅ Módulo común cargado');
    
});