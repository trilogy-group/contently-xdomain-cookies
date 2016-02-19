"use strict";

var app = require('../test_webserver.js');

const expect = require('chai').expect,
	fs = require('fs'),
	vm = require('vm'),
	Browser = require('zombie');

const 	TEST_COOKIE_NAME = 'test_cookie', 
		HTML_DOMAIN_1 = 'test_domain_site1.com',
		HTML_DOMAIN_2 = 'test_domain_site2.com',
		IFRAME_DOMAIN = 'test_domain_iframe.com',
		EXPECTED_UNSET_COOKIE_VAL = 'test1234',
		EXPECTED_SET_COOKIE_VAL = 'preset1234',
		JS_VAR_EXISTING_VAL = 'existing_cookie_val',
		JS_VAR_FINAL_VAL = 'final_cookie_val';

//register needed domains to route throug localhost w/ zombie
Browser.localhost(HTML_DOMAIN_1,3002);
Browser.localhost(HTML_DOMAIN_2,3002);
Browser.localhost(IFRAME_DOMAIN,3002);

Browser.extend(function(browser) {
  browser.on('console', function(level, message) {
    //console.log(message);
  });
  browser.on('log', function(level, message) {
    //console.log(message);
  });
});


describe("Iframe shared cookie",function(){
	this.timeout(5000);

	before(function() {
		this.server = app.listen(3002, 'localhost' );
	});
	after(function(done) {
    	this.server.close(done);
  	});

	describe('Across multiple domains, local cookie present on both domains', function() {
		
		var TEMP_NEWVAL = 'new_val';

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
			var cookie_data = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/', value: TEMP_NEWVAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
	    	var cookie_data2 = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data2);
		})

		before(function(done) {
			this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});
	  	before(function(done) {
	  		//open new tab with alternate domain name (that loads same shared iframe)
	  		this.browser.open()
	  		this.browser.visit('http://'+HTML_DOMAIN_2+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			
			//check the tab @ HTML_DOMAIN_2 first, then close that tab after testing
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_2+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( TEMP_NEWVAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( TEMP_NEWVAL );
			this.browser.tabs.current.close();

			//check the orignal tab @ HTML_DOMAIN_1
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_1+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );

			//now verify that all cookies are set
			var local_cookie1 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie1 ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var local_cookie2 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/' });
			expect( local_cookie2 ).to.equal( TEMP_NEWVAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( TEMP_NEWVAL );
			
		});

	});

	describe('Across multiple domains, local cookie present on second domain', function() {

		var TEMP_NEWVAL = 'new_val';

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
			var cookie_data = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/', value: TEMP_NEWVAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
		})

		before(function(done) {
			this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});
	  	before(function(done) {
	  		//open new tab with alternate domain name (that loads same shared iframe)
	  		this.browser.open()
	  		this.browser.visit('http://'+HTML_DOMAIN_2+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			
			//check the tab @ HTML_DOMAIN_2 first, then close that tab after testing
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_2+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( TEMP_NEWVAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( TEMP_NEWVAL );
			this.browser.tabs.current.close();

			//check the orignal tab @ HTML_DOMAIN_1
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_1+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( null );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_UNSET_COOKIE_VAL );

			//now verify that all cookies are set
			var local_cookie1 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie1 ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			var local_cookie2 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/' });
			expect( local_cookie2 ).to.equal( TEMP_NEWVAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( TEMP_NEWVAL );
			
		});

	});

	describe('Across multiple domains, iframe cookie present on iframe domain', function() {
		
		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
			var cookie_data = { name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
		})

		before(function(done) {
			this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});
	  	before(function(done) {
	  		//open new tab with alternate domain name (that loads same shared iframe)
	  		this.browser.open()
	  		this.browser.visit('http://'+HTML_DOMAIN_2+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			
			//check the tab @ HTML_DOMAIN_2 first, then close that tab after testing
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_2+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			this.browser.tabs.current.close();

			//check the orignal tab @ HTML_DOMAIN_1
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_1+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );

			//now verify that all cookies are set
			var local_cookie1 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie1 ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var local_cookie2 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/' });
			expect( local_cookie2 ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
			
		});

	});

	describe('Across multiple domains, local cookie present on first domain', function() {
		
		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
			var cookie_data = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
		})

		before(function(done) {
			this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});
	  	before(function(done) {
	  		//open new tab with alternate domain name (that loads same shared iframe)
	  		this.browser.open()
	  		this.browser.visit('http://'+HTML_DOMAIN_2+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			
			//check the tab @ HTML_DOMAIN_2 first, then close that tab after testing
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_2+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			this.browser.tabs.current.close();

			//check the orignal tab @ HTML_DOMAIN_1
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_1+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );

			//now verify that all cookies are set
			var local_cookie1 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie1 ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var local_cookie2 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/' });
			expect( local_cookie2 ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
			
		});

	});

	describe('Across multiple domains, no cookies present', function() {

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
		})

		before(function(done) {
			this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});
	  	before(function(done) {
	  		//open new tab with alternate domain name (that loads same shared iframe)
	  		this.browser.open()
	  		this.browser.visit('http://'+HTML_DOMAIN_2+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			
			//check the tab @ HTML_DOMAIN_2 first, then close that tab after testing
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_2+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			this.browser.tabs.current.close();

			//check the orignal tab @ HTML_DOMAIN_1
			expect( this.browser.window.location.href ).to.equal( 'http://'+HTML_DOMAIN_1+'/test_page.html' );
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( null );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_UNSET_COOKIE_VAL );

			//now verify that all cookies are set
			var local_cookie1 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie1 ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			var local_cookie2 = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_2, path: '/' });
			expect( local_cookie2 ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			
		});

	});

	describe('Single domain, previous cookie not set', function() {
		//test that the xdomain cookie is properly on both local domain & iframe domain when no cookies were previously set

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
		})

		before(function(done) {
	    	this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( null );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			//check cookie values
			var local_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_UNSET_COOKIE_VAL );
		});

	});

	describe('Single domain, local cookie set', function() {
		//test that the xdomain cookie is properly on both local domain & iframe domain when only local cookie exists

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
		})

		before(function(done) {
	    	var cookie_data = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
	    	this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//check cookie values
			var local_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
		});

	});

	describe('Single domain, iframe cookie set', function() {
		//test that the xdomain cookie is properly on both local domain & iframe domain when only iframe cookie exists

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
		})

		before(function(done) {
	    	//TODO - fix date
	    	var cookie_data = { name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
	    	this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie',function(){
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//check cookie values
			var local_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
		});

	});

	describe('Single domain, iframe & local cookie set w/ different vals', function() {
		//test that the xdomain cookie is properly on both local domain & iframe domain when only iframe cookie exists

		before(function(){
			this.browser = new Browser();
			this.browser.deleteCookies();
		})

		before(function(done) {
	    	//TODO - fix date
	    	var cookie_data = { name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/', value: EXPECTED_SET_COOKIE_VAL, expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data);
	    	var cookie_data2 = { name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/', value: 'dont_use', expires:new Date((new Date().getTime())+(1000*60*10))};
	    	this.browser.setCookie(cookie_data2);
	    	this.browser.visit('http://'+HTML_DOMAIN_1+'/test_page.html',function(){
	    		setTimeout(done, 1000); //wait for postmessage
	    	});
	  	});

		it('get/set cookie, local cookie overrides iframe',function(){
			expect( this.browser.queryAll('iframe[src*="http://'+IFRAME_DOMAIN+'/xdomain_cookie.html"]' ).length).to.equal(1);
			//verify there was no existing/returned val from .get()
			expect( this.browser.evaluate(JS_VAR_EXISTING_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//verify that final val was set correctly
			expect( this.browser.evaluate(JS_VAR_FINAL_VAL) ).to.equal( EXPECTED_SET_COOKIE_VAL );
			//check cookie values
			var local_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: HTML_DOMAIN_1, path: '/' });
			expect( local_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
			var iframe_cookie = this.browser.getCookie({ name: TEST_COOKIE_NAME, domain: IFRAME_DOMAIN, path: '/' });
			expect( iframe_cookie ).to.equal( EXPECTED_SET_COOKIE_VAL );
		});

	});
	
});