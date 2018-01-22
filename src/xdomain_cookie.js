(function (exports) {
    "use strict";

    var xDomainCookie = function (iframe_path, namespace, debug) {
        //iframe_path = full TLD (and optional path) to location where iframe_shared_cookie.html is served from, and domain cookie will be set on
        //namespace = namespace to use when identifying that postMessage calls incoming are for our use

        if (iframe_path.substr(0, 2) === '//') {
            //verify protocol is present & used
            var protocol = (window.location.protocol === 'about:' || window.location.protocol === 'about:blank') ? window.parent.location.protocol : window.location.protocol;
            iframe_path = (protocol === 'https:' ? 'https:' : 'http:') + iframe_path;
        }

        var _namespace = namespace || 'xdsc',						//namespace for the shared cookie in case there are multiple instances on one page - prevents postMessage collision
            _iframe_ready = false,									//has the iframe posted back as ready?
            _callbacks = [],										//list of pending callbacks to ping when iframe is ready occurs
            _iframe_failed = false,									//has the iframe failed to set cookie?
            _failureCallbacks = [],									//list of pending callbacks to ping when iframe fails to set cookie occurs
            _xdomain_cookie_data = {},								//shared cookie data set by the iframe after load/ready
            _id = new Date().getTime(),								//identifier to use for iframe in case there are multiple on the page
            _default_expires_days = 30,								//default expiration days for cookies when re-uppded
            _debug = !!debug;

        //bind postmessage listeners for incoming messages from iframe
        window.addEventListener('message', onIncomingMessage);

        createIframe();

        return {
            get: get,
            set: set,
            subscribeToFailure: subscribeToFailure
        };

        // Implementation

        //create hidden iframe on the page that loads from same domain as this script and is used for communication / cookie setting
        function createIframe() {
            var ifr = document.createElement('iframe');
            ifr.style.display = 'none';
            ifr.id = 'xdomain_cookie_' + _id;

            var origin = window.parent.location.origin;
            //IE fix
            if (!origin) {
                origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }

            var data = {
                namespace: _namespace,
                window_origin: origin,
                iframe_origin: iframe_path,
                debug: _debug
            };

            ifr.src = iframe_path + '/xdomain_cookie.html#' + encodeURIComponent(JSON.stringify(data));
            document.body.appendChild(ifr);

            _log("creating iframe", ifr.src);
        }

        function _log() {
            if (!_debug) return;
            arguments[0] = "[XDOMAIN PAGE] " + arguments[0];
            console.log.apply(console, arguments);
        }

        //function called on inbound post message - filter/verify that message is for our consumption, then set ready data an fire callbacks
        function onIncomingMessage(event) {

            // Verify it's a message for us.

            var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
            if (iframe_path.substr(0, origin.length) !== origin) return; //incoming message not from iframe

            if (typeof event.data !== 'string') return; //expected json string encoded payload
            var data = null;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
            }

            if (!data || typeof data !== 'object' || (data instanceof Array)) return; //data is not a non-array object
            if (!('namespace' in data) || data.namespace !== _namespace) return; //wrong namespace for msg
            if (!('msg_type' in data)) return; //data is not a xdomainc-cookie payload

            // If it's a data message.
            if (data.msg_type === 'xdsc_read') {
                _log("got data from iframe:", data.cookies);

                _xdomain_cookie_data = data.cookies;
                _iframe_ready = true;
                firePendingCallbacks();

            } else if (data.msg_type === 'xdsc_fail') {

                _log("got failure from iframe");
                _iframe_failed = true;
                firePendingFailureCallbacks(data.cookie_failed, data.local_storage_failed);
            }
        }

        //run all pending callbacks that are registered
        function firePendingCallbacks() {
            if (!_iframe_ready) return; //not yet ready to fire callbacks, still waiting on error or ready
            while (_callbacks.length > 0) {
                _callbacks.pop()();
            }
        }

        function subscribeToFailure(callback) {
            if (_iframe_failed) {
                callback();
            }
            _failureCallbacks.push(callback);
        }

        //run all pending callbacks that are registered to failure
        function firePendingFailureCallbacks(cookie_failed, local_storage_failed) {
            while (_failureCallbacks.length > 0) {
                _failureCallbacks.pop()(cookie_failed, local_storage_failed);
            }
        }

        //set a cookie in the iframe @ iframe_path
        function sendDataToIframe(cookie_name, cookie_value, expires_days) {
            //NOTE - this function is only called from within _on_iframe_ready_or_err  function when there is NOT an error
            //so we can safely assume iframe is present, ready, and callable at this point

            //postMessage to Iframe with info
            var data = {
                namespace: _namespace,
                msg_type: 'xdsc_write',
                cookie_name: cookie_name,
                cookie_val: cookie_value,
                expires_days: expires_days
            };

            _log("sending cookie to iframe:", cookie_name, cookie_value, expires_days);

            document.getElementById('xdomain_cookie_' + _id).contentWindow.postMessage(JSON.stringify(data), iframe_path);
        }

        //function to set the value for both cookies (local & xdomain)
        function set(cookie_name, cookie_value, expires_days) {

            //if iframe isn't ready, wait for it to be ready
            if (!_iframe_ready) {
                return _callbacks.push(function () {
                    set(cookie_name, cookie_value, expires_days);
                });
            }

            expires_days = expires_days || _default_expires_days;

            //if cookie is empty (null or undefined) delete the cookie
            expires_days = (cookie_value === null || cookie_value === undefined) ? -100 : expires_days;

            sendDataToIframe(cookie_name, cookie_value, expires_days);

            //set local cached value
            _xdomain_cookie_data[cookie_name] = cookie_value;
        }

        //function to call after instantiation to sync a cookie, supplying a cookie name, value to write if it does NOT exist, expires
        //time (in ms from now), and a callback for completion (which includes the resolved cookie value as the only argument)
        function get(cookie_name, callback) {

            _log("got request for a cookie:", cookie_name);

            //cb function to create closure for pending user callback
            function _cb(cookie_val, callback) {

                _log("returning response for cookie: ", cookie_name, cookie_val);

                if (typeof callback === 'function') callback(cookie_val);
            }

            //no local cookie is set/present, so bind CB to iframe ready/error callback so it's pinged a soon as we hit a ready state from iframe
            _callbacks.push(function () {

                var _current_cookie_val = cookie_name in _xdomain_cookie_data ? _xdomain_cookie_data[cookie_name] : null;

                _cb(_current_cookie_val, callback);
            });

            firePendingCallbacks();
        }
    };

    exports.xDomainCookie = xDomainCookie;
})(window);
