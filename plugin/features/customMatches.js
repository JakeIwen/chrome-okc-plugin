_OKCP.getCustomCards = function (userData=[]) {
  return userData.map(user => $(buildCard(user)));


  function buildCard(u){
    const info = u.userinfo
    const loc = u.location
    
    return `<a class="match-results-card" href="/profile/${u.userid}?cf=regular,matchsearch">
      <div class="usercard">
        <div class="usercard-thumb" data-username="${u.username}" data-profile-popover="true">
          <span class="userthumb userthumb--desktop userthumb--box">
            <img class="userthumb-img" src="${u.thumbs[0]['225x225']}" alt="Lauren">
          </span>
        </div>
        <div class="userInfo usercard-info userInfo--center">
          <h3 class="userInfo-username">
            <span class="userInfo-username-name">${info.realname}, ${info.age}</span>
          </h3>
          <div class="userInfo-meta">
            <span class="userInfo-meta-location">${loc.formatted.short}</span>
          </div>
          <div><span class="last-online">${(new Date(u.last_login*1000)).toString().split(' GMT')[0]}</small></div>
        </div>
        <div class="match-info usercard-match-info">
          <div class="match-info-percentage">${u.percentages.match}% / ${u.percentages.enemy}%</div>
          ${u.likes.you_like ? '<div class="match-info-liked okicon i-star"></div>' : ''}
        </div>
      </div>
    </a>`

  }
  
}

