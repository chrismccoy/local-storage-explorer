/**
 * @class Options
 * @description Manages the options page for the extension, handling settings persistence.
 */
class Options {
  /**
   * @property {object} el - A cache for DOM element references.
   * @private
   */
  el = {};
  /**
   * @property {object} settings - Holds the current settings loaded from storage.
   * @private
   */
  settings = {};

  /**
   * @constructor
   * Initializes the class by waiting for the DOM to be fully loaded before running the main logic.
   */
  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * @method init
   * @description The main initialization sequence for the options page.
   * @private
   */
  init() {
    this._selectElements();
    this._showHeader();
    this._loadSettings();
    this._showSettings();
    this._startHandlers();
  }

  /**
   * @method _selectElements
   * @description Queries the DOM and caches necessary element references in `this.el`.
   * @private
   */
  _selectElements() {
    const qs = (selector) => document.querySelector(selector);
    this.el = {
      storageSelect: qs(".js-select-storage"),
      themeSelect: qs(".js-select-theme"),
      saveBtn: qs(".js-save-button"),
      header: qs(".js-options-header"),
    };
  }

  /**
   * @method _showHeader
   * @description Checks for a URL parameter to decide whether to show the header.
   * This is used when opening the options page from the main panel.
   * @private
   */
  _showHeader() {
    if (new URLSearchParams(window.location.search).has("show_header")) {
      this.el.header.classList.remove("b-container__main-header_hidden");
    }
  }

  /**
   * @method _loadSettings
   * @description Loads settings (theme and default storage) from `localStorage`.
   * Falls back to default values if nothing is stored.
   * @private
   */
  _loadSettings() {
    this.settings = {
      theme: localStorage.getItem("theme") || DEFAULT_THEME_NAME,
      storage: localStorage.getItem("storage") || DEFAULT_STORAGE,
    };
  }

  /**
   * @method _showSettings
   * @description Updates the UI elements (select dropdowns) to reflect the currently loaded settings.
   * @private
   */
  _showSettings() {
    this.el.storageSelect.value = this.settings.storage;
    this.el.themeSelect.value = this.settings.theme;
  }

  /**
   * @method _startHandlers
   * @description Attaches event listeners to the interactive elements on the page, like the save button.
   * @private
   */
  _startHandlers() {
    this.el.saveBtn.addEventListener("click", () => {
      const newSettings = {
        storage: this.el.storageSelect.value,
        theme: this.el.themeSelect.value,
      };

      localStorage.setItem("storage", newSettings.storage);
      localStorage.setItem("theme", newSettings.theme);

      // Animate button to provide user feedback
      this.el.saveBtn.disabled = true;
      this.el.saveBtn.textContent = "Saved";
      this.el.saveBtn.classList.add("b-options__button-save_animated");

      setTimeout(() => {
        this.el.saveBtn.classList.remove("b-options__button-save_animated");
        this.el.saveBtn.disabled = false;
        this.el.saveBtn.textContent = "Save";
      }, BTN_HIGHLIGHT_TIMEOUT);
    });
  }
}

new Options();
