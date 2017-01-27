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
fDb.ref("worker").set("Im an awesome worker");
console.log("still a great worker");
