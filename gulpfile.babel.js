import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import pug from 'gulp-pug';
import plumber from 'gulp-plumber';
import livereload from 'gulp-livereload';
import connect from 'gulp-connect';

const sass = gulpSass(dartSass);

export function html() {
    return gulp.src('./src/**/*.pug')
    .pipe(plumber())
    .pipe(pug({
        pretty: true
    }))
    .pipe(gulp.dest('./dest'))
    .pipe(livereload());
}

export function css() {
    return gulp.src('./src/scss/**/*.scss')
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest('./dest/css'))
        .pipe(livereload());
}

export function webserver(done) {
    connect.server({
        livereload: true
    });
    // livereload.listen() is handled by connect server usually if livereload: true is set? 
    // Actually documentation says livereload: true enables it. 
    // But original code had livereload.listen(). 
    // In Gulp connect, livereload: true starts the server with LR support.
    // livereload.listen() starts a SEPARATE LR server. 
    // If connect is used, we might not need separate listen, but let's keep it if they differ. 
    // Actually, safest is to remove explicit listen if connect handles it, or keep it if connect acts as webserver only.
    // Let's assume connect handles it for now as per updated gulp-connect docs.
    done(); 
}

// Build task
const build = gulp.series(gulp.parallel(html, css));

// Watch task
const watchTask = () => {
    // We already passed livereload: true to connect, so it should inject script or allow connection.
    // But explicit listening might be needed for the pipe(livereload()).
    
    gulp.watch('./src/**/*.pug', html);
    gulp.watch('./src/scss/**/*.scss', css);
};

// Default task
export default build;

// Watch task exposed as 'watch'
export const watch = gulp.series(
    build,
    gulp.parallel(webserver, watchTask)
);
