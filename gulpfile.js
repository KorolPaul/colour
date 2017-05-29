"use strict"

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    connect = require('gulp-connect'),
    image = require('gulp-image'),
    autoprefixer = require('gulp-autoprefixer');

gulp.task('html', function () {
    gulp.src('*.html')
      .pipe(connect.reload());
});

gulp.task('img', function () {
    gulp.src('img/**/*.{png,jpg,gif,svg}')
      .pipe(image())
      .pipe(gulp.dest('/img'));
});

gulp.task('sass', function () {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./'))
        .pipe(connect.reload());
});

gulp.task('js', function () {
    gulp.src('./js/**/*.js')
      .pipe(babel({
         presets: ['es2015']
        }))
      .pipe(concat('script.js'))
      //.pipe(uglify())
      .pipe(gulp.dest('./'))
      .pipe(connect.reload());
});


gulp.task('watch', function () {
    gulp.watch(['*.html', './scss/**/*.scss'], ['html', 'sass']);
});

gulp.task('default', function () {
    gulp.run('watch');
});