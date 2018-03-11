module.exports = function (grunt) {

  grunt.initConfig({

    eslint: {
      target: [
        'main/js/*',
        'test/*.js',
        'test/spec/**/*.js'
      ]
    },

    clean: {
      output: 'output/**'
    },

    copy: {
      main: {
        files: [
          // Copy all implementation files.
          {
            expand: true,
            cwd: 'main/',
            src: ['**'],
            dest: 'output/'
          },
          {
            src: [
              'node_modules/mousetrap/mousetrap.min.js',
              'node_modules/material-components-web/dist/material-components-web.js',
            ],
            dest: 'output/'
          },
          {
            expand: true,
            src: [
              'node_modules/material-components-web/dist/material-components-web.css',
            ],
            dest: 'output/'
          },
        ]
      },
      test: {
        files: [
          {
            src: ['test/**', '!test/manifest.json', 'node_modules/jasmine-core/lib/jasmine-core/**'],
            dest: 'output/'
          },
          {
            expand: true,
            flatten: true,
            src: ['test/manifest.json'],
            dest: 'output/'
          }
        ]
      }
    },

    exec: {
      test: {
        cmd: 'node test/run-tests.js'
      },
      run: {
        cmd: 'google-chrome-stable --load-extension="output/" --user-data-dir=/tmp/chrome-test-data-dir --no-first-run --disable-gpu'
      }
    },

    crx: {
      createTestArtefact: {
        files: [
          {
            src: [
              'output/**'
            ],
            dest: 'output/test.crx'
          }
        ],
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
  grunt.registerTask('test', ['lint', 'clean', 'copy', 'crx:createTestArtefact', 'exec:test']);
  // TODO Can selectively copy files into CRX so earlier copy and clean tasks may be unnecessary.
  grunt.registerTask('run', ['clean', 'copy:main', 'exec:run']);
};
