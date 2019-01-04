_OKCP.getHoverAnswers = function ($card) {
	const requiredCategories = getRequiredCats();
	const hideWeak = getHideWeakBool()
	
	var list = localStorage.okcpDefaultQuestions 
		? JSON.parse(localStorage.okcpDefaultQuestions).questionsList 
		: {};

	var name = 'usr' + _OKCP.getUserName($card);
	if ($('.match-ratios-wrapper-outer-hover.'+name).length || name ==="usrundefined" ) {
		return;
	}
	
	window['pageQuestions'+name] = [];

	var answers = window.answers;

	if (answers[name] && answers[name].includes(name)) {

		$($($card).find(`.user${window.onLikes ? 'row' : 'card'}-info`)[0]).after(answers[name]);
	
		removeDupes();
		_OKCP.purgeMismatches($card);
		// saveCard();
		return;
	}
	
	console.log('making new');
	var ratioList = $(`<table class="match-ratios-wrapper-outer-hover hover ${window.onLikes ? 'likes-view' : ''} ${name}"><tr><td class="match-ratios">
		<ul class="match-ratios-list-hover ${name}"></ul>
		</td></tr></table>`);
		
	$($($card).find(`.user${window.onLikes ? 'row' : 'card'}-info`)[0]).after(ratioList);
	window.aUrls = window.aUrls || []; //prevents multiple requests
	let url = '';
	let numRequestsMade = 0;
	let numRequestsFinished = 0;
	let questionList = [];
	let numQuestionPages = 20; // initial value
	let failed = 0;
	let responseCount = {};
	let responseGood = 0;
	let response = 0;
	let finished = false;
	let questionPageNum = 0; //for iterating over question pages
	let questionPath; //for storing the path of the question page as we iterate
	let requestFailed = false;
	let pageResultsDiv;

	initRequests();

	function loadData(response, status, xhr) {
		numRequestsFinished++;
		
		if ( status === "error" ) {
			console.log("Request failed on number " + numRequestsMade);
			
			requestFailed = true;
			
			debugger;
			return false;
		}
		
		if (!(response.length > 1000)) {
			failed++;
			console.log('short response', {response, xhr});
		}
		
		if (!finished && (numRequestsFinished >= Math.min(numQuestionPages, numRequestsMade))) {
			if (numRequestsFinished >= numQuestionPages){
				finished = true;
				parseCombinedPages(pageResultsDiv);
				areWeDone();
				saveAnswers();
			} else{
				nextRequest();
			} 
		}
		
	}
	
	function parseCombinedPages(pageResultsDiv){
		
		$(pageResultsDiv).find('[id]').each(function(){
			if ($(this).attr('id').includes('question_')) {
				const qid = $(this).attr('id').split('question_')[1];
				const ansEls = $(this).find('.container.my_answer label.radio');
				let answerText
				try {answerText = $.map(ansEls, (el) => $(el).text().trim())}
				catch(e) {return}
				if (!answerText) return;
				
			  (window['pageQuestions'+name] || []).push({
					text: $(this).find('.qtext').text().trim(),
					answerText,
					qid,
					score: []
				});
			}
		});
		
		for (var category in list) {
			var categoryQuestionList = list[category];
			for (var i = 0; i < categoryQuestionList.length; i++) {
				var listItem = categoryQuestionList[i];
				var theirAnswer, theirAnswerIndex, theirNote, yourAnswer, yourNote, answerScore, answerWeight, answerScoreWeighted;

				var num = listItem.qid;
				var possibleAnswers = listItem.answerText;
				
				var questionElem = $(pageResultsDiv).find('#question_' + num).not('.not_answered');
				if (questionElem.length === 0) continue;
				var questionText = questionElem.find('.qtext').text().trim();
				
				if (questionText === "") continue;
				
				var alreadyExists = questionList.find(q => q.qid==num)
				if (alreadyExists) continue;
			

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
					name: name,
					categoryReadable: category.split('_').join(' ')
				});
				listItem.qid = listItem.qid+"-used";
			}
		}
	}
	
	function initRequests(){
		pageResultsDiv = $('<div class="page-results '+name+'"></div>')

		$.get(`https://www.okcupid.com/profile/${name.replace(/^usr/, '')}/questions`, data => {
			numQuestionPages = parseInt($(data).find('a.last').text()) || 20;
			console.log(`name: ${name}, numpages: ${numQuestionPages}`);
			nextRequest();
		})
	}
	
	function nextRequest(){
		for (var i = 0; i < 25; i++) {
			url = "//www.okcupid.com/profile/" + name.replace(/^usr/, '') + "/questions?n=2&low=" + (questionPageNum*10+1) + "&leanmode=1";
			if (i==9) console.log('got ', questionPageNum, ' pages for', name)
			if (!requestFailed && (numRequestsMade < numQuestionPages)) {
				questionPageNum++;
				numRequestsMade++;
				$('<div class="page-results-' + questionPageNum + ' page-results-' + name + '"></div>')
					.appendTo(pageResultsDiv)
					.load(url, (response, status, xhr)=>loadData(response, status, xhr));
			}
		}
	}

	function areWeDone() {

		$('.match-ratios-list-hover.'+name).html('');
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
				.appendTo('.match-ratios-list-hover.'+name)
				// console.log('appended ', category);
		}
	}
	
	function saveAnswers(){
		$('.page-results-'+name).remove();
		removeDupes();
		if(requestFailed) return;
		var html = ratioList[0].outerHTML;
		
		window.answers[name] = html;
		
		if (!(Object.keys(window.answers).length % 4)) {
			console.log('saving 4 answer sets');
			_OKCP.saveCompressed('answers', window.answers);
		}
		
		
		_OKCP.purgeMismatches($card);
			
		saveQuestions();
		// saveCard();
		
	}
	
	// function saveCard(){
	// 	// window.cards = window.cards || [];
	// 	// window.cards.push($card);
	// 	if($($card).is(":visible")){
	// 		console.log('binding');
	// 		$($card).bind('destroyed', function() {
	// 			console.log('dest', this)
	// 			$('.page-main').prepend($(this))
	// 		  // do stuff
	// 		})
	// 	}
	// 
	// 
	// }
	 
	function saveQuestions(){
		
		const savedQuestions = JSON.parse(localStorage.getItem('savedQuestions') || "[]");
		const questionTexts = savedQuestions.map( q => q.question.text )
		const existingQuestions = _OKCP.fullQuestionsList.map(q => q.text).sort();
		console.log({existingQuestions});
		window['pageQuestions'+name].forEach( (q, i) => {
			const savedIdx = questionTexts.indexOf(q.text);
			if (savedIdx == -1) {
				const question = q;
				question.answerText = question.answerText.filter(a => a && (a!=="Answer publicly to see my answer"))
				const exists = existingQuestions.includes(q.text);
				const qObj = { exists, question, count: 0 };
				savedQuestions.push(qObj);
			} else {
				savedQuestions[savedIdx].count++;
			}
		});
		
		localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
		var qs = savedQuestions;
		var existing = qs.filter(q => q.exists)
			.sort((a,b) => b.count-a.count)
			.map(q => [q.count, q.question]);
		var notExisting = qs.filter(q => !q.exists)
			.sort((a,b) => b.count-a.count)
			.map(q => [q.count, q.question]);
		
		var ana = notExisting.filter(q => q[1].text.includes('anal ') || q[1].answerText.some(t => t.includes('anal ')));
		var ora = notExisting.filter(q => q[1].text.includes('oral sex') || q[1].answerText.some(t => t.includes('oral sex')));
		console.log({existing, notExisting, ana, ora});
		
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
				// $(matchCards).each(function(idx){
				// 	if (idx < matchCards.length-1) $(this).remove(); 
				// })
			}
		}

	}

};
_OKCP.saveCompressed = function(key, value){
	const compressed = _OKCP.lz().compress(JSON.stringify(value), {outputEncoding: "StorageBinaryString"})
	localStorage.setItem(key, compressed);
	console.log('saved');
}
_OKCP.clearCachedQuestionData = function() {
	console.log("cleared cached question data");
	var recentProfiles = JSON.parse(localStorage.getItem(okcpRecentProfiles));
	for (var profile in recentProfiles) {
		if (profile === "_ATTENTION") continue;
		delete recentProfiles[profile]; // remove not-recently visited profiles
	}
	localStorage.setItem(okcpRecentProfiles, JSON.stringify(recentProfiles));
};

_OKCP.getUserName = function($card){
		return $($card).find('[data-username]').attr('data-username');
}

_OKCP.createStorageControl = function(storageKey, label, containerSelector, className){
	var $head = $(containerSelector)
	var isChecked = !(localStorage[storageKey] === "false")
	var $wrapper = $(`<div class="${className}"> ${label}</div>`)
	var $checkbox = $(`<input type="checkbox" ${isChecked && 'checked'} />`)
	$($checkbox).click(function(){ 
		console.log('click');
		var newVal = localStorage[storageKey] === "false";
		$(this).checked = newVal;
		localStorage[storageKey] = newVal;
		console.log('removing', $('.match-ratios-wrapper-outer-hover'));
		
		$('.match-ratios-wrapper-outer-hover').remove();
		window.existingNames = [];
		_OKCP.updateCards();
		_OKCP.purgeMismatches();
	})
	$wrapper.appendTo($head)
	$checkbox.appendTo($wrapper);
}

_OKCP.loadHoverOptions = function() {
	window.existingNames = [];
	setInterval(_OKCP.updateCards, 1000);
  setTimeout(setFilters, 1000)
	
	function setFilters(){
		
		const $catFilters = $(`<div class="category-filters"><h4>Categories</h4></div>`)
		const $locWrapper = $(`<div class="location-filters"><h3>Locations</h3></div>`);
		
		const controlDiv = $(`<div class="control-div"></div>`);
		_OKCP.createStorageControl('displayAllCategories', 'Show All Categories', controlDiv, 'show-all')
		_OKCP.createStorageControl('hideWeakParticipants', 'HideWeakParticipants', controlDiv, 'hide-weak')
		setMainResetBtn(controlDiv);
		
		const $filterWrapper =  $(`<div class="custom-filter-wrapper"></div>`)
															.append(controlDiv, $catFilters, $locWrapper)
															.hide();
		
		$('body').append($filterWrapper);
		
		const questions = _OKCP.parseStorageObject('okcpDefaultQuestions').questionsList;
		const chosenCats = _OKCP.parseStorageObject('okcpChosenCategories');
		
		Object.keys(questions).forEach(category => {
			const shouldBeChecked = Boolean(chosenCats[category]);
			const $wrapper = $(`<ul class="category-wrapper"></ul>`).appendTo($catFilters);
			$wrapper.append(`<li>${category} <input type="checkbox" cat-attr="${category}" ${shouldBeChecked && 'checked'} /></li>`)
			$($wrapper).click(function(){
				console.log('wrapper', this);
				const cat = $(this).find("[cat-attr]").attr("cat-attr");
				const newVal = !chosenCats[cat];
				chosenCats[cat] = newVal;
				localStorage.okcpChosenCategories = JSON.stringify(chosenCats);
				$(cat).attr("checked", newVal);
				$('.match-ratios-wrapper-outer-hover').remove();
				window.existingNames = [];
				_OKCP.updateCards();
				_OKCP.purgeMismatches();
			})
		})
		
		const aList = $(`#navigation > div.nav-left > ul > li:nth-child(3)`).empty();
		const $showFiltersBtn = $(`<a><span class="text"> Custom Filters </span></a>`)
		$(aList).prepend($showFiltersBtn);
		$($showFiltersBtn).click(()=>clickToggle());
		// clickToggle(true);
		
		function clickToggle(init){
			const show = init ? false : window['showOkcpFilters'];
			window['showOkcpFilters'] = !show;
			console.log(`window['showOkcpFilters'] `, window['showOkcpFilters'] );
			show ? $($filterWrapper).hide() : $($filterWrapper).show();
			$($showFiltersBtn).show();
		}


		setInterval(()=>_OKCP.updateLocationsEl($filterWrapper), 2000);

	}

	function setMainResetBtn($wrapper){
		const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-all-btn">
				<span class="rating_like">Reset</span>
			</button>`)
		$($btn).click((event) => {
			window.answers = "{}";
			localStorage.setItem('answers', "{}");
			localStorage.setItem('savedQuestions', "[]");
			$('.match-ratios-wrapper-outer-hover').remove();
			console.log('reset storage complete');
		});
		$($wrapper).append($btn);
	}
}



_OKCP.updateLocationsEl = function($filterWrapper){
	const previousLocs = [...window.domLocations]
	window.domLocations = getDomLocations();
	if (window.domLocations.length != previousLocs.length) {
		localStorage['showOkcpFilters'] && _OKCP.populateLocationsEl(window.domLocations);
	}
}

_OKCP.populateLocationsEl = function(locations){
	
	const chosenLocations = _OKCP.parseStorageObject('okcpChosenLocations');
	const $wrapper = $('.location-filters');
	$($wrapper).empty().append(`<h3>Locations</h3>`);
	locations.forEach(location => {
		if (chosenLocations[location] === undefined) {
			chosenLocations[location] = true;
			localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
		}
		const shouldBeChecked = Boolean(chosenLocations[location]);
		var locEl = $(`<div>${location} <input class="locattr" type="checkbox" loc-attr="${location}" ${shouldBeChecked && 'checked'} /></div>`);
		$wrapper.append(locEl)
	})
	$('[loc-attr]').click(function(){
		const loc = $(this).attr("loc-attr");
		const newVal = !chosenLocations[loc];
		chosenLocations[loc] = newVal;
		localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
		$(loc).attr("checked", newVal);
		window.existingNames = [];
		_OKCP.purgeMismatches();
	})
	
	return $wrapper;
}

_OKCP.purgeMismatches = function($card){
	if (!$card) {
		$(window.cardSelector).show();
		return $(window.cardSelector).each(function(){_OKCP.purgeMismatches(this)})
	}
	hideCats($card);
	if (getHideWeakBool()) {
		const $visCats = $($card).find('.match-ratios-list-hover');
		if (!$($visCats).children(':visible').not('.not-a-match').length) {
			return $($card).hide();
		}
	}
	
	const locations = _OKCP.parseStorageObject('okcpChosenLocations');
	const loc = $($card).find('.userInfo-meta-location')[0].innerHTML.split(', ')[1];
	if (!(locations[loc] || locations['ALL'])) return $($card).hide();
	
	function hideCats($card){
		if (getShowAllBool()) return;
		const requiredCategories = getRequiredCats();
		$($card).find(`.match-ratio-category`).each(function(){
			const domName = this.innerHTML;
			const missingFields = !requiredCategories.some(cat => 
				spaces(domName).includes(spaces(cat)) || spaces(cat).includes(spaces(domName))
			)
			missingFields ? $(this).parent().hide() : $(this).parent().show();
		})
	}
	
}

function getDomLocations(){
	const locations = $.map($('.userInfo-meta-location'), el => el.innerHTML.split(', ')[1])
	//sort by frequency
	const aCount = new Map([...new Set(locations)].map(x => [x, locations.filter(y => y === x).length]));
	return [...new Set(locations.sort( (a,b) => aCount.get(b) - aCount.get(a) )), 'ALL'];
}

function getRequiredCats(){
	const chosenCats = _OKCP.parseStorageObject('okcpChosenCategories');
	return Object.keys(chosenCats).filter(key => chosenCats[key])
}
function getShowAllBool(){return (localStorage.displayAllCategories == "false" ? false : true)}
function getHideWeakBool(){return (localStorage.hideWeakParticipants == "false" ? false : true)}
_OKCP.parseStorageObject = (key) => JSON.parse(localStorage[key] || "{}") || {};
function spaces(str){ return str.replace(/(\-|_)/g, ' ') }
