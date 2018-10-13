_OKCP.getHoverAnswers = function ($card) {
	const requiredCategories = getCats();
	const showAll = getShowAllBool()
	const hideWeak = getHideWeakBool()
	
	list = localStorage.okcpDefaultQuestions 
		? JSON.parse(localStorage.okcpDefaultQuestions).questionsList 
		: {};
		
	var name = 'usr' + $($card).find('[data-username]').attr('data-username');

	// var name = ($($card).attr('href'))
	// 	? $($card).attr('href').split('profile/')[1].split('?')[0]
	// 	: $($card).find('[href]')[0].href.split('profile/')[1].split('?')[0];
	// 
	
	if ($('.match-ratios-wrapper-outer-hover.'+name).length) {
		return;
	}
	
	
	// console.log('checking for ' + name.replace('\n', ''));
	// console.log(requiredCategories);
	var answers = JSON.parse(window.answers)
	var ratioList = $(`<table class="match-ratios-wrapper-outer-hover hover ${window.onLikes ? 'likes-view' : ''} ${name}"><tr><td class="match-ratios">
		<ul class="match-ratios-list-hover ${name}"></ul>
		</td></tr></table>`);
		
	if (answers[name] && answers[name].includes(name)) {
		$($card).prepend(answers[name]);
		removeDupes();
		let cats = $($card).find(`.match-ratio-category`);
		!showAll && hideCats(cats);
		purgeMismatches($card);
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
		var lastSuccess = $(this).html().length > 1000 ;
		if (!lastSuccess) {
			failed++;
			console.log({xhr});
			debugger;
		}
		if (numRequestsMade > 300) debugger;
		if (numRequestsFinished >= Math.min(initialMaxRequests, numQuestionPages)) {
			if (numRequestsFinished >= numQuestionPages){
			 
				console.log('failed', failed);
				console.log('numQuestionPages', name, numQuestionPages);
				finished = true;
				areWeDone();
				saveAnswers();
				let cats = $($card).find(`.match-ratio-category`);
				!showAll && hideCats(cats);
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
				!(numRequestsMade % 10) && console.log('reqs made', numRequestsMade);
				try{
					$('<div class="page-results-' + questionPageNum + ' page-results-' + name + '"></div>')
						.appendTo(pageResultsDiv)
						.load(url, loadData);
				}catch(err){
					console.log('TRYING AGAIN', err);
					debugger;
					$('<div class="page-results-' + questionPageNum + ' page-results-' + name + '"></div>')
						.appendTo(pageResultsDiv)
						.load(url, loadData);
				}
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
		console.log('html', $(html));
		
		var answers = JSON.parse(window.answers);
		answers[name] = html;
		localStorage.answers = JSON.stringify(answers);
		console.log('saved ' + name + 'to local storage');
		purgeMismatches($card);
		
		window.answers = JSON.stringify(answers).replace(/(\\n|\\t)*/g, '');

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

_OKCP.loadHoverOptions = function(updateCards) {
	setInterval(updateCards, 1000);
	
	const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
	
  setTimeout(setFilters, 1000)

	function createStorageControl(storageKey, label, containerSelector, className){
		var $head = $(containerSelector)
		var isChecked = !(localStorage[storageKey] === "false")
		var $wrapper = $(`<div class="${className}"> ${label}</div>`)
		var $checkbox = $(`<input type="checkbox" ${isChecked && 'checked'} />`)
		$checkbox.click(function(){
			var newVal = localStorage[storageKey] === "false";
			$(this).checked = newVal;
			console.log(newVal);
			localStorage[storageKey] = newVal;
			$('.match-ratios-wrapper-outer-hover').remove();
			console.log($('.match-ratios-wrapper-outer-hover'));
			existingNames = [];
			let cats = $('body').find(`.match-ratio-category`);
			!getShowAllBool() && hideCats(cats);
			updateCards();
			purgeMismatches();
		})
		$wrapper.appendTo($head)
		$checkbox.appendTo($wrapper);
	}

	function setFilters(){
		chosenCats = JSON.parse(localStorage.okcpChosenCategories || "{}") || {};

		var $main = $('body');
		
		var $filterWrapper = $(`<div class="filter-wrapper"></div>`)
		var $filters = $(`<div class="category-filters"></div>`)
		
		createStorageControl('displayAllCategories', 'Show All Categories', $filterWrapper, 'show-all')
		createStorageControl('hideWeakParticipants', 'HideWeakParticipants', $filterWrapper, 'hide-weak')
		let $locationWrapper = getLocationsEl(updateCards);
		$($filterWrapper).append($locationWrapper);
	// 
		setInterval(()=>{
			const $newWrapper = getLocationsEl(updateCards);
			console.log('lengths', $($newWrapper[0]).children().length, $($locationWrapper[0]).children().length);
			if ($($newWrapper[0]).children().length == $($locationWrapper[0]).children().length) return;
			console.log('swapping html');
			
			$locationWrapper[0].innerHTML = $newWrapper[0].innerHTML;
		}, 2000);
		setMainResetBtn($filterWrapper);
		setToggleBtn($filters, 'Toggle Filters');
		
		$($filterWrapper).append($filters)
		$($main).append($filterWrapper);
		Object.keys(questions).forEach(category => {
			const shouldBeChecked = Boolean(chosenCats[category]);
			const $wrapper = $(`<span class="category-wrapper"></span>`).appendTo($filters);
			$wrapper.append(`${category} <input type="checkbox" cat-attr="${category}" ${shouldBeChecked && 'checked'} /><br />`)

			$($wrapper).click(function(){
				const cat = $(this).find("[cat-attr]").attr("cat-attr");
				const newVal = !chosenCats[cat];
				chosenCats[cat] = newVal;
				localStorage.okcpChosenCategories = JSON.stringify(chosenCats);
				$(cat).attr("checked", newVal);
				$('.match-ratios-wrapper-outer-hover').remove();
				existingNames = [];
				updateCards();
				purgeMismatches();
			})

		})
	}

	function setMainResetBtn($wrapper){
		const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-all-btn">
				<span class="rating_like">Reset</span>
			</button>`)
		$($btn).click((event) => {
			window.answers = "{}";
			localStorage.answers = "{}";
			$('.match-ratios-wrapper-outer-hover').remove();
			console.log('reset storage complete');
		});
		$($wrapper).append($btn);
	}

}

function setToggleBtn($wrapper, label, id){
	// showOkcpFilters = JSON.pa(localStorage.showOkcpFilters);
	
	const $btn = $(`<button name="reset" class="">
			<span class="rating_like">${label}</span>
		</button>`)
	$($btn).click((event) => {
		const show = localStorage['showOkcpFilters'+label] === 'true';
		$($wrapper).children().each(function(){ 
			show ? $(this).show() : $(this).hide();
		});
		$($btn).show();
		
		localStorage['showOkcpFilters'+label] = !show;
	});
	
	$($wrapper).prepend($btn);
}

function getLocationsEl(updateCards){
	return
	let locations = $.map($('.userInfo-meta-location'), el => el.innerHTML.split(', ')[1])
	locations = [...new Set(locations.sort( (a,b) => 
		(a.length-b.length != 0) ? b.length-a.length : b[0]-a[0]
	)), 'ALL'];
	const chosenLocations = getChosenLocations();
	// $('.category-wrapper.locations').remove();
	const $wrapper = $(`<span class="category-wrapper locations"></span>`);
	locations.forEach(location => {
		if (chosenLocations[location] === undefined) {
			chosenLocations[location] = true;
			localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
		}
		const shouldBeChecked = Boolean(chosenLocations[location]);
		$wrapper.append(`${location} <input type="checkbox" loc-attr="${location}" ${shouldBeChecked && 'checked'} /><br />`)

		$($wrapper).click(function(){
			const loc = $(this).find("[loc-attr]").attr("loc-attr");
			const newVal = !chosenLocations[loc];
			chosenLocations[loc] = newVal;
			localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
			$(loc).attr("checked", newVal);
			$('.match-ratios-wrapper-outer-hover').remove();
			existingNames = [];
			updateCards();
			purgeMismatches();
		})

	})
	// $($wrapper).bind('DOMNodeInserted', () => {
	// 	console.log('node inserted');
	// 	purgeMismatches()
	// });
	setToggleBtn($wrapper, 'Toggle Locations');
	
	return $wrapper;
}

function purgeMismatches($card){
	if (!$card) {
		$('.userrow').show();
		return $('.userrow').each(function(){purgeMismatches(this)})
	}
	
	if (getHideWeakBool()) {
		const $visCats = $($card).find('.match-ratios-list-hover');
		if (!$($visCats).children(':visible').not('.not-a-match').length) 
			return $($card).hide();
	}
	
	const locations = getChosenLocations();
	
	const loc = $($card).find('.userInfo-meta-location')[0].innerHTML.split(', ')[1];
	if (!(locations[loc] || locations['ALL'])) {
		console.log('removing for loc', {loc, locations});
		return $($card).hide();
	}
	$($card).show();
		
}

function getCats(){
	const chosenCats = JSON.parse(localStorage.okcpChosenCategories || "{}") || {}
	const cats = Object.keys(chosenCats).filter(key => chosenCats[key]);
	return cats;
}

function hideCats(catgs){
	const requiredCategories = getCats();
	$(catgs).each(function(){
		const domName = this.innerHTML;
		const missingFields = !requiredCategories.some(cat => {
			return spaces(domName).includes(spaces(cat)) || spaces(cat).includes(spaces(domName))
		})
		missingFields ? $(this).parent().hide() : $(this).parent().show();
	})
}

function getShowAllBool(){return (localStorage.displayAllCategories == "false" ? false : true)}
function getHideWeakBool(){return (localStorage.hideWeakParticipants == "false" ? false : true)}
function getChosenLocations(){return JSON.parse(localStorage.okcpChosenLocations || "{}") || {}}
function spaces(str){ return str.replace(/(\-|_)/g, ' ') }
String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|\s(\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();        
    });
};