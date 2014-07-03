(function () {
  "use strict";

  var gulp = require("gulp");

  var args = require("yargs").argv;
  var clean = require("gulp-clean");
  var uglify = require("gulp-uglify");
  var concat = require("gulp-concat");
  var gulpif = require("gulp-if");
  var compass = require("gulp-compass");
  var plumber = require("gulp-plumber");
  var eslint = require("gulp-eslint");
  var csso = require("gulp-csso");
  var cmq = require("gulp-combine-media-queries");
  var minifycss = require('gulp-minify-css');

  var paths = {
    vendor_scripts: [
      "src/javascript/jquery.js",
      "src/javascript/noconflict.js",
      "src/javascript/jquery.cookie.js",
      "src/javascript/URI.js",
      "src/javascript/modernizr.mq.js",
      "src/javascript/md5.js"
    ],
    non_vendor_scripts: [
      // Polyfill.js adds hacks for IE, it does not conform eslint for now:
      // "src/javascript/polyfill.js",
      "src/javascript/walkthrough.js",
      "src/javascript/walkthrough/*.js",
      "src/javascript/walkthrough_start.js"
    ],
    sass: ["src/sass/walkthrough.sass"]
  };

  paths.scripts = paths.vendor_scripts.concat(paths.non_vendor_scripts);

  gulp.task("eslint", function () {
    return gulp.src(paths.non_vendor_scripts)
      .pipe(eslint({
        rules: {
          "eqeqeq": [2, "smart"],
          "guard-for-in": 2,
          "no-undef": 2,
          "no-unused-vars": 0,
          "strict": 2,
          "new-cap": 0,
          "quotes": 0,
          "camelcase": 0,
          "no-underscore-dangle": 0,
          "no-new": 0,
          "no-alert": 0,
          "no-use-before-define": 0,
          "consistent-return": 0,
          "no-constant-condition": 0
        },
        globals: {
          'console': true,
          'jqWalkhub': true
        },
      }))
      .pipe(eslint.format())
      .pipe(eslint.failOnError());
  });

  gulp.task("buildjs", function () {
    return gulp.src(paths.scripts)
      .pipe(plumber())
      .pipe(concat("compiled.js"))
      .pipe(gulpif(!args.debug, uglify()))
      .pipe(gulp.dest("."));
  });

  gulp.task("buildsass", function () {
    var sassConfig = {
      css: ".",
      sass: "./src/sass",
      project: __dirname
    };

    return gulp.src(paths.sass)
      .pipe(plumber())
      .pipe(compass(sassConfig))
      .pipe(csso())
      .pipe(cmq({log: true}))
      .pipe(gulpif(!args.debug, minifycss()))
      .pipe(gulp.dest("./"));
  });

  gulp.task("build", ["buildjs", "buildsass"]);

  gulp.task("clean", function () {
    return gulp.src(["compiled.js", "walkthrough.css"])
      .pipe(clean());
  });

  gulp.task("watch", function () {
    gulp.watch("./src", ["clean", "build"]);
    gulp.watch(paths.non_vendor_scripts, ["eslint"]);
    gulp.watch(paths.non_vendor_scripts, ["buildjs"]);
  });

  gulp.task("default", ["clean", "build", "watch"]);
})();
