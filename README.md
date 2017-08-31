# Seshy
Chrome extension for effortlessly syncing browsing sessions.

# Testing
### Run Tests
Install Google Chrome from [the dev release channel](https://www.chromium.org/getting-involved/dev-channel).
*Dev version is necessary for the `--load-extension` command line option for Chrome that Grunt uses under the hood.*
1. `[sudo] npm install`
2. `grunt test`

### Methodology
The way the tests work is a little wacky but allow me to explain.

Jasmine for the browser is used rather than Jasmine for Node because it means that the actual Chrome APIs can be used making the tests more 'live-like'.

The difficulty with this is that there is no easy way to get the test results and act upon them in order to appropriately pass or fail Travis jobs. The solution is convoluted but effective:

- Chrome Driver is used to start a Chrome instance with the test extension loaded.
- The test extension automatically navigates to the spec runner when it is loaded which runs the tests.
- DOM inspection is used from the Chrome Driver to get the test results and return an appropriate exit code.

The key here is that Chrome Driver has greater access to the host system than a browser does so it is much easier to return the exit code Travis needs.
