var gulp  = require('gulp'),
    mocha = require('gulp-mocha');

require('amd-loader');
require('node-amd-require')({
  paths: {
    'bee':             'src',
    'bee/util':        'vendor/util',
    'querystring':     'vendor/querystring',
    'promise':         'vendor/promise',
    'specs':           'test/specs'
  }
});

gulp.task('test', function () {
  global.expect = require('chai').expect;
  global.sinon  = require('sinon');

  return gulp.src('test/specs/*Spec.js', {read: false})
             .pipe(mocha({reporter: 'dot'}));
});
