module.exports = function(grunt) {

  grunt.initConfig({

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
          {expand: true, cwd: 'main/', src: ['seshy-lib.js'], dest: 'output/test/'}
        ]
      }
    },

    exec: {
      runTest: {
        cmd: 'google-chrome-unstable --load-extension="/home/dan/The Laboratory/Seshy/output/test/"'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('test', ['clean:test', 'copy:test', 'exec:runTest']);
};
