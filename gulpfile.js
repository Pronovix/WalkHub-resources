(function () {
  "use strict";

  var gulp = require('gulp');

  var args = require('yargs').argv;
  var clean = require('gulp-clean');
  var uglify = require('gulp-uglify');
  var concat = require('gulp-concat');
  var gulpif = require('gulp-if');
  var compass = require('gulp-compass');
  var plumber = require('gulp-plumber');
  var jshint = require('gulp-jshint');

  var paths = {
    vendor_scripts: [
      "src/javascript/jquery.js",
      "src/javascript/noconflict.js",
      "src/javascript/jquery.cookie.js",
      "src/javascript/URI.js",
      "src/javascript/modernizr.mq.js",
    ],
    non_vendor_scripts: [
      "src/javascript/walkthrough.js",
      "src/javascript/walkthrough/*.js",
      "src/javascript/walkthrough_start.js"
    ],
    sass: ["src/sass/walkthrough.sass"]
  };

  paths.scripts = paths.vendor_scripts.concat(paths.non_vendor_scripts);

  gulp.task('jshint', function () {
    return gulp.src(paths.non_vendor_scripts)
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
  });

  gulp.task('buildjs', function () {
    return gulp.src(paths.scripts)
      .pipe(plumber())
      .pipe(concat('compiled.js'))
      .pipe(gulpif(!args.debug, uglify()))
      .pipe(gulp.dest('.'));
  });

  gulp.task('buildsass', function () {
    var sassConfig = {
      css: '.',
      sass: './src/sass',
      style: 'compressed',
      project: __dirname
    };

    if (args.debug) {
      sassConfig.style = 'expanded';
    }

    return gulp.src(paths.sass)
      .pipe(plumber())
      .pipe(compass(sassConfig))
      .pipe(gulp.dest('walkthrough.css'));
  });

  gulp.task('build', ['buildjs', 'buildsass']);

  gulp.task('clean', function () {
    return gulp.src(['compiled.js', 'walkthrough.css'])
      .pipe(clean());
  });

  gulp.task('watch', function () {
    gulp.watch('./src', ['clean', 'build']);
    gulp.watch(paths.non_vendor_scripts, ['jshint']);
  });

  gulp.task('default', ['clean', 'build', 'watch']);
})();
