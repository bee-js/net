var gulp  = require('gulp'),
    mocha = require('gulp-mocha-phantomjs');

gulp.task('test', function() {
  return gulp
    .src('test/test.html')
    .pipe(mocha({reporter: 'dot'}));
});
