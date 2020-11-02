

_OKCP.mutualLikes = function() {
  window.cardSelector = ".matchLink-wrapper";
  var nextSelector = '.sliding-pagination-button.next';
  console.log('mlikes');

  $(document).arrive('.messages-mutuallikes .messages-section-header', function() {
    $('.messages-mutuallikes .messages-section-header').click( async () => {
      console.log('begin');
      var begin = (new Date()).valueOf();
      var ivl = setInterval(() => {
        var diff = (new Date()).valueOf() - begin;
        if (diff > 2000) {
          clearInterval(ivl);
          initMutual();
        } else if($(nextSelector).length){
          $(nextSelector).click();
          begin = (new Date()).valueOf();
        } else {
          console.log({diff});
        }
      }, 200)

      // setTimeout(() => initMutual(), 4000);
    })
  });
};

async function initMutual() {
  $('.sliding-pagination-inner-content').attr('style', '');
  
  saveCard()
  var mCards = JSON.parse(_OKCP.lz().decompress(localStorage.getItem('mLikeCards'), {inputEncoding: "StorageBinaryString"}));
  
  _OKCP.setFilters()
  // setTimeout(() => {
  //   $(window.cardSelector).parent().bind('DOMNodeInserted', function() {
  //   });
  // },3000)
  
  for (var card of $(window.cardSelector).toArray()) {
    await handleMutualCard(card);
    _OKCP.setPass(card);
  }
  // return setInterval(()=>{
  //   $(`${window.cardSelector}:not([added]):visible > :not(.usercard-placeholder)`).parent().each(function(){_OKCP.getHoverAnswers(this, 'browse')})
  //   const cardNum = $(window.cardSelector).length
  //   const passNum = $("button[name='pass']:visible").length
  //   if (cardNum > passNum) _OKCP.setPasses();
  // }, 1000);

};

async function handleMutualCard(card) {
  var $card = $(card);
  var sansParams = $($card).find('.matchLink').attr('href').split('?')[0]
  var userId = sansParams.replace('/profile/', '')
  
  await _OKCP.getHoverAnswers({$card, userId});
}
  // return;
  
function saveCard(mCards={}, id, html){
  if (id) mCards[id] = html;
  _OKCP.saveCompressed('mLikeCards', mCards)
}

