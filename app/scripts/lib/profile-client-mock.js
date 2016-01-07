/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This module handles communication with the fxa-profile-server.

define(function (require, exports, module) {
  'use strict';

  var ProfileErrors = require('lib/profile-errors');
  var xhr = require('lib/xhr');
  var p = require('lib/promise');

  function ProfileClient(options) {
    options = options || {};
    this.profileUrl = options.profileUrl;
  }

  ProfileClient.prototype.setMockAttributes = function(args) {
    this.email      = args.email;    
    this.uid        = args.uid;
  };

  ProfileClient.prototype.returnPromise = function (data) {
    return p(data);
  };

  // Returns the user's profile data
  // including: email, uid, displayName, avatar
  ProfileClient.prototype.getProfile = function (accessToken) {
    //return this._request('/v1/profile', 'get', accessToken);
    //var result = this._request('/v1/profile', 'get', accessToken);
    //console.log("result:");
    //console.dir(result);
    return this.returnPromise({
      email: this.email,
      uid: this.uid
    });
  };

  ProfileClient.prototype.getAvatar = function (accessToken) {
    //return this._request('/v1/avatar', 'get', accessToken);
    //var result = this._request('/v1/avatar', 'get', accessToken);
    //console.log("result:");
    //console.dir(result);
    return this.returnPromise({});
  };

  ProfileClient.prototype.getAvatars = function (accessToken) {
    //return this._request('/v1/avatars', 'get', accessToken);
    return this.returnPromise({});
  };

  ProfileClient.prototype.postAvatar = function (accessToken, url, selected) {
    //return this._request('/v1/avatar', 'post', accessToken, {
    //  selected: selected,
    //  url: url
    //});
    return this.returnPromise({});
  };

  ProfileClient.prototype.deleteAvatar = function (accessToken, id) {
    //return this._request('/v1/avatar/' + id, 'delete', accessToken);
    return this.returnPromise({});
  };

  ProfileClient.prototype.uploadAvatar = function (accessToken, data) {
    //return this._request('/v1/avatar/upload', 'post', accessToken, data, {
    //  'Content-type': data.type
    //});
    return this.returnPromise({});
  };

  ProfileClient.prototype.getDisplayName = function (accessToken) {
    //return this._request('/v1/display_name', 'get', accessToken);
    return this.returnPromise({});
  };

  ProfileClient.prototype.postDisplayName = function (accessToken, displayName) {
    //return this._request('/v1/display_name', 'post', accessToken, {
    //  displayName: displayName
    //});
    return this.returnPromise({});
  };

  ProfileClient.Errors = ProfileErrors;

  return ProfileClient;
});

