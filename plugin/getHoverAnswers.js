_OKCP.getHoverAnswers = function ($card, requiredCategories, filterList) {
	list = localStorage.okcpDefaultQuestions 
		? JSON.parse(localStorage.okcpDefaultQuestions).questionsList 
		: {};
		
	var name = ($($card).attr('href'))
		? $($card).attr('href').split('profile/')[1].split('?')[0]
		: $($card).find('[href]')[0].href.split('profile/')[1].split('?')[0];
		
	name = 'usr' + name;
	
	if ($('.match-ratios-wrapper-outer-hover.'+name).length) {
		return;
	}
	
	
	console.log('checking for ', name);
	var answers = JSON.parse(window.answers)
	
	var ratioList = $(`<table class="match-ratios-wrapper-outer-hover hover ${window.onLikes ? 'likes-view' : ''} ${name}"><tr><td class="match-ratios">
		<ul class="match-ratios-list-hover ${name}"></ul>
		</td></tr></table>`);
		
	if (answers[name] && answers[name].includes(name)) {
		$($card).prepend(answers[name]);
		purgeMismatches(answers[name]);
		removeDupes();
		return;
	}
	
	console.log('making new');
	$($card).prepend(ratioList);
	
	window.aUrls = window.aUrls || [];
	var url = '';
	var numRequestsMade = 0;
	var numRequestsFinished = 0;
	var questionList = [];
	var initialMaxRequests = 20;
	var numQuestionPages = initialMaxRequests;
	var failed = 0;
	var responseCount = {};
	var responseGood = 0;
	var response = 0;
	var finished = false;
	var questionPageNum = 0; //for iterating over question pages
	var questionPath; //for storing the path of the question page as we iterate
	var requestFailed = false;
	var pageResultsDiv
	var recentProfiles = localStorage.okcpRecentProfiles ? JSON.parse(localStorage.okcpRecentProfiles) : {"_ATTENTION":"This is just temporary caching to avoid hitting the server a million times. Notice there's an expires time built in for each key."};
	
	// get list of questions and categories to compare to

	firstRequests();

	function loadData(response, status, xhr) {
		numRequestsFinished++;
		if (finished)  return false;
		
		if ( status === "error" ) {
			console.log("Request failed on number " + numRequestsMade);
			requestFailed = true;
			return false;
		}

		//fix the illegal ids that break jQuery
		$(this).find('[id]').each(function(){
			var elem = $(this);
			var oldID = elem.attr('id');
			var idArr = oldID.split('\\\"');
			if (idArr.length > 2) $(this).attr('id',idArr[1]);
		});

		for (var category in list) {
			var categoryQuestionList = list[category];
			for (var i = 0; i < categoryQuestionList.length; i++) {
				var listItem = categoryQuestionList[i];
				var theirAnswer, theirAnswerIndex, theirNote, yourAnswer, yourNote, answerScore, answerWeight, answerScoreWeighted;

				var num = listItem.qid;
				var possibleAnswers = listItem.answerText;
				// var questionElem = $('#question_' + num + '[public]');		//misses some
				var questionElem = $(pageResultsDiv).find('#question_' + num);
				// if question isn't present on page, continue
				if (questionElem.length === 0) continue;
				// get question information
				var questionText = questionElem.find('.qtext').text().trim();
				if (questionText === "") continue;

				theirAnswer = questionElem.find("#answer_target_"+num).text().trim();
				if (theirAnswer === '') continue; //if the answer elem doesn't exist, continue
				theirNote   = questionElem.find("#note_target_"+num).text().trim();
				yourAnswer  = questionElem.find("#answer_viewer_"+num).text().trim();
				yourNote    = questionElem.find("#note_viewer_"+num).text().trim();
				
				for (var j = 0; j < possibleAnswers.length; j++) {
					if (possibleAnswers[j].replace('.', '') === theirAnswer.replace('.', '')) {
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
				// console.log(num + " - " + questionText);
				questionList.push({
					question: questionText,
					qid: num,
					theirAnswer: theirAnswer,
					theirNote: theirNote,
					yourAnswer: yourAnswer,
					yourNote: yourNote,
					answerScore: answerScore,
					answerWeight: answerWeight,
					answerScoreWeighted: answerScoreWeighted,
					category: category,
					categoryReadable: category.split('_').join(' ')
				});
				listItem.qid = listItem.qid+"-used";
			}
		}
		
		lastSuccess = $(this).html().length > 1000 ;
		if (!lastSuccess) failed++;
		if (numRequestsMade > 300) debugger;
		if (numRequestsFinished >= Math.min(initialMaxRequests, numQuestionPages)) {
			if (numRequestsFinished >= numQuestionPages){
			 
				console.log('failed', failed);
				console.log('numQuestionPages', name, numQuestionPages);
				finished = true;
				areWeDone();
				saveAnswers();

			} else if(numRequestsFinished >= numRequestsMade){
				nextRequest();
			} 
		}
		
	}
	
	function firstRequests(){
		pageResultsDiv = $('<div class="page-results '+name+'"></div>')
		// .appendTo($card);
		$.get(`https://www.okcupid.com/profile/${name.replace('usr', '')}/questions`, data => {
			numQuestionPages = parseInt($(data).find('a.last').text()) || 20;
			console.log(`name: ${name}, numpages: ${numQuestionPages}`);
			for (var i = 0; i < Math.min(initialMaxRequests, numQuestionPages); i++) {
				url = "//www.okcupid.com/profile/" + name.replace('usr', '') + "/questions?n=2&low=" + (questionPageNum*10+1) + "&leanmode=1";
				questionPageNum++;
				$('<div class="page-results-' + questionPageNum + ' page-results-' + name + '"></div>')
					.appendTo(pageResultsDiv)
					.load(url, loadData);
			}
		})
		
	}
	
	function nextRequest(){
		for (var i = 0; i < 10; i++) {
			url = "//www.okcupid.com/profile/" + name + "/questions?n=2&low=" + (questionPageNum*10+1) + "&leanmode=1";
			questionPageNum++;
			
			if (!requestFailed) {
				numRequestsMade++;
				console.log('reqs made', numRequestsMade);
				$('<div class="page-results-' + questionPageNum + ' page-results-' + name + '"></div>')
					.appendTo(pageResultsDiv)
					.load(url, loadData);
			}

		}
		
	

	}


	function areWeDone() {

		$('.match-ratios-list-hover.'+name).html('');
		for (var category in responseCount) {
			
			var countArr = responseCount[category];
			var matchClass = 'match-' + Math.floor(countArr[0]/countArr[1]*5);
			var categoryReadable = category.split('_').join(' ');
			
			if (countArr[1]<=1) matchClass += ' one-data-point-match';
			if (countArr[1] >= 10) matchClass += ' more-than-10';
			if (countArr[0]/countArr[1] <= 0.1) matchClass += ' not-a-match';

			var numerator = Math.round(countArr[0]*10)/10+'';
			var denominator = Math.round(countArr[1]*10)/10+'';
			var numeratorArr = numerator.split('.');
			var denominatorArr = denominator.split('.');
			
			if (denominator*1 <= 0.5) continue;
			
			var matchRatioHtmlValue = '<span class="integer">' + numeratorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(numeratorArr[1] || '0')+'</span><span class="slash">/</span><span class="integer">' + denominatorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(denominatorArr[1] || '0')+'</span>';
			
			$('<li class="match-ratio ' + matchClass + '" category="'+category+'"><span class="match-ratio-progressbar ' + matchClass + '" style="width:' + (Math.round(countArr[0]/countArr[1]*93)+7) + '%"></span><span class="match-ratio-category">' + categoryReadable + '</span><span class="match-ratio-value">' + matchRatioHtmlValue + '</span></li>')
				.appendTo('.match-ratios-list-hover.'+name)
				console.log('appended ', category);
		}
	}
	
	function saveAnswers(){
		$('.page-results-'+name).remove();
		removeDupes();
		
		var html = ratioList[0].outerHTML;
		console.log('html', html);
		
		var answers = JSON.parse(window.answers);
		answers[name] =  html;
		localStorage.answers = JSON.stringify(answers);
		console.log('saved ' + name + 'to local storage');
		purgeMismatches(html);
		
		window.answers = JSON.stringify(answers).replace(/(\\n|\\t)*/g, '');
	}
	
	function purgeMismatches(html){
		$('.match-ratio-category').each(function(){
			const domName = $(this).text()
			const hasField = !requiredCategories.some(cat => spaces(domName).includes(spaces(cat)))
			if (hasField) $(this).parent()	.remove();
		})
		if ( !requiredCategories.some(category => html.includes(category)) ) 
			$($card).remove();
	}
	
	function spaces(str){
		return str.replace(/(\-|_)/g, ' ')
	}
	
	function removeDupes(){
		
		var onBrowseMatches = window.location.pathname=='/match';
		var onLikes = window.location.pathname=='/who-you-like';
		
		if (onLikes) {
			var anchorCards = $($card).find('a.userrow-inner');
			if (anchorCards.length > 1) {
				$(anchorCards).each(function(idx){
					if (idx) $(this).remove(); 
				})
			}
		} else if(onBrowseMatches) {
			var matchCards = $($card).find('div.match_card');
			if (matchCards.length > 1) {
				$(matchCards).each(function(idx){
					if (idx < matchCards.length-1) $(this).remove(); 
				})
			}
		}

	}

};

_OKCP.clearCachedQuestionData = function() {
	console.log("cleared cached question data");
	var recentProfiles = JSON.parse(localStorage.okcpRecentProfiles);
	for (var profile in recentProfiles) {
		if (profile === "_ATTENTION") continue;
		delete recentProfiles[profile]; // remove not-recently visited profiles
	}
	localStorage.okcpRecentProfiles = JSON.stringify(recentProfiles);
};

