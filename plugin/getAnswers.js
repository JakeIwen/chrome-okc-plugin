_OKCP.getAnswers = function () {
	var userName = '';
	_OKCP.showSaved();
	_OKCP.setFilters();
	_OKCP.setProfilerParams(); 
	
	if (window.onDoubleTake) handleDoubletake(); 
	else setTimeout(() => loadProfileAnswers(), 2000) 
	 
	async function loadProfileAnswers() {  
		var qList = [];
		var resCt = {};
		// console.log('qmca', $('.cardsummary-reflux-profile-link a'));
		userName = ($('.cardsummary-reflux-profile-link a')[0] || window.location)
			.href.split('/profile/')[1].split('?')[0]
			
		var origUserName = userName;
		var apiAnswers = await _OKCP.getApiAnswers(userName);
		
		if(origUserName !== userName) return console.log('user swap!');

		apiAnswers.forEach( answer => _OKCP.loadAnswer(answer, qList, resCt))
		_OKCP.visualizeRatios(qList, resCt);
		console.log({userName});
	}

	function handleDoubletake() {
		var dtHref = '';
		setInterval(() => {
			var newDtHref = $('.cardsummary-reflux-profile-link a').attr('href');
			if(dtHref !== newDtHref){
				dtHref = newDtHref;
				$('.match-ratios-list').html('')
				console.log('loading doubletake', {newDtHref});
				loadProfileAnswers();
			}
		}, 600)
	}

};


_OKCP.loadAnswer = function(answer, questionList, responseCount) {	
		
	var {target, viewer, question} = answer
	
	for (var category in _OKCP.list) {
		var categoryQuestionList = _OKCP.list[category];
		
		for (var i = 0; i < categoryQuestionList.length; i++) {
			var listItem = categoryQuestionList[i];
			if(parseInt(listItem.qid) !== question.id) continue;
			
			var theirAnswerIndex, answerScore, answerWeight, answerScoreWeighted;
			var theirAnswer = question.answers[target.answer];
			var possibleAnswers = listItem.answerText;

			for (var j = 0; j < possibleAnswers.length; j++) {
				if (possibleAnswers[j].replace(/\./g, '') === theirAnswer.replace(/\./g, '')) {
					theirAnswerIndex = j;
					break;
				}
			}
			answerScore = listItem.score[theirAnswerIndex];
			answerWeight = listItem.weight ? listItem.weight[theirAnswerIndex] || 0 : 1;
			if (answerWeight === 0) continue;
			answerScoreWeighted = ((answerScore+1) / 2) * answerWeight;

			//ensure there's an entry for the category count
			if (!responseCount[category]) responseCount[category] = [0,0];
			responseCount[category][0] += answerScoreWeighted;
			responseCount[category][1] += answerWeight;
			if (isNaN(responseCount[category][0])) debugger;
			
			questionList.push({
				question: question.text,
				qid: String(question.id),
				theirAnswer: theirAnswer,
				theirNote: (target.note || {}).note ||'',
				yourAnswer: question.answers[viewer.answer],
				yourNote: (viewer.note || {}).note ||'',
				answerScore: answerScore,
				answerWeight: answerWeight,
				answerScoreWeighted: answerScoreWeighted,
				category: category,
				categoryReadable: category.split('_').join(' ')
			});
			listItem.qid = listItem.qid+"-used";
		}
	}
}

_OKCP.visualizeRatios = function (questionList, responseCount, name) {
	var showDetail = !name;
	
	var ratioSelector = name 
		? `.match-ratios-list-hover.${name}`
		: '.match-ratios-list' 
		
	$(ratioSelector).html('');
	$('.question-detail > ul').remove();
	
	for (var category in responseCount) {
		
		var countArr = responseCount[category];
		var matchClass = 'match-' + Math.floor(countArr[0]/countArr[1]*5);
		var categoryReadable = category.split('_').join(' ');
		
		if (countArr[1] <= 1)  matchClass += ' one-data-point-match';
		if (countArr[1] >= 10) matchClass += ' more-than-10';
		if (countArr[0]/countArr[1] <= 0.1) matchClass += ' not-a-match';

		var numerator = Math.round(countArr[0]*10)/10+'';
		var denominator = Math.round(countArr[1]*10)/10+'';
		var numeratorArr = numerator.split('.');
		var denominatorArr = denominator.split('.');
		
		if (denominator*1 <= 0.5) continue;
		
		var matchRatioHtmlValue = '<span class="integer">' + numeratorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(numeratorArr[1] || '0')+'</span><span class="slash">/</span><span class="integer">' + denominatorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(denominatorArr[1] || '0')+'</span>';
		
		$('<li class="match-ratio ' + matchClass + '" category="'+category+'"><span class="match-ratio-progressbar ' + matchClass + '" style="width:' + (Math.round(countArr[0]/countArr[1]*93)+7) + '%"></span><span class="match-ratio-category">' + categoryReadable + '</span><span class="match-ratio-value">' + matchRatioHtmlValue + '</span></li>')
			.appendTo(ratioSelector)
			
		if (!showDetail) continue;
		
		for (var i = 0; i < questionList.length; i++) {
			var question = questionList[i];
			if (question.category === category) {
				if ($('.question-detail-'+question.category).length === 0) {
					$('.question-detail').append('<ul class="question-detail-'+question.category+'"></ul>');
				}
				matchClass = 'match-' + (Math.floor((question.answerScore+1)/2*5));
				$('.question-detail-'+question.category).append('<li class="match ' + matchClass + '"><ul>'+
					'<li class="question qid-'+question.qid+'">' + question.question + '</li>'+
					'<li class="answer">' + question.theirAnswer + '</li>'+
					'<li class="explanation">' + question.theirNote + '</li>'+
					'</ul></li>');
				if ($('.question-detail-'+question.category+' .match').length === 1) {
					$('.question-detail-'+question.category).prepend('<li class="category-header category-header-'+question.category+'">'+question.categoryReadable+'</li>');
				}
			}
		}
		
	}
	
	// sort categories
	$(`${ratioSelector} .match-ratio`).sort(function(a,b) {
		if ($(b).find('.match-ratio-category').text() === "poly:") return true;
		if ($(a).find('.match-ratio-category').text() === "poly:") return false;
		return ( $(a).find('.match-ratio-category').text() > $(b).find('.match-ratio-category').text() );
	}).appendTo(ratioSelector);
	
	if (!showDetail) return;
	
	if (!$('.question-detail > ul').length) {
		$('.question-detail').append('<ul><li class="match match-nomatches"><ul>'+
			'<li class="noresults">' + 'No Results' + '</li>'+
			'<li class="note">' + 'To improve the plugin\'s accuracy, answer more questions publicly and rank them as "Very Important". You can also click the "Improve Accuracy" link at the top of this panel to help out.' + '</li>'+
			'</ul></li></ul>');
		return false;
	}

	$('.question-detail > ul').sort(function(a,b) {
		if ($(b).find('.category-header').text() === "poly") return true;
		if ($(a).find('.category-header').text() === "poly") return false;
		return ( $(a).find('.category-header').text() > $(b).find('.category-header').text() );
	}).appendTo('.question-detail');

}

_OKCP.clearCachedQuestionData = function() {
	console.log("cleared cached question data");
	var recentProfiles = JSON.parse(localStorage.okcpRecentProfiles);
	for (var profile in recentProfiles) {
		delete recentProfiles[profile]; // remove not-recently visited profiles
	}
	localStorage.okcpRecentProfiles = JSON.stringify(recentProfiles);
}

_OKCP.setProfilerParams = function(){
	return
	try{
		var scriptEl = $('script').filter(function(){ return $(this).text().includes('profileParams')})
		var pJson = scriptEl.text()
			.match(/var profileParams = .*/g)[0]
			.slice(20, -1)
		_OKCP.profileParams = JSON.parse(pJson)
		console.log('profileParams', _OKCP.profileParams);
	}catch(e){
		console.log('couldnt find params', e);
	}

}
