
_OKCP.getMatches = async function(max=1000, numExisting=0, searchParams={}){
  //window.ACCESS_TOKEN required for API call
  let days = searchParams.days_since_online ;

  let matches = [];
  var dataParams = {
    ..._OKCP.defaultMatchParams, 
    ...searchParams
  }
  
  const params = { api: 1, type: "POST", data: dataParams};
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
  
  const answers = [];
  const params = { api: 1, type: "GET" };
  let cursor = '';
  let end = false;
  
  do {    //must be async loop to get cursor from each response
    
    const path = `/profile/${userId}/answers?after=${cursor}`;
    const {data, paging} = await window.OkC.api(path, params);

    if(!data || !paging) {
      return answers; //bad response: bail. This is very rare. 
    }
    
    answers.push(...data);
    cursor = paging.cursors.after;
    end = paging.end;
    if(end && userId == "12371192137647414140") debugger;
    
  } while(!end)
  console.log('num answers found', answers.length);
  
  return answers;
  
}

_OKCP.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

_OKCP.defaultMatchParams = {
"order_by": "MATCH",
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
  "default_radius": 25,
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
  "radius": 500,
  "located_anywhere": 1,
  "they_want": "men",
  "monogamy": null,
  "limit": 50,
  "max": 100,
  "fields": "userinfo,thumbs,percentages,likes,last_contacts,last_login,online,location,details"
}
