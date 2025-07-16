/**
 * @class WebStorageExplorer
 * @description Main application class for the DevTools panel. It handles fetching,
 * parsing, and displaying web storage data (localStorage and sessionStorage).
 */
class WebStorageExplorer {
  /**
   * @property {StorageDriver} storageDriver - Instance for interacting with the inspected window's storage.
   */
  storageDriver = new StorageDriver();
  /**
   * @property {Map<string, {value: any, len: number, type: string}>} storage - A map to hold the parsed storage data.
   */
  storage = new Map();
  /**
   * @property {string[]} keyList - An array of keys from the current storage.
   */
  keyList = [];
  /**
   * @property {object} constants - An object to store non-changing values like element heights.
   * @private
   */
  constants = {};
  /**
   * @property {object} el - A cache for frequently accessed DOM elements.
   * @private
   */
  el = {};
  /**
   * @property {string} currentStorageName - The name of the currently displayed storage ('localStorage' or 'sessionStorage').
   */
  currentStorageName = DEFAULT_STORAGE;
  /**
   * @property {boolean} isNavFloating - Tracks if the navigation sidebar is in a floating state.
   */
  isNavFloating = false;
  /**
   * @property {string} lastShownKey - The key of the last item viewed by the user.
   */
  lastShownKey = "";
  /**
   * @property {number} lastShownKeyIndex - The index in `keyList` of the last shown key.
   */
  lastShownKeyIndex = -1;
  /**
   * @property {boolean} loadedByUpdate - A flag to indicate if the data was reloaded by a user action (e.g., refresh button).
   */
  loadedByUpdate = false;

  /**
   * @constructor
   * Initializes the class, waiting for the DOM to be ready before executing the main logic.
   */
  constructor() {
    // The 'ready' event ensures the DOM is fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * @method init
   * @description Asynchronous initialization sequence for the application.
   * @async
   */
  async init() {
    this._loadSettings();
    this._selectElements();
    this._setHandlers();
    this._createConstants();
    this.updateUI();
    await this.update();
  }

  /**
   * @method _loadSettings
   * @description Loads the preferred storage type from localStorage.
   * @private
   */
  _loadSettings() {
    this.currentStorageName =
      localStorage.getItem("storage") || DEFAULT_STORAGE;
  }

  /**
   * @method _selectElements
   * @description Queries the DOM and caches necessary element references in `this.el`.
   * @private
   */
  _selectElements() {
    const qs = (selector) => document.querySelector(selector);
    this.el = {
      body: document.body,
      window: window,
      valueView: qs(".js-value-view"),
      initialText: qs(".js-initial-text"),
      keyList: qs(".js-key-list"),
      selectStorage: qs(".js-select-storage"),
      reloadBtn: qs(".js-reload-btn"),
      removeBtn: qs(".js-remove-btn"),
      showNavBtn: qs(".js-show-nav"),
      pageOverlay: qs(".js-page-overlay"),
      navBlock: qs(".js-nav-block"),
      showSubnavBtn: qs(".js-show-subnav"),
      subnavMenu: qs(".js-subnav-menu"),
      footer: qs(".js-footer"),
      valueInfo: qs(".js-value-info"),
      optionsPageBtn: qs(".js-options-page-button"),
      clearStorageBtn: qs(".js-clear-storage-button"),
      clearStorageConfirmBtn: qs(".js-clear-storage-confirm-button"),
      jsonViewTools: qs(".js-json-view-tools"),
    };
  }

  /**
   * @method retrieveStorage
   * @description Fetches storage data from the inspected page for the given storage type.
   * @param {string} storageType - The type of storage to retrieve ('localStorage' or 'sessionStorage').
   * @async
   */
  async retrieveStorage(storageType) {
    this.currentStorageName = ["localStorage", "sessionStorage"].includes(
      storageType
    )
      ? storageType
      : "localStorage";

    const startTime = performance.now();
    try {
      const [storageInfo, parsedStorage] = await Promise.all([
        this.storageDriver.getStoragesInfo(),
        this.storageDriver.getStorageByName(this.currentStorageName),
      ]);

      this._showStorageInfo(storageInfo);
      this._parseAndRenderStorage(parsedStorage, startTime);
    } catch (e) {
      console.error("Cannot retrieve or parse storage: ", e);
      this.el.initialText.textContent = `Error loading ${this.currentStorageName}.`;
      this.el.initialText.style.display = "block";
    }
  }

  /**
   * @method _parseAndRenderStorage
   * @description Parses the raw storage object, populates the internal storage map, and renders the key list.
   * @param {object} parsedStorage - The key-value object from the inspected page.
   * @param {number} startTime - The timestamp from `performance.now()` when the retrieval began.
   * @private
   */
  _parseAndRenderStorage(parsedStorage, startTime) {
    this.storage.clear();
    this.keyList = Object.keys(parsedStorage);

    if (this.keyList.length) {
      this.keyList.forEach((key) => {
        const rawValue = parsedStorage[key];
        const parsedValue =
          WebStorageExplorer.tryParseJSON(rawValue) ?? rawValue;
        this.storage.set(key, {
          value: parsedValue,
          len: rawValue.length,
          type: WebStorageExplorer.guessType(parsedValue),
        });
      });
      this._renderStorageKeys();
    } else {
      this.clear();
    }

    const loadTime = performance.now() - startTime;
    this._showInitialText(loadTime);
    this._updateFooterPosition();
    this._checkForLastKey();
  }

  /**
   * @method _renderStorageKeys
   * @description Generates the HTML for the list of storage keys and injects it into the DOM.
   * @private
   */
  _renderStorageKeys() {
    const linksTemplate = this.keyList
      .map((key) => {
        const { type } = this.storage.get(key);
        const icon = ICON_TYPE[type] || "question";
        // Basic HTML escaping for key
        const escapedKey = key
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        return `
        <li class="b-keys-menu__item">
            <a href="#" class="b-keys-menu__link js-select-key" data-key="${escapedKey}" title="${escapedKey}">
                <i class="fa fa-${icon} b-keys-menu__type-icon"></i>
                <span>${escapedKey}</span>
            </a>
        </li>`;
      })
      .join("");

    this.el.keyList.innerHTML = linksTemplate;
  }

  /**
   * @method _showStorageInfo
   * @description Updates the storage selection dropdowns to show the number of items in each storage.
   * @param {object} storageInfo - An object containing item counts for `ls` and `ss`.
   * @private
   */
  _showStorageInfo(storageInfo) {
    if (storageInfo && storageInfo.ls !== undefined) {
      const lsOption = this.el.selectStorage.querySelector(
        'option[value="localStorage"]'
      );
      const ssOption = this.el.selectStorage.querySelector(
        'option[value="sessionStorage"]'
      );
      lsOption.textContent = `localStorage [${storageInfo.ls}]`;
      ssOption.textContent = `sessionStorage [${storageInfo.ss}]`;
    }
  }

  /**
   * @method _setHandlers
   * @description Attaches all necessary event listeners for the application's UI.
   * @private
   */
  _setHandlers() {
    // Event delegation for key list clicks
    this.el.keyList.addEventListener("click", (e) => {
      const link = e.target.closest(".js-select-key");
      if (!link) return;

      e.preventDefault();
      const currentActive = this.el.keyList.querySelector(
        ".b-keys-menu__link_active"
      );
      if (currentActive) {
        currentActive.classList.remove("b-keys-menu__link_active");
      }
      link.classList.add("b-keys-menu__link_active");

      const key = link.dataset.key;
      this.showValueForKey(key);
      if (this.isNavFloating) {
        this.toggleNavView();
      }
      this.lastShownKeyIndex = this.keyList.indexOf(key);
    });

    this.el.selectStorage.addEventListener("change", async (e) => {
      this.clear();
      this.lastShownKey = "";
      await this.retrieveStorage(e.target.value);
    });

    this.el.reloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      this.clear(true);
      await this.update();
    });

    this.el.removeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (this.lastShownKey) {
        await this.storageDriver.removeKey(
          this.currentStorageName,
          this.lastShownKey
        );
        this.clear(true);
        await this.update();
      }
    });

    this.el.showNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleNavView();
    });

    this.el.pageOverlay.addEventListener("click", () => this.toggleNavView());

    this.el.showSubnavBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.el.subnavMenu.classList.toggle("b-subnav-menu_shown");
      e.currentTarget.classList.toggle("b-header__header-btn_active");
    });

    this.el.body.addEventListener("click", () => {
      if (this.el.subnavMenu.classList.contains("b-subnav-menu_shown")) {
        this.el.subnavMenu.classList.remove("b-subnav-menu_shown");
        this.el.showSubnavBtn.classList.remove("b-header__header-btn_active");
      }
    });

    this.el.clearStorageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.currentTarget.classList.toggle("b-subnav-menu__link_activated");
    });

    this.el.clearStorageConfirmBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await this.storageDriver.clearStorage(this.currentStorageName);
      this.el.subnavMenu.classList.remove("b-subnav-menu_shown");
      this.clear();
      await this.update();
    });

    this.el.optionsPageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(chrome.runtime.getURL("options.html?show_header"));
    });

    this.el.valueView.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (link) {
        e.preventDefault();
        window.open(link.getAttribute("href"));
      }
    });

    this.el.jsonViewTools.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-json-view-action]");
      if (!button) return;

      const action = button.dataset.jsonViewAction.toLowerCase();
      const level = button.dataset.jsonViewLevel || 1;
      const $valueView = $(this.el.valueView); // jQuery needed for plugin

      switch (action) {
        case "collapse":
          $valueView.JSONView("collapse");
          break;
        case "expand":
          $valueView.JSONView("expand");
          break;
        case "toggle":
          $valueView.JSONView("toggle", level);
          break;
      }
    });

    this.el.window.addEventListener("resize", () =>
      this._updateFooterPosition()
    );
  }

  /**
   * @method _createConstants
   * @description Calculates and stores layout-related constants to avoid re-computation.
   * @private
   */
  _createConstants() {
    this.constants.footerHeight = this.el.footer.offsetHeight;
    this.constants.storageSelectHeight = this.el.selectStorage.offsetHeight;
    Object.freeze(this.constants);
  }

  /**
   * @method updateUI
   * @description Syncs the UI state with the application's current state.
   */
  updateUI() {
    this.el.selectStorage.value = this.currentStorageName;
  }

  /**
   * @method update
   * @description Triggers a full refresh of the storage data from the inspected page.
   * @async
   */
  async update() {
    this.loadedByUpdate = true;
    await this.retrieveStorage(this.currentStorageName);
  }

  /**
   * @method toggleNavView
   * @description Toggles the visibility of the floating navigation sidebar and page overlay.
   */
  toggleNavView() {
    this.el.navBlock.classList.toggle("b-nav_shown");
    this.el.pageOverlay.classList.toggle("b-page-overlay_hidden");
    this.isNavFloating = this.el.navBlock.classList.contains("b-nav_shown");
  }

  /**
   * @method clear
   * @description Resets the UI and internal data structures.
   * @param {boolean} [shouldSaveLastShownKey=false] - If true, the last selected key is preserved for re-selection.
   */
  clear(shouldSaveLastShownKey = false) {
    this.storage.clear();
    if (!shouldSaveLastShownKey) {
      this.lastShownKey = "";
      this.lastShownKeyIndex = -1;
    }
    this.el.keyList.innerHTML = "";
    this.el.valueView.innerHTML = "";
    this.el.valueInfo.innerHTML = "";
    this.el.jsonViewTools.classList.add("b-json-view-tools_hidden");
  }

  /**
   * @method showValueForKey
   * @description Displays the value and metadata for a given storage key.
   * @param {string} key - The key of the item to display.
   */
  showValueForKey(key) {
    const data = this.storage.get(key);
    if (!data) return;

    const { value, type, len } = data;
    this.el.valueView.parentElement.scrollTop = 0;
    this.el.initialText.style.display = "none";

    const $valueView = $(this.el.valueView); // jQuery needed for plugin

    if (type === "object" || type === "array") {
      $valueView.JSONView(value, { collapsed: false });
      this.el.valueView.classList.add("b-value-view__with-tools");
      this.el.jsonViewTools.classList.remove("b-json-view-tools_hidden");
    } else {
      $valueView.text(value); // Use .text() to prevent HTML injection
      this.el.valueView.classList.remove("b-value-view__with-tools");
      this.el.jsonViewTools.classList.add("b-json-view-tools_hidden");
    }

    this.lastShownKey = key;
    this._showInfoForValue(type, len);
  }

  /**
   * @method _showInfoForValue
   * @description Displays metadata (type and length) for the currently shown value.
   * @param {string} type - The data type of the value.
   * @param {number} len - The length of the raw string value.
   * @private
   */
  _showInfoForValue(type, len) {
    this.el.valueInfo.innerHTML = `
      <span class="b-value-info__property">Type: <b>${type}</b></span>
      <span class="b-value-info__property">Length: <b>${len}</b></span>
    `;
  }

  /**
   * @method _checkForLastKey
   * @description After a data refresh, attempts to re-select the previously viewed key.
   * @private
   */
  _checkForLastKey() {
    if (this.loadedByUpdate) {
      this.loadedByUpdate = false;
      if (this.lastShownKey && this.storage.has(this.lastShownKey)) {
        this._tryToShowLastKey();
      } else {
        this._tryToSelectNextKey();
      }
    }
  }

  /**
   * @method _tryToShowLastKey
   * @description Re-selects and displays the last shown key if it still exists after a refresh.
   * @private
   */
  _tryToShowLastKey() {
    this.showValueForKey(this.lastShownKey);
    const link = this.el.keyList.querySelector(
      `.js-select-key[data-key="${this.lastShownKey}"]`
    );
    if (link) {
      link.classList.add("b-keys-menu__link_active");
    }
  }

  /**
   * @method _tryToSelectNextKey
   * @description If the last shown key was deleted, this attempts to select an adjacent key.
   * @private
   */
  _tryToSelectNextKey() {
    if (this.lastShownKeyIndex !== -1 && this.keyList.length) {
      this.lastShownKeyIndex = Math.min(
        this.lastShownKeyIndex,
        this.keyList.length - 1
      );
      const key = this.keyList[this.lastShownKeyIndex];
      if (key) {
        this.showValueForKey(key);
        const link = this.el.keyList.querySelector(
          `.js-select-key[data-key="${key}"]`
        );
        if (link) {
          link.classList.add("b-keys-menu__link_active");
        }
      }
    }
  }

  /**
   * @method _showInitialText
   * @description Displays a message in the value view area, such as load time or an "empty" message.
   * @param {number} loadTime - The time in milliseconds it took to load the storage data.
   * @private
   */
  _showInitialText(loadTime) {
    if (!this.lastShownKey) {
      if (this.storage.size) {
        this.el.initialText.textContent = `loaded ${
          this.storage.size
        } items in ${loadTime.toFixed(1)}ms`;
      } else {
        this.el.initialText.textContent = `${this.currentStorageName} is empty`;
      }
      this.el.initialText.style.display = "block";
    } else {
      this.el.initialText.style.display = "none";
    }
  }

  /**
   * @method _updateFooterPosition
   * @description Adjusts the footer's CSS class based on whether the key list is overflowing its container.
   * @private
   */
  _updateFooterPosition() {
    const isOverflowing =
      this.el.keyList.offsetHeight >=
      window.innerHeight -
        this.constants.footerHeight -
        this.constants.storageSelectHeight;
    this.el.footer.classList.toggle("b-nav-footer_no-bottom", isOverflowing);
  }

  /**
   * @method handleSearch
   * @description Uses mark.js to highlight or clear search terms in the value view.
   * @param {string} action - The search action to perform ('performSearch' or other).
   * @param {string} keyword - The keyword to search for.
   */
  handleSearch(action, keyword) {
    const $valueView = $(this.el.valueView); // jQuery needed for mark.js
    $valueView.unmark();
    if (action === "performSearch" && keyword) {
      $valueView.mark(keyword);
    }
  }

  /**
   * @method tryParseJSON
   * @description Safely attempts to parse a string as JSON.
   * @param {string} strJSON - The string to parse.
   * @returns {object|null} The parsed object, or null if parsing fails or is not applicable.
   * @static
   */
  static tryParseJSON(strJSON) {
    try {
      // Avoid parsing simple numbers and booleans that are valid JSON
      if (
        !strJSON.startsWith("{") &&
        !strJSON.startsWith("[") &&
        !strJSON.startsWith('"')
      ) {
        return null;
      }
      return JSON.parse(strJSON);
    } catch (err) {
      return null;
    }
  }

  /**
   * @method guessType
   * @description Determines the likely data type of a value.
   * @param {*} val - The value to inspect.
   * @returns {string} The guessed type (e.g., 'object', 'array', 'string').
   * @static
   */
  static guessType(val) {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    const type = typeof val;
    if (type === "object") return "object";
    if (type === "boolean") return "boolean";
    if (type === "number") return "number";
    if (type === "string") return "string";
    return "other";
  }
}

// Initialize the app
window.App = new WebStorageExplorer();

/**
 * Sets the keyboard shortcut hint based on the user's operating system.
 */
document.addEventListener("DOMContentLoaded", () => {
  const kbdEl = document.querySelector(".shortcut");
  if (!kbdEl) return;

  // Use modern userAgentData with a fallback for compatibility
  const isMac =
    (navigator.userAgentData &&
      navigator.userAgentData.platform.toLowerCase() === "macos") ||
    navigator.platform.toLowerCase().includes("mac");

  kbdEl.textContent = isMac ? "Command+Option+I" : "Control+Shift+I";
});
