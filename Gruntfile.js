module.exports = function(grunt) {

  grunt.initConfig({

    eslint: {
      target: [
        'main/js/init.js',
        'main/js/seshy-lib.js',
        'main/js/session-manager.js',
        'test/*.js',
        'test/spec/*.js'
      ]
    },

    clean: {
      output: 'output/*'
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
          {
            expand: true,
            src: ['main/**'],
            dest: 'output/'
          },
          {
            expand: true,
            flatten: true,
            src: [
              'node_modules/mousetrap/mousetrap.min.js',
              'node_modules/material-components-web/dist/material-components-web.js',
            ],
            dest: 'output/main/js/'
          },
          {
            expand: true,
            flatten: true,
            src: [
              'node_modules/material-components-web/dist/material-components-web.css',
            ],
            dest: 'output/main/css/'
          },
        ]
      }
    },

    exec: {
      test: {
        cmd: 'node test/run-tests.js'
      },
      run: {
        cmd: 'google-chrome-unstable --load-extension="output/main/" --disable-gpu --auto-open-devtools-for-tabs'
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
  grunt.registerTask('test', ['lint', 'clean:output', 'copy:test', 'crx:createTestArtefact', 'exec:test']);
  grunt.registerTask('run', ['clean:output', 'copy:main', 'exec:run']);
};
