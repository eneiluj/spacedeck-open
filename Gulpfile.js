const gulp = require('gulp')
const sass = require('gulp-sass')
const concat = require('gulp-concat')
const config = require('config')
console.debug(config.get('endpoint'))

gulp.task('styles', function(done) {
  gulp.src('styles/**/*.scss')
    .pipe(sass({
        errLogToConsole: true
    }))
    .pipe(gulp.dest('./public/stylesheets/'))
    .pipe(concat('style.css'))
  done()
})
