var game={};
importScripts("https://www.gstatic.com/firebasejs/3.6.4/firebase.js");
importScripts("/js/game.util.js");
importScripts("/js/lib/hex.js");
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
var locationRefs = new Map();
var world;
var receiveRecord = function(s) {
  //console.log("Recieved a record from firebase sending it to the user!");
    var r = s.val();
    //console.log(s.key);
  //console.log(r);
    //this is really an empty record, and for the remote people we have to trasnmit that
    //change.
  if (r !== null) {
    r.hexID = s.key;
    postMessage(r);
  }else{
      r=game.util.createRecord({hexID:s.key});
      postMessage(r);
  }
};

onmessage = function(e) {
  //console.log("Recieced a record from the user, sending it to firebase");
  var packet = e.data;

  if (packet.type === "record") {
    let r = packet.data;
    if (!locationRefs.has(r.hexID)) {
        //console.log("creating a ref to hex " + r.hexID);
        //console.log(r);
      var ref = fDb.ref(world + "/world/" + r.hexID);

      //this case from exploring the world. we cant just stomp the
      //record that is there, since we are discovering it.
      //so we have to read it but not write it.
      locationRefs.set(r.hexID, ref);
      locationRefs.get(r.hexID).on("value", receiveRecord);
      //locationRefs.get(r.hexID).once("value", receiveRecord);
    }else{
    //console.log("sending to fb " + r.hexID);
      //  console.log(r);
    //for empty hexes there is only the id and that is redundant with the key
    //so we don't need to send any thing, but we can delete what was there
    let hexID = r.hexID;
    delete r.hexID;
        locationRefs.get(hexID).set(r);
    }
  } else if (packet.type === "world") {
    //console.log("setting world to " + packet.data);
    world = packet.data;
  }
};

