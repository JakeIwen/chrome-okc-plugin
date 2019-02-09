
_OKCP.getMatches = async function(max, searchParams={}){
  //window.ACCESS_TOKEN required for API call
  // + (otherFields || []).length ? (',' + otherFields.join(',')) : ''
  
  const matches = [];
  var dataParams = {
    ..._OKCP.defaultMatchParams, 
    ...searchParams
  }
  
  const params = { api: 1, type: "POST", data:  dataParams};
  var after = '';
  let total_matches;
  do { 
    //must be async loop because we need to get the cursor from each response
    const path = `/match/search`;
    console.log('makin match', {matches, params});
    const {data, paging} = await window.OkC.api(path, params);
    matches.push(...data);
    after = paging.cursors.after;
    params.after = after;
    
  } while(matches.length < (max||400))
  
  return {matches, after, total_matches};
  
}


_OKCP.getApiAnswers = async function(userId){
  //window.ACCESS_TOKEN required for API call
  
  const answers = [];
  const params = { api: 1, type: "GET" };
  let cursor = '';
  let end = false;
  
  do { 
    //must be async loop because we need to get the cursor from each response
    const path = `/profile/${userId}/answers?after=${cursor}`;
    const {data, paging} = await window.OkC.api(path, params);
    answers.push(...data);
    cursor = paging.cursors.after;
    end = paging.end;
    
  } while(!end)
  
  return answers;
  
}

_OKCP.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

_OKCP.defaultMatchParams = {
"order_by": "MATCH",
"gentation": [
  54
],
"gender_tags": 29645,
"orientation_tags": 0,
"minimum_age": 18,
"maximum_age": 39,
"locid": 4356872,
"radius": 500,
"lquery": "",
"location": {
  "postal_code": "",
  "nameid": 239415,
  "display_state": 1,
  "locid": 4356872,
  "state_code": "CO",
  "country_name": "United States",
  "longitude": -10498470,
  "popularity": 0,
  "state_name": "Colorado",
  "default_radius": 25,
  "country_code": "US",
  "city_name": "Denver",
  "density": 40857,
  "metro_area": 2080,
  "latitude": 3973915
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
"fields": "userinfo,thumbs,percentages,likes,last_contacts,last_login,online,location,looking_for,answers"
}
