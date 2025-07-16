/**
 * @file devtools.js
 * @description This script creates the DevTools panel and handles its lifecycle events.
 */

/**
 * A flag to prevent the update function from being called the very first time the panel is shown,
 * as the initial data load is handled by the panel's own init logic.
 * @type {boolean}
 */
let appShownFirst = false;

/**
 * Creates the "Local Storage Explorer" panel in the Chrome DevTools.
 * @param {string} title - The title of the panel.
 * @param {null} iconPath - The path to the panel's icon (null for default).
 * @param {string} pagePath - The path to the panel's HTML page.
 * @param {function(chrome.devtools.panels.ExtensionPanel): void} callback - A function that runs after the panel is created.
 */
chrome.devtools.panels.create(
  "Local Storage Explorer",
  null,
  "panel.html",
  (panel) => {
    /**
     * Adds a listener for when the panel is shown. This is used to refresh data
     * and set up listeners that require the panel's window object.
     * @param {function(Window): void} listener - The callback function that receives the panel's window object.
     */
    panel.onShown.addListener(function (appWindow) {
      // On subsequent shows (not the first one), call the update method on the panel's App instance
      // to refresh the storage data.
      if (appShownFirst && appWindow.App && appWindow.App.update) {
        appWindow.App.update();
      }

      // On the very first show, set the flag and add the search listener.
      // The search listener is only added once to avoid duplicates.
      if (!appShownFirst) {
        appShownFirst = true;
        /**
         * Adds a listener for the DevTools search action (Cmd/Ctrl+F).
         * It binds the App's `handleSearch` method to the event.
         * @param {function(string, string): void} listener - The callback function for search actions.
         */
        panel.onSearch.addListener(
          appWindow.App.handleSearch.bind(appWindow.App)
        );
      }
    });
  }
);
