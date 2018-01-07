module.exports = function(grunt) {

  grunt.initConfig({

    eslint: {
      target: [
        'main/js/*',
        'test/*.js',
        'test/spec/**/*.js'
      ]
    },

    clean: {
      output: 'output/*'
    },

    copy: {
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
        cmd: 'node test/run-tests-2.js'
      },
      run: {
        cmd: 'google-chrome-unstable --load-extension="output/main/" --disable-gpu --auto-open-devtools-for-tabs'
      }
    },

    crx: {
      createTestArtefact: {
        src: [
          'test/**/*',
          'main/**/*',
          '!main/manifest.json',
          'node_modules/material-components-web/dist/material-components-web.js',
          'node_modules/material-components-web/dist/material-components-web.css',
          'main/css/session-manager.css'
        ],
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
  grunt.registerTask('test', ['lint', 'crx:createTestArtefact', 'exec:test']);
  // TODO Can selectively copy files into CRX so earlier copy and clean tasks may be unnecessary.
  grunt.registerTask('run', ['clean:output', 'copy:main', 'exec:run']);
};
