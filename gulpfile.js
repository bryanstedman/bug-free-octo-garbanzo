'use strict';

/* Configuration */
var projectName = 'garbanzo';
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
    argv = require('yargs').argv,
    autoprefixer = require('gulp-autoprefixer'),
    bump = require('gulp-bump'),
    concat = require('gulp-concat'),
    del = require('del'),
    fs = require('fs'),
    imagemin = require('gulp-imagemin'),
    jscs = require('gulp-jscs'),
    jshint = require('gulp-jshint'),
    livereload = require('gulp-livereload'),
    postcss = require('gulp-postcss'),
    release = require('gulp-github-release'),
    reporter = require('postcss-reporter'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    semver = require('semver'),
    sourcemaps = require('gulp-sourcemaps'),
    stylelint = require('stylelint'),
    stylish = require('gulp-jscs-stylish'),
    syntaxScss = require('postcss-scss'),
    tag_version = require('gulp-tag-version'),
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

gulp.task('styles:build', function() {
  gulp.src(paths.styles.src)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.build.dest));
});


// Scripts tasks

gulp.task('scripts', function() {
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

gulp.task('scripts:build', function() {
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
  // gulp.watch(paths.scripts.src, ['scripts']);
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
    'cleanup',
    'scripts:build',
    'styles:build',
    'compile',
    'copy',
    callback);
});

// Bump version number
var getPackageJson = function () {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

gulp.task('bump', function() {
  // Get version number
  var pkg = getPackageJson();
  var newVer = semver.inc(pkg.version, 'patch');

  if (argv.minor) {
    newVer = semver.inc(pkg.version, 'minor');
  } else if (argv.major) {
    newVer = semver.inc(pkg.version, 'major');
  }

  gulp.src('./sass/style.scss')
    .pipe(bump({
      version: newVer
    }))
    .pipe(gulp.dest('./sass'));

  gulp.src(['./package.json', './style.css'])
    .pipe(bump({
      version: newVer
    }))
    .pipe(gulp.dest('./'));
});

// Add git tag task
gulp.task('tag', function() {
  return gulp.src(['./package.json']).pipe(tag_version());
});

// Release task
gulp.task('release', function() {
  gulp.src('./'+projectName+'.zip')
    .pipe(release({
      token: '59f3e0b80a8c6dfa12a4cbff5c44c966ba8cda31',    // or you can set an env var called GITHUB_TOKEN instead
      owner: 'bryanstedman',                                // if missing, it will be extracted from manifest (the repository.url field)
      repo: 'bug-free-octo-garbanzo',                       // if missing, it will be extracted from manifest (the repository.url field)
      manifest: require('./package.json')                   // package.json from which default values will be extracted if they're missing
    }));
});
