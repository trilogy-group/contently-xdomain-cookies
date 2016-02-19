
##Cross-Domain Cookie Library

This library is intended for cases where you have scripts running on different domains (i.e. domain-a.com, domain-b.com) that need to be able to set/share a cookie value across those domains. A few example use cases would be a third-party script that wants to set/share a user identifier across both domains, or a company that wants to track if a user signed up for a newsletter across both their main website and blog that resides on a different TLD.

The library leverages 2 files to achieve this - a javascript file you load/run on the page, and an HTML file that gets loaded onto that same page by the JS file. The JS & HTML files both must be served from the same domain/location (such as an s3 bucket). They leverage postMessage across the same/trusted domain to communicate and set the cookie on that domain, which can then be read/written by the same script run on any other domain you give it access to.

### Usage

Simply include the script on any page where it's needed, create a new instance of xDomainCookie, and leverage the get/set functions:
````
var xd_cookie = xDomainCookie( 'https://my.s3bucket.com', 'my_cookie_name', 30,  'my.namespace' );
xd_cookie.get( function(cookie_val){
	//cookie val will contain value of cookie as fetched from local val (if present) else from iframe
	if(!cookie_val){
		var new_val = get_what_value_should_be();
		xd_cookie.set( new_val );
	}
});
```

### Testing

There's a full test suite that leverages zombie/connect to mock & test the library behavior across multiple domains in multiple different situations. There is also a pre-build development setup to load/test in local environments in the library. Both of these rely on npm packages, so be sure to do an `npm install` in the root dir before running.

#### Test suite
```
npm test
```

#### Dev Server
The dev server runs on localhost:3001. Once running you can map whatever hosts to 127.0.0.1 and load the JS in running local pages from {{myhost}}:3001/xdomain_cookie.js.
```
npm run dev
```

It is also pre-configurd with an example scenario that shows usage across domains. It requires you to map the following domains to 127.0.0.1 in your hosts file: shared_cookie_test.com, shared_cookie_test2.com, and shared_cookie_iframe.com

You can then see the example working by visiting shared_cookie_test.com/test_page.html and shared_cookie_test2.com/test_page.html - take a look at the console output to see cookie behavior.


[//]: # ### License
[//]: # Contently releaes this library under the [MIT License](http://www.opensource.org/licenses/MIT).