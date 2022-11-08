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


// <!-- inicia test translater -->

const flagsElement= document.getElementById("flags")

let textToChange = document.querySelectorAll("[data-section]");

const changeLanguage = async (language) => {
    const requestJson = await fetch(`./languages/${language}.json`);
    const texts = await requestJson.json();

   for(textToChange of textToChange){
    let section = textToChange.dataset.section;
    let value = textToChange.dataset.value;
    console.log(section,value);
   }
};

flagsElement.addEventListener('click',(e) =>{
    changeLanguage(e.target.parentElement.dataset.language);
})

