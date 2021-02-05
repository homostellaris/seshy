[**Seshy** is available on the Chrome Web Store](https://chrome.google.com/webstore/detail/seshy/noeieddjehppejohbbchbcmheecaneac) but be aware that it is pre-1.0 and so some minor bugs can be expected.

# What is Seshy?
A Chrome window is not always a throwaway set of tabs, sometimes it is an ongoing *session* with the same lifecycle as the task you are working on. The problem is that tasks can be easily put down and picked back up again but browsing sessions cannot. **Seshy** aims to solve that problem.

To **Seshy**, every Chrome window is a *session*. If a *session* is marked as *saved* when it becomes persistent and is stored in a bookmark folder. Tabs are stored as bookmarks in the session's bookmark folder and are updated (almost) immediately whenever something changes about them. In fact, you can view Seshy simply as an extension that maps windows to *sessions* and tabs to *bookmarks* and provides a UI for browsing and resuming them.

# Testing
Note: Tests are currently being migrated to Jest and Playwright but there is an [outstanding bug](https://github.com/microsoft/playwright/issues/2676) blocking the use of Playwright.

# Contributing
Just raise a PR :)
