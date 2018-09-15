
_OKCP.likes = function() {
  const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
  console.log({questions});
  console.log('questions', questions);
  const list = false
  // const list = {
  //   // 'time-to-intimacy': questions['time-to-intimacy'],
  //   // 'oral_sex': questions['oral_sex']
  //   'anal': questions['anal']
  // }
  
  const hideMismatch = false;
  const reverseSort = false;
  console.log('likes init');
  var existingNames = [];
  var newNames = [];
  setTimeout(setMainResetBtn, 1000)
  function setMainResetBtn(){
    console.log('setting manin');
    const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-all-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Reset</span>
      </button>`)
    $($btn).click((event) => {
      window.answers = "{}";
      localStorage.answers = "{}";
      $('.match-ratios-wrapper-outer-hover').remove();
      console.log('reset');
    });
    $('.userrow-bucket-heading-container').append($btn);
    console.log('done setting manin');
    
  }
  setInterval(()=>{
    var els = $('.userrow.is-liked-you')
    newNames = [];
    $(els).each(function(){
      const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
      if (!existingNames.includes(thisName)) newNames.push(thisName);
    })
    // var difference = diff(newNames, existingNames);
    
    existingNames = existingNames.concat(newNames);
    // if (!difference.length) return;
    
    console.log('newNames', newNames);
    var sorted = $(els);
    // var sorted = $(els).sort((a,b)=>{
    //   var foundA = $(a).find('.userrow-percentage')
    //   var foundB = $(b).find('.userrow-percentage')
    //   var nameA = $(a).find('.userrow-username-name')[0].innerHTML;
    //   var nameB = $(b).find('.userrow-username-name')[0].innerHTML;
    //   var percA = parseInt(foundA[0].innerHTML.slice(0,2))
    //   var percB = parseInt(foundB[0].innerHTML.slice(0,2))
    //   if (!(percB - percA)) {
    //     return nameA.charCodeAt(0) - nameB.charCodeAt(0)
    //   }
    //   return reverseSort ? percA - percB : percB - percA;
    // })
    // $('.userrow.is-liked-you').remove();
    $(sorted).each(function(){
      const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
      if (newNames.includes(thisName)) {
        const href = $(this).attr("href");
        const aHref = $(`<a class="mock-link"></a>`).attr('href', href)
        $(this).find('img').css({height: '120px', width: '120px'});
        $(this).removeAttr("href").append(aHref);
        $card = $(this);
        setPassBtn($card);
        setCardResetBtn($card);
        browseAnswers($card, i);
      }
    })
    // $('.userrows-main').append(sorted);
  }, 2050)//TODO HERE
  
  function diff(arr1=[], arr2=[]) {
    var ret = [];
    for(var i in arr1) 
      if(arr2.indexOf(arr1[i]) == -1) ret.push(arr1[i]);
    return ret;
  };

  function browseAnswers($card, i) {
    
    $($card).hover(()=>_OKCP.getHoverAnswers($card, list, undefined, hideMismatch))
  }
  
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
        setLike($card, $btn, false);
      })
    });
    
    $($card).append($btn);
    
	}
  
  function setCardResetBtn($card){
    if ($($card).find('button[name="reset"]').length) return;
    const thisName = $($(this).find('.userrow-thumb')[0]).attr('data-username')
		const $btn = $(`<button name="reset" class="binary_rating_button silver flatbutton reset-btn">
        <i class="icon i-star"></i>
        <span class="rating_like">Reset</span>
      </button>`)
    $($btn).click((event) => {
      var localAnswers = JSON.parse(window.answers);
      delete localAnswers['usr'+thisName];
      console.log('localAnswers', localAnswers);
      localStorage.answers = JSON.stringify(localAnswers);
      window.answers = JSON.stringify(localAnswers);
      $('.match-ratios-list-hover.usr'+name).remove();
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
  
  function setLike($card, $btn, val){
    const userId = $($($card).find('.userrow-thumb')[0]).attr('data-username')
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      console.log('res', res);

      $($card).css({display: 'none'})
    }).catch(err => console.log(err));
  }
  
  return true;
};