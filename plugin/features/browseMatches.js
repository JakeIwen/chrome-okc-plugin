_OKCP.browseMatches = function() {
  
  const $likeBtnTemplate = $(`<button style=transform:scale(0.7) class="binary_rating_button silver flatbutton">
    <span class="profile-buttons-actions-action-text okicon i-close">
    </span>
    <span class="rating_like">Like</span>
  </button>`)
  const $passBtnTemplate = $(`<button style=transform:scale(0.5) class="binary_rating_button silver flatbutton">
    <span class="profile-buttons-actions-action-text okicon i-close">
    </span>
    <span class="rating_pass">Pass</span>
  </button>`)
  
  function browseAnswers($card, i) {
    console.log('card', $card);
    const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
    $($card).find('img').hover(()=>_OKCP.getHoverAnswers($card, undefined, undefined))
  }
  
  setInterval(()=>{
    
    const cardNum = $(".match-results-card").length
    const passNum = $("button[name='pass']").lengt
    console.log({cardNum, passNum});
    if (cardNum > passNum) setPasses();
  }, 1000);

  
  function setLike(e, $card, $btn, val){
    console.log({e, $card, $btn, val});
    e.preventDefault();
    const userId = $btn.closest("div[data-userid]").attr("data-userid");
    const params = getLikePassParams(userId, val);
    console.log('userId, val', userId, val, params);
    
    const path = "/likes/batch";
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
  }
  
  
  
  function setPasses() {
    $(".match-results-card").each(function(i) {
      let $likeBtn = $($likeBtnTemplate).clone();
      let $passBtn = $($passBtnTemplate).clone();
      $passBtn.click((e)=>setLike(e, this, $passBtn, false));
      $likeBtn.click((e)=>setLike(e, this, $likeBtn, true));
      const $percent = $(this).find('.match-info-percentage');
      // $likeBtn.insertBefore($percent);
      
      // if((this.nextSibling || {}).name == "pass") return;
      // const $card = this.closest('.match_card_wrapper');
      // $likeBtn.css({marginLeft: 'inherit', position: 'relative', top: '10px', left: '10px'})
      // let $passBtn = $likeBtn.clone();
      // $passBtn.removeClass("liked");
      // $passBtn.attr('name', 'pass');
      // $passBtn.find("span").text("Pass");

      const $userInfo = $(this).find('.userInfo');
      let $btnRow = $('<h3 class="userInfo-username">');
      // $($btnRow).css('display', 'inline-block');
      $($btnRow).append([$likeBtn, $passBtn]);
      $($btnRow).insertBefore($percent);
      // $($percent).insertAfter($passBtn);
      // $matchInfo = $(this).find('.usercard-match-info')
      // $($matchInfo).append($btnRow);
      
      // $(this).append($btnRow);
      // $($userInfo).append($btnRow);
      
      browseAnswers(this, i);
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