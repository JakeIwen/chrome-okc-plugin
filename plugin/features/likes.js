
_OKCP.likes = function() {
  _OKCP.loadHoverOptions(updateCards);
  window.cardSelector = '.userrow'
  const primarySortSelector = '.match-info-percentage'
  const secondarySortSelector = '.userInfo-username'
  existingNames = [];
  const reverseSort = false;
  const sort = true;
  
  
  var insertedNodes = [];
  var observer = new WebKitMutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
          for(var i = 0; i < mutation.addedNodes.length; i++)
              insertedNodes.push(mutation.addedNodes[i]);
      })
  });
  // observer.observe(document, {
  //     childList: true
  // });
  // 
  
  
  
  function noMoreMatches(){
    return !!$('.userrow-bucket-heading:contains("You like them")').length
  }
  // setInterval(()=>{
  //   console.log({observer, insertedNodes});
  // }, 1000)
  function updateCards(){ 
    var els = $(window.cardSelector);
    newNames = [];
    $(els).each(function(){
      const thisName = _OKCP.getUserName(this);
      if (!existingNames.includes(thisName)) newNames.push(thisName);
    })
    existingNames = existingNames.concat(newNames);
    if (newNames.length) {
      console.log('updating for ', newNames.length, 'cards');
      var sorted = sort ? sortJqElements(els) : els;
      
      modifyCards(sorted, newNames)
    }
  }

  console.log('allq', questions);

  function browseAnswers($card, i) {
    $($card).hover(()=>_OKCP.getHoverAnswers($card, window.cardSelector))
  }

  function sortJqElements($els, moveToEnd){
    return $($els).sort((a,b)=>{
      var foundA = $(a).find(primarySortSelector)
      var foundB = $(b).find(primarySortSelector)
      var nameA = $(a).find(secondarySortSelector || "div")[0].innerHTML;
      var nameB = $(b).find(secondarySortSelector || "div")[0].innerHTML;
      var percA = parseInt(foundA[0].innerHTML.slice(0,2))
      var percB = parseInt(foundB[0].innerHTML.slice(0,2))
      if (!(percB - percA)) {
        return nameA.charCodeAt(0) - nameB.charCodeAt(0)
      }
      return reverseSort ? percA - percB : percB - percA;
    })
  }
  function modifyCards(sorted, newNames){
    const hideNew = noMoreMatches();
    const answers = window.answers;

    $(sorted).each(function(){
      const $card = $(this);
      const thisName = _OKCP.getUserName($card);
      
      // if (hideNew){
      //   if (newNames.includes(thisName)) {
      //     console.log(newNames, ' includes ', thisName);
      //     return $($card).hide();
      //   } else {
      //     return;
      //   }
      // } 

      if (newNames.includes(thisName)) {
        if (Object.keys(answers).includes('usr'+thisName)) {
          _OKCP.getHoverAnswers($card, window.cardSelector)
        }
        const href = 'https://www.okcupid.com/profile/'+thisName;
        
        const aHref = $(`<a class="mock-link"></a>`).attr('href', href)
        $(this).find('img').css({height: '120px', width: '120px'});
        $(this).prepend(aHref);
        setPassBtn($card);
        setCardResetBtn($card);
        browseAnswers($card, i);
      }
    })
    $('.userrows-main').append(sorted);
  }

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
        setLike($card, false);
      })
    });

    $($card).append($btn);

	}
  
  function setCardResetBtn($card){
    if ($($card).find('button[name="reset"]').length) return;
    const thisName = _OKCP.getUserName($card)
		const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Reset</span>
      </button>`)
    $($btn).click((event) => {
      var localAnswers = JSON.parse(window.answers);
      delete localAnswers['usr'+thisName];
      console.log({localAnswers, thisName});
      localStorage.answers = JSON.stringify(localAnswers);
      window.answers = JSON.stringify(localAnswers);
      $($card).find('.match-ratios-wrapper-outer-hover').remove();
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

  function setLike($card, val){
    const userId = $($($card).find('.userrow-thumb')[0]).attr('data-username')
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      console.log('res', res);
      $($card).remove();
    }).catch(err => console.log(err));
  }

  return true;
};