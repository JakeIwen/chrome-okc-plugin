

_OKCP.browseMatches = function() {
  // return;
  window.cardSelector = ".match-results-card";
  const removeLiked = false;
  const cards = []
  const showBtn = $("<button>Show</button> ")
  let passList = JSON.parse(localStorage.passList || "[]");
  let show = false; 
  $(showBtn).click(()=>{
    show = true;
    $('body').empty();
    
    console.log({cards});
    $(cards).each(function(){
      $(this).css('display', 'inline-block')
      $('body').append(this)
      $(this).css('margin', '10px')
      const thisName = 'usr' + _OKCP.getUserName(this)
      
      $(this).find('.match-ratios-wrapper-outer-hover.' + thisName).remove();
      _OKCP.getHoverAnswers(this, 'browse')
      // browseAnswers(this);
      setTimeout(()=>setPasses(), 500)
    })
    
    
    $('body').prepend(showBtn);
    $(showBtn).click(()=>{
      $('.match-ratios-wrapper-outer-hover').remove();
      $(window.cardSelector).each(function(){
        _OKCP.getHoverAnswers(this, 'browse')
      })
    });
    // o
    // $(cards).find("button[name='pass']").remove();
    // $(cards).find("button[name='like']").remove();
  })
  $('body').prepend(showBtn);
  const $likeBtnTemplate = $(`<button name="like" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Like</span></button>`)
  const $resetBtnTemplate = $(`<button name="reset" style=transform:scale(0.7) class="btn-ctr"><span class="rating_reset">Reset</span></button>`)
  const $passBtnTemplate = $(`<button name="pass" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Pass</span></button>`)
  
  function resetUser(e, $card, $btn, val){
    e.preventDefault();
    const thisName = _OKCP.getUserName($card)
    var localAnswers = JSON.parse(window.answers);
    delete localAnswers['usr'+thisName];
    console.log({localAnswers, thisName});
    localStorage.answers = JSON.stringify(localAnswers);
    window.answers = JSON.stringify(localAnswers);
    $($card).find('.match-ratios-wrapper-outer-hover').remove();
    console.log('reset');

    // $($card).append($btn);
	}
  
  setInterval(()=>{
    console.log('int');
    const cardNum = $(window.cardSelector).length
    const passNum = $("button[name='pass']").length
    console.log({cardNum, passNum});
    if (cardNum > passNum) setPasses();
  }, 2000);

  setInterval(()=>{
    $(window.cardSelector).each(function(){_OKCP.getHoverAnswers(this, 'browse')})
  }, 5000)

  function setLike(e, $card, $btn, val){
    console.log({e, $card, $btn, val});
    const userName = _OKCP.getUserName($card);
    e.preventDefault();

    const path = "/likes/batch";
    _OKCP.getUserId(userName).then(userId => {
      const params = getLikePassParams(userId, val, userName);
      
      window.OkC.api(path, params).then(res => {
        console.log('res', res);
        if (res.results[0].mutual_like) {
          $($card).css({backgroundColor: 'green'})
          console.log('MUTUAL LIKE');
          setTimeout(()=>$($card).css({display: 'none'}), 2200)
        } else {
          $($card).css({display: 'none'})
        }
      }).catch(err => console.log(err));
      
      
      
    });

  }
  
  function setPasses() {
    $(window.cardSelector).each(function(i) {
      const newId = 'usr' + _OKCP.getUserName(this)
      if ((passList || []).includes(newId)) $(this).remove();
      if($('#'+newId+' .match-ratio-category:visible').length && !$(cards).find('#'+newId).length && newId!=='usrundefined' && !show){
        console.log('adding card');
        // debugger;
        cards.push(this);
      }
      if ($('#'+newId).length) {
        return // $(this).remove()
      }
      $(this).attr("id", newId);
      const href = $(this).attr("href")
      if (href) {
        $(this).removeAttr("href")
        const ahref = $(`<a href="${href}"></a>`)
        $($(this).find("img.userthumb-img")[0]).wrap(ahref)
      }

      if ($(this).find('.usercard-placeholder-thumb').length) return;
      
      if ($(this).find("button[name='pass']").length) return;
      let $likeBtn = $($likeBtnTemplate).clone();
      let $passBtn = $($passBtnTemplate).clone();
      let $resetBtn = $($resetBtnTemplate).clone();
      $passBtn.click((e)=>setLike(e, this, $passBtn, false));
      $likeBtn.click((e)=>setLike(e, this, $likeBtn, true));
      $resetBtn.click((e)=>resetUser(e, this, $resetBtn));
      const $percent = $(this).find('.match-info-percentage');


      const $userInfo = $(this).find('.userInfo');
      let $btnRow = $('<div class="button-ctr"></div>');
      
      $($btnRow).append([$likeBtn, $resetBtn, $passBtn]);
      $($userInfo).append($btnRow);

      if (removeLiked && $(this).find('div.match-info-liked.okicon.i-star').length) return $(this).remove();
    })
  }
  
  function getLikePassParams(userId, likeBool, userName) {
    if (likeBool === 'pass') {
      passList.push('usr'+userName)
      localStorage.passList = JSON.stringify(passList);
    }
    return {
      headers: {newRef: `https://www.okcupid.com/profile/${userName}?cf=regular,matchsearch`},
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
  
  function browseAnswers($card, i) {
    $($card).find('.usercard-thumb').hover(()=>{
      _OKCP.getHoverAnswers($card, 'browse')
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