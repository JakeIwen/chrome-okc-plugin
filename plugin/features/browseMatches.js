

_OKCP.browseMatches = function() {
  // return;
  window.cardSelector = ".match-results-card";
  
  const removeLiked = false;
  const cards = [] 
  const cardIds = []
  if(localStorage.okcpUseShowCards) {
    $(localStorage.okcpShowCards).each(function(){
      cards.push(this);
      cardIds.push( $(this).attr('id') )
    })
  };
  console.log({cards});
  localStorage.removeItem('okcpShowCards');
  
  const cardList = [];
  _OKCP.createStorageControl('okcpAutoscroll', 'Autoscroll matches', 'body', 'auto-scroll', true)

  const showBtn = $("<button>Show</button> ")
  const evalBtn = $("<button>Eval</button> ")
  const hideLikedBtn = $("<button>Hide Liked</button> ")
  
  
  var ivl = setInterval(() => {
    localStorage.okcpAutoscroll === "true" && scrollIfReady();
  }, 1500);
  $(hideLikedBtn).click(()=>{
    console.log('click');
    $(`.match-results-card button[name="like"][disabled]`)
      .closest(`.match-results-card`).hide()
  });
  let show = false; 
  $(evalBtn).click(() => setPasses(!!$('#showEl').length))
  $(showBtn).click(()=>{
    show = !show;
    console.log({cards});
    if(!show) {
      $('#showEl').remove();
      $('#main_content').show();
      
      ivl = setInterval(() => {
        localStorage.okcpAutoscroll === "true" && scrollIfReady();
      }, 2000);
      return;
    }
    
    clearInterval(ivl);
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
    
    // $('body').prepend(showBtn);
    // $('body').prepend(hideLikedBtn);

  })
  $('body').prepend(evalBtn, showBtn, hideLikedBtn);
  const $likeBtnTemplate = $(`<button name="like" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Like</span></button>`)
  const $resetBtnTemplate = $(`<button name="reset" style=transform:scale(0.7) class="btn-ctr"><span class="rating_reset">Reset</span></button>`)
  const $passBtnTemplate = $(`<button name="pass" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Pass</span></button>`)
  
  setInterval(()=>{
    $(`${window.cardSelector}:not([added]):visible > :not(.usercard-placeholder)`).parent().each(function(){_OKCP.getHoverAnswers(this, 'browse')})
    const cardNum = $(window.cardSelector).length
    const passNum = $("button[name='pass']").length
    if (cardNum > passNum) setPasses();
    else !$('#showEl').length && scrollIfReady();
    
  }, 1000);
  
  function scrollIfReady() {
    if ($('.usercard-placeholder').length) return;
    
    // jQuery('.clear-tag').length 
    //   ? console.log(jQuery('.clear-tag').trigger('click'))
    //   : console.log(jQuery('.page-featured *').each(function(){$(this)[0].dispatchEvent(new Event("change"))}));
    if($('.match-results-error').length) {
      var showHtml = '';
      cards.forEach(card => showHtml += $('<div>').append($(card)).html());
      console.log({showHtml});
      localStorage.okcpShowCards = showHtml;
      location.reload()
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
      // console.log(newId);
      const likedByYou = $(this).find('.match-info-liked.okicon.i-star').length;
      if (removeLiked && likedByYou) return $(this).remove();
      if(!showMode && $('#'+newId+' .match-ratio-category:visible').length){
        if(!cardIds.includes(newId)){
          console.log('adding card');
          $(this).attr('added', true);
          
          var cardToSave = $(this).clone();
          
          $(cardToSave).find('.button-ctr').remove();
          $(cardToSave).css('display', 'inline-block')
          $(cardToSave).css('margin', '10px')
          $(cardToSave).find('.match-ratios-wrapper-outer-hover.' + newId).remove();
          cards.push(cardToSave);
          cardIds.push( newId )
        } 
        console.log('hiding', newId);
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
      if (showMode) debugger;
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
  console.log({userId, likeBool, userName});
  if (likeBool === 'pass') {
    passList.push('usr'+userName)
    localStorage.passList = JSON.stringify(passList);
  }
  
  return {
    path: '/likes/batch',
    params: {
      // headers: {newRef: `https://www.okcupid.com/profile/${userName}?cf=regular,matchsearch`},
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