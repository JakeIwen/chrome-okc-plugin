_OKCP.getBrowseAnswers = function (list, name, $card) {
	if (!name || !$card) {
		console.log('missing');
		return;
	}
	var numRequestsMade = 0;
	var numRequestsFinished = 0;
	var questionList = [];
	var byCategory = {};
	var responseCount = {};
	var responseGood = 0;
	var response = 0;
	var questionPageNum = 0; //for iterating over question pages
	var questionPath; //for storing the path of the question page as we iterate
	var requestFailed = false;
	var recentProfiles = localStorage.okcpRecentProfiles ? JSON.parse(localStorage.okcpRecentProfiles) : {"_ATTENTION":"This is just temporary caching to avoid hitting the server a million times. Notice there's an expires time built in for each key."};

	// if (_OKCP.onOwnProfile) { //on own profile
	// 	log.info('on own profile');
	// 	$('.spinner').hide();
	// 	return false;
	// }

	// get list of questions and categories to compare to
	if (list === undefined) {
		list = localStorage.okcpDefaultQuestions ? JSON.parse(localStorage.okcpDefaultQuestions).questionsList : {};
	}

	// check for cached question data
	if (!!recentProfiles[name] && _OKCP.cacheEnabled && new Date().getTime() - recentProfiles[name].expires < 0) {
		// console.log('cached');
		recentProfiles[name].expires = new Date().getTime() + 300000; //reset expires
		questionList = recentProfiles[name].questionList;
		responseCount = recentProfiles[name].responseCount;
		areWeDone(true);
	} else {
		// console.log('not cached');
		loadProfileAnswers();
	}

	function loadData(response, status) {
		if ( status === "error" ) {
			numRequestsFinished++;
			console.log("Request failed on number " + numRequestsMade);
			console.log('response', response);
			requestFailed = true;
			return false;
		}
		numRequestsFinished++;
		
		//fix the illegal ids that break jQuery
		$(this).find('[id]').each(function(){
			var elem = $(this);
			var oldID = elem.attr('id');
			var idArr = oldID.split('\\\"');
			if (idArr.length > 2) {
				$(this).attr('id',idArr[1]);
			}
		});
		
		for (var category in list) {
			var categoryQuestionList = list[category];
			for (var i = 0; i < categoryQuestionList.length; i++) {
				var listItem = categoryQuestionList[i];
				var theirAnswer, theirAnswerIndex, theirNote, yourAnswer, yourNote, answerScore, answerWeight, answerScoreWeighted;

				var num = listItem.qid;
				var possibleAnswers = listItem.answerText;
				// var questionElem = $('#question_' + num + '[public]');		//misses some
				var questionElem = $('#question_' + num);

				// if question isn't present on page, continue
				if (questionElem.length === 0) {continue;}

				// get question information
				var questionText = questionElem.find('.qtext').text().trim();
				if (questionText === "") continue;

	
				theirAnswer = questionElem.find("#answer_target_"+num).text().trim();
				if (theirAnswer === '') continue; //if the answer elem doesn't exist, continue
				theirNote   = questionElem.find("#note_target_"+num).text().trim();
				yourAnswer  = questionElem.find("#answer_viewer_"+num).text().trim();
				yourNote    = questionElem.find("#note_viewer_"+num).text().trim();
				
				for (var j = 0; j < possibleAnswers.length; j++) {
					// console.log(questionText + "  " + theirAnswer + " | " + wrongAnswers[j]);
					if (possibleAnswers[j] === theirAnswer) {
						theirAnswerIndex = j;
						break;
					}
				}
				answerScore = listItem.score[theirAnswerIndex];
				answerWeight = listItem.weight ? listItem.weight[theirAnswerIndex] || 0 : 1;
				if (answerWeight === 0) continue;
				answerScoreWeighted = ((answerScore+1) / 2) * answerWeight;
				// console.log(answerScore + " " + answerWeight);

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
		questionList.length && console.log('qlist', questionList);
		areWeDone(false);
	}

	function loadProfileAnswers() {
		// if (location.href.split('/profile/')[1] === undefined) return false;
		//loop through every question page
		var pageResultsDiv = $('<div id="page-results-'+name+'"></div>').appendTo($card);
		$('#footer').append('<a class="page-results-'+name+'-link" href="#page-results-'+name+'">Question results for '+name+'</a>');

		while (!requestFailed && numRequestsMade < _OKCP.numQuestionPages) {
			updateQuestionPath();
			console.log('loading page '+ questionPath);
			numRequestsMade++;

			//add page results, parse the page
			// $('<div id="page-results-' + name + '-' + questionPageNum + '"></div>')
			// 	.appendTo(pageResultsDiv)
			// 	.load(questionPath, loadData);
			$.get(questionPath, loadData);
			// loadData()
			
		}
	}

	function updateQuestionPath (pageNum) {
		if (_OKCP.questionFetchingMethod === "original" || _OKCP.questionFetchingMethod === "mobile_app") {
			var questionFilterParameter = 'i_care=1';
			// if (_OKCP.onOwnProfile) {
			// 	questionFilterParameter = 'very_important=1';
			// }
			questionPageNum = pageNum || questionPageNum;
			questionPath = "//www.okcupid.com/profile/" + name + "/questions?n=2&low=" + (questionPageNum*10+1) + "&" + questionFilterParameter;
			if (_OKCP.questionFetchingMethod === "mobile_app") questionPath += '&leanmode=1';
			questionPageNum++;
		}
	}

	// if we're done, it hides the spinner and adds the UI, then sorts the categories
	function areWeDone(fromCached) {
		// console.log('from cache '+fromCached);
		if (fromCached || numRequestsFinished === numRequestsMade) {
			// put this data into localStorage
			recentProfiles[name] = {
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

			_OKCP.getBrowseAnswersFinished = true;
		}

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
			
			$('<li class="match-ratio ' + matchClass + '" category="'+category+'"><span class="match-ratio-progressbar ' + matchClass + '" style="width:' + (Math.round(countArr[0]/countArr[1]*93)+7) + '%"></span><span class="match-ratio-category">' + categoryReadable + '</span><span class="match-ratio-value">' + matchRatioHtmlValue + '</span></li>')
				.appendTo($card)
				.hover(function(e){
					// return early if questions haven't finished loading
					if (!_OKCP.getBrowseAnswersFinished) return false;

					var target = e.target.tagName === 'LI' ? $(e.target) : $(e.target).parent('li');
					var category = target.attr('category');

					$('.'+name+'.question-detail > ul:not(.'+name+'.question-detail-' + category + ')').stop().slideUp(500);

				}, function() {
					$('.'+name+'.question-detail > ul').slideDown(500);
				});

			
			for (var i = 0; i < questionList.length; i++) {
				
				var question = questionList[i];
				if (question.category === category) {
					byCategory[category] = [].concat([byCategory[category]], [category])
					matchClass = 'match-' + (Math.floor((question.answerScore+1)/2*5));
				}
			}
			console.log('byCategory', byCategory);
		}

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
};
