var game={};
importScripts("https://www.gstatic.com/firebasejs/3.6.4/firebase.js");
importScripts("/js/game.util.0.4.18.js");
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
var networkDelay=0;
var myUID;
var receiveRecord = function(s) {
    //console.log("Recieved a record from firebase sending it to the user!");
    var r = s.val();
    //console.log(s.key);
    //game.util.printRecord(r);
    //this is really an empty record, and for the remote people we have to trasnmit that
    //change.
    var message;
    if (r !== null) {
        r.hexID = s.key;
        message= {type:'record',record:r};
        if(networkDelay){
            setTimeout(function(){postMessage(message);},networkDelay);
        }else{
            postMessage(message);
        }
    }else{
        r=game.util.createRecord({hexID:s.key,AID:myUID});
        message= {type:'record',record:r};
        if(networkDelay){
            setTimeout(function(){postMessage(message);},networkDelay);
        }else{
            postMessage(message);
        }
    }
};
var receiveDiff = function(s){
    var r = s.val();
//    console.log("receiveDiff");
//    game.util.printRecord(r);
    var message = {type : 'diff', record:r};
    postMessage(message);
};
onmessage = function(e) {
    var packet = e.data;
    var ref;
    if (packet.type === "record") {
          //console.log("Recieced a record from the user, sending it to firebase");
        var next = packet.data.next;
        var curr = packet.data.curr;
        if (!locationRefs.has(next.hexID)) {
            console.log("creating a ref to hex " + next.hexID);
            console.log(next);
            ref = fDb.ref(world + "/world/" + next.hexID);
            
            //this case from exploring the world. we cant just stomp the
            //record that is there, since we are discovering it.
            //so we have to read it but not write it.
            locationRefs.set(next.hexID, ref);
            locationRefs.get(next.hexID).on("value", receiveRecord);
        } else{
            console.log("sending to fb " + next.hexID);
            console.log(next);
            //for empty hexes there is only the id and that is redundant with the key
            //so we don't need to send any thing, but we can delete what was there
            let hexID = next.hexID;
            delete next.hexID;
            if(networkDelay){
                setTimeout(function(){locationRefs.get(hexID).set(next);},networkDelay);
            }else{
                locationRefs.get(hexID).transaction(
                    
                    function(currData){
                        console.log("current Data");
                        console.log(currData);
                        console.log("expected Data");
                        console.log(curr);
                        console.log("new data");
                        console.log(next);
                        return next;
                    //    if(game.util.deflateEqual(currData, expected)){
                    //        return r;
                    //    }else{
                    //        return null;
                    //    }
                    },
                    function(error,commited,snapshot){
                        receiveRecord(snapshot);
                    },
                    false
                );
                    
                //locationRefs.get(hexID).set(r);
            }
        }
    }else if(packet.type === "diffRecord"){
        //console.log("onmessage diffRecord");
        let r = packet.data;
        let from  = r.from;
        let to = r.to;
        if(!locationDiffRefs.has(from.hexID)){
            //console.log("creating a ref to hexID:"+from.hexID);
            ref = fDb.ref(world + "/newWorld/"+ from.hexID );
            locationDiffRefs.set(from.hexID,ref);
            locationDiffRefs.get(from.hexID).orderByKey().on('child_added',receiveDiff);
        }
        if(to){
             if(!locationDiffRefs.has(to.hexID)){
                 //console.log("creating a ref to hexID:"+to.hexID);
                 ref = fDb.ref(world + "/newWorld/"+ to.hexID );
                 locationDiffRefs.set(to.hexID,ref);
                 locationDiffRefs.get(to.hexID).orderByKey().on('child_added',receiveDiff);
             }
        }
        var newPushRef = fDb
            .ref(world + "/newWorld/" + from.hexID)
            .push();
        var key = newPushRef.key;
        var update = {};
        update[world + "/newWorld/" + from.hexID + "/"+ key] = from;
        if (to) {
            update[world + "/newWorld/" + to.hexID + "/" + key] = to;
        }
        fDb.ref().update(update);
        
    } else if (packet.type === "world") {
        //console.log("setting world to " + packet.data);
        world = packet.data;
    }else if(packet.type === "networkDelay" ){
        networkDelay = packet.data;
    }else if (packet.type ==='UID'){
        myUID = packet.data;
    }
};
