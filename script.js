document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MENÚ HAMBURGUESA ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        navLinks.forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }));
    }

    // --- 2. TRADUCTOR ---
    const flagsElement = document.getElementById("flags");
    const textsToChange = document.querySelectorAll("[data-section]");
    const btnSwitchTranslater = document.querySelector('#switch-translater');

    const changeLanguage = async (language) => {
        try {
            if (!language) return;
            const requestJson = await fetch(`./languages/${language}.json`);
            if (!requestJson.ok) throw new Error("No se pudo cargar el archivo de idioma");
            const texts = await requestJson.json();

            textsToChange.forEach((textToChange) => {
                const section = textToChange.dataset.section;
                const value = textToChange.dataset.value;
                if (texts[section] && texts[section][value]) {
                    textToChange.innerHTML = texts[section][value];
                }
            });

            localStorage.setItem('selected-language', language);
        } catch (error) {
            console.error("Error cambiando idioma:", error);
        }
    };

    // Aplicar idioma guardado al cargar
    const savedLanguage = localStorage.getItem('selected-language');
    if (savedLanguage && savedLanguage !== 'es') {
        changeLanguage(savedLanguage);
        if (btnSwitchTranslater) btnSwitchTranslater.classList.add('active');
    }

    if (flagsElement) {
        flagsElement.addEventListener('click', (e) => {
            const flagItem = e.target.closest('.flags_item');
            if (flagItem) {
                changeLanguage(flagItem.dataset.language);
                if (btnSwitchTranslater) btnSwitchTranslater.classList.toggle('active');
            }
        });
    }

// --- 3. TEMA OSCURO ---
const btnSwitch = document.querySelector('#switch');

const savedMode = localStorage.getItem('dark-mode');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const shouldBeDark = savedMode !== null ? savedMode === 'true' : systemDark;

if (shouldBeDark) {
    document.body.classList.add('dark');
    if (btnSwitch) btnSwitch.classList.add('active');
}

if (btnSwitch) {
    btnSwitch.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        btnSwitch.classList.toggle('active');
        localStorage.setItem('dark-mode', document.body.classList.contains('dark') ? 'true' : 'false');
    });
}

    // --- 4. SCROLL ANIMATIONS ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Solo anima una vez
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => observer.observe(el));

});
