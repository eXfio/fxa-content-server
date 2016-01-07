/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  var path = require('path');

  var CONFIG_ROOT = path.join(__dirname, '..', 'server', 'config');
  var TARGET_TO_CONFIG = {
  };

  grunt.registerTask('selectconfig', 'Select configuration files for the running environment.', function (target) {

    // Config files specified in CONFIG_FILES env variable override everything
    // else. awsbox instances use this variable to specify ephemeral
    // configuration like public_url.
    // NOTE: By default, the ./config/<env>.json file is loaded first, i.e. 
    // development.json and production.json for the development and production env 
    // resepectively. Finally for the development env if the config file is missing
    // it defaults to local.json. See server/lib/configuration.js
    if ( !process.env.CONFIG_FILES && target in TARGET_TO_CONFIG ) {
      process.env.CONFIG_FILES = TARGET_TO_CONFIG[target];
    }

    //  Invalidate cache to ensure that config module is reloaded taking CONFIG_FILES into account
    delete require.cache[require.resolve('../server/lib/configuration')];

    // `server` is a shortcut to the server configuration
    var serverConfig = require('../server/lib/configuration').getProperties();
    grunt.config.set('server', serverConfig);
  });
};
