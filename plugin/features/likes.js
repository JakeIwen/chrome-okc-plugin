
_OKCP.likes = function() {
  const questions = JSON.parse(localStorage.okcpDefaultQuestions).questionsList;
  console.log({questions});
  console.log('questions', questions);
  const list = {
    // 'time-to-intimacy': questions['time-to-intimacy'],
    // 'oral_sex': questions['oral_sex']
    'anal': questions['anal']
  }
  
  const hideMismatch = true;
  const reverseSort = false;
  console.log('likes init');
  var existingNames, newNames;
  
  setInterval(()=>{
    var els = $('.userrow.is-liked-you')
    newNames = $.makeArray($(els).map(function(){
      return $($(this).find('.userrow-thumb')[0]).attr('data-username')
    }))
    var difference = diff(newNames, existingNames);
    
    existingNames = newNames;
    if (!difference.length) return;
    
    console.log('newNames');
    var sorted = $(els).sort((a,b)=>{
      var foundA = $(a).find('.userrow-percentage')
      var foundB = $(b).find('.userrow-percentage')
      var nameA = $(a).find('.userrow-username-name')[0].innerHTML;
      var nameB = $(b).find('.userrow-username-name')[0].innerHTML;
      var percA = parseInt(foundA[0].innerHTML.slice(0,2))
      var percB = parseInt(foundB[0].innerHTML.slice(0,2))
      if (!(percB - percA)) {
        return nameA.charCodeAt(0) - nameB.charCodeAt(0)
      }
      return reverseSort ? percA - percB : percB - percA;
    })
    $('.userrow.is-liked-you').remove();
    $(sorted).each(function(){
      $card = $(this);
      setPassBtn($card);
      browseAnswers($card, i);
    })
    $('.userrows-main').append(sorted);
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
    if ($($card).find('button').length) return;
    
		const $btn = $(`<button name="pass" class="binary_rating_button silver flatbutton" style="right: 90px; position: absolute; top: 50px; z-index: 5;"><i class="icon i-star"></i><span class="rating_like">Pass</span></button>`)
    
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
    const userId = $btn.closest("div[data-userid]").attr("data-userid");
    const params = getLikePassParams(userId, val);
    const path = "/likes/batch";
    window.OkC.api(path, params).then(res => {
      if (res.results[0].mutual_like) {
        $($card).css({backgroundColor: 'green'})
        setTimeout(()=>$($card).css({display: 'none'}), 2200)
      } else {
        $($card).css({display: 'none'})
      }
    }).catch(err => console.log(err));
  }
  
  return true;
};