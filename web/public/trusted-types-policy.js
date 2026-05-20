(function () {
  var trustedTypes = window.trustedTypes;

  if (!trustedTypes) {
    return;
  }

  try {
    if (
      typeof trustedTypes.getPolicyNames === "function" &&
      trustedTypes.getPolicyNames().indexOf("default") !== -1
    ) {
      return;
    }
  } catch {
    // Fall through and let createPolicy decide in browsers without this API.
  }

  var trustedScriptPaths = {
    "/_vercel/insights/script.js": true,
    "/_vercel/speed-insights/script.js": true,
  };
  var trustedVercelScriptOrigin = "https://va.vercel-scripts.com";
  var trustedVercelScriptPaths = {
    "/v1/script.js": true,
    "/v1/script.debug.js": true,
    "/v1/speed-insights/script.js": true,
    "/v1/speed-insights/script.debug.js": true,
  };

  var isTrustedScriptUrl = function (value) {
    try {
      var url = new URL(value, window.location.origin);
      if (url.origin === window.location.origin) {
        return Boolean(trustedScriptPaths[url.pathname]);
      }

      return (
        url.origin === trustedVercelScriptOrigin &&
        Boolean(trustedVercelScriptPaths[url.pathname])
      );
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
