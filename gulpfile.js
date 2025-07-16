/**
 * @file Gulp configuration file for building the Chrome extension.
 * This file defines tasks for cleaning, copying, processing assets (CSS, JS, images, fonts),
 * and packaging the final extension for distribution.
 */

// --- Gulp Modules ---
const gulp = require("gulp");
const cleanCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const htmlReplace = require("gulp-html-replace");
const zip = require("gulp-zip");
const uglify = require("gulp-uglify-es").default;
const imagemin = require("gulp-imagemin");

// --- Node.js Modules ---
const fs = require("fs");
const rimraf = require("rimraf");
const humanSize = require("humanize").filesize;

// --- Local Configuration ---
const manifest = require("./manifest.json");

// Load optional build configuration if it exists.
let buildConfig = {};
if (fs.existsSync("./.conf.json")) {
  buildConfig = require("./.conf.json");
  console.info("Found .conf.json file");
}

// --- Constants ---
const BUILD_DIR = "build/";
const DIST_DIR = "dist/";

// --- Helper Functions ---

/**
 * Prints detailed statistics after CSS minification.
 * @param {object} d - The details object provided by gulp-clean-css.
 * @param {string} d.name - The name of the processed file.
 * @param {object} d.stats - The statistics object.
 * @param {number} d.stats.originalSize - The original size in bytes.
 * @param {number} d.stats.minifiedSize - The minified size in bytes.
 * @param {number} d.stats.efficiency - The compression efficiency ratio.
 * @param {number} d.stats.timeSpent - The time spent on processing in ms.
 */
function printCSSInfo(d) {
  const origSize = humanSize(d.stats.originalSize);
  const minSize = humanSize(d.stats.minifiedSize);
  const eff = (d.stats.efficiency * 100).toFixed(1);

  console.info(
    `${d.name} \n\t ${origSize} → ${minSize} [${eff}%] @ ${d.stats.timeSpent}ms`
  );
}

// --- Gulp Tasks ---

/**
 * Deletes the build directory to ensure a clean build.
 */
gulp.task("clean", (cb) => {
  rimraf(BUILD_DIR + "**", cb);
});

/**
 * Copies static root files like the manifest to the build directory.
 */
gulp.task("copy", (cb) => {
  gulp.src(["manifest.json"]).pipe(gulp.dest(BUILD_DIR));
  cb();
});

/**
 * Copies required font files from node_modules to the build directory.
 */
gulp.task("fonts", () => {
  return gulp
    .src("node_modules/font-awesome/fonts/*.woff*")
    .pipe(gulp.dest(BUILD_DIR + "fonts"));
});

/**
 * Optimizes and copies images to the build directory.
 */
gulp.task("images", () => {
  return gulp
    .src("imgs/**")
    .pipe(imagemin())
    .pipe(gulp.dest(BUILD_DIR + "imgs"));
});

/**
 * Minifies application-specific CSS files and copies them to the build directory.
 */
gulp.task("css:app", () => {
  return gulp
    .src("css/**")
    .pipe(cleanCSS({ debug: true }, printCSSInfo))
    .pipe(gulp.dest(BUILD_DIR + "css"));
});

/**
 * Concatenates and minifies vendor CSS files into a single file.
 */
gulp.task("css:vendor", () => {
  return gulp
    .src([
      "node_modules/jquery-jsonview/dist/jquery.jsonview.css",
      "node_modules/font-awesome/css/font-awesome.min.css",
    ])
    .pipe(cleanCSS({ debug: true, rebase: false }, printCSSInfo))
    .pipe(concat("vendor.min.css"))
    .pipe(gulp.dest(BUILD_DIR + "css"));
});

/**
 * Replaces blocks in HTML files with references to the bundled vendor assets.
 */
gulp.task("html:replace", () => {
  return gulp
    .src("./*.html")
    .pipe(
      htmlReplace({
        "vendor-style": "css/vendor.min.css",
        "vendor-script": "js/vendor.min.js",
      })
    )
    .pipe(gulp.dest(BUILD_DIR));
});

/**
 * Minifies application-specific JavaScript files.
 */
gulp.task("js:app", () => {
  return gulp
    .src(["js/**"])
    .pipe(uglify())
    .pipe(gulp.dest(BUILD_DIR + "js"));
});

/**
 * Concatenates and minifies vendor JavaScript files into a single file.
 */
gulp.task("js:vendor", () => {
  return gulp
    .src([
      "node_modules/jquery/dist/jquery.min.js",
      "node_modules/jquery-jsonview/dist/jquery.jsonview.js",
      "node_modules/mark.js/dist/jquery.mark.min.js",
    ])
    .pipe(uglify())
    .pipe(concat("vendor.min.js"))
    .pipe(gulp.dest(BUILD_DIR + "js"));
});

/**
 * Creates a zip archive of the build directory for distribution.
 */
gulp.task("zip", () => {
  return gulp
    .src(BUILD_DIR + "**")
    .pipe(zip(`dist_${manifest.version}.zip`))
    .pipe(gulp.dest(DIST_DIR));
});

/**
 * Default task: runs the complete build and packaging sequence.
 */
module.exports.default = gulp.series(
  "clean",
  gulp.parallel("copy", "fonts", "images"),
  "css:app",
  "css:vendor",
  gulp.parallel("js:app", "js:vendor"),
  "html:replace",
  "zip"
);
