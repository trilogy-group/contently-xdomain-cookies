'use strict';

function pbUserCookieProvider(guidGenerator, playbuzzHomeUrl, debug) {

    // Initialize the cross domain cookie library.
    // At the iframe path there should be an html named 'xdomain_cookie.html'.
    // The cookies will be saved under this domain.
    var IFRAME_PATH = playbuzzHomeUrl,
        IFRAME_POSTMESSAGE_NAMESPACE = '',
        IFRAME_DEBUG = debug,
        COOKIE_NAME = 'playbuzz',
        COOKIE_EXPIRY_DAYS = 30,
        CHECK_INTERVAL = 200;

    var xdomainCookieProvider = window.xDomainCookie(IFRAME_PATH, IFRAME_POSTMESSAGE_NAMESPACE, IFRAME_DEBUG),
        user = null;

    // Implementation

    return {
        init: init,
        get: get
    };

    function init(onFailure) {

        // Try getting the user cookie from the xdomain provider.
        xdomainCookieProvider.get(COOKIE_NAME, function (result) {

            // If cookie found, set it.
            if (result !== null) {
                user = result;
                return;
            }

            // If no cookie found, create anonymous user cookie and set it.
            var anonymousUser = createAnonymousUser();
            user = anonymousUser;
            xdomainCookieProvider.set(COOKIE_NAME, anonymousUser, COOKIE_EXPIRY_DAYS);
        });

        // Subscribe to a case of a failure.
        xdomainCookieProvider.subscribeToFailure(function (cookieFailed, localStorageFailed) {
            onFailure(JSON.parse(user), cookieFailed, localStorageFailed);
        });
    }

    /**
     * Function that gets the user cookie in an async way.
     * If a null value is found, it will keep trying to fetch the cookie.
     * Will not call the given callback until a value was found.
     * @param callback
     */
    function get(callback) {

        // If a user exist, return it.
        if (user !== null) {
            callback(user);
            return;
        }

        // If a user does not yet exist, wait for it.
        var interval = setInterval(function () {

            // If a user exist, return it, and cancel interval.
            if (user !== null) {
                clearInterval(interval);
                callback(user);
            }

        }, CHECK_INTERVAL);
    }

    /**
     * A function that creates an anonymous user cookie.
     */
    function createAnonymousUser() {
        return JSON.stringify({
            userId: guidGenerator.generate(),
            nickname: 'Anonymous_user',
            origin: 'Anonymous',
            hasAccounts: false
        });
    }
}