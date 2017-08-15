module.exports = function(grunt) {

  grunt.initConfig({

    eslint: {
      options: {
        configFile: '.eslintrc.js',
      },
      target: ['main/*']
    },

    clean: {
      test: 'output/test',
      main: 'output/main'
    },

    copy: {
      test: {
        files: [
          // Copy all test files.
          {expand: true, src: ['test/**'], dest: 'output/'},
          // Copy necessary implementation files.
          {
            expand: true,
            cwd: 'main/js',
            src: ['init.js', 'seshy-lib.js', 'session-manager.js', '../../node_modules/mousetrap/mousetrap.min.js'],
            dest: 'output/test/'
          }
        ]
      },
      main: {
        files: [
          // Copy all implementation files.
          {expand: true, src: ['main/**', 'node_modules/mousetrap/mousetrap.min.js'], dest: 'output/'}
        ]
      }
    },

    exec: {
      test: {
        cmd: 'google-chrome-unstable --load-extension="/home/dan/The Laboratory/Seshy/output/test/"'
      },
      run: {
        cmd: 'google-chrome-unstable --load-extension="/home/dan/The Laboratory/Seshy/output/main/"'
      }
    }

  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['clean:test', 'copy:test', 'exec:test']);
  grunt.registerTask('run', ['clean:main', 'copy:main', 'exec:run']);
};
