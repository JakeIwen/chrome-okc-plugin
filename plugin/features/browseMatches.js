
_OKCP.$likeBtnTemplate = () => $(`<button name="like" style=transform:scale(0.7) class="btn-ctr"><span class="rating_like">Like</span></button>`)
_OKCP.$resetBtnTemplate = () => $(`<button name="reset" style=transform:scale(0.7) class="btn-ctr"><span class="rating_reset">Reset</span></button>`)
_OKCP.$passBtnTemplate = () => $(`<button name="pass" style=transform:scale(0.7) class="btn-ctr"><span class="rating_pass">Pass</span></button>`)
window.removeLiked = false;
window.cards = [];
window.cardIds = []

_OKCP.browseMatches = function() { 
  console.log('browsematches');
  _OKCP.setFilters()
  // return;
  window.cardSelector = ".match-results-card";
  
  const showBtn = $("<button>Show</button> ")
  const evalBtn = $("<button>Eval</button> ")
  const hideLikedBtn = $("<button>Hide Liked</button> ")
  const moreBtn = $("<button>More</button> ")
  const setPassBtn = $("<button>Set Passes</button> ")
  const detailsFilterInput = $('<input id="details-filter" placeholder="Details Filter"></input>')
  const notDetailsFilterInput = $('<input id="not-details-filter" placeholder="Not Details"></input>')
  const essaysFilterInput = $('<input id="essays-filter" placeholder="Essays Filter"></input>')
    
  let show = false;
  let customCards = [];
  let matches = []
  let total_matches;
  var matchParams = localStorage.okcpMatchParams || JSON.stringify(_OKCP.editableMatchParams, null, 2);
  
  let after = null;
  var passIvl = setPassIvl();
  
  var ivl = setInterval(() => localStorage.okcpAutoscroll==="true" && scrollIfReady(), 1000);
  
  $(setPassBtn).click(()=>_OKCP.setPasses());
  $(moreBtn).click(addMoreMatches);
  
  const includesMulti = (text, words) => words.some(w => text.toUpperCase().includes(w.toUpperCase()))
  
  async function addMoreMatches(){
    console.log(matches.length, total_matches);
    // if(matches.length >= total_matches) return;
    const mp = JSON.parse(matchParams);
    localStorage.okcpMatchParams = matchParams;
    console.log('mp', mp);
    const res = await _OKCP.getMatches(mp.max, matches.length, {...mp, after})
    total_matches = res.total_matches
    matches = matches.concat(res.matches)
    after = res.after;
    $('.match-results-card').remove();
    
    console.log('all MATCHES of ', total_matches,  matches)
    let userIds = [];
    let fMatches = matches.filter(m => {
      const detailsText = JSON.stringify(m.details || [])
      const essaysText = JSON.stringify(m.essays || [])
      const detailsFilterVal = $(detailsFilterInput).val().split(',');
      const notDetailsFilterVal = $(notDetailsFilterInput).val().split(',');
      const essaysFilterVal = $(essaysFilterInput).val().split(',');
      const hasDetailsWord = includesMulti(detailsText, detailsFilterVal)
      const hasNotDetailsWord = includesMulti(detailsText, notDetailsFilterVal)
      const hasEssaysWord = includesMulti(essaysText, essaysFilterVal)
      const dupeUser = userIds.includes(m.userid);
      console.log({hasDetailsWord, hasEssaysWord});
      let ret = hasDetailsWord && hasEssaysWord && !dupeUser;
      if (hasNotDetailsWord) ret = false;
      userIds.push(m.userid);
      return ret;
    })

    const newCustomCards = _OKCP.getCustomCards(fMatches);
    
    newCustomCards.forEach(function($card, i){
      $('#showEl').append($card);
      $($card).show();
      _OKCP.getHoverAnswers({$card});
    })
    // console.log('full len', $('#showEl').children());
    setTimeout(()=>_OKCP.setPasses(), 500)
    setTimeout(()=>_OKCP.setPasses(), 3000)
  }

  $(hideLikedBtn).click(() =>
    $(`.match-info-liked.okicon.i-star`).closest(`.match-results-card`).hide()
  );
  
  $(evalBtn).click(() => {
    $(".match-ratios-wrapper-outer-hover").remove();
    $(`.match-results-card`).show()
    var $card = $(this);
    $('#showEl').children().each(function(){_OKCP.getHoverAnswers({$card})})
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
    $('body').append(showEl);
    
    
  })
  setTimeout(() => addSearchJSON($('body')), 3000);
  
  function addSearchJSON($el){
    console.log('adding search textarea');
    const ta = $('<textarea class="params"></textarea>')
    $('#main_content').before(ta);
    $(ta).val(matchParams);
    console.log({matchParams});
    
    $('#main_content').hide();
    
    $(ta).on("change", () => matchParams = $(ta).val())
      .focus(() => {$(`.match-results-card`).hide()})
      .blur(() => {$(evalBtn).click(); $(`.match-results-card`).show()})
      
  }
  
  $('body').prepend(evalBtn, showBtn, hideLikedBtn, moreBtn, setPassBtn, detailsFilterInput, notDetailsFilterInput, essaysFilterInput);
  $('#page').remove();
  $(showBtn).click();
  
  $('#main_content').hide();
  
  function setPassIvl(){
    return setInterval(()=>{
      $(`${window.cardSelector}:not([added]):visible > :not(.usercard-placeholder)`).parent().each(function(){_OKCP.getHoverAnswers(this, 'browse')})
      const cardNum = $(window.cardSelector).length
      const passNum = $("button[name='pass']:visible").length
      if (cardNum > passNum) _OKCP.setPasses();
      else !$('#showEl').length && scrollIfReady();
    }, 1000);
  }

  
  function scrollIfReady() {
    if ($('.usercard-placeholder').length || !$('#page').length) return;
    
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
  
  return true;
};

_OKCP.setLike = function (e, $card, $btn, val){
  console.log({e, $card, $btn, val});
  const userName = _OKCP.getUserName($card);
  e.preventDefault();

  _OKCP.getUserId(userName).then(userId => {
    const {path, params} = _OKCP.getLikePassParams(userId, val, userName);
    
    window.OkC.api(path, params).then(res => {
      console.log('res', res);
      if (val && res.results[0].mutual_like) {
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

_OKCP.setPasses = function() {
  $(`${window.cardSelector}`).parent().each(function(i) {
    _OKCP.setPass(this)
  })
}

_OKCP.setPass = function(card, userId) {
  userId = userId || 'usr' + _OKCP.getUserName(card)
  const likedByYou = $(card).find('.match-info-liked.okicon.i-star').length;
  
  const href = $(card).attr("href") || $(card).find('.matchLink').attr('href');
  console.log({href});
  if (href) {
    $(card).removeAttr("href")
    const ahref = $(`<a href="${href}" target="_blank"></a>`)
    $($(card).find("img.userthumb-img")[0]).wrap(ahref)
  }

  const $likeBtn = _OKCP.$likeBtnTemplate();
  const $passBtn = _OKCP.$passBtnTemplate();
  const $resetBtn = _OKCP.$resetBtnTemplate();
  
  $passBtn.click((e)=> e.preventDefault() && _OKCP.setLike(e, card, $passBtn, false));
  $likeBtn.click((e)=> e.preventDefault() && _OKCP.setLike(e, card, $likeBtn, true));
  $resetBtn.click((e)=> e.preventDefault() && _OKCP.resetUser(e, card, $resetBtn));

  if(likedByYou) $($likeBtn).attr("disabled", "disabled");
    
  const $btnRow = $('<div class="button-ctr"></div>').append([$likeBtn, $resetBtn, $passBtn]);
  $(card).find('.userInfo').append($btnRow);
}

_OKCP.getLikePassParams = function(userId, likeBool) {
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
