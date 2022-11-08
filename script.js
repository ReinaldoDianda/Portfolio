const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click",() => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
})

document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click",()=>{
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}))


const translate_container = document.querySelector(".translate-container");

translate_container.addEventListener("click",() => {
    translate_container.classList.toggle("active");
    navMenu.classList.toggle("active");
})





// <!-- inicia test translater -->
// switch lenguage

const flagsElement= document.getElementById("flags")
//identificamos el elemento, imprimiendo un console .log

const changeLanguage = async language => {
    const requestJson = await fetch(`./languages/${language}.json`)
    const texts = await requestJson.json();
    console.log(texts);
}







flagsElement.addEventListener('click',(e) =>{
    changeLanguage(e.target.parentElement.dataset.language);
})




// s