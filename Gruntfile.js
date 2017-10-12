module.exports = function(grunt) {

  grunt.initConfig({

    eslint: {
      target: [
        'main/js/*',
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
          {expand: true, src: ['test/**'], dest: 'output/'}
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
        cmd: 'google-chrome-stable --pack-extension=output/ --pack-extension-key=seshy-development.pem  --disable-gpu'
      },
    },

    crx: {
      createTestArtefact: {
        src: ['test/**/*', 'main/**/*', '!main/manifest.json'],
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
  // TODO Can selectively copy files into CRX so earlier copy and clean tasks may be unnecessary.
  grunt.registerTask('test', ['lint', 'clean:output', 'copy:main', 'copy:test', 'crx:createTestArtefact', 'exec:test']);
  grunt.registerTask('run', ['clean:output', 'copy:main', 'exec:run']);
};
