"use strict";

// Load plugins
const { watch, series, parallel, src, dest } = require('gulp');
const { platform } = require('os');
const autoprefixer = require('gulp-autoprefixer');
const { init, write } = require('gulp-sourcemaps');
const stylus = require('gulp-stylus');
const rupture = require('rupture');
const { server, reload } = require('gulp-connect');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const gulpif = require('gulp-if');
const debug = require('gulp-debug');
const notify = require('gulp-notify');
const open = require('gulp-open');
const emitty = require('emitty').setup('dev/pug', 'pug', {
	makeVinylFile: true
});


const browser = platform() === 'linux' ? 'google-chrome' : (
  platform() === 'darwin' ? 'google chrome' : (
  platform() === 'win32' ? 'chrome' : 'firefox'));

const openPage = (done) => {
	let options = {
		uri: 'http://localhost:1337',
		app: browser
	};
	src(__filename)
		.pipe(open(options));
	done();
}

const liveReload = (done) => {
  server({
    root: './dist',
    livereload: true,
    port: 1337
  });
  done();
}

const styl = (done) => {
	src('dev/styl/style.styl')
		.pipe(plumber())
		.pipe(debug({title: 'Updated styles :'}))
		.pipe(init())
		.pipe(stylus({
			use: rupture()
		}))
		.pipe(autoprefixer({
				browsers: ['last 2 versions', 'ie 10', 'ie 11'],
		}))
		.pipe(write())
		.pipe(dest('dist/css'))
		.pipe(notify({message: 'Served "<%= file.path %>"'}))
		.pipe(reload())
	done();
}



const templates = (done) => {
	new Promise((resolve, reject) => {
		const sourceOptions = global.watch ? { read: false } : {};

		emitty.scan(global.emittyChangedFile).then(() => {
			src('dev/pug/_pages/*.pug', sourceOptions)
				.pipe(plumber())
				.pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
        .pipe(debug({title: 'Updated pages :'}))
				.pipe(pug({ pretty: true }))
				.pipe(dest('dist'))
        .pipe(reload())
				.on('end', resolve)
        .pipe(notify({message: 'Served "<%= file.path %>"'}))
				.on('error', reject);
		});
	})
	done();
}

const setWatch = (done) => {
  global.watch = true;
  watch('dev/pug/**/*.pug', { ignoreInitial: false }, series( templates ))
  .on('all', (event, filepath) => {
    global.emittyChangedFile = filepath;
  })
	watch('dev/styl/**/*.styl', { ignoreInitial: false }, series( styl ))
  done();
}


exports.default = parallel(setWatch, liveReload, openPage);
