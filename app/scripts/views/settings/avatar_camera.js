/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var AuthErrors = require('lib/auth-errors');
  var AvatarMixin = require('views/mixins/avatar-mixin');
  var Camera = require('lib/camera');
  var Cocktail = require('cocktail');
  var Constants = require('lib/constants');
  var Environment = require('lib/environment');
  var FormView = require('views/form');
  var ModalSettingsPanelMixin = require('views/mixins/modal-settings-panel-mixin');
  var p = require('lib/promise');
  var ProfileImage = require('models/profile-image');
  var ProgressIndicator = require('views/progress_indicator');
  var Template = require('stache!templates/settings/avatar_camera');

  var DISPLAY_LENGTH = Constants.PROFILE_IMAGE_DISPLAY_SIZE;
  var EXPORT_LENGTH = Constants.PROFILE_IMAGE_EXPORT_SIZE;

  // a blank 1x1 png
  var PNG_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQYV2P4DwABAQEAWk1v8QAAAABJRU5ErkJggg==';


  var View = FormView.extend({
    template: Template,
    className: 'avatar-camera',
    viewName: 'settings.avatar.camera',

    context: function () {
      return {
        streaming: this.streaming
      };
    },

    initialize: function (options) {
      var self = this;

      self.exportLength = options.exportLength || EXPORT_LENGTH;
      self.displayLength = options.displayLength || DISPLAY_LENGTH;
      self.streaming = false;
    },

    beforeRender: function () {
      var environment = new Environment(this.window);
      if (! environment.hasGetUserMedia()) {
        // no camera support, send user back to the change avatar page.
        this.navigate('settings/avatar/change', {
          error: AuthErrors.toError('NO_CAMERA')
        });
        return false;
      }
    },

    afterRender: function () {
      var self = this;
      self._avatarProgressIndicator = new ProgressIndicator();
      self._avatarProgressIndicator.start(self.$('.progress-container'));

      self._enablePreview()
        .then(function () {
          self.streaming = true;

          self.$('.progress-container').addClass('hidden');
          self.$('#video').removeClass('hidden');

          self._centerPreview();

          self.enableSubmitIfValid();
          self._avatarProgressIndicator.done();
        })
        .fail(function (err) {
          console.error('uh oh', String(err));
          self.displayError(AuthErrors.toError('NO_CAMERA'));
        });
    },

    _enablePreview: function () {
      var self = this;
      return p().then(function () {

        var videoEl = self.$('#video')[0];
        var previewEl = videoEl;
        var snapshotSource = videoEl;

        if (self.broker.isAutomatedBrowser()) {
          snapshotSource = new Image();
          snapshotSource.src = PNG_SRC;
        }

        self._camera = new Camera({
          previewEl: previewEl,
          snapshotSource: snapshotSource
        });

        if (self.broker.isAutomatedBrowser()) {
          // no actual camera in when automated testing, continue anyways.
          return p(null);
        } else {
          return self._camera.enablePreview();
        }
      });
    },


    _centerPreview: function () {
      if (this.broker.isAutomatedBrowser()) {
        // automated browser, no stream to center
        return;
      }

      var $video = this.$('#video');
      var videoEl = $video[0];
      var vw = videoEl.videoWidth;
      var vh = videoEl.videoHeight;

      var width;
      var height;

      if (vh > vw) {
        // The camera is in portrait mode
        width = this.displayLength;
        height = vh / (vw / width);
      } else {
        // The camera is in landscape mode
        height = this.displayLength;
        width = vw / (vh / height);
      }

      $video.height(height);

      var pos = this._camera.centeredPos(width, height, this.displayLength);
      var $wrapper = this.$('#avatar-camera-wrapper');
      $wrapper.css({ marginLeft: pos.left, marginTop: pos.top });
    },

    isValidEnd: function () {
      return this.streaming;
    },

    submit: function () {
      var self = this;
      var account = self.getSignedInAccount();
      self.logAccountImageChange(account);

      return self.takePicture()
        .then(function (data) {
          return account.uploadAvatar(data);
        })
        .then(function (result) {
          self._camera.disablePreview();
          self.streaming = false;

          self.updateProfileImage(new ProfileImage(result), account);
          self.navigate('settings');
          return result;
        });
    },

    beforeDestroy: function () {
      if (this._camera) {
        this._camera.disablePreview();
      }
      this.streaming = false;
    },

    takePicture: function () {
      return this._camera.getSnapshot(this.exportLength, this.exportLength);
    }
  });

  Cocktail.mixin(
    View,
    AvatarMixin,
    ModalSettingsPanelMixin
  );

  module.exports = View;
});
