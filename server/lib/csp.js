/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Middleware to take care of CSP. CSP headers are not sent unless config
// option 'csp.enabled' is set (default true in development), with special
// exceptions for paths /tests/index.html and /unit-tests/index.html, which
// are the frontend unit tests.

var helmet = require('helmet');
var config = require('./configuration');
var url = require('url');
var SELF = "'self'";
var DATA = 'data:';
var BLOB = 'blob:';
var GRAVATAR = 'https://secure.gravatar.com';

function requiresCsp(req) {
  // is the user running tests? No CSP.
  console.log('DEBUG! req.path is `%s`', req.path);
  return req.path !== '/tests/index.html' && req.path !== '/unit-tests/index.html';
}

function getOrigin(link) {
  var parsed = url.parse(link);
  return parsed.protocol + '//' + parsed.host;
}

var cspMiddleware = helmet.csp({
  connectSrc: [
    SELF,
    getOrigin(config.get('fxaccount_url')),
    config.get('oauth_url'),
    config.get('profile_url'),
    config.get('marketing_email.api_url')
  ],
  defaultSrc: [SELF],
  imgSrc: [
    SELF,
    DATA,
    GRAVATAR,
    config.get('profile_images_url')
  ],
  mediaSrc: [BLOB],
  reportOnly: config.get('csp.reportOnly'),
  reportUri: config.get('csp.reportUri')
});

module.exports = function (req, res, next) {
  if (! requiresCsp(req)) {
    return next();
  }

  cspMiddleware(req, res, next);
};
