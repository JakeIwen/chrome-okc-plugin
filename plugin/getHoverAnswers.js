_OKCP.getHoverAnswers = function ($card, screen, isHover) {
	var name = 'usr' + _OKCP.getUserName($card);
	
	if(!isHover && _OKCP.queriedNames.includes(name) && screen !== 'browse') {
		$($card).remove()
		return console.log('skipping requery');
	}
	if($($card).find('.match-ratios-wrapper-outer-hover').length) {
		return console.log('already has container');
	}
	_OKCP.queriedNames.push(name)

	console.log({name});
	 
	window['pageQuestions'+name] = [];

	var answers = window.answers || {};
	
	var ratioList = $(answers[name] || `<table class="match-ratios-wrapper-outer-hover hover ${name}"><tr><td class="match-ratios">
		<ul class="match-ratios-list-hover ${name}"></ul>
		</td></tr></table>`);
	if(window.onLikes) $(ratioList).addClass('likes-view')
	else $(ratioList).removeClass('likes-view')
	$($($card).find(`.usercard-info`)[0]).after(ratioList);
	if (answers[name]) {
		return _OKCP.purgeMismatches($card, true);
	}
	console.log('making new');
	
	window.aUrls = window.aUrls || []; //prevents multiple requests
	let url = '';
	let numRequestsMade = 0;
	let numRequestsFinished = 0;
	let numQuestionPages = 20; // initial value
	let failed = 0;
	let responseGood = 0;
	let response = 0;
	let finished = false;
	let questionPageNum = 0; //for iterating over question pages
	let questionPath; //for storing the path of the question page as we iterate

	init();
	 
	async function init(){
		let qList = [];
		let resCt = {};
		
		var userId = await _OKCP.getUserId(name.slice(3));
		var apiAnswers = await _OKCP.getApiAnswers(userId);
		
		apiAnswers.forEach(answer => _OKCP.loadAnswer(answer, qList, resCt));
		_OKCP.visualizeRatios(qList, resCt, name);
		
		saveAnswers();
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
		
		if (window.onLikes) {
			var anchorCards = $($card).find('a.userrow-inner');
			if (anchorCards.length > 1) {
				$(anchorCards).each(function(idx){
					if (idx) $(this).remove();
				})
			}
		} else if(window.onBrowseMatches) {
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


_OKCP.getUserName = function($card){
	return $($card).find('[data-profile-popover]').attr('data-profile-popover') || $($card).find('[data-username]').attr('data-username');
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
	
	var $showFiltersBtn = $(`<a><span class="text"> Custom Filters </span></a>`)
	
	setInterval( () => {
		var aList = $(`.upgrade-link`);
		if($(aList).length) {
			$(aList).replaceWith($showFiltersBtn)
			console.log('replaced');
			$($showFiltersBtn).click(()=>clickToggle());
		}
		if(!$('.custom-filter-wrapper').length) {
			$('#navigation').after($filterWrapper);
		}
	}, 1500)
	
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
		var visCats = $($card).find('.match-ratio-category:visible').not('.not-a-match').text();
		var hasMatch = getRequiredCats().some( rc => visCats.includes(rc))
		if (!hasMatch) $($card).hide();
	}
	
	var locations = _OKCP.parseStorageObject('okcpChosenLocations');
	var loc = $($card).find('.userInfo-meta-location')[0].innerHTML.split(', ')[1];
	if (!(locations[loc] || locations['ALL'])) $($card).hide();
	if(save){
		window.okcpSaved = window.okcpSaved || {};
		window.okcpSaved[_OKCP.getUserName($card)] = $card;
	}
	
	function hideCats($card){
		if (getShowAllBool()) return;
		$($card).find(`.match-ratio-category`).each(function(){
			var domName = this.innerHTML;
			var missingFields = !getRequiredCats().some(cat => 
				spaces(domName).includes(spaces(cat)) || spaces(cat).includes(spaces(domName))
			)
			missingFields ? $(this).parent().hide() : $(this).parent().show();
		})
	}
	
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

