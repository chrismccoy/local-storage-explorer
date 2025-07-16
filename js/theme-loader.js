/**
 * @file Manages theme loading and switching for the extension panels.
 */

const LINK_TAG_SELECTOR = ".js-link-theme";

(() => {
  /**
   * Sets the stylesheet URL based on the selected theme name.
   * Handles 'auto' theme by detecting the user's OS preference.
   * @param {string} themeName - The name of the theme to apply ('auto', 'light', or 'dark').
   */
  function loadTheme(themeName) {
    if (themeName === "auto") {
      // Check for OS-level dark mode preference
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        themeName = "dark";
      } else {
        themeName = "light";
      }
    }

    const themeURL = chrome.runtime.getURL(`css/theme/${themeName}.css`);
    const linkElement = document.querySelector(LINK_TAG_SELECTOR);

    if (linkElement) {
      linkElement.setAttribute("href", themeURL);
    } else {
      console.error("Theme link element not found.");
    }
  }

  /**
   * Load the theme from localStorage on initial script execution.
   * Falls back to a default theme if no setting is found.
   */
  loadTheme(localStorage.getItem("theme") || DEFAULT_THEME_NAME);

  /**
   * Listen for changes to the 'theme' key in localStorage across tabs/windows
   * and apply the new theme dynamically.
   */
  window.addEventListener("storage", (e) => {
    if (e.key === "theme" && e.newValue !== e.oldValue) {
      loadTheme(e.newValue);
    }
  });
})();
