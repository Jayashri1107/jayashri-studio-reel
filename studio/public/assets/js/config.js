/**
* Theme: Velok- Responsive Bootstrap 5 Admin Dashboard
* Author: FoxPixel
* Module/App: Theme Config Js
*/


(function () {

     var savedConfig = sessionStorage.getItem("__THEME_CONFIG__");

     var html = document.getElementsByTagName("html")[0];

     var defaultConfig = {
          theme: "light",

          topbar: {
               color: "topbar-light",
          },

          menu: {
               size: "default",
               color: "sidebar-light",
          },
     };

     this.html = document.getElementsByTagName('html')[0];

     config = Object.assign(JSON.parse(JSON.stringify(defaultConfig)), {});
     window.defaultConfig = JSON.parse(JSON.stringify(config));

     if (savedConfig !== null) {
          config = JSON.parse(savedConfig);
     }

     window.config = config;

     if (config) {
          html.setAttribute("data-bs-theme", config.theme);
          // Ensure both theme attribute and classes are set correctly
          if (config.theme === "dark") {
               html.classList.remove("topbar-light", "sidebar-light");
               html.classList.add("topbar-dark", "sidebar-dark");
          } else {
               html.classList.remove("topbar-dark", "sidebar-dark");
               html.classList.add("topbar-light", "sidebar-light");
          }
          html.classList.add(config.topbar.color);
          html.classList.add(config.menu.color);

          if (window.innerWidth <= 1140) {
               html.classList.add("sidebar-hidden");
          }
     }
})();