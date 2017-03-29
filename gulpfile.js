'use strict';
const gulp = require("gulp");
const gutil = require('gulp-util');
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");

const runSequence = require('run-sequence');
const del = require('del');

const _ = require('lodash');

gulp.task('lib-clean', function() {
  return del('./lib/**/*');
});

gulp.task("tslint", () =>
  gulp.src(['src/**/*.ts'])
    .pipe(tslint({
      formatter: "verbose",
      configuration: {
        rules: {
          quotemark: [true, 'single', 'avoid-escape']
        }
      }
    }))
    .pipe(tslint.report())
);

gulp.task('lib-compile', function() {
  let tsProject = ts.createProject('tsconfig.json');
  let dtsgen = require('dts-generator').default;
  dtsgen({ 
    name: 'racl', 
    baseDir: 'src/',
    project: './',
    files: ['src/**/*.ts'],
    out: 'lib/index.d.ts'
  });
  return gulp.src(['src/**/*.ts'])
    .pipe(tsProject())
    .js
    .pipe(gulp.dest('./lib'));
});

gulp.task('lib-copy', function() {
  return gulp.src(['src/**/*.json'])
    .pipe(gulp.dest('./lib'));
});

gulp.task('lib', function(callback) {
  return runSequence(
    ['lib-clean'],
    ['tslint'],
    ['lib-compile','lib-copy'],
    callback
  );
});

gulp.task('default', ['lib']);
