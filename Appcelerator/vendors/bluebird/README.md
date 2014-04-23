bluebird
===

bluebird Promise library by Petka Antonov available at https://github.com/petkaantonov/bluebird

This export contains only the "core" features (see repository details about build types) needed to work in titanium & browser

To use a custom one, override `compose.util.getPromiseLib()`

Changes
---

In `bluebird/titanium`

- `.js` suffixes in all require() call has been removed.
- Updated global.js to export correct function set
