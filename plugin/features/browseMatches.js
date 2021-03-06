

_OKCP.browseMatches = function() {
  // return;
  window.cardSelector = ".match-results-card";
  const $likeBtnTemplate = $(`<button name="like" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Like</span></button>`)
  const $resetBtnTemplate = $(`<button name="reset" style=transform:scale(0.7) class="btn-ctr"><span class="rating_reset">Reset</span></button>`)
  const $passBtnTemplate = $(`<button name="pass" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Pass</span></button>`)
  
  const showBtn = $("<button>Show</button> ")
  const evalBtn = $("<button>Eval</button> ")
  const hideLikedBtn = $("<button>Hide Liked</button> ")
  const customBtn = $("<button>Custom</button> ")
  const moreBtn = $("<button>More</button> ")
  const setPassBtn = $("<button>Set Passes</button> ")
  
  const removeLiked = false;
  let show = false;
  const cards = [];
  let customCards = [];
  let matches = []
  let total_matches;
  const cardIds = []
  
  let after = null;
  setInterval(()=>console.log({cards}), 3000)
  var passIvl = setPassIvl();
  
  _OKCP.createStorageControl('okcpAutoscroll', 'Autoscroll matches', 'body', 'auto-scroll', true)
  var ivl = setInterval(() => localStorage.okcpAutoscroll==="true" && scrollIfReady(), 1000);
  
  $(setPassBtn).click(()=>setPasses());
  $(moreBtn).click(addMoreMatches);
  
  async function addMoreMatches(){
    if(matches.length >= total_matches) return;
    const res = await _OKCP.getMatches(200, {radius: 300, located_anywhere: 0, after})
    total_matches = res.total_matches
    matches = matches.concat(res.matches)
    after = res.after;
    $('.match-results-card').remove();
    
    console.log('all MATCHES', matches)
    const newCustomCards = _OKCP.getCustomCards(matches);
    newCustomCards.forEach(function(card){
      $(showEl).append(card);
      $(card).show();
      _OKCP.getHoverAnswers(card, 'browse');
    })
    console.log('full len', $('#showEl').children());
    setTimeout(()=>setPasses(true), 500)
    setTimeout(()=>setPasses(true), 3000)
  }
  
  
  $(customBtn).click(async () => {
    let res = await _OKCP.getMatches(50, {radius: 300, located_anywhere: 0})
    matches = matches.concat(res.matches)
    after = res.after;
    console.log('MATCHES', matches)
    customCards = _OKCP.getCustomCards(matches);
    $('.match-results-card').remove();
    customCards.forEach(function(card){
      $(showEl).append(card);
      $(card).show();
      _OKCP.getHoverAnswers(card, 'browse');
    })
    console.log('full len', $('#showEl').children());
    setTimeout(()=>setPasses(), 500)
    setTimeout(()=>setPasses(), 3000)
    
  })
  $(hideLikedBtn).click(() =>
    $(`.match-info-liked.okicon.i-star`).closest(`.match-results-card`).hide()
  );
  
  $(evalBtn).click(() => {
    $(".match-ratios-wrapper-outer-hover").remove();
    debugger;
    $('#showEl').children().each(function(){_OKCP.getHoverAnswers(this)})
  })
  
  $(showBtn).click(() => {
    show = !show;
    
    if(!show) {
      $('.button-ctr, #showEl').remove();
      $('#main_content').show();
      ivl = setInterval(() => localStorage.okcpAutoscroll === "true" && scrollIfReady(), 1000);
      passIvl = setPassIvl();
      return;
    }
    
    clearInterval(ivl);
    clearInterval(passIvl);
    const showEl = $('<div id="showEl" style="background-color: #FFFFFF; position: absolute; margin: 50px; padding-top: 50px; overflow-y: scroll; top: 0; z-index: 1000"></div>');
    $('#main_content').hide();
    $('body').append(showEl)
    cards.forEach(function(card){
      $(showEl).append(card);
      $(card).show()
      _OKCP.getHoverAnswers(card, 'browse')
    })
    console.log('full len', $(showEl).children());
    
    setTimeout(()=>setPasses(true), 500)
    setTimeout(()=>setPasses(true), 3000)
    
  })
  
  $('body').prepend(evalBtn, showBtn, hideLikedBtn, customBtn, moreBtn, setPassBtn);
  
  function setPassIvl(){
    return setInterval(()=>{
      $(`${window.cardSelector}:not([added]):visible > :not(.usercard-placeholder)`).parent().each(function(){_OKCP.getHoverAnswers(this, 'browse')})
      const cardNum = $(window.cardSelector).length
      const passNum = $("button[name='pass']:visible").length
      if (cardNum > passNum) setPasses();
      else !$('#showEl').length && scrollIfReady();
    }, 1000);
  }

  
  function scrollIfReady() {
    if ($('.usercard-placeholder').length) return;
    
    if($('.match-results-error').length) {
      debugger;
      // location.reload()
      //change to sort by match percent or something to keep it rolling
      return;
    }
    
    var vizCards = $(".match-ratios-list-hover:visible");
    var cardsWithMissingCats = [];
    $(vizCards).each(function(){
      $(this).children(':visible').length === 0 && cardsWithMissingCats.push(this);
    })
    if (!cardsWithMissingCats.length) {
      console.log('getting more');
    	window.scroll({top: 700});
    	window.scroll({top: 0});
    }
  }

  function setLike(e, $card, $btn, val){
    console.log({e, $card, $btn, val});
    const userName = _OKCP.getUserName($card);
    e.preventDefault();

    _OKCP.getUserId(userName).then(userId => {
      const {path, params} = _OKCP.getLikePassParams(userId, val, userName);
      
      window.OkC.api(path, params).then(res => {
        console.log('res', res);
        if (res.results[0].mutual_like) {
          $($card).css({backgroundColor: 'green'})
          console.log('MUTUAL LIKE');
        } else if (val){
          $($btn).css({display: 'none'})
        } else {
          $($card).css({display: 'none'})
        }
      }).catch(err => console.log(err));
      
    });

  }
  
  function setPasses(showMode) {
    $(`${window.cardSelector}${showMode ? '[added]' : ':not([added])'} > :not(.usercard-placeholder)`).parent().each(function(i) {
      const newId = 'usr' + _OKCP.getUserName(this)
      const likedByYou = $(this).find('.match-info-liked.okicon.i-star').length;
      if (removeLiked && likedByYou) return $(this).remove();
      if(!showMode && $('#'+newId+' .match-ratio:visible').length){
        if(!cardIds.includes(newId)){
          $(this).attr('added', true);
          
          var cardToSave = $(this).clone();
          
          $(cardToSave).find('.button-ctr').remove();
          $(cardToSave).css('display', 'inline-block')
          $(cardToSave).css('margin', '10px')
          $(cardToSave).find('.match-ratios-wrapper-outer-hover.' + newId).remove();
          cards.push(cardToSave);
          cardIds.push( newId )
        } 
        // console.log('hiding', newId);
        $(this).hide();
        
      }
      
      if ((!showMode && $('#'+newId).length) || $(this).find("button[name='pass']").length) return;
      
      $(this).attr("id", newId);
      
      const href = $(this).attr("href")
      if (href) {
        $(this).removeAttr("href")
        const ahref = $(`<a href="${href}" target="_blank"></a>`)
        $($(this).find("img.userthumb-img")[0]).wrap(ahref)
      }

      const $likeBtn = $($likeBtnTemplate).clone();
      const $passBtn = $($passBtnTemplate).clone();
      const $resetBtn = $($resetBtnTemplate).clone();
      
      $passBtn.click((e)=>setLike(e, this, $passBtn, false));
      $likeBtn.click((e)=>setLike(e, this, $likeBtn, true));
      $resetBtn.click((e)=>_OKCP.resetUser(e, this, $resetBtn));

      if(likedByYou) $($likeBtn).attr("disabled", "disabled");
        
      const $btnRow = $('<div class="button-ctr"></div>').append([$likeBtn, $resetBtn, $passBtn]);
      
      $(this).find('.userInfo').append($btnRow);
    })
  }
  
  return true;
};

_OKCP.getUserId = function(userName){
  return new Promise((resolve) => {
    const url = `https://www.okcupid.com/profile/${userName}?cf=regular,matchsearch`
    $('<div></div>').load(url, response => resolve($(response).find('[data-tuid]').attr('data-tuid')))
  })
}

_OKCP.getLikePassParams = function(userId, likeBool, userName) {
  if (likeBool === 'pass') {
    passList.push('usr'+userName)
    localStorage.passList = JSON.stringify(passList);
  }
  return {
    path: '/likes/batch',
    params: {
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
}
