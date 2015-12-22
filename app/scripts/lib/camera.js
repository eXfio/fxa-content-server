/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Preview and capture an image from the device's camera.
 */

define(function (require, exports, module) {
  'use strict';

  var AuthErrors = require('lib/auth-errors');
  var canvasToBlob = require('canvasToBlob'); //eslint-disable-line no-unused-vars
  var Constants = require('lib/constants');
  var p = require('lib/promise');
  var WebRTC = require('webrtc');

  var JPEG_QUALITY = Constants.PROFILE_IMAGE_JPEG_QUALITY;
  var MIME_TYPE = Constants.DEFAULT_PROFILE_IMAGE_MIME_TYPE;
  var FX18_LOADEDMETADATA_EVENT_DELAY_MS = 1000;

  function Camera(options) {
    this._previewEl = options.previewEl;
    this._snapshotSource = options.snapshotSource;
  }

  Camera.prototype = {
    /**
     * Enable preview, turns on the device's camera, updates
     * the previewEl set on startup.
     *
     * @returns {promise} resolves with the video stream
     */
    enablePreview: function () {
      var previewEl = this._previewEl;

      return p.all([
        // waitForLoadedMetaData is first in the array because it
        // binds to an event listener that could be called before
        // getVideoStream completes
        this._waitForLoadedMetaData(previewEl),
        this._getVideoStream(previewEl),
      ]).spread(function (unused, stream) {
        var vw = previewEl.videoWidth;
        var vh = previewEl.videoHeight;

        // Log metrics if these are 0; something with the browser/machine isn't right
        if (vh === 0 || vw === 0) {
          throw AuthErrors.toError('INVALID_CAMERA_DIMENSIONS');
        }

        return stream;
      });
    },

    /**
     * Get a video stream, handling cross browser and API differences.
     *
     * @private
     * @param {object} previewEl - video element that streams the video
     * @returns {promise} promise that resolves with video stream
     */
    _getVideoStream: function (previewEl) {
      var self = this;

      var mediaConstraints = {
        audio: false,
        video: true
      };

      return navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function (stream) {
          WebRTC.attachMediaStream(previewEl, stream);
          previewEl.play();

          // Older versions of the WebRTC spec return a stream
          // that has `stop` directly on the stream. Newer
          // versions of the spec require fetching
          // the track to stop.
          if (stream.stop) {
            self._videoTrack = stream;
          } else if (stream.getVideoTracks) {
            self._videoTrack = stream.getVideoTracks()[0];
          } else {
            // we have problems in this case.
          }

          return stream;
        });
    },


    /**
     * Resolves once the camera is enabled and data is being
     * sent to the preview element
     *
     * @private
     * @param {object} previewEl - video element that streams the video
     * @returns {promise}
     */
    _waitForLoadedMetaData: function (previewEl) {
      var deferred = p.defer();

      previewEl.addEventListener('loadedmetadata', function loaded () {
        previewEl.removeEventListener('loadedmetadata', loaded, true);
        // Fx 18 fires the loadedmetadata event before the camera
        // is turned on, resulting in the previewEl.videoWidth
        // being 0. A delay avoids the problem.
        if (previewEl.videoWidth === 0 || previewEl.videoHeight === 0) {
          setTimeout(function () {
            deferred.resolve();
          }, FX18_LOADEDMETADATA_EVENT_DELAY_MS);
        } else {
          deferred.resolve();
        }
      }, true);

      return deferred.promise;
    },

    /**
     * Turn off the device's camera
     */
    disablePreview: function () {
      if (this._videoTrack) {
        this._videoTrack.stop();
        delete this._videoTrack;
      }
    },

    /**
     * Get a snapshot.
     *
     * @param {number} width - width of snapshot in pixels
     * @param {number} height - height of snapshot in pixels
     * @returns {promise} promise that resolves to JPEG image
     */
    getSnapshot: function (width, height) {
      var defer = p.defer();

      var previewEl = this._snapshotSource || this._previewEl;
      var h = previewEl.videoHeight || previewEl.height;
      var w = previewEl.videoWidth || previewEl.width;
      var minValue = Math.min(h, w);
      var pos = this.centeredPos(w, h, minValue);

      var target = document.createElement('canvas');
      target.style.display = 'none';
      target.width = width;
      target.height = height;
      document.body.appendChild(target);

      target.getContext('2d').drawImage(
        previewEl,
        Math.abs(pos.left),
        Math.abs(pos.top),
        minValue,
        minValue,
        0, 0, width, height
      );

      target.toBlob(function (data) {
        target.parentNode.removeChild(target);
        defer.resolve(data);
      }, MIME_TYPE, JPEG_QUALITY);

      return defer.promise;
    },

    /**
     * Calculate the offset needed to center a rectangular image
     * in a square container.
     *
     * @param {number} width
     * @param {number} height
     * @param {max} max width or height
     * @returns {object} with left, top
     */
    centeredPos: function (w, h, max) {
      if (w > h) {
        return { left: (max - w) / 2, top: 0 };
      } else {
        return { left: 0, top: (max - h) / 2 };
      }
    }
  };

  module.exports = Camera;
});
