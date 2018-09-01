_OKCP.browseMatches = function() {
  
  let numBtns = $("button[name='like']").length;
  verifyTokenPresence();
  setPasses();
  setInterval(()=>{
    const newNum = $("button[name='like']").length
    if (numBtns < newNum) setPasses();
    numBtns = newNum;
  }, 1000);
  
  setTimeout(()=>console.log('reg window', window), 3000)

  function verifyTokenPresence() {
    window.CURRENTUSERID = "49246541853129158";
    const settings = localStorage.okcpSettings;
    console.log(JSON.parse({settings}))
    const tokenIsOld = (Date.now()-settings.tokenLastUpdated) > 60*60*2.75*1000;
    window.ACCESS_TOKEN = settings.ACCESS_TOKEN;
    if(tokenIsOld || !window.ACCESS_TOKEN) {
      console.log('getting new token');
      window.OkC.getNewAccessToken().then(tokenres => 
        settings.ACCESS_TOKEN = tokenres.authcode);
    }
  }
  
  function setLike($btn, val){
    const userId = $btn.closest("div[data-userid]").attr("data-userid");
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      $btn.closest('.match_card_wrapper').css('display', 'none');
    }).catch(err => console.log(err));
  }
  
  function setPasses() {
    $("button[name='like']").each(function() {
      if((this.nextSibling || {}).name == "pass") return;
      let $likeBtn = $(this).clone();
      $likeBtn.css({marginLeft: 'inherit', position: 'relative', top: '10px', left: '10px'})
      let $passBtn = $likeBtn.clone();
      $passBtn.removeClass("liked");
      $passBtn.attr('name', 'pass');
      $passBtn.find("span").text("Pass");
      $passBtn.click(()=>setLike($passBtn, false));
      $likeBtn.click(()=>setLike($likeBtn, true));
      let $btnRow = $('<div></div>');
      $btnRow.append([$likeBtn, $passBtn]);
      $(this).replaceWith($btnRow);
    })
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