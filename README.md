# Link to QR

A static QR-code generator that runs in the browser. The page and its app code
are hosted locally with the site; there are no remote font or script requests.

## Project structure

```text
index.html
assets/
  css/styles.css
  js/app.js
  vendor/
    qrcode.min.js
    LICENSE
```

## Add the QR library

`assets/vendor/qrcode.min.js` must contain the browser-ready `qrcode-generator`
1.4.4 build. The checked-in placeholder may be empty; the app will show an error
until the actual library is added. Obtain the build from the
[qrcode-generator project](https://github.com/kazuhikoarase/qrcode-generator),
verify its version and source, and place its license text in
`assets/vendor/LICENSE`. Do not substitute a file from an untrusted source.

## Run locally

Serve the repository root with any static HTTP server and open its URL. This is
also useful for testing clipboard access, which browsers generally restrict on
insecure origins and local files.

## Publish on GitHub Pages

Push the repository, then select the branch and repository root under
**Settings → Pages**. `index.html` is the site entry point. Asset URLs are
relative so they work both at the domain root and under a repository path.
