_OKCP.getAnswers = function (list) {
	var numRequestsMade = 0;
	var numRequestsFinished = 0;
	var questionList = [];
	var responseCount = {};
	var responseGood = 0;
	var response = 0;
	var questionPageNum = 0; //for iterating over question pages
	var questionPath; //for storing the path of the question page as we iterate
	var requestFailed = false;
	var recentProfiles = localStorage.okcpRecentProfiles ? JSON.parse(localStorage.okcpRecentProfiles) : {"_ATTENTION":"This is just temporary caching to avoid hitting the server a million times. Notice there's an expires time built in for each key."};

	if (_OKCP.onOwnProfile) { //on own profile
		log.info('on own profile');
		$('.spinner').hide();
		return false;
	} else {
		


	// get list of questions and categories to compare to
	if (list === undefined) {
		list = localStorage.okcpDefaultQuestions ? JSON.parse(localStorage.okcpDefaultQuestions).questionsList : {};
	}

	// check for cached question data
	// if (!!recentProfiles[_OKCP.profileName] && _OKCP.cacheEnabled && new Date().getTime() - recentProfiles[_OKCP.profileName].expires < 0) {
	// 	// console.log('cached');
	// 	recentProfiles[_OKCP.profileName].expires = new Date().getTime() + 300000; //reset expires
	// 	questionList = recentProfiles[_OKCP.profileName].questionList;
	// 	responseCount = recentProfiles[_OKCP.profileName].responseCount;
	// 	areWeDone(true);
	// } else {
		// console.log('not cached');
		loadProfileAnswers();
	// }

	function loadData(answer) {
		const {target, viewer, question} = answer
		for (var category in list) {
			var categoryQuestionList = list[category];
			
			for (var i = 0; i < categoryQuestionList.length; i++) {
				var listItem = categoryQuestionList[i];
				
				if(parseInt(listItem.qid) !== question.id) continue;
				
				var theirAnswerIndex, answerScore, answerWeight, answerScoreWeighted;
				const theirAnswer = question.answers[target.answer];
				var possibleAnswers = listItem.answerText;

				for (var j = 0; j < possibleAnswers.length; j++) {
					if (possibleAnswers[j] === theirAnswer) {
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

	async function loadProfileAnswers() {
		var userId = window.location.href.split('/profile/')[1].split('?')[0]
		var apiAnswers = await _OKCP.getApiAnswers(userId);
		apiAnswers.forEach(answerObj => loadData(answerObj))
		console.log({questionList, responseCount});
		areWeDone(false);
	}



	// if we're done, it hides the spinner and adds the UI, then sorts the categories
	function areWeDone(fromCached) {
		// console.log('from cache '+fromCached);
		if (fromCached || numRequestsFinished === numRequestsMade) {
			// put this data into localStorage
			recentProfiles[_OKCP.profileName] = {
				expires: new Date().getTime() + 600000, // temporarily-cached data expires 10 minutes from being set
				questionList: questionList,
				responseCount: responseCount
			};

			for (var profile in recentProfiles) {
				if (profile === "_ATTENTION") continue;
				if (new Date().getTime() - recentProfiles[profile].expires > 0) {
					delete recentProfiles[profile]; // remove not-recently visited profiles
				}
			}
			localStorage.okcpRecentProfiles = JSON.stringify(recentProfiles);

			$('.spinner').fadeOut(300);
			_OKCP.getAnswersFinished = true;
		}
		$('.match-ratios-list').html('');
		$('.question-detail > ul').remove();
		console.log('mrl', {responseCount	});
		
		for (var category in responseCount) {
			var countArr = responseCount[category];
			var matchClass = 'match-' + Math.floor(countArr[0]/countArr[1]*5);
			var categoryReadable = category.split('_').join(' ');
			if (countArr[1]<=1) {
				matchClass += ' one-data-point-match';
			}
			if (countArr[1] >= 10) {
				matchClass += ' more-than-10';
			}
			if (countArr[0]/countArr[1] <= 0.1) {
				matchClass += ' not-a-match';
			}

			var numerator = Math.round(countArr[0]*10)/10+'';
			var denominator = Math.round(countArr[1]*10)/10+'';
			var numeratorArr = numerator.split('.');
			var denominatorArr = denominator.split('.');
			if (denominator*1 <= 0.5) continue;
			var matchRatioHtmlValue = '<span class="integer">' + numeratorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(numeratorArr[1] || '0')+'</span><span class="slash">/</span><span class="integer">' + denominatorArr[0] + '</span><span class="point">.</span><span class="decimal">'+(denominatorArr[1] || '0')+'</span>';
			console.log('mrhtmlrv', matchRatioHtmlValue);
			$('<li class="match-ratio ' + matchClass + '" category="'+category+'"><span class="match-ratio-progressbar ' + matchClass + '" style="width:' + (Math.round(countArr[0]/countArr[1]*93)+7) + '%"></span><span class="match-ratio-category">' + categoryReadable + '</span><span class="match-ratio-value">' + matchRatioHtmlValue + '</span></li>')
				.appendTo('.match-ratios-list')
				.hover(function(e){
					// return early if questions haven't finished loading
					if (!_OKCP.getAnswersFinished) return false;

					var target = e.target.tagName === 'LI' ? $(e.target) : $(e.target).parent('li');
					var category = target.attr('category');

					$('.question-detail > ul:not(.question-detail-' + category + ')').stop().slideUp(500);

				}, function() {
					$('.question-detail > ul').slideDown(500);
				});


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


		if ($('.question-detail > ul').length === 0) {
			$('.question-detail').append('<ul><li class="match match-nomatches"><ul>'+
				'<li class="noresults">' + 'No Results' + '</li>'+
				'<li class="note">' + 'To improve the plugin\'s accuracy, answer more questions publicly and rank them as "Very Important". You can also click the "Improve Accuracy" link at the top of this panel to help out.' + '</li>'+
				'</ul></li></ul>');
			return false;
		}

		// sort categories
		$('.match-ratios-list .match-ratio').sort(function(a,b) {
			if ($(b).find('.match-ratio-category').text() === "poly:") return true;
			if ($(a).find('.match-ratio-category').text() === "poly:") return false;
			return ( $(a).find('.match-ratio-category').text() > $(b).find('.match-ratio-category').text() );
		}).appendTo('.match-ratios-list');

		$('.question-detail > ul').sort(function(a,b) {
			if ($(b).find('.category-header').text() === "poly") return true;
			if ($(a).find('.category-header').text() === "poly") return false;
			return ( $(a).find('.category-header').text() > $(b).find('.category-header').text() );
		}).appendTo('.question-detail');

		if (_OKCP.debugTimerEnabled) {
			console.log('Fetching the questions took ' + (new Date().getTime() - _OKCP.debugTimer.getTime()) + ' ms');
			var timeList = JSON.parse(localStorage.timeList);
			timeList.push(1*(new Date().getTime() - _OKCP.debugTimer.getTime()));
			localStorage.timeList = JSON.stringify(timeList);
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
}
};
