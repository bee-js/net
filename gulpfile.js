var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var del = require('del');
var mkdirp = require('mkdirp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var file = require('gulp-file');
var esperanto = require('esperanto');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha-phantomjs');

// Disable: modules, classes, unicodeRegex, forOf
var babelOpts = {
  whitelist: [
    'spec.undefinedToVoid',    // https://6to5.org/docs/usage/transformers/#spec-undefined-to-void
    'es6.arrowFunctions',      // https://6to5.org/docs/learn-es6/#arrows
    'es6.blockScoping',        // https://6to5.org/docs/learn-es6/#let-const
    'es6.constants',           // https://6to5.org/docs/learn-es6/#let-const
    'es6.destructuring',       // https://6to5.org/docs/learn-es6/#destructuring
    'es6.parameters',          // https://6to5.org/docs/learn-es6/#default-rest-spread
    'es6.spread',              // https://6to5.org/docs/learn-es6/#default-rest-spread
    'es6.templateLiterals',    // https://6to5.org/docs/learn-es6/#template-strings
    'es6.properties.computed', // https://6to5.org/docs/learn-es6/#enhanced-object-literals
    'es6.properties.shorthand' // https://6to5.org/docs/learn-es6/#enhanced-object-literals
  ]
};

var destinationFolder = 'build/';

var config = {
  entryFileName: 'net.js',
  exportFileName: 'net'
};

gulp.task('js:babel', function() {
  return gulp.src('src/net.js')
    .pipe(sourcemaps.init())
    .pipe(babel(babelOpts))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('tmp'));
});

gulp.task('clean-tmp', function(cb) {
  del(['tmp'], cb);
});

gulp.task('test:build', function(done) {
  esperanto.bundle({
    base: 'test',
    entry: 'specs.js'
  }).then(function(bundle) {
    var res = bundle.concat({
      sourceMap: true,
      sourceMapFile: 'test.js',
      sourceMapName: 'test.js.map'
    });

    // Write the generated sourcemap
    mkdirp.sync('tmp');
    fs.writeFileSync(path.join('tmp', 'specs.js'), res.map.toString());

    file('specs.js', res.code, { src: true })
      .pipe(plumber())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(babel(babelOpts))
      .pipe(sourcemaps.write('./', { addComment: false }))
      .pipe(gulp.dest('tmp/'))
      .on('end', done)
  }).catch(done);
});

gulp.task('test', ['test:build'], function() {
  return gulp.src('test/test.html')
    .pipe(mocha({ reporter: 'dot' }));
});
