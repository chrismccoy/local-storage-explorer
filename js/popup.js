/**
 * @file This script detects the user's operating system and displays the
 * appropriate keyboard shortcut for opening DevTools in a designated element.
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * The DOM element where the keyboard shortcut text will be displayed.
   * @type {HTMLElement|null}
   */
  const kbdEl = document.querySelector(".shortcut");
  if (!kbdEl) return;

  /**
   * A boolean flag indicating if the user's operating system is macOS.
   * It uses the modern `navigator.userAgentData` with a fallback to `navigator.platform`
   * for older browser compatibility.
   * @type {boolean}
   */
  const isMac =
    (navigator.userAgentData &&
      navigator.userAgentData.platform.toLowerCase() === "macos") ||
    navigator.platform.toLowerCase().includes("mac");

  // Set the text content of the element to the correct shortcut based on the OS.
  kbdEl.textContent = isMac ? "Command+Option+I" : "Control+Shift+I";
});
