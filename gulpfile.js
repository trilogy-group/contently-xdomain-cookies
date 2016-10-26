"use strict";

const gulp = require('gulp'),
	  jshint = require('gulp-jshint'),
      rename = require("gulp-rename"),
      mocha = require('gulp-mocha'),
      runSequence = require('run-sequence'),
      insert = require('gulp-insert'),
      uglify = require('gulp-uglify'),
      argv = require('yargs').argv;

const PACKAGE = require('./package.json');
const ATTIBUTION = `/* Version ${PACKAGE.version} ${PACKAGE.name} (${PACKAGE.homepage}) from Contently (https://github.com/contently) */`+"\n\n";

gulp.task('build', function(cb) {
  runSequence(
  	'lint',
  	'test',
  	'build_files',
    cb);
});      

gulp.task('build_files', ['build_js','copy_html']);

gulp.task('copy_html', function(){
	return gulp.src('./dev/xdomain_cookie.html')
        .pipe(gulp.dest('src'));
});

gulp.task('build_js', ['build_regular_js', 'build_min_js']);

gulp.task('build_regular_js', function(){
	return gulp.src('./dev/xdomain_cookie.dev.js')
        .pipe(insert.prepend(ATTIBUTION))
        .pipe( rename("xdomain_cookie.js") )
        .pipe(gulp.dest('src'));
});

gulp.task('build_min_js', function(){
	return gulp.src('./dev/xdomain_cookie.dev.js')
		.pipe(uglify({mangle:false}))
        .pipe(insert.prepend(ATTIBUTION))
        .pipe( rename("xdomain_cookie.min.js") )
        .pipe(gulp.dest('src'));
});

gulp.task('lint', function(){
	return gulp.src('./dev/**/*')
		.pipe(jshint.extract('auto'))
		.pipe(jshint())
  		.pipe(jshint.reporter('default'))
  		.pipe(jshint.reporter('fail'));
});

//NOTE - can pass in --test=<TEST_FILTER> flag to filter
gulp.task('test', function(){
  var mopts = {
    reporter:'spec',
    fullTrace: true
  };
  if('test' in argv) mopts['grep'] = argv.test;

	return gulp.src('test/test_suite.js', {read:false} )
		.pipe(mocha(mopts))
  	.on("error", function(err) {
  		console.log(err.toString());
  		this.emit('end');
  		process.exit();
  	})
});