module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      version: '<%= pkg.version %>'
    },

    clean: {
      lib: 'lib'
    },

    coffee: {
      compile: {
        options: {
          bare: true
        },
        files: [
          {
            expand: true,
            cwd: "src",
            src: "**/*.coffee",
            dest: "tmp/build",
            ext: ".js"
          }
        ]
      }
    },

    preprocess: {
      core: {
        src: 'tmp/build/build/core.js',
        dest: 'tmp/core.js'
      }
    },

    template: {
      options: {
        data: {
          version: '<%= pkg.version %>'
        }
      },
      core: {
        src: '<%= preprocess.core.dest %>',
        dest: '<%= preprocess.core.dest %>'
      }
    },

    concat: {
      core: {
        src: '<%= preprocess.core.dest %>',
        dest: 'lib/bbcodeparser.js'
      }
    },

    uglify : {
      core: {
        src : '<%= concat.core.dest %>',
        dest : 'lib/bbcodeparser.min.js',
        options : {
          sourceMap : 'lib/bbcodeparser.map',
          sourceMappingURL : 'bbcodeparser.map',
          sourceMapPrefix : 1
        }
      }
    }

  });

  grunt.registerTask('default', 'An alias task for running dev.', ['build']);

  grunt.registerTask('build', 'Build all three versions of the library.', ['clean:lib', 'coffee', 'preprocess', 'template', 'concat', 'uglify']);
};