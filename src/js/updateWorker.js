var game = {};
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
var locationDiffRefs = new Map();
var world;
var networkDelay = 0;
var myUID;
var timing={};
var latencySum=0;
var latencyCount=0;
var wsMessage = function(message){
  //console.log("wsMessage");
  var r;
  var m;
  if(!message.data){
    console.log("error empty record this should not happen.");
  }else{
    r = JSON.parse(message.data);
    m = {type:"record",record:r.r};
    var hexID = r.r.hexID;
    if(timing[hexID]){
      let latency =  Date.now()-timing[hexID];
      latencySum +=latency;
      latencyCount++;
      if(latencyCount === 50){
//        console.log("latency Ave:"+latencySum/latencyCount);
        postMessage({type:"latency",data:latencySum/latencyCount});
        latencySum =0;
        latencyCount=0;
      }
    }
    //console.log(r);
    postMessage(m);
  }
};
var host = location.origin.replace('http', 'ws');
console.log("host "+host);
var ws = new WebSocket(host);
ws.onmessage = wsMessage;

var receiveRecord = function(s) {
//  console.log("receiveRecord");
  var r = s.val();
//  console.log("        " + s.key);
//  console.log("        " + game.util.formatRecord(r));
  //this is really an empty record, and for the remote people we have to trasnmit that
  //change.
  var message;
  if (r !== null) {
    r.hexID = s.key;
    message = { type: "record", record: r };
    if (networkDelay) {
      setTimeout(
        function() {
          postMessage(message);
        },
        networkDelay
      );
    } else {
      postMessage(message);
    }
  } else {
    r = game.util.createRecord({ hexID: s.key, AID: myUID });
    message = { type: "record", record: r };
    if (networkDelay) {
      setTimeout(
        function() {
          postMessage(message);
        },
        networkDelay
      );
    } else {
      postMessage(message);
    }
  }
};
var receiveDiff = function(s) {
  var r = s.val();
  //    console.log("receiveDiff");
  //    game.util.printRecord(r);
  var message = { type: "diff", record: r };
  postMessage(message);
};
var doTransaction = function(ref, next, curr, action, hexID) {
  ref.transaction(
    function(currData) {
//      console.log("doTransaction  " + hexID);
//      console.log("     current Data");
//      console.log("        " + game.util.formatRecord(currData));
//      console.log("     expected Data");
//      console.log("        " + game.util.formatRecord(curr));
//      console.log("     new data");
//      console.log("        " + game.util.formatRecord(next));
//      console.log("     action");
//      console.log("        " + game.util.formatRecord(action));
      if (game.util.fBRecordsEqual(currData, curr)) {
//        console.log("     equal");
      } else {
 //       console.log("     not equal");
        if(action.type === "spawn"){
//          console.log("     aborting spawn transaction");
          return null;
        }else if(action.type === "buildWall" || action.type === "buildCity"){
          //it is still ok to build this wall as long as
          //the square is either ours or unclaimed.
          //else abort it 
          if(curr.hasOwnProperty('UID')){
            if(curr.UID === next.UID){              
              return next;
            }else{
              return null;
            }
          }else{
            return next;
          }          
        }else if(action.type === "moveKing"){
          
        }else if(action.type === "moveArmy"){
          //this will let the sender process the
          //this packet when it is received. 
          next.AID = 0;
          return next;
        }
        
        
        
        
      }

      return next;
    },
    function(error, commited, snapshot) {
      //receiveRecord(snapshot);
  //    console.log("CompleteCallback");
  //    console.log("     e: "+error+" c:"+commited);
  //    console.log("     data: "+game.util.formatRecord(snapshot.val()));
    },
    false
  );
};
onmessage = function(e) {
  var packet = e.data;
  var ref;
  //console.log("onMessge");
  if (packet.type === "record") {
    //console.log("Recieced a record from the user, sending it to firebase");
    var next   = packet.data.next;
    var curr   = packet.data.curr;
    var action = packet.data.action;
    timing[next.hexID]= Date.now();

    if (!locationRefs.has(next.hexID)) {
      var wsR = {type:'listen',r:next};
      ws.send(JSON.stringify(wsR));
      //console.log("     creating a ref to hex " + next.hexID);
      //console.log("     next : " + game.util.formatRecord(next));
      // ------ref = fDb.ref(world + "/world/" + next.hexID);

      //this case from exploring the world. we cant just stomp the
      //record that is there, since we are discovering it.
      //so we have to read it but not write it.
      //--------locationRefs.set(next.hexID, ref);
      //--------locationRefs.get(next.hexID).on("value", receiveRecord);


      locationRefs.set(next.hexID, true);
    } else {
      //console.log("     sending to fb " + next.hexID);
      //console.log("     next: " + game.util.formatRecord(next));
      //for empty hexes there is only the id and that is redundant with the key
      //so we don't need to send any thing, but we can delete what was there
      var wsRecord = {type : 'write',r: next,e:curr,a:action};
      ws.send(JSON.stringify(wsRecord));

//      let hexID = next.hexID;
//      delete next.hexID;
//      if (networkDelay) {
//        setTimeout(
//          function() {
//            doTransaction(locationRefs.get(hexID), next, curr,action, hexID);
//          },
//          networkDelay
//        );
//      } else {
//        //doTransaction(locationRefs.get(hexID), next, curr,action, hexID);
//        locationRefs.get(hexID).set(next);
//      }
    }
  } else if (packet.type === "diffRecord") {
    //console.log("onmessage diffRecord");
    let r = packet.data;
    let from = r.from;
    let to = r.to;
    if (!locationDiffRefs.has(from.hexID)) {
      //console.log("creating a ref to hexID:"+from.hexID);
      ref = fDb.ref(world + "/newWorld/" + from.hexID);
      locationDiffRefs.set(from.hexID, ref);
      locationDiffRefs
        .get(from.hexID)
        .orderByKey()
        .on("child_added", receiveDiff);
    }
    if (to) {
      if (!locationDiffRefs.has(to.hexID)) {
        //console.log("creating a ref to hexID:"+to.hexID);
        ref = fDb.ref(world + "/newWorld/" + to.hexID);
        locationDiffRefs.set(to.hexID, ref);
        locationDiffRefs
          .get(to.hexID)
          .orderByKey()
          .on("child_added", receiveDiff);
      }
    }
    var newPushRef = fDb.ref(world + "/newWorld/" + from.hexID).push();
    var key = newPushRef.key;
    var update = {};
    update[world + "/newWorld/" + from.hexID + "/" + key] = from;
    if (to) {
      update[world + "/newWorld/" + to.hexID + "/" + key] = to;
    }
    fDb.ref().update(update);
  } else if (packet.type === "world") {
    //console.log("setting world to " + packet.data);
    world = packet.data;
  } else if (packet.type === "networkDelay") {
    networkDelay = packet.data;
  } else if (packet.type === "UID") {
    myUID = packet.data;
  }
};
