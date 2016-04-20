'use strict';

/* Configuration */
var projectName = 'king-of-the-jungle';
var paths = {
  styles: {
    src: './sass/*.scss',
    dest: './'
  },
  scripts: {
    src: [
      './assets/bower_components/jquery/dist/jquery.min.js', './assets/bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js', './assets/js/skip-link-focus-fix.js', './assets/js/main.js'
    ],
    dest: './'
  },
  php: {
    src: './**/*.php'
  },
  imgs: {
    src: 'assets/images/*.{png,jpg,jpeg,gif,svg}'
  },
  build: {
    src: {
      files: [
        './*.php',
        './inc/**/*.*',
        './languages/**/*.*',
        './layouts/**/*.*',
        './template-parts/**/*.*',
        './screenshot.png'
      ],
      imgs: './img/*'
    },
    dest: './dist/'
  }
};


/* Load Plugins */
var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    del = require('del'),
    imagemin = require('gulp-imagemin'),
    jscs = require('gulp-jscs'),
    jshint = require('gulp-jshint'),
    livereload = require('gulp-livereload'),
    postcss = require('gulp-postcss'),
    reporter = require('postcss-reporter'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    stylelint = require('stylelint'),
    stylish = require('gulp-jscs-stylish'),
    syntaxScss = require('postcss-scss'),
    uglify = require('gulp-uglify'),
    zip = require('gulp-zip');

/* Tasks */

// Styles Tasks
gulp.task('styles', function() {
  gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(livereload());
});

gulp.task('styles:lint', function() {
  gulp.src(paths.styles.src)
    .pipe(postcss([
      stylelint('.stylelintrc'),
      reporter()
    ], {syntax: syntaxScss}));
});

gulp.task('styles:watch', function() {
  livereload.listen();
  gulp.watch(paths.styles.src, ['styles']);
});

gulp.task('styles:build', ['styles:lint'], function() {
  gulp.src(paths.styles.src)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.build.dest));
});


// Scripts tasks

gulp.task('scripts', ['scripts:lint'], function() {
  gulp.src(paths.scripts.src)
    .pipe(concat('scripts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(livereload());
});

gulp.task('scripts:lint', function() {
  gulp.src(paths.scripts.src)
    .pipe(jshint())
    .pipe(jscs())
    .pipe(stylish.combineWithHintResults())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('scripts:watch', function() {
  livereload.listen();
  gulp.watch(paths.scripts.src, ['scripts']);
});

gulp.task('scripts:build', ['scripts:lint'], function() {
  gulp.src(paths.scripts.src)
    .pipe(concat('scripts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.build.dest));
});


// Image tasks
gulp.task('images', ['images:optimize']);

gulp.task('images:optimize', function() {
  gulp.src(paths.imgs.src)
  .pipe(imagemin())
  .pipe(gulp.dest('./img/'));
});

gulp.task('images:watch', function() {
  gulp.watch(paths.imgs.src, ['images:optimize']);
});


// Watch task
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(paths.imgs.src, ['images:optimize']);
  gulp.watch(paths.styles.src, ['styles']);
  gulp.watch(paths.scripts.src, ['scripts']);
  gulp.watch(paths.php.src).on('change', function(file) {
    livereload.changed(file);
  });
});


// Cleanup task
gulp.task('cleanup', function() {
  return del([
    paths.build.dest,
    './*.css',
    './*.min.js',
    './'+projectName+'.zip'
  ]);
});


// Copy tasks
gulp.task('copy', ['copy:files', 'copy:images']);

gulp.task('copy:files', function() {
  gulp.src(paths.build.src.files, {base: './'})
    .pipe(gulp.dest(paths.build.dest));
});

gulp.task('copy:images', function() {
  gulp.src(paths.build.src.imgs)
    .pipe(gulp.dest(paths.build.dest + '/img'));
});


// Zip it up
gulp.task('zipit', function() {
  gulp.src(paths.build.dest+'**/')
    .pipe(zip(projectName+'.zip'))
    .pipe(gulp.dest('./'));
});


// Combine tasks
gulp.task('lint', ['scripts:lint', 'styles:lint']);
gulp.task('compile', ['styles', 'scripts']);
gulp.task('default', ['compile', 'images:optimize', 'watch']);

// Build task
gulp.task('build', function(callback) {
  runSequence(
    'images',
    'lint',
    'cleanup',
    'scripts:build',
    'styles:build',
    'compile',
    'copy',
    callback);
});
