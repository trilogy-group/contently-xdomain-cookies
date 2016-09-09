
#Cross-Domain Cookie Library

This library is intended for cases where you have scripts running on different domains (i.e. domain-a.com, domain-b.com) that need to be able to set/share a cookie value across those domains. A few example use cases would be a third-party script that wants to set/share a user identifier across both domains, or a company that wants to track if a user signed up for a newsletter across both their main website and blog that resides on a different TLD.

The library leverages 2 files to achieve this - a javascript file you load/run on the page, and an HTML file that gets loaded onto that same page by the JS file. The JS & HTML files both must be served from the same domain/location (such as an s3 bucket). They leverage postMessage across the same/trusted domain to communicate and set the cookie on that domain, which can then be read/written by the same script run on any other domain you give it access to.

Authored by *Authored by* [Evan Carothers](https://github.com/ecaroth) @ [Contently](http://www.contently.com)

Read the backstory and implementation details on the Building Contently Blog entry [Tracking people across multiple domains — when cookies just aren’t enough](https://medium.com/building-contently/tracking-people-across-multiple-domains-when-cookies-just-arent-enough-b270cc95beb1)

Usage
------

Simply include the script on any page where it's needed, create a new instance of xDomainCookie, and leverage the get/set functions:

```html
<script src="//my.s3bucket.com/xdomain_cookie.min.js"></script>
<script>
	var xd_cookie = xDomainCookie( '//my.s3bucket.com' );
	xd_cookie.get( 'cookie_name', function(cookie_val){
		//cookie val will contain value of cookie as fetched from local val (if present) else from iframe (if set), else null
		if(!cookie_val){
			var new_val = get_what_value_should_be();
			xd_cookie.set( 'cookie_name', new_val );
		}
	});
</script>
```

Usage Notes
------

_Please Note_ that it's important for the `xdomain_cookie.min.js` file to be served from the same domain _and_ protocol as the path passed in for the iframe creation (when creating `xDomainCookie`). You can setup the script to use whichever page the protocol of the main window is using by specifying `//` as the protocol prefix (instead of explicit `https://` or `http://`, assuming the webserver hosting the `xdomain_cookie.html` file supports that procolol). It's also OK to serve both the script and iframe path over HTTPS in all instances, regardless of if the main page is loaded over HTTPS.

This script should work in all modern desktop and mobile browsers that support the postMessage API (IE 8+, Chrome, FF, etc).

API
------

### xDomainIframe( iframe_domain, namespace, xdomain_only )
> Create a new instance of the xDomainIframe object that creates the iframe in the page and is ready for usage

> `iframe_domain` _(string, required)_ the domain, and optional path, where the iframe html script should be loaded from - NOTE should match the protocol/host/port of where the JS script is loaded from

> `namespace` _(string,optional)_ a namespace to use for postMessage passing - prevents collission if you are running multiple instances of this lib on the page... usually not needed

> `xdomain_only` _(boolean, optional, default false)_ if the cookie should _only_ be set on the xdomain site, not locally.. meaning that the xdomain version acts as the source of truth for the cookie value and eliminates local caching. _PLEASE NOTE_ that this flag can provide specific intended behavior for different use cases. See the _Cross Domain ONLY Cookies_ section further down the readme for more info

> ```javascript
> //create instance of xDomainIframe with local cookie caching
> var xd_cookie = xDomainIframe( "//my.trusted-site.com", "my.namespace" );
> 
> //create instance of xDomainIframe that uses xdomain_only cookies
> var xd_cookie = xDomainIframe( "//my.trusted-site.com", "my.namespace", true );
> ```

###.set( cookie_name, cookie_value, expires_days )
> Set the value of the xdomain (& local) cookie

> `cookie_name` _(string, required)_ the name of the cookie (both for local domain & iframe domain)

> `cookie_value` _(string/int/float/obj, required)_ the value of the cookie that we wish to set, get's JSON encoded & serialized

> `expires_days` _(int, optional)_ # of days to use for setting cookie expiration (default is 30)

> ```javascript
> my_xdc_instance.set( 'my_cookie', JSON.stringify({foo:"bar"}), 15 );
> ```


###.get( cookie_name, callback, expires_days )
> Get the value of the xdomain (& local) cookie with complete callback. _NOTE: this function also re-ups the xdomain cookie as if it was being re-set with .set()_

> `cookie_name` _(string, required)_ the name of the cookie (both for local domain & iframe domain)

> `callback` _(function, required)_ function that is called upon retreival of iframe cookie - takes 1 arg, which is the cookie value (if present)

> `expires_days` _(int, optional)_ # of days to use for setting/re-upping cookie expiration (default is 30)

> ```javascript
> my_xdc_instance.get( 'my_cookie', function( val ){
> 	  console.log("Current value of xdomain cookie 'my_cookie'", val );
> });
> ```

Cross Domain ONLY Cookies
------

By default the `xDomainCookies` class is configured to set and use a local cookie as a caching mechanism to allow the callback for `.get()` to return as fast as possible. This is based on the fact that you are setting a piece of information that _should not change_ on any domains you are using the xDomainCookie on, as if you change the cookie from a single domain and it's cached locally at another domain, that local cache will prevent the updated value from being returned by the `get()` callback on that specific domain. 

For use cases where you are setting a cookie value that should not change (such as something simple like a user ID), allowing the local cookie cache to function is useful and ideal. If, however, you are using advanced data types (such as a serialzed JSON object that has a property that can be updated from multiple domains, and needs to always have the most updated values accessible), then you should pass in `true` for the _xdomain_only_ param when creating a new `xDomainIframe` instance. This means that the local cookie cache isn't used, and the iframe must fully lead before the callback to `get()` will fire, but will guarantee that any interaction with the cookie data will always use up-to-date values.


Testing
------

There's a full test suite that leverages zombie/connect to mock & test the library behavior across multiple domains in multiple different situations. There is also a pre-build development setup to load/test in local environments in the library. Both of these rely on npm packages, so be sure to do an `npm install` in the root dir before running.

##### Test suite
```
npm test
```

##### Dev Server & Development
The dev server runs on localhost:3001. Once running you can map whatever hosts to 127.0.0.1 and load the JS in running local pages from {{myhost}}:3001/xdomain_cookie.dev.js.
```
npm run dev
```

It is also pre-configurd with an example scenario that shows usage across domains. It requires you to map the following domains to 127.0.0.1 in your hosts file: shared_cookie_test.com, shared_cookie_test2.com, and shared_cookie_iframe.com

You can then see the example working by visiting http://shared_cookie_test.com:3001/test_page.html and shared_cookie_test2.com/test_page.html - take a look at the console output to see cookie behavior.

When developing locally you can lint/test/build the library by running `gulp build`
