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
          {
            expand: true,
            cwd: 'main/',
            src: ['**'],
            dest: 'output/'
          },
          {
            src: [
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
        cmd: 'node output/test/run-tests.js'
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
    },

    compress: {
      main:{
        files: [
          {
            expand: true,
            cwd: 'main/',
            src: ['**']
          },
          {
            src: [
              'node_modules/material-components-web/dist/material-components-web.js',
            ]
          },
          {
            expand: true,
            src: [
              'node_modules/material-components-web/dist/material-components-web.css',
            ]
          },
        ],
        options: {
          archive: 'output/seshy.zip',
          mode: 'zip'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-crx');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['lint', 'clean', 'copy', 'crx:createTestArtefact', 'exec:test']);
  // TODO Can selectively copy files into CRX so earlier copy and clean tasks may be unnecessary.
  grunt.registerTask('run', ['clean', 'copy:main', 'exec:run']);
  grunt.registerTask('publish', ['clean', 'lint', 'compress:main']);
};
