class Options {
  el = {};
  settings = {};

  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this._selectElements();
    this._showHeader();
    this._loadSettings();
    this._showSettings();
    this._startHandlers();
  }

  _selectElements() {
    const qs = (selector) => document.querySelector(selector);
    this.el = {
      storageSelect: qs(".js-select-storage"),
      themeSelect: qs(".js-select-theme"),
      saveBtn: qs(".js-save-button"),
      header: qs(".js-options-header"),
    };
  }

  _showHeader() {
    if (new URLSearchParams(window.location.search).has("show_header")) {
      this.el.header.classList.remove("b-container__main-header_hidden");
    }
  }

  _loadSettings() {
    this.settings = {
      theme: localStorage.getItem("theme") || DEFAULT_THEME_NAME,
      storage: localStorage.getItem("storage") || DEFAULT_STORAGE,
    };
  }

  _showSettings() {
    this.el.storageSelect.value = this.settings.storage;
    this.el.themeSelect.value = this.settings.theme;
  }

  _startHandlers() {
    this.el.saveBtn.addEventListener("click", () => {
      const newSettings = {
        storage: this.el.storageSelect.value,
        theme: this.el.themeSelect.value,
      };

      localStorage.setItem("storage", newSettings.storage);
      localStorage.setItem("theme", newSettings.theme);

      // Animate button
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
