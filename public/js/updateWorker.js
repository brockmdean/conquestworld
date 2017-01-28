importScripts("https://www.gstatic.com/firebasejs/3.6.4/firebase.js");
var config = {
    apiKey: "AIzaSyCZVSQ4AEZ8KOauMqhefalUSrEG1pf7zUM",
    authDomain: "darkgenerals-17fac.firebaseapp.com",
    databaseURL: "https://darkgenerals-17fac.firebaseio.com",
    storageBucket: "darkgenerals-17fac.appspot.com",
    messagingSenderId: "294204791883"
  };
firebase.initializeApp(config);
var fDb = firebase.database();
console.log("still a great net worker");
var ref=fDb.ref('rdev/updates');

var receiveRecord= function(s){
  //console.log("Recieved a record from firebase sending it to the user!");
  var r = s.val();
  postMessage(r);
};

onmessage = function(e){
  //console.log("Recieced a record from the user, sending it to firebase");
  var r = e.data;
  ref.push(r);
};
ref.on('child_added', receiveRecord);
