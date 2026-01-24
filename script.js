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

    // --- 2. TRADUCTOR (Mejorado con manejo de errores y seguridad) ---
    const flagsElement = document.getElementById("flags");
    const textsToChange = document.querySelectorAll("[data-section]");
    const btnSwitchTranslater = document.querySelector('#switch-translater');

    const changeLanguage = async (language) => {
        try {
            // Verificamos que el idioma sea válido antes de hacer el fetch
            if (!language) return;

            const requestJson = await fetch(`./languages/${language}.json`);
            
            // Verificamos si la carga del archivo fue exitosa
            if (!requestJson.ok) throw new Error("No se pudo cargar el archivo de idioma");

            const texts = await requestJson.json();

            textsToChange.forEach((textToChange) => {
                const section = textToChange.dataset.section;
                const value = textToChange.dataset.value;

                // Verificamos que la traducción exista para evitar errores en consola
                if (texts[section] && texts[section][value]) {
                    textToChange.innerHTML = texts[section][value];
                }
            });

            // Opcional: Guardar preferencia en el navegador
            localStorage.setItem('selected-language', language);

        } catch (error) {
            console.error("Error cambiando idioma:", error);
        }
    };

    if (flagsElement) {
        flagsElement.addEventListener('click', (e) => {
            // USO DE CLOSEST: Esto arregla un bug común.
            // Si hacías click justo en el borde del div o en la imagen,
            // 'parentElement' podía fallar. 'closest' busca el elemento correcto hacia arriba.
            const flagItem = e.target.closest('.flags_item');

            if (flagItem) {
                changeLanguage(flagItem.dataset.language);
                if (btnSwitchTranslater) btnSwitchTranslater.classList.toggle('active');
            }
        });
    }

    // --- 3. TEMA OSCURO (Con memoria - LocalStorage) ---
    const btnSwitch = document.querySelector('#switch');

    // Revisar si el usuario ya tenía el modo oscuro activado anteriormente
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark');
        if (btnSwitch) btnSwitch.classList.add('active');
    }

    if (btnSwitch) {
        btnSwitch.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            btnSwitch.classList.toggle('active');

            // Guardamos la decisión del usuario
            if (document.body.classList.contains('dark')) {
                localStorage.setItem('dark-mode', 'true');
            } else {
                localStorage.setItem('dark-mode', 'false');
            }
        });
    }
});