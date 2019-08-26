var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
    ' * DataLoudLabs - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2018-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('less/*.less')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('dist/css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy JS to dist
gulp.task('js', function() {
    return gulp.src(['js/*.js'])
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
})

// Minify JS
gulp.task('minify-js', ['js'], function() {
    return gulp.src('js/*.js')
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy vendor libraries from /public/lib into /vendor
gulp.task('copy', function() {
    gulp.src(['public/lib/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('vendor/bootstrap'))

    gulp.src(['public/lib/bootstrap-social/*.css', 'public/lib/bootstrap-social/*.less', 'public/lib/bootstrap-social/*.scss'])
        .pipe(gulp.dest('vendor/bootstrap-social'))

    gulp.src(['public/lib/font-awesome/**/*', '!public/lib/font-awesome/*.json', '!public/lib/font-awesome/.*'])
        .pipe(gulp.dest('vendor/font-awesome'))

    gulp.src(['public/lib/jquery/dist/jquery.js', 'public/lib/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('vendor/jquery'))

    gulp.src(['public/lib/handsontable/dist/handsontable.full.js', 'public/lib/handsontable/dist/handsontable.full.min.js'])
        .pipe(gulp.dest('vendor/handsontable'))
    gulp.src(['public/lib/handsontable/dist/handsontable.full.css', 'public/lib/handsontable/dist/handsontable.full.min.css'])
        .pipe(gulp.dest('vendor/handsontable'))

    gulp.src(['public/lib/d3/d3.js', 'public/lib/d3/d3.min.js'])
        .pipe(gulp.dest('vendor/d3'))

    gulp.src(['public/lib/knockout/dist/knockout.js', 'public/lib/knockout/dist/knockout.debug.js'])
        .pipe(gulp.dest('vendor/knockout'))

    gulp.src(['public/lib/d3brush-util/dist/js/d3brush-util.js', 'public/lib/d3brush-util/dist/js/d3brush-util.min.js'])
        .pipe(gulp.dest('vendor/d3brush-util')) 

    gulp.src(['public/lib/lodash/dist/lodash.min.js', 'public/lib/lodash/dist/lodash.fp.min.js'])
        .pipe(gulp.dest('vendor/lodash')) 

    gulp.src(['public/lib/graphlib/dist/graphlib.core.min.js'])
        .pipe(gulp.dest('vendor/graphlib')) 

    gulp.src(['public/lib/dagre/dist/dagre.core.min.js'])
        .pipe(gulp.dest('vendor/dagre')) 

    gulp.src(['public/lib/dagre-d3/dist/dagre-d3.core.min.js'])
        .pipe(gulp.dest('vendor/dagre-d3')) 

    gulp.src(['node_modules/js-yaml/dist/*'])
        .pipe(gulp.dest('vendor/js-yaml')) 



})

// Run everything
gulp.task('default', ['minify-css', 'minify-js', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: './'
        },
    })
})

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'less', 'minify-css', 'js', 'minify-js'], function() {
    gulp.watch('less/*.less', ['less']);
    gulp.watch('dist/css/*.css', ['minify-css']);
    gulp.watch('js/*.js', ['minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('pages/*.html', browserSync.reload);
    gulp.watch('dist/js/*.js', browserSync.reload);
});
