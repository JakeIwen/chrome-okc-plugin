$(function(){
	window.HeaderBar = {"barFixed":false,"stickyable":true,"pagetop":0,"barleft":0,"isPositioning":false,"isRefreshingPageSize":false}

	window.HeaderBar.init = function(){return null;}
	window.OkCanary = () => {
		window.TheWebsiteOkCupidDotComAppearsToBeFunctioning = true;
	};
	
	class Product {
	constructor(params) {
		this.initialize(params);
	}

	initialize(params) {
		if (!params || !params.productid) {
			return;
		}

		this.product_fields = params.product_fields;

		this.body = jQuery("body");
		this.windowshade = jQuery("#windowshade");

		this.message_handlers = {};

		this.successaction = params.successaction;
		this.on_open = params.on_open;
		this.on_close = params.on_close;
		this.on_success = params.on_success;

		this.opened = false;
		this.opennow = false;
	}


	add_cf(cf) {
		if (!cf || cf == "") { return; }
		this.product_fields.cf = cf;
	}

	remove_cf(cf) {
		if (!cf || cf == "") { return; }

		let value = this.product_fields.cf;

		if (value.indexOf(cf) == -1) { return; }

		value = value.replace(cf, "").replace(/,,/gi, ",");
	}


	set_param(name, value) {
		this.product_fields[name] = value;
	}

	rm_param(name) {
		delete (this.product_fields[name]);
	}


	open() {
		if (this.opennow) { return; }

		// show the window shade before loading the box
		this.windowshade.addClass("show quickbuy");
		this.body.addClass("noscroll");

		this.openTime = new Date();

		// get okpay running with the bare information
		window.OkPay.init({ isLoading: true });

		OkC.get("/payments/product", {
			api: 1,
			data: this.product_fields,
			success: function(data) {
				// add the server-side data
				data.isLoading = false;

				// if there's an active payment method, send it through
				if (this.product_fields && this.product_fields.active_payment_method) {
					data.activePaymentMethod = this.product_fields.active_payment_method;
				}

				window.OkPay.import(data);
				this.markOpenTime();
				console.log('paltform', process.env.PLATFORM );
				const platform = process.env.PLATFORM == "desktop" ? "desktop" : "mobile";

				ClientStats.update({
					statname: `purchases - platform:${platform} - product:alist - state:control - option selected`,
					unique: true,
				});

				setTimeout(() => {
					this.check_state();
				}, 5000);
			}.bind(this),
		});

		if (this.on_open && typeof (this.on_open) === "function") {
			this.on_open();
		}

		this.opened = true;
		this.opennow = true;
	}

	close() {
		if (this.on_close && typeof (this.on_close) === "function") {
			this.on_close();
		}

		this.opennow = false;

		this.windowshade.removeClass("show").removeClass("quickbuy");
		window.OkPay.unmount();
		this.body.removeClass("noscroll");
	}


	check_state() {
		// if it's been a forever amount of time, and okpay hasn't initialized, let
		// a grownup know
		if (!jQuery(".okpay-app").length) {
			window.util.updateStats("quickbox - not loaded after 5 seconds", 1, "counter", "mOYzog9Nm7Ihdl60nzfVpjxSWGw=");
		}
	}

	markOpenTime() {
		// if we don't have an open time, we can't really do anything
		if (!this.openTime) {
			return;
		}

		// don't check this out more than once
		if (this.markedTime) {
			return;
		}

		const now = new Date();
		const diff = now - this.openTime;
		this.markedTime = true;

		window.util.updateStats("payment modal - avg open time", diff, "value", "UJ/RljGYi/m8AarfyjleuYLOhi8=");
	}

	on_product_success(res) {
		if (this.successaction && typeof (this.successaction) === "function") {
			this.successaction(res);
		}

		if (this.on_success && typeof (this.on_success) === "function") {
			this.on_success(res);
		}
	}
}

window.Product = Product;



// WEBPACK FOOTER //
// ./src/legacy/products.js
	
	verifyTokenPresence();
	
	var onPageQuestions = $('#questions').length > 0;
	var onPageMailbox = $('#p_mailbox').length > 0;
	var onPageProfile = $('#p_profile').length > 0;
	var onBrowseMatches = window.location.pathname=='/match';
	var onDoubleTake = window.location.pathname=='/doubletake';
	window.onLikes = window.location.pathname=='/who-you-like';
		
	try {
			window.answers = JSON.parse(_OKCP.lz().decompress(localStorage.getItem('answers'), {inputEncoding: "StorageBinaryString"}));
	} catch (e) {
		window.answers = JSON.parse(localStorage.getItem('answers') || "{}");
		console.log('get uncompressed answers');
	}
	window.numAnswers = 0;
	window.inProgress = {};
	
	localStorage.reallyClear = localStorage.clear;	
	localStorage.clear = function() {
		console.warn('`localStorage.clear()` was just called. We\'re ignoring that so you don\'t lose your data.');
		console.log('if you called `localStorage.clear()` intentionally, it\'s been reassigned to `localStorage.reallyClear()`');
	}

	if (_OKCP.devmode) _OKCP.initDevMode();
	
	// Questions Pages
	if (onPageQuestions)
		_OKCP.initSuggestQuestionsFeature(); // question suggestion feature

	// Pages with pagination missing
	if (onPageQuestions || onPageMailbox)
		_OKCP.initReaddPagination(); // re-adding pagination on questions and mailbox pages

	if (onPageMailbox)
		_OKCP.messageSearch();

	// Profile Pages
	if (onPageProfile) {
		_OKCP.getAnswers(); // get answers and add categories
		// _OKCP.messageSearch(); // check to see if you've messaged them before
	}
	
	if (onDoubleTake) {
		_OKCP.getAnswers(true); // get answers and add categories
		// _OKCP.messageSearch(); // check to see if you've messaged them before
	}
	
	if (onBrowseMatches) {
		window.domLocations = [];
		_OKCP.browseMatches();
	}
	if (window.onLikes) {
		window.domLocations = [];
		_OKCP.likes();
	}
	console.log('_OKCP', _OKCP);
	// initialize large thumbnail viewer
	_OKCP.initThumbViewer();
	console.log('fq', _OKCP.fileQuestions);
	function verifyTokenPresence() {
		window.CURRENTUSERID = "49246541853129158";
		window.ACCESS_TOKEN = _OKCP.settings('ACCESS_TOKEN');
		console.log('at', window.ACCESS_TOKEN);
		const tokenIsOld = (Date.now()-(localStorage.okcpTokenLastUpdated || 0)) > 60*60*2.75*1000;
		if(tokenIsOld || !window.ACCESS_TOKEN) {
			window.OkC.getNewAccessToken().then(tokenres => {
				console.log('getting new token', tokenres);
				_OKCP.settings('ACCESS_TOKEN', tokenres.authcode);
				window.ACCESS_TOKEN = tokenres.authcode;
				localStorage.ACCESS_TOKEN = tokenres.authcode
				console.log('at', window.ACCESS_TOKEN);
				localStorage.okcpTokenLastUpdated = Date.now();
			});
		} 
	}
	
});
