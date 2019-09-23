_OKCP.getHoverAnswers = function ($card) {
	var requiredCategories = getRequiredCats();
	var hideWeak = getHideWeakBool()
	
	var list = localStorage.okcpDefaultQuestions 
		? JSON.parse(localStorage.okcpDefaultQuestions).questionsList 
		: {};

	var name = 'usr' + _OKCP.getUserName($card);
	console.log({name});
	if ($('.match-ratios-wrapper-outer-hover.'+name).length || name ==="usrundefined" ) {
		console.log('exists', name);
		return;
	}
	
	window['pageQuestions'+name] = [];

	var answers = window.answers || {};;
	
	var ratioList = $(answers[name] || `<table class="match-ratios-wrapper-outer-hover hover ${name}"><tr><td class="match-ratios">
		<ul class="match-ratios-list-hover ${name}"></ul>
		</td></tr></table>`);
	if(window.onLikes) $(ratioList).addClass('likes-view')
	else $(ratioList).removeClass('likes-view')
	console.log({ratioList});
	$($($card).find(`.usercard-info`)[0]).after(ratioList);
	if (answers[name]) {
		return _OKCP.purgeMismatches($card, true);
	}
	console.log('making new');
	
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

	init();
	
	async function init(){
		var userId = await _OKCP.getUserId(name.slice(3));
		var apiAnswers = await _OKCP.getApiAnswers(userId);
		apiAnswers.forEach(answerObj => loadData(answerObj))
		areWeDone(name);
		saveAnswers();
	}
	
	function loadData(answer) {
		var {target, viewer, question} = answer
		for (var category in list) {
			var categoryQuestionList = list[category];
			
			for (var i = 0; i < categoryQuestionList.length; i++) {
				var listItem = categoryQuestionList[i];
				
				if(parseInt(listItem.qid) !== question.id) continue;
				
				var theirAnswerIndex, answerScore, answerWeight, answerScoreWeighted;
				var theirAnswer = question.answers[target.answer];
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
				if(question.text.includes("amil")) debugger;
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
	
	function areWeDone(userName) {
		$('.match-ratios-list-hover.'+userName).html('');
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
		removeDupes();
		var html = ratioList[0].outerHTML;
		
		window.answers[name] = html;
		
		if (!(Object.keys(window.answers).length % 4)) {
			console.log('saving 4 answer sets');
			_OKCP.saveCompressed('answers', window.answers);
		}
		
		
		_OKCP.purgeMismatches($card, true);
			
		saveQuestions();
		
	}

	 
	function saveQuestions(){
		
		var savedQuestions = JSON.parse(localStorage.getItem('savedQuestions') || "[]");
		var questionTexts = savedQuestions.map( q => q.question.text )
		var existingQuestions = _OKCP.fullQuestionsList.map(q => q.text).sort();
		window['pageQuestions'+name].forEach( (q, i) => {
			var savedIdx = questionTexts.indexOf(q.text);
			if (savedIdx == -1) {
				var question = q;
				question.answerText = question.answerText.filter(a => a && (a!=="Answer publicly to see my answer"))
				var exists = existingQuestions.includes(q.text);
				var qObj = { exists, question, count: 0 };
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
		
		// console.log({existing, notExisting});
		
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
	var compressed = _OKCP.lz().compress(JSON.stringify(value), {outputEncoding: "StorageBinaryString"})
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
	setInterval(_OKCP.updateCards, 1500);
  setTimeout(_OKCP.setFilters, 1000)
}

_OKCP.setMainResetBtn = function($wrapper){
	var $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-all-btn">
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

_OKCP.setFilters = function(){
	
	var $catFilters = $(`<div class="category-filters"><h4>Categories</h4></div>`)
	var $locWrapper = $(`<div class="location-filters"><h3>Locations</h3></div>`);
	
	var controlDiv = $(`<div class="control-div"></div>`);
	_OKCP.createStorageControl('displayAllCategories', 'Show All Categories', controlDiv, 'show-all')
	_OKCP.createStorageControl('hideWeakParticipants', 'HideWeakParticipants', controlDiv, 'hide-weak')
	_OKCP.setMainResetBtn(controlDiv);
	
	var $filterWrapper =  $(`<div class="custom-filter-wrapper"></div>`)
														.append(controlDiv, $catFilters, $locWrapper)
														.hide();
	
	$('#navigation').after($filterWrapper);
	
	var questions = _OKCP.parseStorageObject('okcpDefaultQuestions').questionsList;
	var chosenCats = _OKCP.parseStorageObject('okcpChosenCategories');
	
	Object.keys(questions).forEach(category => {
		var shouldBeChecked = Boolean(chosenCats[category]);
		var $wrapper = $(`<ul class="category-wrapper"></ul>`).appendTo($catFilters);
		$wrapper.append(`<li>${category} <input type="checkbox" cat-attr="${category}" ${shouldBeChecked && 'checked'} /></li>`)
		$($wrapper).click(function(){
			console.log('wrapper', this);
			var cat = $(this).find("[cat-attr]").attr("cat-attr");
			var newVal = !chosenCats[cat];
			chosenCats[cat] = newVal;
			localStorage.okcpChosenCategories = JSON.stringify(chosenCats);
			$(cat).attr("checked", newVal);
			$('.match-ratios-wrapper-outer-hover').remove();
			window.existingNames = [];
			_OKCP.updateCards();
			_OKCP.purgeMismatches();
		})
	})
	
	var aList = $(`#navigation .upgrade-link`);
	var $showFiltersBtn = $(`<a><span class="text"> Custom Filters </span></a>`)
	$(aList).replaceWith($showFiltersBtn);
	$($showFiltersBtn).click(()=>clickToggle());
	
	function clickToggle(init){
		var show = init ? false : window['showOkcpFilters'];
		window['showOkcpFilters'] = !show;
		console.log(`window['showOkcpFilters'] `, window['showOkcpFilters'] );
		show ? $($filterWrapper).hide() : $($filterWrapper).show();
		$($showFiltersBtn).show();
	}


	setInterval(()=>_OKCP.updateLocationsEl($filterWrapper), 2000);

}



_OKCP.updateLocationsEl = function($filterWrapper){
	var previousLocs = window.domLocations ? [...window.domLocations] : [];

	window.domLocations = getDomLocations();
	if (window.domLocations.length != previousLocs.length) {
		_OKCP.populateLocationsEl(window.domLocations);
	}
}

_OKCP.populateLocationsEl = function(locations){
	
	var chosenLocations = _OKCP.parseStorageObject('okcpChosenLocations');
	console.log('CL', chosenLocations);
	var $wrapper = $('.location-filters');
	$($wrapper).empty().append(`<h3>Locations</h3>`);
	locations.forEach(location => {
		if (chosenLocations[location] === undefined) {
			chosenLocations[location] = true;
			localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
		}
		var shouldBeChecked = Boolean(chosenLocations[location]);
		var locEl = $(`<div>${location} <input class="locattr" type="checkbox" loc-attr="${location}" ${shouldBeChecked && 'checked'} /></div>`);
		$wrapper.append(locEl)
	})
	$('[loc-attr]').click(function(){
		var loc = $(this).attr("loc-attr");
		var newVal = !chosenLocations[loc];
		chosenLocations[loc] = newVal;
		localStorage.okcpChosenLocations = JSON.stringify(chosenLocations);
		$(loc).attr("checked", newVal);
		window.existingNames = [];
		_OKCP.purgeMismatches();
	})
	
	return $wrapper;
}

_OKCP.purgeMismatches = function($card, save){
	if (!$card) {
		$(window.cardSelector).show();
		return $(window.cardSelector).each(function(){_OKCP.purgeMismatches(this)})
	}
	hideCats($card);
	
	if (getHideWeakBool()) {
		var $visCats = $($card).find('.match-ratios-list-hover');
		if (!$($visCats).children(':visible').not('.not-a-match').length) {
			$($card).hide();
		} 
	}
	
	var locations = _OKCP.parseStorageObject('okcpChosenLocations');
	// console.log('CL2', locations);
	
	var loc = $($card).find('.userInfo-meta-location')[0].innerHTML.split(', ')[1];
	if (!(locations[loc] || locations['ALL'])) $($card).hide();
	if(save){
		window.okcpSaved = window.okcpSaved || {};
		window.okcpSaved[_OKCP.getUserName($card)] = $card;
	}
	
_OKCP.showSaved = function(){
	const showEl = $('<div id="showEl" style="background-color: #FFFFFF; position: absolute; margin: 50px; padding-top: 50px; overflow-y: scroll; top: 0; z-index: 1000"></div>');
	$('#main_content').hide();
	$('body').append(showEl)
	console.log(window.okcpSaved);
console.log('appended');
	for(nameKey in window.okcpSaved){
		let card = window.okcpSaved[nameKey]
		$(showEl).append(card);
		$(card).show()
		_OKCP.getHoverAnswers(card)
	}
	
}
	
	
	function hideCats($card){
		if (getShowAllBool()) return;
		var requiredCategories = getRequiredCats();
		$($card).find(`.match-ratio-category`).each(function(){
			var domName = this.innerHTML;
			var missingFields = !requiredCategories.some(cat => 
				spaces(domName).includes(spaces(cat)) || spaces(cat).includes(spaces(domName))
			)
			missingFields ? $(this).parent().hide() : $(this).parent().show();
		})
	}
	
}

function getDomLocations(){
	var locations = $.map($('.userInfo-meta-location'), el => el.innerHTML.split(', ')[1])
	//sort by frequency
	var aCount = new Map([...new Set(locations)].map(x => [x, locations.filter(y => y === x).length]));
	return [...new Set(locations.sort( (a,b) => aCount.get(b) - aCount.get(a) )), 'ALL'];
}

function getRequiredCats(){
	var chosenCats = _OKCP.parseStorageObject('okcpChosenCategories');
	return Object.keys(chosenCats).filter(key => chosenCats[key])
}
function getShowAllBool(){return (localStorage.displayAllCategories == "false" ? false : true)}
function getHideWeakBool(){return (localStorage.hideWeakParticipants == "false" ? false : true)}
_OKCP.parseStorageObject = (key) => JSON.parse(localStorage[key] || "{}") || {};
function spaces(str){ return str.replace(/(\-|_)/g, ' ') }

