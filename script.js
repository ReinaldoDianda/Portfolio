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


// <!--translater  -->

const flagsElement= document.getElementById("flags")

let textsToChange = document.querySelectorAll("[data-section]");

const changeLanguage = async (language) => {
    const requestJson = await fetch(`./languages/${language}.json`);
    const texts = await requestJson.json();

   for( const textToChange of textsToChange){
    let section = textToChange.dataset.section;
    let value = textToChange.dataset.value;
    textToChange.innerHTML = texts[section][value];
}
};

flagsElement.addEventListener('click',(e) =>{
    changeLanguage(e.target.parentElement.dataset.language);
})


//darktheme
const btnSwitchTranslater = document.querySelector('#switch-translater');

btnSwitchTranslater.addEventListener('click',() =>{
    btnSwitchTranslater.classList.toggle('active');
})













/////////darktheme
const btnSwitch = document.querySelector('#switch');

btnSwitch.addEventListener('click',() =>{
    document.body.classList.toggle('dark')
    btnSwitch.classList.toggle('active');
})