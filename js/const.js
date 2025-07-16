/**
 * @file This file contains shared constants used throughout the application.
 */

/**
 * The duration in milliseconds for the "Saved" button to remain highlighted after a successful save action.
 * @type {number}
 */
const BTN_HIGHLIGHT_TIMEOUT = 2700;

/**
 * The default theme name used when no theme is explicitly set by the user.
 * 'auto' means the theme will be determined by the user's operating system preference.
 * @type {string}
 */
const DEFAULT_THEME_NAME = "auto";

/**
 * The default storage type to be displayed when the panel is first opened.
 * @type {string}
 */
const DEFAULT_STORAGE = "localStorage";

/**
 * A mapping from detected data types to their corresponding Font Awesome icon class names.
 * This is used to display a visual indicator for each key in the storage list.
 * @type {Object<string, string>}
 */
const ICON_TYPE = {
  object: "code",
  string: "font",
  array: "list-ol",
  number: "sort-numeric-asc",
  null: "ban",
  boolean: "check",
  other: "question",
};
