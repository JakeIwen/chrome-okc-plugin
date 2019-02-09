
_OKCP.likes = function() {
  _OKCP.loadHoverOptions();
  window.cardSelector = '.userrow'
  const primarySortSelector = '.match-info-percentage'
  const secondarySortSelector = '.userInfo-username'
  existingNames = [];
  const reverseSort = false;
  let show = false;

  function diff(arr1=[], arr2=[]) {
    var ret = [];
    for(var i in arr1) 
      if(arr2.indexOf(arr1[i]) == -1) ret.push(arr1[i]);
    return ret;
  };
  
  
  const showBtn = $("<button>Show</button> ")
  const evalBtn = $("<button>Eval</button> ")
  $('body').prepend(evalBtn, showBtn);
  defineClicks(evalBtn, showBtn);
  
  function defineClicks(evalBtn, showBtn){
    
    $(evalBtn).click(() => {
      $(".match-ratios-wrapper-outer-hover").remove();
      $('#showEl').children().each(function(){_OKCP.getHoverAnswers(this)})
    })
    
    $(showBtn).click(() => {
      show = !show;
      if(!show) {
        $('.button-ctr, #showEl').remove();
        $('#main_content').show();
        // ivl = setInterval(() => localStorage.okcpAutoscroll === "true" && scrollIfReady(), 1000);
        // passIvl = setPassIvl();
        return;
      }
      $('body').children().remove();
      _OKCP.showSaved();
      $('body').prepend(evalBtn, showBtn);
      defineClicks(evalBtn, showBtn);
      $(evalBtn).click();
    })
    
  }

  return true;
  
  
  
  
};

_OKCP.modifyCards = function(sorted, newNames){
  const answers = window.answers;

  $(sorted).each(function(){
    const $card = $(this);
    const thisName = _OKCP.getUserName($card);

    if (newNames.includes(thisName)) {
      if (Object.keys(answers).includes('usr'+thisName)) {
        _OKCP.getHoverAnswers($card, window.cardSelector)
      }
      const href = 'https://www.okcupid.com/profile/'+thisName;
      const aHref = $(`<a class="mock-link" href=${href}></a>`);
      
      // $(this).find('img').css({height: '100px', width: '100px'});
      $(this).prepend(aHref);
      setPassBtn($card);
      setCardResetBtn($card);
      $($card).hover(()=>_OKCP.getHoverAnswers($card, window.cardSelector))
    }
  })
  $('.userrows-main').append(sorted);
  
  function setPassBtn($card){
    if ($($card).find('button[name="pass"]').length) return;
    
    const $btn = $(`<button name="pass" class="binary_rating_button silver flatbutton pass-btn"><i class="icon i-star"></i><span class="rating_like">Pass</span></button>`)
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
    const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-btn"><i class="icon i-star"></i><span class="rating_like">Reset</span></button>`)
    $($btn).click((event) => _OKCP.resetUser(event, $card, $btn));
    $($card).append($btn);
  }

  function setLike($card, val){
    const userName = _OKCP.getUserName($card)
    _OKCP.getUserId(userName).then(userId => {
      const {path, params} = _OKCP.getLikePassParams(userId, val, userName);
      window.OkC.api(path, params).then(res => {
        console.log({params, res});
        val == false && $($card).remove();
      }).catch(err => console.log(err));
    });
  }
  
}

_OKCP.updateCards = function(){ 
  const sort = false;
  
  var els = $(window.cardSelector);
  let newNames = [];
  $(els).each(function(){
    const thisName = _OKCP.getUserName(this);
    if (!existingNames.includes(thisName)) newNames.push(thisName);
  })
  existingNames = existingNames.concat(newNames);
  if (newNames.length) {
    console.log('updating for ', newNames.length, 'cards');
    var sorted = sort 
      ? _OKCP.sortJqElements(els, primarySortSelector, secondarySortSelector, reverseSort) 
      : els;
    
    _OKCP.modifyCards(sorted, newNames)
  }
}