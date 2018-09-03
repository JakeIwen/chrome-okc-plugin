_OKCP.getHoverAnswers = function (list, $card) {
	var name = $($card).find('[href]')[0].href.split('profile/')[1].split('?')[0]
;
	console.log({list, $card, name});
	list = undefined;
	$('.match-ratios-wrapper-outer-hover') && $('.match-ratios-wrapper-outer-hover').remove();
	
	var ratioList = $('<table class="match-ratios-wrapper-outer-hover"><tr><td class="match-ratios">'+
		'<ul class="match-ratios-list-hover"></ul>'+
		'</td></tr></table>');
	
	$($card).prepend(ratioList);
	
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

			    if (_OKCP.onOwnProfile) {
				// TODO: Fix own profile view - we need the text of the label which follows the <input>
				// element that is checked
					theirAnswer = questionElem.find(".my_answer input:checked + label").text().trim();
					theirNote = questionElem.find(".explanation textarea").text().trim();
				} else {
					theirAnswer = questionElem.find("#answer_target_"+num).text().trim();
					if (theirAnswer === '') continue; //if the answer elem doesn't exist, continue
					theirNote   = questionElem.find("#note_target_"+num).text().trim();
					yourAnswer  = questionElem.find("#answer_viewer_"+num).text().trim();
					yourNote    = questionElem.find("#note_viewer_"+num).text().trim();
				}
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
		// console.log(questionList);
		areWeDone(false);
	}

	function loadProfileAnswers() {
		//loop through every question page
		$('#page-results') && $('#page-results').remove();
		$('.page-results-link') && $('.page-results-link').remove();
		
		var pageResultsDiv = $('<div id="page-results"></div>').appendTo('body');
		$('#footer').append('<a class="page-results-link" href="#page-results">Show question results</a>');

		while (!requestFailed && numRequestsMade < _OKCP.numQuestionPages) {
			updateQuestionPath();
			// console.log('loading page '+ questionPath);
			numRequestsMade++;
			
			//add page results, parse the page
			$('<div id="page-results-' + questionPageNum + '"></div>')
				.appendTo(pageResultsDiv)
				.load(questionPath, loadData);
		}
	}

	function updateQuestionPath (pageNum) {
		if (_OKCP.questionFetchingMethod === "original" || _OKCP.questionFetchingMethod === "mobile_app") {
			var questionFilterParameter = 'i_care=1';
			if (_OKCP.onOwnProfile) {
				questionFilterParameter = 'very_important=1';
			}
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

			$('.spinner').fadeOut(300);
			_OKCP.getHoverAnswersFinished = true;
		}
		
		$('.match-ratios-list-hover').html('');
		$('.question-detail > ul').remove();
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
				.appendTo('.match-ratios-list-hover')
				.hover(function(e){
					// return early if questions haven't finished loading
					if (!_OKCP.getHoverAnswersFinished) return false;

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
		$('.match-ratios-list-hover .match-ratio').sort(function(a,b) {
			if ($(b).find('.match-ratio-category').text() === "poly:") return true;
			if ($(a).find('.match-ratio-category').text() === "poly:") return false;
			return ( $(a).find('.match-ratio-category').text() > $(b).find('.match-ratio-category').text() );
		}).appendTo('.match-ratios-list-hover');

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
};
