_OKCP.getMutualLikes = async function(){
  const mutualLikes = [];
  const body = {
    operationName:"getInboxPage",
    variables:{
      userid:"49246541853129158",
      conversationsFilter:"INCOMING",
    },
    query: `fragment ArchivedConversationCount on User {
      conversationCounts {
        archived
        __typename
      }
      __typename
    }
    fragment LikesMutual on User {
      likesMutual(after: $matchesAfter) {
        data {
          senderLikeTime
          targetLikeTime
          targetLikeViaSpotlight
          senderMessageTime
          targetMessageTime
          user {
            id
            displayname
            username
            age
            primaryImage {
              id
              square225
              __typename
            }
            location {
              summary
              __typename
            }
            isOnline
            __typename
          }
          __typename
        }
        pageInfo {
          hasMore
          after
          __typename
        }
        __typename
      }
      __typename
    }
    fragment Conversations on User {
      notificationCounts {
        messages
        __typename
      }
      conversations(filter: $conversationsFilter, after: $conversationsAfter) {
        data {
          threadid
          time
          isUnread
          sentTime
          receivedTime
          correspondent {
            senderLikeTime
            targetLikeTime
            targetLikeViaSpotlight
            senderMessageTime
            targetMessageTime
            matchPercent
            user {
              id
              displayname
              username
              age
              isOnline
              primaryImage {
                id
                square225
                __typename
              }
              __typename
            }
            __typename
          }
          snippet {
            text
            sender {
              id
              __typename
            }
            __typename
          }
          __typename
        }
        pageInfo {
          hasMore
          after
          total
          __typename
        }
        __typename
      }
      __typename
    }
    query getInboxPage($userid: String!, $matchesAfter: String, $conversationsFilter: ConversationFilter!, $conversationsAfter: String) {
      user(id: $userid) {
        id
        ...LikesMutual
        ...Conversations
        ...ArchivedConversationCount
        __typename
      }
    }
  `}
  let hasMore = false;
  let matchesAfter;
  const url = "https://www.okcupid.com/graphql";
  const buildRequest = (after) => {
    if (after) body.variables.matchesAfter = after;
    return {
      "headers": {
        "content-type": "application/json",
      },
      "referrer": "https://www.okcupid.com/messages",
      "body": JSON.stringify(body),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    }
  }
  
  do {
    const response = await fetch(url, buildRequest(matchesAfter));
    const json = await response.json();
    if (json.errors) {
      debugger;
      return mutualLikes;
    }
    const {data, pageInfo} = json.data.user.likesMutual;
    mutualLikes.push(...data)
    console.log(mutualLikes.length);
    hasMore = pageInfo.hasMore;
    matchesAfter = pageInfo.after;
  } while (hasMore);
  return mutualLikes;
}
_OKCP.getMatches = async function(max=1000, numExisting=0, searchParams={}){
  //window.ACCESS_TOKEN required for API call
  let days = searchParams.days_since_online ;

  let matches = [];
  var dataParams = Object.assign(_OKCP.defaultMatchParams, searchParams)
  
  dataParams.location = {
    country_code: 'US',
    postal_code: dataParams.zip_code,
    default_radius: dataParams.radius
}
  
  const params = { api: 1, type: "POST", data: dataParams};
  console.log({params});
  var after = '';
  let total_matches;
  let oldLen = 0;
  do { 
    //must be async loop because we need to get the cursor from each response
    const path = `/match/search`;
    console.log('makin match', {matches, params});
    oldLen = matches.length;
    const res = await window.OkC.api(path, params);
    const {data, paging} = res;
    total_matches= res.total_matches;
    matches.push(...data);
    if(matches.length === oldLen) {
      console.log('stalling. total matches = ', total_matches);
      await _OKCP.timeout(2500);
    };
    after = paging.cursors.after;
    params.data.after = after;
    
  } while(matches.length + dataParams.limit < max && matches.length + numExisting < total_matches)
  
  if(days) {
    var secCalc = Date.now()/1000 - 3600*24*days;
    matches = matches.filter(m => m.last_login > secCalc)
  }
  
  var passed = matches.filter(m => m.likes.passed_on)
  var you_disliked = matches.filter(m => m.likes.you_like===0)
  
  if(passed.length) console.log('passed on', passed)  
  if(you_disliked.length) console.log({you_disliked})
  
  return {matches, after, total_matches};
  
}

_OKCP.getApiProfile = async function(userId){
  const params = { api: 1, type: "GET", cf: "regular,matchsearch"};
  const path = `/profile/${userId}`;
  const res = await window.OkC.api(path, params);
  console.log('apiprofile', res);
  return res
}

_OKCP.getApiVisitors = async function(){
  console.log('getting visitirs');
  const params = { type: "GET" };
  const path = `/visitors?okc_api=1`;
  const res = await window.OkC.api(path, params);
  console.log('apivisitors', res);
  return res
}

//return ALL available questions for a given user
_OKCP.getApiAnswers = async function(userId){
  //window.ACCESS_TOKEN required for API call
  var bad = 0;
  const allAnswers = [...await getLoopFilterAnswers(), ...await getLoopFilterAnswers(10)]
  console.log('num answers found', allAnswers.length);
  return bad ? null : allAnswers;
  
  async function getLoopFilterAnswers(filterNum) {
    const answers = [];
    const params = { api: 1, type: "GET" };
    let cursor = '';
    let end = false;
    let filter = filterNum ? `filter=${filterNum}&` : ''
    
    do {    //must be async loop to get cursor from each response
      
      const path = `/profile/${userId}/answers?${filter}after=${cursor}`;
      const {data, paging} = await window.OkC.api(path, params);

      if(!data || !paging) {
        console.log(`bad response: bailing on /profile/${userId}/answers?${filter}after=${cursor}`);
        await _OKCP.timeout(2500);
        bad++;
        return answers; //bad response: bail. This is very rare. 
      }
      
      answers.push(...data);
      cursor = paging.cursors.after;
      end = paging.end;
      
    } while(!end)

    return answers;
  }
  
}

_OKCP.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

_OKCP.defaultMatchParams = {
  "order_by": "MATCH",
  "likes": {
    "mutual_like": 1
  },
  "gentation": [
    54
  ],
  "minimum_age": 18,
  "maximum_age": 39,
  // "locid": 4356872,
  "radius": 500,
  "lquery": "",
  "location": {
    "postal_code": "55407",
    // "nameid": 239415,
    // "display_state": 1,
    // "locid": 4356872,
    // "state_code": "CO",
    // "country_name": "United States",
    // "longitude": -10498470,
    // "popularity": 0,
    // "state_name": "Colorado",
    // "default_radius": 25,
    "country_code": "US",
    // "city_name": "Denver",
    // "density": 40857,
    // "metro_area": 2080,
    // "latitude": 3973915
  },
  "located_anywhere": 1,
  "last_login": 1468800,
  // "i_want": "other",
  "they_want": "men",
  "minimum_height": null,
  "maximum_height": null,
  "languages": 0,
  "speaks_my_language": false,
  "ethnicity": [],
  "religion": [],
  "availability": "any",
  "monogamy": null,
  "looking_for": [],
  "smoking": [],
  "drinking": [],
  "drugs": [],
  "answers": [],
  "interest_ids": [],
  "education": [],
  "children": [],
  "cats": [],
  "dogs": [],
  "tagOrder": [],
  // "after": "NTExNjU2NDc2OTE5NDk1NDI1NiwyMCwyMA==",
  "limit": 50,
  "fields": "userinfo,thumbs,percentages,likes,last_contacts,last_login,online,location,looking_for,answers,details"
}

_OKCP.editableMatchParams = {
  "order_by": "MATCH",
  "days_since_online": null,
  "gentation": [
    54
  ],
  "gender_tags": 29645,
  "minimum_age": 18,
  "maximum_age": 39,
  "zip_code": 55407,
  "radius": 300,
  "located_anywhere": 0,
  "they_want": "everyone | men",
  "monogamy": null,
  "limit": 50,
  "max": 100,
  "fields": "userinfo,thumbs,percentages,likes,last_contacts,last_login,online,location,details"
}
