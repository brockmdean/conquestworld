/* global game, $, radio  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

var remoteDatabase = (function (){
    'use strict';

    var create = function (){
	var _worldPtr;
	var worldStateNumChildren;
        var _incomingCount = 0;
        var _outgoingCount = 0;
        var _UID;
        var fbDatabase;
        var globalUpdatesRef;
        var usersRef;
        var worldStateLocation;
        var writeSeq = 0;
        var transactionID = '';
        var processRecordCallback;
        var processUserCallback;
        var processWorldCallback;
        var transactions = {};
        var outputQueue = [];
	var lastTransaction;
        var keyList = [];
	var lDb ;
        //in ms
        var kMinTimeBetweenUpdates = 10000
        // the # of transactions between atempts update the worldstate
        //the random part is so that all the players don't try to update
        //at the same time.
        var kTransactionsBetweenUpdates = 1000+game.util.getRandomIntInclusive(500,1000);
	// public
	var setLDB = function(ldb){lDb = ldb};
        var bandwidth = function (){ return  {I: _incomingCount,  O: _outgoingCount}; };

	var tryUpdate = function(){
	    // Try to create a user for ada, but only if the user id 'ada' isn't
	    // already taken
	    console.log("tryUpdate");
	    console.log(game.world());
	    var updaterRef = fbDatabase.ref(game.world()+'/updater');
	    
	    updaterRef.transaction(function(currentData) {
		console.log("current data "+currentData);
		if (currentData === null) {
		    console.log("here");
		    return { name: game.uid()};
		} else {
		    console.log('someone alreay is updating');
		    return; // Abort the transaction.
		}
	    }, function(error, committed, snapshot) {
		if (error) {
		    console.log('Transaction failed abnormally!', error);
		} else if (committed) {
		    startUpdate();
		} else {
		    console.log('User ada added!');
		}
		console.log("Ada's data: ", snapshot.val());
	    });
	};
	var updateWorldState = function(){
	    tryUpdate();//starts a chain of call backs 
	};
	var startUpdate = function(){
            
	    console.log("starting update");
            fbDatabase.ref(game.world()+'/UpdatedAt').orderByKey().limitToLast(1).once('child_added',function(s){
                var lastUpdatedAt = s.val();
                //there may not have been an update yet
                if(lastUpdatedAt === null ){lastUpdatedAt= 0;}
                if( (Date.now() - lastUpdatedAt) >  kMinTimeBetweenUpdates){doUpdate();}
                else {console.log("there was an update "+(Date.now() - lastUpdatedAt)+" ago, skipping");
                      fbDatabase.ref(game.world()+'/updater').remove();
                     }
            });
	};
        var doUpdate= function(){
            console.log("do Update");
            fbDatabase.ref(game.world()+'/UpdatedAt').push(Date.now());
	    //first get the current world pointer
	    fbDatabase.ref(game.world()+'/ptr').once('value',getWorldPtr);            
        };
	var getWorldPtr = function(snapshot){
	    _worldPtr = snapshot.val();
	    //we are going to be writing to the other buffer, so flip it.
	    if(_worldPtr === "a"){_worldPtr='b'}else{_worldPtr = 'a'}
	    //now get the current world state

	    //probably should pause processing of updates here.

	    var records = lDb.query(function(r){ return r.A || r.C || r.K });
	    //make a copy of each, to break the reference.
	    var recordsCopy=[];
	    records.forEach(function(r){ var cR = Object.assign({},r); recordsCopy.push(cR)});
	    
	    //unpause the update processing

	    //remove the old buffer
	    fbDatabase.ref(game.world()+'/world/'+_worldPtr).remove();
	    recordsCopy.forEach(function(r){
		updateWorldCoordinate(r,_worldPtr);
	    });
	    fbDatabase.ref(game.world()+'/world/'+_worldPtr+'/lastTransaction').set(lastTransaction);
	    fbDatabase.ref(game.world()+'/ptr').set(_worldPtr);
	    fbDatabase.ref(game.world()+'/updater').remove();
	    //clean up the update list
            var done =false;
            while(! done){
                if(keyList[0] === lastTransaction){
                    done = true;
                }else{
                    fbDatabase.ref(game.world()+'/updates/'+keyList[0]).remove();
                    keyList.shift();
                }
            }
	}
        var initModule = function (update, user, worldState){
            fbDatabase = firebase.database();

            globalUpdatesRef = fbDatabase.ref(update.location);
            processRecordCallback = update.callback;
        // TODO move to a startRead type functon that also does .startAt().on()..
        // for the initialization algorithm. for now
        // reading from the start is ok.
            //globalUpdatesRef.on('child_added', processRecord);

            usersRef = fbDatabase.ref(user.location);
            processUserCallback = user.callback;
            usersRef.on('child_added', processUser);

            worldStateLocation = worldState.location;
        };

  // writer functions
  // public
        var openTransaction = function (){
            transactionID = uuid();
            writeSeq = 0;
        };

        var closeTransaction = function (){
            var r = {};
            r.seq = writeSeq;
            r.tID = transactionID;
            r.count = writeSeq;
            globalUpdatesRef.push(r);
            _outgoingCount++;
        };
  // public
        var pushUpdate = function (r){
            _outgoingCount++;
            r.seq = writeSeq;
            r.tID = transactionID;
            r.count = 0;
            globalUpdatesRef.push(r);
            writeSeq++;
        };
  // end writer functions

	// reader functions
        var processRecord = function (snapshot){
	    // add this record to the transaction, or create one and add it.
	    // if the record is complete
	    // move the records in order to the output queue
	    // and remove it from the transaction obj
            _incomingCount++;
            var r = snapshot.val();
	    // console.log("processRecord");
	    //console.log(r);
            var tID = r.tID;
            var count = r.count;
            var seq = parseInt(r.seq);
	    var key = snapshot.key;
            keyList.push(key);
            if (!transactions.hasOwnProperty(tID)){
                transactions[tID] = {count: -1, recs: []};
            }
            if (count > 0){ transactions[tID]['count'] = count; }
            if (count == 0){
                transactions[tID]['recs'][seq] = r;
            }
	    // console.log("current length"+transactions[tID]['recs'].length+" expecting "+transactions[tID]['count']);
            if (transactions[tID]['recs'].length == transactions[tID]['count']){
		// console.log("output transaction "+tID);
		// $("#recieved").append("output transaction "+tID+"  count  "+transactions[tID]['count']+"<BR>");
                transactions[tID]['recs'].forEach(function (r){
                    delete r.tID;
                    delete r.count;
                    delete r.seq;
		    // printRecord(r)
                    processRecordCallback(r);
                });
		// $("#recieved").append("<BR>");
                delete transactions[tID];
		lastTransaction = key;
		if(_incomingCount > kTransactionsBetweenUpdates){_incomingCount=0; setTimeout(updateWorldState,1)}
            };
        };
        var processUser = function (snapshot){
            var r = snapshot.val();
            processUserCallback(r);
        };
        var pushUser = function (r){
            usersRef.push(r);
        };
        var updateWorldCoordinate = function (r,ptr){
            var hexID = r.hexID;
            fbDatabase.ref(worldStateLocation +'/'+ ptr + '/' + hexID).set(r);
        };
	var readUpdates = function(){
	    if(lastTransaction){
		globalUpdatesRef.orderByKey().startAt(lastTransaction).on('child_added', processRecord);
	    }else{
		globalUpdatesRef.orderByKey().on('child_added',processRecord);
	    }
	};
        var readWorld = function (processCallback){
	    processWorldCallback=processCallback;
	    //get the semaphore
	    console.log(worldStateLocation);
	    //first read the world pointer to find the valid world in the double buffering scheme
	    fbDatabase.ref(worldStateLocation+'/ptr').once('value',worldPtr);

        };
	var worldPtr = function(snapshot){
	    //the value could be null, if the ptr has not been set yet , we will check that next
	    _worldPtr = snapshot.val();
	    if(_worldPtr){
		fbDatabase.ref(worldStateLocation+'/'+_worldPtr).orderByKey().once('value', processReadWorld);
	    }else{
                //this will get run at the end of processReadWorld. this case is for when there is no world state
                //this happens only in the early minutes of the worlds existance. 
		readTerrain();
	    }
	};
        var processReadWorld = function (snapshot){
            var r = snapshot.val();
	    worldStateNumChildren = snapshot.numChildren();
	    //note the key "last" indicates the last transaction that is in the world
	    //unfortunately it must be lexagraphically sorted last under /world.
	    snapshot.forEach(processWorldHex);
        };
	var processWorldNode = function(snapshot){
	    worldStateNumChildren --;
	    if(snapshot.key === "last"){console.log("last "+snapshot.val()); lastTransaction = snapshot.val(); return ;}
            processWorldCallback(r);
	    if(worldStateNumChildren===0){
		readTerrain();
	    }
	};
        var readTerrain = function(){
            console.log("readTerrain");
            fbDatabase.ref(game.world()+'/terrain').limitToLast(10).once('value',terrain);
        };
        var terrain = function (snapshot){
            var numChildren = snapshot.numChildren();
            if(numChildren > 0 ){
                console.log("reading terrain");
                fbDatabase.ref(game.world()+'/terrain').on('child_added', processTerrain);
            }else{
                console.log("generating terrain");
                fbDatabase.ref(game.world()+'/terrain').on('child_added', processTerrain);
                for (var i = 0; i < 1800; i++){
                    var x = game.util.getRandomIntInclusive(0, 300);
                    var y = game.util.getRandomIntInclusive(0, 300);
                    var r = game.util.createRecord({hexID:x+"_"+y,M:game.util.getRandomIntInclusive(1,2)});
                    fbDatabase.ref(game.world()+'/terrain').push(r);
                }
            }
            readUpdates();
        };
        var processTerrain = function(s){
            var r =s.val();
            processRecordCallback(r);
        };
	var printRecord = function (r){
            var s = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

            s += ' &nbsp;&nbsp;&nbsp; UID ' + r['UID'];
            s += ' &nbsp;&nbsp;&nbsp; hexID ' + r['hexID'];
            s += ' &nbsp;&nbsp;&nbsp; A ' + r['A'];
            s += ' &nbsp;&nbsp;&nbsp; K ' + r['K'];

            s += '<BR>';
  //  $("#recieved").append(s);
        };
        return {
            initModule            : initModule,
            openTransaction       : openTransaction,
            pushUpdate            : pushUpdate,
            updateWorldCoordinate : updateWorldCoordinate,
            pushUser              : pushUser,
            readWorld             : readWorld,
	    readUpdates           : readUpdates,
            closeTransaction      : closeTransaction,
            bandwidth             : bandwidth,
	    tryUpdate             : tryUpdate,
	    setLDB                : setLDB
        };
    };
    return {
        create: create
    };
}());
