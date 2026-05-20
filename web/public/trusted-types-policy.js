(function () {
  var trustedTypes = window.trustedTypes;

  if (!trustedTypes) {
    return;
  }

  var trustedScriptPaths = {
    "/_vercel/insights/script.js": true,
    "/_vercel/speed-insights/script.js": true,
  };

  var isTrustedScriptUrl = function (value) {
    try {
      var url = new URL(value, window.location.origin);
      return url.origin === window.location.origin && Boolean(trustedScriptPaths[url.pathname]);
    } catch {
      return false;
    }
  };

  try {
    trustedTypes.createPolicy("default", {
      createHTML: function (value) {
        return value;
      },
      createScriptURL: function (value) {
        if (isTrustedScriptUrl(value)) {
          return value;
        }

        throw new TypeError("Untrusted script URL: " + value);
      },
    });
  } catch {
    // The app can be mounted more than once during local development.
  }
})();
