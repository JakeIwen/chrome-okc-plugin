_OKCP.browseMatches = function() {
  
  setPasses();
  setInterval(()=>{
    const likeNum = $("button[name='like']").length
    const passNum = $("button[name='pass']").length
    if (likeNum > passNum) setPasses();
  }, 1000);

  
  function setLike($card, $btn, val){
    const userId = $btn.closest("div[data-userid]").attr("data-userid");
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      if (res.results[0].mutual_like) {
        $($card).css({backgroundColor: 'green'})
        console.log('MUTUAL LIKE');
        setTimeout(()=>$($card).css({display: 'none'}), 2200)
      } else {
        $($card).css({display: 'none'})
      }
      
    }).catch(err => console.log(err));
  }
  
  function setPasses() {
    $("button[name='like']").each(function(i) {
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
      browseAnswers($card, i);
    })
  }
  
  function browseAnswers($card, i) {
    const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
    $($card).hover(()=>_OKCP.getHoverAnswers($card, undefined, undefined))
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