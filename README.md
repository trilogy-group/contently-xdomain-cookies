
##Cross-Domain Cookie Library

This library is intended for cases where you have scripts running on different domains (i.e. domain-a.com, domain-b.com) that need to be able to set/share a cookie value across those domains. A few example use cases would be a third-party script that wants to set/share a user identifier across both domains, or a company that wants to track if a user signed up for a newsletter across both their main website and blog that resides on a different TLD.

The library leverages 2 files to achieve this - a javascript file you load/run on the page, and an HTML file that gets loaded onto that same page by the JS file. The JS & HTML files both must be served from the same domain/location (such as an s3 bucket). They leverage postMessage across the same/trusted domain to communicate and set the cookie on that domain, which can then be read/written by the same script run on any other domain you give it access to.


### Usage

Simply include the script on any page where it's needed, create a new instance of xDomainCookie, and leverage the get/set functions:
````
<script src="http://my.s3bucket.com/xdomain_cookie.js"></script>
<script>
	var xd_cookie = xDomainCookie( 'https://my.s3bucket.com' );
	xd_cookie.get( function(cookie_val){
		//cookie val will contain value of cookie as fetched from local val (if present) else from iframe (if set), else null
		if(!cookie_val){
			var new_val = get_what_value_should_be();
			xd_cookie.set( new_val );
		}
	});
</script>
```


### API

##### xDomainIframe( iframe_domain, namespace )
Create a new instance of the xDomainIframe object that creates the iframe in the page and is ready for usage

`iframe_domain` (string, required) the domain, and optional path, where the iframe html script should be loaded from - NOTE should match the protocol/host/port of where the JS script is loaded from

`namespace` (string,optional) a namespace to use for postMessage passing - prevents collission if you are running multiple instances of this lib on the page... usually not needed

#####.get( cookie_name, callback, expires_days )
Get the value of the xdomain (& local) cookie with complete callback

`cookie_name` (string, required) the name of the cookie (both for local domain & iframe domain)

`callback` (function, required) function that is called upon retreival of iframe cookie - takes 1 arg, which is the cookie value (if present)

`expires_days` (int, optional) # of days to use for setting/re-upping cookie expiration (default is 30)

#####.set( cookie_name, cookie_value, expires_days )
Set the value of the xdomain (& local) cookie

`cookie_name` (string, required) the name of the cookie (both for local domain & iframe domain)

`cookie_value` (string/int/float/obj, required) the value of the cookie that we wish to set, get's JSON encoded & serialized

`expires_days` (int, optional) # of days to use for setting cookie expiration (default is 30)


### Testing

There's a full test suite that leverages zombie/connect to mock & test the library behavior across multiple domains in multiple different situations. There is also a pre-build development setup to load/test in local environments in the library. Both of these rely on npm packages, so be sure to do an `npm install` in the root dir before running.

##### Test suite
```
npm test
```

##### Dev Server
The dev server runs on localhost:3001. Once running you can map whatever hosts to 127.0.0.1 and load the JS in running local pages from {{myhost}}:3001/xdomain_cookie.js.
```
npm run dev
```

It is also pre-configurd with an example scenario that shows usage across domains. It requires you to map the following domains to 127.0.0.1 in your hosts file: shared_cookie_test.com, shared_cookie_test2.com, and shared_cookie_iframe.com

You can then see the example working by visiting http://shared_cookie_test.com:3001/test_page.html and shared_cookie_test2.com/test_page.html - take a look at the console output to see cookie behavior.
