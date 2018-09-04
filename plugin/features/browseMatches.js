_OKCP.browseMatches = function() {
  let numBtns = $("button[name='like']").length;
  
  verifyTokenPresence();
  setPasses();
  setInterval(()=>{
    const newNum = $("button[name='like']").length
    if (numBtns < newNum) setPasses();
    numBtns = newNum;
  }, 1000);
  
  setTimeout(()=>console.log('reg window', window), 3000);
  
  // setInterval(()=>{
  //   $('.match_card_wrapper').each(function(){
  //     if(!$(this).find('.match-ratio-category').text().includes('anal')){
  //       this.css({display: 'none'});
  //       console.log('hiding card');
  //     } else {
  //       console.log('showing card');
  //       this.css({display: none});
  // 
  //     }
  //   })
  //   let $card = $('.match_card_wrapper');
  // }, 5000)

  function verifyTokenPresence() {
    window.CURRENTUSERID = "49246541853129158";
    const settings = localStorage.okcpSettings;
    const tokenIsOld = (Date.now()-(localStorage.okcpTokenLastUpdated || 0)) > 60*60*2.75*1000;
    window.ACCESS_TOKEN = settings.ACCESS_TOKEN;
    if(tokenIsOld || !window.ACCESS_TOKEN) {
      console.log('getting new token');
      window.OkC.getNewAccessToken().then(tokenres => {
        settings.ACCESS_TOKEN = tokenres.authcode;
        localStorage.okcpTokenLastUpdated = Date.now();
      });
    }
  }
  
  function setLike($card, $btn, val){
    const userId = $btn.closest("div[data-userid]").attr("data-userid");
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      $($card).css({display: 'none'});
    }).catch(err => console.log(err));
  }
  
  function setPasses() {
    $("button[name='like']").each(function() {
      if((this.nextSibling || {}).name == "pass") return;
      const $card = this.closest('.match_card_wrapper');
      let $likeBtn = $(this).clone();
      $likeBtn.css({marginLeft: 'inherit', position: 'relative', top: '10px', left: '10px'})
      let $passBtn = $likeBtn.clone();
      $passBtn.removeClass("liked");
      $passBtn.attr('name', 'pass');
      $passBtn.find("span").text("Pass");
      $passBtn.click(()=>setLike($card, $passBtn, false));
      $likeBtn.click(()=>setLike($card, $likeBtn, true));
      let $btnRow = $('<div></div>');
      $btnRow.append([$likeBtn, $passBtn]);
      $(this).replaceWith($btnRow);
      browseAnswers($card);
    })
  }
  
  function browseAnswers($card) {
    const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
    $($card).hover(()=>
      _OKCP.getHoverAnswers($card)
    )
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
  
  return true;
};