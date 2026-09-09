document.addEventListener('DOMContentLoaded', () => {

    // --- 1. TRADUCTOR ---
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
            document.documentElement.lang = language;
        } catch (error) {
            console.error("Error cambiando idioma:", error);
        }
    };

    // Idioma inicial: preferencia guardada > idioma del navegador > español
    const browserLang = (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
    const initialLanguage = localStorage.getItem('selected-language') || browserLang;
    document.documentElement.lang = initialLanguage;
    if (initialLanguage !== 'es') {
        changeLanguage(initialLanguage);
    }
    if (btnSwitchTranslater) btnSwitchTranslater.classList.toggle('active', initialLanguage === 'en');

    if (flagsElement) {
        flagsElement.addEventListener('click', (e) => {
            const flagItem = e.target.closest('.flags_item');
            if (flagItem) {
                const lang = flagItem.dataset.language;
                changeLanguage(lang);
                if (btnSwitchTranslater) btnSwitchTranslater.classList.toggle('active', lang === 'en');
            }
        });
    }

// --- 2. TEMA OSCURO ---
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

// Seguir en vivo el tema del sistema mientras el usuario no haya elegido manualmente
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('dark-mode') === null) {
        document.body.classList.toggle('dark', e.matches);
        if (btnSwitch) btnSwitch.classList.toggle('active', e.matches);
    }
});

    // --- 3. SCROLL ANIMATIONS ---
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
