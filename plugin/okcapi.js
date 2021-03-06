/* eslint-disable */
/* GENERATED BY DECAFFEINATE */



var Path;
console.log('API INIT', this);

window.OkC = {
	api_prefix: "/apitun",
	access_token_refresher: null,
	api_timed_out: false,
	api_timed_out_logged: false,
	api_timed_out_for_good: false,
	api_timed_out_listening: false,
	api_timed_out_rechecking: false,

	Path: (Path = class Path {
		constructor(s) {
			this.path = s.split("/");
		}

		namedParts() {
			let parts = [];
			for (let part of this.path) {
				if (part[0] !== ":") {
					parts.push(part);
				}
			}
			return parts;
		}

		fill() {
			let args = Array.prototype.slice.call(arguments);
			let ret = this.path
				.map(function(x) {
					if (x[0] !== ":") {
						return x;
					}
					if (!args.length) {
						throw new Error(`Missing URL parameter: ${x.substr(1)}`);
					}
					return encodeURIComponent(args.shift());
				})
				.join("/");
			if (args.length) {
				throw new Error(`Extra URL parameters: ${args.join(" ")}`);
			}
			return ret;
		}
	}),

	// Used to init the path shortcuts
	init(d) {
		// add shortcut methods (OkC.get, OkC.post, etc)
		for (let path in d) {
			this.addAPIMethod(path, d[path]);
		}
	},

	// used when this file loads to load convenience functions and stuff
	start() {
		this.checkApiTimeout = this.checkApiTimeout.bind(this);
		this.makeAliases();
		return this.scheduleTokenRefresher();
	},

	makeAliases() {
		let methods = ["get", "post", "delete", "put"];

		// use map here instead of a for loop because the for loop variable will change
		return methods.map(method => {
			return (this[method] = (path, params) => {
				params = params || {};
				params.type = method.toUpperCase();
				return this.api(path, params);
			});
		});
	},

	api(path, params) {
		// this is the v1 api client, but if we released a v2 of the api, we could
		// check for `params && params.api`
		return this.api_edge(path, params);
	},

	// ==========================================================================
	// v1 Client
	// --------------------------------------------------------------------------

	api_edge(path, params) {
		if (params == null) {
			params = {};
		}

		// default to api v1
		if (typeof params.api === "undefined") {
			params.api = 1;
		}

		let apiVersions = [1];
		let type = (params.type || params.method || "GET").toUpperCase();
		let data = params.data || {};

		// let devs supply a leading slash, even though it's not needed
		let urlPath = path.replace(/^\//, "");
		urlPath = `${this.api_prefix}/${urlPath}`;

		if (params.api && _.contains(apiVersions, params.api)) {
			urlPath = urlPath.replace("/apitun", `/${params.api}/apitun`);
		}

		let baseHeaders = {
			"X-OkCupid-Platform": "DESKTOP",
		};

		if ( typeof ACCESS_TOKEN !== "undefined" && ACCESS_TOKEN !== null && ACCESS_TOKEN !== "" ) {
			baseHeaders["Authorization"] = `Bearer ${ACCESS_TOKEN}`;
		}
		
		if (params.version) {
			baseHeaders.endpoint_version = params.version;
		}

		// Assemble Ajax params
		// ----------------------------------------------------------------------

		let ajaxParams = _.extend({}, params);
		ajaxParams.headers = _.extend(baseHeaders, params.headers);
		// JSON data handling
		// ----------------------------------------------------------------------

		// jQuery won't send a bundle of data to DELETE endpoints,
		// so drop that shit into the URL.
		if (type === "DELETE" && ajaxParams.data) {
			let deleteParams = $.param(ajaxParams.data);
			let joiner = urlPath.indexOf("?") === -1 ? "?" : "&";
			urlPath = `${urlPath}${joiner}${deleteParams}`;

			// Send JSON for all non-GET requests
		} else if (type !== "GET") {
			ajaxParams.dataType = "json";
			ajaxParams.data = JSON.stringify(ajaxParams.data);
			ajaxParams.contentType = "application/json; charset=UTF-8";
		}

		// Callbacks
		// ----------------------------------------------------------------------

		return new Promise(function(resolve, reject) {
			ajaxParams.success = function(response, status, jhxr) {
				if ((response != null ? response.error : undefined) != null) {
					if (typeof params.error === "function") {
						params.error(response, jhxr);
					}
					return reject(response, jhxr);
				} else {
					if (typeof params.success === "function") {
						params.success(response, status, jhxr);
					}
					return resolve(response, status, jhxr);
				}
			};

			ajaxParams.error = function(jhxr) {
				let default_error = {
					error: {
						message: "No error response",
						type: "DefaultError",
					},
				};

				let response = jhxr != null ? jhxr.responseJSON : undefined;

				if (!response) {
					response = default_error;
				}

				// don't call back if the user aborted
				if (
					!(jhxr != null ? jhxr.statusText : undefined) ||
					jhxr.statusText !== "abort"
				) {
					if (typeof params.error === "function") {
						params.error(response, jhxr);
					}
					reject(response, jhxr);
				}

				// report to onerror if it's a logical error
				if (jhxr.status === 404) {
					return typeof window.onerror === "function"
						? window.onerror(
								`\
Public API: ${jhxr.statusText} error on ${path}:
${JSON.stringify(response)}\
`,
								window.location.href,
								130
							)
						: undefined;
				}
			};

			ajaxParams.complete = function(jhxr) {
				let default_response = {
					error: {
						message: "No error response",
						type: "DefaultError",
					},
				};
				let response =
					(jhxr != null ? jhxr.responseJSON : undefined) || default_response;

				// don't call back if the user aborted
				if (
					!(jhxr != null ? jhxr.statusText : undefined) ||
					jhxr.statusText !== "abort"
				) {
					return typeof params.complete === "function"
						? params.complete(response, jhxr)
						: undefined;
				}
			};

			return $.ajax(urlPath, ajaxParams);
		});
	},


	// helpers
	// -----------

	addAPIMethod(path_string, doc) {
		let path = new OkC.Path(path_string.substr(1));
		let target = OkC;
		let parts = path.namedParts();
		while (parts.length > 1) {
			target = target[parts[0]] || (target[parts[0]] = {});
			parts.shift();
		}

		let f = function() {
			let args = Array.prototype.slice.call(arguments);
			let cb = args.pop();
			let params =
				args.length && args[args.length - 1].constructor === Object
					? args.pop()
					: {};
			let req = OkC.api(
				path.fill.apply(path, args),
				{
					type: doc.method || "GET",
					data: params,

					success(response) {
						return typeof cb === "function" ? cb(response) : undefined;
					},
				},
			);
			return req;
		};

		f.doc = doc;
		if (typeof target[parts[0]] === "object") {
			let old = target[parts[0]];
			for (let k in old) {
				f[k] = old[k];
			}
		}
		target[parts[0]] = f;
	},


	// ==========================================================================
	// Access token refreshing
	// --------------------------------------------------------------------------

	// check every 2.75 hours for api token working
	scheduleTokenRefresher() {
		if (this.api_timed_out_for_good) {
			return;
		}

		// Check for a new access token every few hours
		return (this.access_token_refresher = setTimeout(() => {
			return this.getNewAccessToken();
		}, 60 * 60 * 2.75 * 1000));
	},

	// the checker and response handlers
	getNewAccessToken(param) {
		if (param == null) {
			param = {};
		}
		let { final } = param;
		clearTimeout(this.access_token_refresher);
		return this.api(
			"/okc/authcode",
			{
				api: 1,
				type: "GET",

				success: res => {
					let { authcode, userid } = res;

					if (!authcode) {
						return this.newAccessTokenError({ message: "no auth" }, final);
					} else if (userid !== CURRENTUSERID) {
						return this.newAccessTokenError(
							{ message: "userid mismatch" },
							final
						);
					} else {
						return this.newAccessTokenSuccess(authcode);
					}
				},

				error: e => {
					return this.newAccessTokenError(e, final);
				},

				complete: () => {
					this.api_timed_out_rechecking = false;
					return this.scheduleTokenRefresher();
				},
			},
		);
	},

	newAccessTokenSuccess(authcode) {
		window.ACCESS_TOKEN = authcode;
		this.api_timed_out = false;
		this.api_timed_out_logged = false;
		return (this.api_timed_out_for_good = false);
	},

	newAccessTokenError(e, final) {
		if (!this.api_timed_out_logged) {
			this.api_timed_out_logged = true;
			ClientStats.update("public api - new access token error", 1);
		}

		if (final) {
			return this.showErrorFeedback();
		} else {
			this.api_timed_out = true;
			return this.addRecheckListeners();
		}
	},

	// when an api request fails, add a listener to do-or-die when they gets back
	addRecheckListeners() {
		if (this.api_timed_out_listening) {
			return;
		}
		this.api_timed_out_listening = true;
		return $(window)
			.on("focus", this.checkApiTimeout)
			.on("mousemove", this.checkApiTimeout);
	},

	clearRecheckListeners() {
		if (!this.api_timed_out_listening) {
			return;
		}
		this.api_timed_out_listening = false;

		return $(window)
			.off("focus", this.checkApiTimeout)
			.off("mousemove", this.checkApiTimeout);
	},

	// ride or die
	checkApiTimeout() {
		// only proceed if the API timed out before
		if (!this.api_timed_out) {
			return;
		}

		// also only proceed if rechecking
		if (this.api_timed_out_rechecking) {
			return;
		}

		this.api_timed_out_rechecking = true;

		// don't recheck anymore, it's ride or die
		this.clearRecheckListeners();

		// check the api error one last time for shit
		return this.getNewAccessToken({ final: true });
	},

	showErrorFeedback() {
		this.api_timed_out_for_good = true;

		Modal.setCloseHandler(() => {
			return window.location.reload();
		});
		Modal.open("authtoken_refresh_notice");

		return ClientStats.update(
			"public api - new access token error - banner shown"
		);
	},
};

OkC.start();



// WEBPACK FOOTER //
// ./src/legacy/okcapi.js