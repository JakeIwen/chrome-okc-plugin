
_OKCP.likes = function() {
  var existingNames = [];
  const hideMismatch = false;
  const reverseSort = false;
  setTimeout(setMainResetBtn, 1000)
  setInterval(updateCards, 1000);
  setTimeout(setFilters, 1000)
  
  const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
  console.log('allq', questions);
  function getShowAllBool(){return localStorage.displayAllCategories}
  function getHideWeaklBool(){return localStorage.hideWeakParticipants}
  function browseAnswers($card, i) {
    $($card).hover(()=>_OKCP.getHoverAnswers($card, getCats(), getShowAllBool(), getHideWeaklBool()))
  }
  
  function getCats(){
    const chosenCats = JSON.parse(localStorage.okcpChosenCategories || "{}") || {}
    return Object.keys(chosenCats).filter(key => chosenCats[key]);
  }
  
  function createStorageControl(storageKey, label, containerSelector, className){
    var $head = $(containerSelector)
    var $wrapper = $(`<div class="${className}"> ${label}</div>`)
    var $checkbox = $(`<input type="checkbox" ${localStorage[storageKey] && 'checked'} />`)
    $checkbox.click(function(){
      var newVal = !localStorage[storageKey];
      $(this).checked = newVal;
      $('.match-ratios-wrapper-outer-hover').remove();
      existingNames = [];
      updateCards();
    })
    $wrapper.appendTo($head)
    $checkbox.prependTo($wrapper);
  }
  
  function setFilters(){
    createStorageControl('displayAllCategories', 'Show All Categories', '.userrow-bucket', 'show-all')
    createStorageControl('hideWeakParticipants', 'HideWeakParticipants', '.userrow-bucket', 'hide-weak')
    chosenCats = JSON.parse(localStorage.okcpChosenCategories || "{}") || {};
    // var $head = $('.userrow-bucket')
    // var $wrapper = $(`<div class="show-all"> Show All Categories</div>`)
    // var $checkbox = $(`<input type="checkbox" ${localStorage.displayAllCategories && 'checked'} />`)
    // $checkbox.click(function(){
    //   var newVal = !localStorage.displayAllCategories;
    //   $(this).checked = newVal;
    //   $('.match-ratios-wrapper-outer-hover').remove();
    //   existingNames = [];
    //   updateCards();
    // })
    // $wrapper.appendTo($head)
    // $checkbox.prependTo($wrapper);
    
    var $main = $('.page-content');
    var $filters = $($main).append(`<div class="category-filters"></div>`)
    Object.keys(questions).forEach(category => {
      const shouldBeChecked = chosenCats[category] == true;
      const $wrapper = $(`<span class="category-wrapper"></span>`).appendTo($filters);
      $wrapper.append(`<input type="checkbox" cat-attr="${category}" ${shouldBeChecked && 'checked'} /> ${category} <br />`)
      
      $($wrapper).click(function(){
        const cat = $(this).find("[cat-attr]").attr("cat-attr");
        const newVal = !chosenCats[cat];
        chosenCats[cat] = newVal;
        localStorage.okcpChosenCategories = JSON.stringify(chosenCats);
        $(cat).attr("checked", newVal);
        $('.match-ratios-wrapper-outer-hover').remove();
        updateCards();
        existingNames = [];
        newNames = [];
      })
      // const $input = $(`<input type="checkbox" cat-attr="${category}" ${shouldBeChecked && 'checked'} />`)
      
      // $wrapper.append($input)
      
    })
  }
  
  function setMainResetBtn(){
    const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-all-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Reset</span>
      </button>`)
    $($btn).click((event) => {
      window.answers = "{}";
      localStorage.answers = "{}";
      $('.match-ratios-wrapper-outer-hover').remove();
      console.log('reset storage complete');
    });
    $('.userrow-bucket-heading-container').append($btn);
  }
  
  function updateCards(){ 
    var els = $('.userrow.is-liked-you')
    newNames = [];
    $(els).each(function(){
      const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
      if (!existingNames.includes(thisName)) newNames.push(thisName);
    })
    
    existingNames = existingNames.concat(newNames);
    var sorted = $(els);
    // var sorted = $(els).sort((a,b)=>{
    //   var foundA = $(a).find('.userrow-percentage')
    //   var foundB = $(b).find('.userrow-percentage')
    //   var nameA = $(a).find('.userrow-username-name')[0].innerHTML;
    //   var nameB = $(b).find('.userrow-username-name')[0].innerHTML;
    //   var percA = parseInt(foundA[0].innerHTML.slice(0,2))
    //   var percB = parseInt(foundB[0].innerHTML.slice(0,2))
    //   if (!(percB - percA)) {
    //     return nameA.charCodeAt(0) - nameB.charCodeAt(0)
    //   }
    //   return reverseSort ? percA - percB : percB - percA;
    // })
    // $('.userrow.is-liked-you').remove();
    const answers = JSON.parse(localStorage.answers);
    $(sorted).each(function(){
      const $card = $(this);
      const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
      
      if (newNames.includes(thisName)) {
        if (Object.keys(answers).includes('usr'+thisName)) {
          _OKCP.getHoverAnswers($card, getCats(), getShowAllBool(), getHideWeaklBool())
          console.log('adding existing');
        }
        const href = $(this).attr("href");
        const aHref = $(`<a class="mock-link"></a>`).attr('href', href)
        $(this).find('img').css({height: '120px', width: '120px'});
        $(this).removeAttr("href").append(aHref);
        setPassBtn($card);
        setCardResetBtn($card);
        browseAnswers($card, i);
      }
    })
  }
    // $('.userrows-main').append(sorted);
  
  function diff(arr1=[], arr2=[]) {
    var ret = [];
    for(var i in arr1) 
      if(arr2.indexOf(arr1[i]) == -1) ret.push(arr1[i]);
    return ret;
  };
  
  function setPassBtn($card){
    if ($($card).find('button[name="pass"]').length) return;
		const $btn = $(`<button name="pass" class="binary_rating_button silver flatbutton pass-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Pass</span>
      </button>`)
    
    $($btn).click((event) => {
      event.stopPropagation();
      $($btn).css({backgroundColor: 'red'});
      $($btn).click((event1)=>{
        event1.stopPropagation();
        setLike($card, $btn, false);
      })
    });
    
    $($card).append($btn);
    
	}
  
  function setCardResetBtn($card){
    if ($($card).find('button[name="reset"]').length) return;
    const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
		const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Reset</span>
      </button>`)
    $($btn).click((event) => {
      var localAnswers = JSON.parse(window.answers);
      delete localAnswers['usr'+thisName];
      console.log('localAnswers', localAnswers);
      localStorage.answers = JSON.stringify(localAnswers);
      window.answers = JSON.stringify(localAnswers);
      $('.match-ratios-list-hover.usr'+name).remove();
      console.log('reset');
    });
    
    $($card).append($btn);
	}
  
  function getLikePassParams(userId, likeBool) {
    return {
      api: 1,
      type: "POST",
      data: {
        source: "PROFILE",
        votes: [{
          userid: userId,
          like: likeBool,
          time_from_request: 0
        }]
      }
    }
  }
  
  function setLike($card, $btn, val){
    const userId = $($($card).find('.userrow-thumb')[0]).attr('data-username')
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      console.log('res', res);

      $($card).css({display: 'none'})
    }).catch(err => console.log(err));
  }
  
  return true;
};