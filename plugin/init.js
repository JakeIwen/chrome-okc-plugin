$(function(){
	verifyTokenPresence();
	
	var onPageQuestions = $('#questions').length > 0;
	var onPageMailbox = $('#p_mailbox').length > 0;
	var onPageProfile = $('#p_profile').length > 0;
	var onBrowseMatches = window.location.pathname=='/match';
	var onLikes = window.location.pathname=='/who-you-like';
	window.answers = localStorage.answers || "{}";
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
		_OKCP.messageSearch(); // check to see if you've messaged them before
	}
	
	if (onBrowseMatches) {
		_OKCP.browseMatches();
	}
	if (onLikes) {
		console.log('lieks');
		_OKCP.likes();
	}
	console.log('_OKCP', _OKCP);
	// initialize large thumbnail viewer
	_OKCP.initThumbViewer();
	
	function verifyTokenPresence() {
		window.CURRENTUSERID = "49246541853129158";
		const settings = localStorage.okcpSettings;
		const tokenIsOld = (Date.now()-(localStorage.okcpTokenLastUpdated || 0)) > 60*60*2.75*1000;
		window.ACCESS_TOKEN = settings.ACCESS_TOKEN;
		if(tokenIsOld || !window.ACCESS_TOKEN) {
			console.log('getting new token');
			window.OkC.getNewAccessToken().then(tokenres => {
				settings.ACCESS_TOKEN = tokenres.authcode;
				localStorage.okcpTokenLastUpdated = Date.now();
			});
		}
	}
	
});
