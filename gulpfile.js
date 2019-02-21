"use strict";

// Load plugins
const { watch, series, parallel } = require('gulp');
const gulp = require('gulp');
const os = require('os');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('gulp-stylus');
const rupture = require('rupture');
const connect = require('gulp-connect');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const gulpif = require('gulp-if');
const debug = require('gulp-debug');
const notify = require('gulp-notify');
const open = require('gulp-open');
const emitty = require('emitty').setup('dev/pug', 'pug', {
	makeVinylFile: true
});


const browser = os.platform() === 'linux' ? 'google-chrome' : (
  os.platform() === 'darwin' ? 'google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));

const openPage = (done) => {
	let options = {
		uri: 'http://localhost:1337',
		app: browser
	};
	gulp.src(__filename)
		.pipe(open(options));
	done();
}

const liveReload = (done) => {
  connect.server({
    root: './dist',
    livereload: true,
    port: 1337
  });
  done();
}

const styl = (done) => {
	gulp.src('dev/styl/style.styl')
		.pipe(plumber())
		.pipe(debug({title: 'Updated styles :'}))
		.pipe(sourcemaps.init())
		.pipe(stylus({
			use: rupture()
		}))
		.pipe(autoprefixer({
				browsers: ['last 2 versions', 'ie 10', 'ie 11'],
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/css'))
		.pipe(notify({message: 'Served "<%= file.path %>"'}))
		.pipe(connect.reload())
	done();
}



const templates = (done) => {
	new Promise((resolve, reject) => {
		const sourceOptions = global.watch ? { read: false } : {};

		emitty.scan(global.emittyChangedFile).then(() => {
			gulp.src('dev/pug/*.pug', sourceOptions)
				.pipe(plumber())
				.pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
        .pipe(debug({title: 'Updated pages :'}))
				.pipe(pug({ pretty: true }))
				.pipe(gulp.dest('dist'))
        .pipe(connect.reload())
				.on('end', resolve)
        .pipe(notify({message: 'Served "<%= file.path %>"'}))
				.on('error', reject);
		});
	})
	done();
}

const setWatch = (done) => {
  global.watch = true;
  watch('dev/pug/**/*.pug', { ignoreInitial: false }, gulp.series( templates ))
  .on('all', (event, filepath) => {
    global.emittyChangedFile = filepath;
  })
	watch('dev/styl/**/*.styl', { ignoreInitial: false }, gulp.series( styl ))
  done();
}


exports.default = parallel(setWatch, liveReload, openPage);
