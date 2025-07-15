document.addEventListener("DOMContentLoaded", () => {
  const kbdEl = document.querySelector(".shortcut");
  if (!kbdEl) return;

  // Use modern userAgentData with a fallback for compatibility
  const isMac =
    navigator.userAgentData?.platform.toLowerCase() === "macos" ||
    navigator.platform.toLowerCase().includes("mac");

  kbdEl.textContent = isMac ? "Command+Option+I" : "Control+Shift+I";
});
