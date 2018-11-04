console.log("ADDING");
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  console.log({details});
  var refHeaderIndex = details.requestHeaders.map(n=>n.name).indexOf('newRef')
  if (refHeaderIndex == -1) {
    console.log('nope');
    return;
  }
  
  var newRef = details.requestHeaders.splice(refHeaderIndex, 1)[0].value;
  debugger;
  
  var gotRef = false;
  for(var n in details.requestHeaders){
      gotRef = details.requestHeaders[n].name.toLowerCase()=="referer";
      if(gotRef){
          details.requestHeaders[n].value = newRef;
          break;
      }
  }
  if(!gotRef){
      details.requestHeaders.push({name:"Referer",value:newRef});
  }
  return {requestHeaders:details.requestHeaders};
},{
  urls:[
    "http://*.okcupid.com/*",
    "https://*.okcupid.com/*"
  ]
},[
  "requestHeaders",
  "blocking"
]);