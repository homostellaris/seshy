module.exports = function(grunt) {

  grunt.initConfig({

    eslint: {
      target: [
        'main/js/init.js',
        'main/js/seshy-lib.js',
        'main/js/session-manager.js'
      ]
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
        cmd: 'node test/run-tests.js'
      },
      run: {
        cmd: 'google-chrome-stable --load-extension="/home/dan/The Laboratory/Seshy/output/main/"'
      },
      createTestArtefact: {
        // Creates output/test.crx which can then be loaded by Chrome Driver for running the tests.
        cmd: 'google-chrome-stable --pack-extension=output/test/ --pack-extension-key=seshy-development.pem  --disable-gpu'
      }
    },

    crx: {
      createTestArtefact: {
        src: 'output/test/**/*',
        dest: 'output/test.crx',
        options: {
          privateKey: 'seshy-development.pem'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-crx');

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['lint', 'clean:test', 'copy:test', 'crx:createTestArtefact', 'exec:test']);
  grunt.registerTask('run', ['clean:main', 'copy:main', 'exec:run']);
};
