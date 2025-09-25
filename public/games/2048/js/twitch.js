// Twitch.js - Solo manejo de UI, sin OAuth personalizado
// NextAuth.js maneja toda la autenticación

const username = localStorage.getItem("username");
const userInfo = document.getElementById("userInfo");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userAvatarUrl = localStorage.getItem("userAvatar");
const container = document.querySelector(".container");

// Mostrar/ocultar elementos según el estado de autenticación
if (!username) {
    if (loginWithTwitchButton) {
        loginWithTwitchButton.style.display = "block";
    }
    if (container) {
        container.classList.add("hidden");
    }
} else {
    if (loginWithTwitchButton) {
        loginWithTwitchButton.style.display = "none";
    }
    if (userInfo) {
        userInfo.classList.remove("hidden");
    }
    if (userAvatar && userAvatarUrl) {
        userAvatar.src = userAvatarUrl;
    }
    if (userName) {
        userName.textContent = `Username: ${username}`;
    }
    if (container) {
        container.classList.remove("hidden");
    }
}

// Función para actualizar la UI cuando el usuario se autentica
function updateUserUI(userData) {
    if (userData) {
        localStorage.setItem("username", userData.display_name || userData.name);
        localStorage.setItem("userAvatar", userData.profile_image_url || userData.image);
        
        if (loginWithTwitchButton) {
            loginWithTwitchButton.style.display = "none";
        }
        if (userInfo) {
            userInfo.classList.remove("hidden");
        }
        if (userAvatar && userData.profile_image_url) {
            userAvatar.src = userData.profile_image_url;
        }
        if (userName && userData.display_name) {
            userName.textContent = `Username: ${userData.display_name}`;
        }
        if (container) {
            container.classList.remove("hidden");
        }
    }
}

// Exportar función para uso externo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateUserUI };
}