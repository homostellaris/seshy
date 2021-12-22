The tests use Playwright to automate a Chrome browser and load the bundled extension.

# Concepts
Its helpful to understand the following concepts to make sense of the tests.

## Chrome
### Window
A collection of tabs.
### Tab
A single page.

## Playwright
### Browser
An instance of a browser process.
### Context
You can have multiple users with their own windows and tabs in Chrome, each one has their own browser context. Opening an incognito window also starts a new context.
### Page
Equivalent to a Chrome tab.
### Frame
Iframes and web workers are examples of frames that belong to a parent page.

# Notes on the test implementation
For some purposes it is easier to use the Chrome API rather than the Playwright API (for example closing a window as Playwright has no concept of this, it just sees a bunch of pages in the context). In these cases Playwrights 'evaluate' method is used to execute code in the extension page where the Chrome API is available.
