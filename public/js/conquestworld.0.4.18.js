/*
* module_template.js
* Template for browser feature modules
*
* Michael S. Mikowski - mike.mikowski@gmail.com
* Copyright (c) 2011-2012 Manning Publications Co.
*/

/*jslint         browser : true, continue : true,
devel  : true, indent  : 2,    maxerr   : 50,
newcap : true, nomen   : true, plusplus : true,
regexp : true, sloppy  : true, vars     : false,
white  : true
*/

/*global $, simpleDB */

simpleTable = (function () {
	'use strict';
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------

	//----------------- END MODULE SCOPE VARIABLES ---------------

	//------------------- BEGIN UTILITY METHODS ------------------
	// example : getTrimmedString
	//-------------------- END UTILITY METHODS -------------------

	var create = function(){
		var _count=0;
		var _storage={};
		var _indexFunctions=[];
		var _indexes=[];
		var key;
		var fields=[];
		var uniqueKey = function(k){key=k;};
		var Fields = function(f){
			fields=f;
		};
		var recordCount = function(){return _count;};
		var unique = function(r){if(!_storage.hasOwnProperty(r[key])){return true;}return false; };

		var verifyRecord = function(r){

			for(var i=0 ;i<fields.length;i++){
				//console.log("f:"+fields[i]);
				if (!r.hasOwnProperty(fields[i])){console.log("found missing field "+fields[i]); return false;}
			}
			return true;
		};
		var sumAllUniqueField = function (uniqueField,sumField){
			var uniqueKey={};
			var _uniqueField ;
			for(var k in _storage){
				_uniqueField=_storage[k][uniqueField];
				if(!uniqueKey.hasOwnProperty(_uniqueField)){
					uniqueKey[_uniqueField]=_storage[k][sumField];
				}
				else{
					uniqueKey[_uniqueField]+=_storage[k][sumField];
				}
			}
			return uniqueKey;
		};
		var testIndex = function(I,r){
			return I.f(r);
		};
	    var insert = function(r){
                //console.log("insert");
                //printRecord(r.hexID,r);
                var nr=Object.assign({},r);
		_count++;
		if (!verifyRecord(nr)){return false;}
		if(unique(r)){
		    //console.log("inserting a record");
		    _storage[nr[key]]=(nr);
		    _indexFunctions.forEach(function(I){
			if( testIndex(I,r)){
			    _indexes[I.n][nr[key]]=r;
			}
		    });
		    return true;
		}else
		{
		    return false;
		}
	    };
	    var insertOrUpdate = function(r){
		if(!insert(r)){
		    update(r);
		}
	    };
		var query = function(arg){
			var result=[];
			//console.log(compFunction);
			if(typeof(arg)==='function'){
				for(var k in _storage){
					if(arg(_storage[k])){
						result.push(_storage[k]);
					}
				}
				return result;

			}
			if( _storage.hasOwnProperty(arg[key])){
				result.push(_storage[arg[key]]);
			}
			return result;
		};

		var update = function(newR){
                  //  console.log("update");
                    
		    var currentR = _storage[newR[key]];
                    //printRecord(newR[key],currentR);
                    //printRecord(newR[key],newR);
			for(var k in newR){
				currentR[k]=newR[k];
			}
			_storage[newR[key]]=currentR;
			//update the indexes
			//the updated object may need to be
			//added or removed from the indexe
			//since the index holds unique records
			//we can add the record if it matches or needs
			//to be deleted regardless of whether it is
			//in the index or not.
			_indexFunctions.forEach(function(I){
				if( testIndex(I,currentR)){
					_indexes[I.n][currentR[key]]=currentR;
				}else{
					delete _indexes[I.n][currentR[key]];
				}
			});
		};
		var keyExists = function(k){
			return _storage.hasOwnProperty(k);
		}
	    var print = function(){
		//var string =JSON.stringify(_storage);
		//console.log("JSON string is "+string.length+" long");
		//var compressed = LZString.compressToUint8Array(string);
		//console.log("compressed is "+compressed.length+" long");
		for(var k in _storage){
                    if(_storage[k].UID){
			printRecord(k,_storage[k]);}
		};
	    }
		var printRecord = function(key,record){
			var s="record "+key+": ";
			for(var k in record){
				s= s+k+":"+record[k]+" ";
			}
			console.log(s);
		};
		var addIndex=function(I){
			console.log('index name is '+I.name);
			this[I.name]=function(){return Object.values(_indexes[I.name]);};
			_indexFunctions.push({n:I.name,f:I});
			//use a hash for the index, it will make updates easier.
			_indexes[I.name]={};
		}

		return {
		    insert : insert,
		    insertOrUpdate: insertOrUpdate,
		    query : query,
		    uniqueKey : uniqueKey,
		    Fields:Fields,
		    sumAllUniqueField : sumAllUniqueField,
		    recordCount : recordCount,
		    //remove : remove,
		    update : update,
		    keyExists : keyExists,
		    addIndex : addIndex,
		    print : print
		}
	};



	//------------------- BEGIN PUBLIC METHODS -------------------
	// Begin public method /configModule/
	// Purpose    : Adjust configuration of allowed keys
	// Arguments  : A map of settable keys and values
	//   * color_name - color to use
	// Settings   :
	//   * configMap.settable_map declares allowed keys
	// Returns    : true
	// Throws     : none
	//

	// return public methods
	return {
		create : create,

	};
	//------------------- END PUBLIC METHODS ---------------------
}());
/*
 * game.js
 * Root namegamece module
*/
/* global game, $ */
/* eslint semi:["error", "always"] , indent:["error",2] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

var game = (function() {
  "use strict";
  var _world = "dev";
  var _UID;
  var _visibility = false;
    var _debug = false;
    var help = "Guide <BR>" +
    "Movement keys q,w,e,a,s,d will move selected armies in the 6 directions.<BR>" +
    "arrow keys : Move a selected armies in 4 of the 6 directions.<BR>" +
    '1 : Build a city, cost starts at 100 gold, current cost is displayed in 100s. or click "C" button. or press c key.<BR>' +
    '2 : Build a wall, costs 500 gold. walls take 100 troops to breach or click "W" button.<BR>' +
    "3 : Toggle Trail. <BR>" +
    '4 : Enable Queen movement or click "Q" button.<BR>' +
    "escape : Clear all selected armies.<BR>" +
    "p : Send a radar ping and reveal all units within 100 hex. costs at least 1000.<BR>" +
    "x : Recenter the map on the Queen.<BR>" +
    "m : Drop a marker.<BR>" +
    "j : Jump to the next marker in a ring fashion.<BR>" +
      "r : recruit armies in your cities. cost is 1 gold per troop.<BR>" +
      "h: help<BR>"+
      "+- : zoom in and zoom out<BR>"+
    "Click to select  a tile.<BR>" +
    "Shift click and drag to select multiple armies.<BR>" +
        "Control click and drag to select multiple empty hexes.<BR>"+
        "legend :<BR>"+
        '<img src = "Queen.png"></img> Queen <BR>'+
        '<img src = "Wall.png"></img> Wall <BR>';
    
  var landingHtml = '<span id = "pname"><input type="text" name="playerName" id="playerName"></input>' +
    '<img id ="playButton" src="play.jpg">' +
      "<BR><BR><BR><BR><BR><BR>" +
      help+
    "</span> ";

    var modal ='<div class="help-modal" id="help">'+
        '<div class="help-content">'+ help +
        '</div></div>';
    
  var visibility = function() {
    return _visibility;
  };
  var world = function(w) {
    if (w) {
      _world = w;
      return _world;
    } else {
      return _world;
    }
  };

  var uid = function() {
    return _UID;
  };
  var printRecord = function(r) {
    var s = "record ";
    var k;
    for (k in r) {
      s = s + k + ":" + r[k] + " ";
    }
    return s;
  };
  var formatRecord = function(r) {
    var s;
    s = printRecord(r) +
      "<BR>";
    return s;
  };
  var debugTransactions = function(r) {
//      console.log(r);
      $("#debug_transactions").append(formatRecord(r));
  };
  
  var initGame = function() {
    var name;
    name = $("#playerName").val();
    //console.log(name);
    $("#pname").remove();
    $("#ConquestWorld").append(
      '<canvas id=\'GameBoard\' width="1200" height="600"></canvas>'
    );
    game.splash.launchSplash();
    game.drawLayer.initModule("#GameBoard");
      game.model.initModule(name);
      radio("help").subscribe(showHelp);
  };
    var showHelp = function(){
        $("#ConquestWorld").append(modal);

        $("#help").css('display','block');
        $("#help").on('click',closeHelp);
    };
    var closeHelp = function(){
        $("#help").css('display','none');
        $("#help").off('click',closeHelp);        
    };
    var initModule = function($container,addedNetworkDelay) {
        game.constant.kAddedNetworkDelay = addedNetworkDelay;
    _UID = game.util.getID();
    //     console.log("my UID is " + _UID);
    console.log("my better ID is " + _UID);
    $($container).html(landingHtml);
    $("#playButton").on("click", initGame);
    game.splash.initModule($container);
      radio('debug-transactions').subscribe(debugTransactions);
      radio("diff").subscribe(displayDiff);
  };

    var displayDiff = function(r){
        var s = printRecord(r);
        $("#diff").append(s+"<BR>");
    };
  return {
    initModule: initModule,
    world: world,
    uid: uid,
    visibility: visibility
  };
})();

game.constant={};
game.constant.kAddedNetworkDelay = 0;
game.constant.kPingCost = 5000;
game.constant.kPingRange = 100;
game.constant.kSpawnRange = 250;
/* global game,  */
/* eslint semi:["error", "always"] , indent:["error",2] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

game.util = (function() {
  var assert = function(b, m) {
    if (!b) {
      throw "Assert failed " + m;
    }
  };
  // Returns a random integer between min (included) and max (included)
  // Using Math.round() will give you a non-uniform distribution!
  var getRandomIntInclusive = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  var createRecord = function(keys) {
    var r = { UID: 0, hexID: "", K: 0, C: 0, W: 0, A: 0, S: 0, V: 0, M: 0 };
    assert(keys.hexID, "createRecord missing required field hexID");
    for (var k in keys) {
      if (k == "x" || k == "y") {
        throw "invalid key " + k + " at creatRecord";
      }
      r[k] = keys[k];
    }
    var id = keys.hexID;
    r.h = HexLib.idToHex(id);

    // console.log("createRecord ");
    // console.log(r);
    return r;
  };
  var printRecord = function(record) {
    var s = "record ";
    for (var k in record) {
      if (k === "h") {
        s = s +
          k +
          " {" +
          record[k].q +
          ", " +
          record[k].r +
          ", " +
          record[k].s +
          " } ";
      } else {
        s = s + k + " " + record[k] + " ";
      }
    }
    console.log(s);
  };
 var formatRecord = function(record){
     var s = "record ";
     for (var k in record) {
         if (k === "h") {
             s = s +
                 k +
                 " {" +
                 record[k].q +
                 ", " +
                 record[k].r +
                 ", " +
                 record[k].s +
                 " } ";
         } else {
             s = s + k + " " + record[k] + " ";
         }
     }
     return s;
    };
  var deflateRecord = function(r) {
    //remove all 0 fields
    //remove the h field , it can be recalculated from the hexID
    //remove S,V,Marked always
    delete r.S;
    delete r.V;
    delete r.Marker;
    delete r.Cursor;
    delete r.local;
    delete r.h;
    var keys = Object.keys(r);
    keys.forEach(function(i) {
      if (!r[i]) {
        delete r[i];
      }
    });
    return r;
  };
  var inflateRecord = function(r) {
    r.S = 0;
    r.V = 0;
    var h = HexLib.idToHex(r.hexID);

    r.h = h;

    if (!r.K) {
      r.K = 0;
    }
    if (!r.C) {
      r.C = 0;
    }
    if (!r.M) {
      r.M = 0;
    }
    if (!r.W) {
      r.W = 0;
    }
    if (!r.UID) {
      r.UID = 0;
    }
    if (!r.A) {
      r.A = 0;
    }

    return r;
  };

  var recordsEqual = function(a, b) {
    if (a.local) {
      if (a.S !== b.S) {
        return false;
      }
    }
    // a record is the same if
    if (a.A !== b.A) {
      return false;
    }
    if (a.C !== b.C) {
      return false;
    }
    if (a.W !== b.W) {
      return false;
    }
    if (a.K !== b.K) {
      return false;
    }
    if (a.M !== b.M) {
      return false;
    }
    return true;
  };
  var base64 = "0123456789abcdefghijklmnopqustuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
  var getID = function() {
    var array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    var idA = [];
    var id = "";
    for (let i = 0; i < 8; i++) {
      let r = array[i] % 64;
      idA.push(base64.substr(r, 1));
    }

    return id.concat(
      idA[0],
      idA[1],
      idA[2],
      idA[3],
      idA[4],
      idA[5],
      idA[6],
      idA[7]
    );
  };

  return {
    getRandomIntInclusive: getRandomIntInclusive,
    deflateRecord: deflateRecord,
    inflateRecord: inflateRecord,
    createRecord: createRecord,
      printRecord: printRecord,
      formatRecord:formatRecord,
    recordsEqual: recordsEqual,
    getID: getID
  };
})();

/* global game, $, radio  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

var remoteDatabase = (function() {
  "use strict";
  var create = function() {
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
    var transactionID = "";
    var processRecordCallback;
      var processUserCallback;
      var processDiffRecordCallback;
    var processWorldCallback;
    var leaderBoardCallback;
    var transactions = {};
    var outputQueue = [];
    var lastTransaction;
    var keyList = {};
    var lDb;
    var netWorker;
    //in ms
    var kMinTimeBetweenUpdates = 10000000;
    // the # of transactions between atempts update the worldstate
    //the random part is so that all the players don't try to update
    //at the same time.
    var kTransactionsBetweenUpdates = 10000000 +
      game.util.getRandomIntInclusive(500, 1000);
    // public
    var setLDB = function(ldb) {
      lDb = ldb;
    };
    var bandwidth = function() {
      return { I: _incomingCount, O: _outgoingCount };
    };

    var tryUpdate = function() {
      // Try to create a user for ada, but only if the user id 'ada' isn't
      // already taken
      //console.log("tryUpdate");
      //console.log(game.world());
      var updaterRef = fbDatabase.ref(game.world() + "/updater");

      updaterRef.transaction(
        function(currentData) {
          //console.log("current data "+currentData);
          if (currentData === null) {
            //console.log("here");
            return { name: game.uid() };
          } else {
            //console.log('someone alreay is updating');
            return; // Abort the transaction.
          }
        },
        function(error, committed, snapshot) {
          if (error) {
            //console.log('Transaction failed abnormally!', error);
          } else if (committed) {
            startUpdate();
          } else {
            //console.log('User ada added!');
          }
          //console.log("Ada's data: ", snapshot.val());
        }
      );
    };
    var updateWorldState = function() {
      tryUpdate(); //starts a chain of call backs
    };
    var startUpdate = function() {
      //console.log("starting update");
      //was 'child_added' but that is not called if there are not children causing no updates to happen
      fbDatabase
        .ref(game.world() + "/UpdatedAt")
        .orderByKey()
        .limitToLast(1)
        .once("value", function(s) {
          var lastUpdatedAt = s.val();
          //there may not have been an update yet
          if (lastUpdatedAt === null) {
            lastUpdatedAt = 0;
          } else {
            //updated is a list so get the last element.
            var numChildren = s.numChildren();
            //console.log("num children"+numChildren);
            s.forEach(function(c) {
              lastUpdatedAt = c.val();
            });
            //delete the list
            fbDatabase.ref(game.world() + "/UpdatedAt").remove();
          }
          //console.log("last updated at "+lastUpdatedAt);
          if (Date.now() - lastUpdatedAt > kMinTimeBetweenUpdates) {
            doUpdate();
          } else {
            //console.log("there was an update "+(Date.now() - lastUpdatedAt)+" ago, skipping");
            fbDatabase.ref(game.world() + "/updater").remove();
          }
        });
    };
    var doUpdate = function() {
      //console.log("do Update");
      fbDatabase.ref(game.world() + "/UpdatedAt").push(Date.now());
      //first get the current world pointer
      fbDatabase.ref(game.world() + "/ptr").once("value", getWorldPtr);
    };
    var getWorldPtr = function(snapshot) {
      //console.log("getWorldPtr");
      _worldPtr = snapshot.val();
      //we are going to be writing to the other buffer, so flip it.
      if (_worldPtr === null) {
        _worldPtr = "a";
      } else if (_worldPtr === "a") {
        _worldPtr = "b";
      } else {
        _worldPtr = "a";
      }
      //now get the current world state
      //probably should pause processing of updates here.
      var records = lDb.query(function(r) {
        return r.A || r.C || r.K;
      });
      //make a copy of each, to break the reference.
      //console.log("copy the db");
      var recordsCopy = [];
      records.forEach(function(r) {
        var cR = Object.assign({}, r);

        recordsCopy.push(cR);
      });

      //unpause the update processing
      //remove the old buffer
      fbDatabase.ref(game.world() + "/world/" + _worldPtr).remove();
      recordsCopy.forEach(function(r) {
        updateWorldCoordinate(r, _worldPtr);
      });
      fbDatabase
        .ref(game.world() + "/world/" + _worldPtr + "/lastTransaction")
        .set(lastTransaction);
      fbDatabase.ref(game.world() + "/ptr").set(_worldPtr);
      fbDatabase.ref(game.world() + "/updater").remove();
      //clean up the update list
      //var done =false;
      //while(! done){
      //    if(keyList[0] === lastTransaction){
      //        done = true;
      //    }else{
      //       fbDatabase.ref(game.world()+'/updates/'+keyList[0]).remove();
      //        keyList.shift();
      //    }
      //}
    };
      var initModule = function(update, user, worldState, leaderBoard,Diff) {
      fbDatabase = firebase.database();

      globalUpdatesRef = fbDatabase.ref(update.location);
      processRecordCallback = update.callback;
      // TODO move to a startRead type functon that also does .startAt().on()..
      // for the initialization algorithm. for now
      // reading from the start is ok.
      //globalUpdatesRef.on('child_added', processRecord);
      usersRef = fbDatabase.ref(user.location);
      processUserCallback = user.callback;
      usersRef.on("child_added", processUser);

      fbDatabase
        .ref(game.world() + "/pingRequest")
        .on("child_added", processPingRequest);
      worldStateLocation = worldState.location;
      netWorker = new Worker("js/updateWorker.0.4.18.js");
      netWorker.onmessage = processRecord;
      netWorker.postMessage({ data: game.world(), type: "world" });
      netWorker.postMessage({
        type: "networkDelay",
        data: game.constant.kAddedNetworkDelay
      });
      netWorker.postMessage({ type: "UID", data: game.uid() });
//      console.log(leaderBoard);
      leaderBoardCallback = leaderBoard.callback;
      fbDatabase
        .ref(leaderBoard.location)
        .on("child_added", processLeaderBoard);
      fbDatabase
        .ref(leaderBoard.location)
              .on("child_changed", processLeaderBoard);
          processDiffRecordCallback = Diff.callback;
    };

    var processLeaderBoard = function(s) {
      //console.log("processLeaderBoard");
      //console.log(s.key+"  "+s.val());
      var score = s.val();
      var uid = s.key;
      leaderBoardCallback({ UID: uid, score: score });
    };
    // writer functions
    // public
    var openTransaction = function() {
      //      transactionID = uuid();
      writeSeq = 0;
    };

    var closeTransaction = function() {
      return;
      var r = {};
      r.seq = writeSeq;
      r.tID = transactionID;
      r.count = writeSeq;
      globalUpdatesRef.push(r);
      _outgoingCount++;
    };
    // public
      var pushUpdate = function(r) {
      _outgoingCount++;
      //r.seq = writeSeq;
      //r.tID = transactionID;
      //r.count = 0;
      //console.log("pushupdate");
      //game.util.printRecord(r);
      radio("debug-transactions").broadcast({ f: "pushUpdate" });
      radio("debug-transactions").broadcast(r);
          var curr = lDb.query({hexID:r.hexID})[0];
          curr = Object.assign({},curr);
          var next = Object.assign({}, r);
          if(curr){
              curr = game.util.deflateRecord(curr);
          }
      next = game.util.deflateRecord(next);
      var localR = Object.assign({}, r);
      localR.local = 1;

      processRecordCallback(localR);
      next.AID = game.uid();
      var packet = { data: {curr:curr,next:next}, type: "record" };
      netWorker.postMessage(packet);
      writeSeq++;
    };
      var pushDiffUpdate = function(from, to) {
          return;
          var remoteTo , deflateTo;
          var remoteFrom = Object.assign({},from);
          if(to){
              remoteTo = Object.assign({},to);
              delete remoteTo.S;

          }else{
              remoteTo = null;
          }
          var localFrom = Object.assign({},from);

          localFrom.local = 1;
          processDiffRecordCallback(localFrom);
          if(to){
              var localTo   = Object.assign({},to);
              localTo.local = 1;
              processDiffRecordCallback(localTo);              
          }
          delete remoteFrom.S;
          var packet = { data : {from :remoteFrom,
                                 to: remoteTo},
                         type :'diffRecord'};
          netWorker.postMessage(packet);
    };
    // end writer functions
    var processRecord = function(r) {
      if (enableUpdateTrigger) {
        _incomingCount++;
      }
        var data= r.data;
      //game.util.printRecord(r.data);
        if(data.type === 'record'){
            processHexRecord(data.record);
        }else if(data.type === 'diff'){
            processDiffRecord(data.record);
            
        }
    };
      var processHexRecord = function(r){
      //game.util.printRecord(r.data);
        r = game.util.inflateRecord(r);
      if (r.AID === game.uid()) {
        return;
      }
      delete r.AID;
      //game.util.printRecord(r);
      radio("debug-transactions").broadcast({ f: "processRecord" });
      radio("debug-transactions").broadcast(r);
      processRecordCallback(Object.assign({}, r));
      };
      var processDiffRecord = function(r){
          if(r.UID !== game.uid()){
              processDiffRecordCallback(r);
          }
      };
    var insertSnapshot = function(s) {
      var r = s.val();
      lDb.insertOrUpdate(r);
    };

    var processUser = function(snapshot) {
      var r = snapshot.val();
      processUserCallback(r);
    };
    var pushUser = function(r) {
      usersRef.push(r);
    };
    var processTerrain = function(s) {
      var r = s.val();
      processRecordCallback(r);
    };
    var updateWorldCoordinate = function(r) {
      var hexID = r.hexID;
      var tr = Object.assign({}, r);
      tr = game.util.deflateRecord(r);
      delete tr.hexID;
      fbDatabase.ref(worldStateLocation + "/" + hexID).set(tr);
    };
    var updatePingList = function(r) {
      var h = Object.assign({}, r.h);
      h.UID = r.UID;
      fbDatabase.ref(game.world() + "/pingList/" + r.UID).set(h);
    };
    var pingOrigin;
    var getPingData = function(callback, h) {
      //this will get the queens for players who have left the game.
      pingOrigin = h;
      fbDatabase.ref(game.world() + "/pingList/").once("value", function(s) {
        parseQueenList(s);
      });
      //get rid of the old lists
      fbDatabase.ref(game.world() + "/pingRequest/" + game.uid()).remove();
      fbDatabase.ref(game.world() + "/" + game.uid()).off();
      fbDatabase.ref(game.world() + "/" + game.uid()).remove();
      //make a new request and listen for the responses.
      fbDatabase.ref(game.world() + "/pingRequest/" + game.uid()).set(h);
      fbDatabase
        .ref(game.world() + "/" + game.uid())
        .on("child_added", parsePingPoint);
    };
    var parseQueenList = function(s) {
      s.forEach(function(childS) {
        if (HexLib.hex_distance(childS.val(), pingOrigin) < 100) {
          sendPingPoint(childS.val());
        }
      });
    };
    var parsePingPoint = function(s) {
      var h = s.val();
      sendPingPoint(h);
    };
    var sendPingPoint = function(h) {
      var uid = h.UID;
      h = HexLib.hex_subtract(h, pingOrigin);
      h.UID = uid;
      radio("ping-data-point").broadcast(h);
    };
    var matchRange = function(r, h) {
      if (r.UID != 0) {
        var d = HexLib.hex_distance(h, r.h);
        return d < 100;
      }
      return false;
    };

    var processPingRequest = function(s) {
//      console.log("processPingRequest");
      var pingUID = s.key;
      var h = s.val();
      var records = lDb.query(function(r) {
        return matchRange(r, h);
      });
      var ref = fbDatabase.ref(game.world() + "/" + pingUID);
      records.forEach(function(r) {
        let h = Object.assign({}, r.h);
        h.UID = r.UID;
        ref.push(h);
      });
    };
    var readUpdates = function() {
      if (lastTransaction) {
        globalUpdatesRef
          .orderByKey()
          .startAt(lastTransaction)
          .on("child_added", processRecord);
      } else {
        globalUpdatesRef.orderByKey().on("child_added", processRecord);
      }
    };
    //vars for the join chain of events, will get hoisted.
    var joinCompleteCallback;
    var useInitCallback = false;
    var linkIndex = 0;
    var linkList = [];
    var initStartAt = { world: null, terrain: null, update: null };
    var numChildren = 0;
    var enableUpdateTrigger = false;
    //end vars for join chain of events
    var join = function(completeCallback) {
      //console.log("join");
      joinCompleteCallback = completeCallback;
      useInitCallback = true;
      //console.log(game.world()+"/ptr");
      fbDatabase.ref(game.world() + "/ptr").once("value", joinStart);
    };
    var joinStart = function(s) {
      //console.log("joinStart");
      if (s.val()) {
        // if the ptr is not there this will be null
        //console.log("found ptr :"+s.val());
        linkList = [
          {
            name: "world",
            path: "/world/" + s.val(),
            initCallback: insertSnapshot,
            liveCallback: null,
            lastTransaction: true,
            storeLastTransaction: "update"
          },
          {
            name: "terrain",
            path: "/terrain",
            initCallback: insertSnapshot,
            liveCallback: processTerrain,
            lastTransaction: false
          },
          {
            name: "update",
            path: "/updates",
            initCallback: processRecord,
            liveCallback: processRecord,
            lasttransaction: false
          }
        ];
      } else {
        //console.log("no ptr found, not loading a world");
        linkList = [
          {
            name: "terrain",
            path: "/terrain",
            initCallback: insertSnapshot,
            liveCallback: processTerrain,
            lastTransaction: false
          },
          {
            name: "update",
            path: "/updates",
            initCallback: processRecord,
            liveCallback: processRecord,
            lasttransaction: false
          }
        ];
      }
      linkIndex = 0;
      linkHead();
    };
    var linkHead = function() {
      //console.log("linkHead "+"linkIndex "+linkIndex);
      if (initStartAt[linkList[linkIndex].name]) {
        //console.log("linkHead start at "+initStartAt[linkList[linkIndex].name]);
        //console.log("path "+game.world()+linkList[linkIndex].path);
        fbDatabase
          .ref(game.world() + linkList[linkIndex].path)
          .orderByKey()
          .startAt(initStartAt[linkList[linkIndex].name])
          .once("value", linkHeadValid);
      } else {
        //console.log("linkHead start at begining");
        fbDatabase
          .ref(game.world() + linkList[linkIndex].path)
          .once("value", linkHeadValid);
      }
    };
    var linkHeadValid = function(s) {
      //console.log("linkHeadValid");
      //console.log("numChildren "+s.numChildren());
      if (s.val()) {
        numChildren = s.numChildren();
        s.forEach(listItem);
      } else {
        if (linkIndex === linkList.length - 1) {
          finalLink();
        } else {
          linkIndex++;
          linkHead();
        }
      }
    };
    var listItem = function(s) {
      //console.log("listItem");
      var r = s.val();
      //console.log(r);
      numChildren--;
      if (s.key === "lastTransaction" && linkList[linkIndex].lastTransaction) {
        initStartAt[linkList[linkIndex].storeLastTransaction] = s.val();
        keyList[s.val()] = true;
      } else {
        linkList[linkIndex].initCallback(s);
      }
      if (numChildren === 0) {
        linkList[linkIndex].liveStartAt = s.key;
        if (linkIndex === linkList.length - 1) {
          finalLink();
        } else {
          linkIndex++;
          linkHead();
        }
      }
    };
    var finalLink = function() {
      //console.log("finalLink");
      //console.log(linkList);
      //      linkList.forEach(function(l) {
      //       if (l.liveCallback) {
      //          if (l.liveStartAt) {
      //            //console.log("live start at with key "+ l.liveStartAt);
      //            fbDatabase
      //              .ref(game.world() + l.path)
      //              .orderByKey()
      //              .startAt(l.liveStartAt)
      //              .on("child_added", l.liveCallback);
      //          } else {
      //            //console.log("live start at begining");
      //            fbDatabase
      //              .ref(game.world() + l.path)
      //              .on("child_added", l.liveCallback);
      //          }
      //        }
      //      });
      usersRef.on("child_added", processUser);
      enableUpdateTrigger = true;
      useInitCallback = false;
      joinCompleteCallback();
    };

    var readWorld = function(processCallback) {
      processWorldCallback = processCallback;
      //console.log(worldStateLocation);
      //first read the world pointer to find the valid world in the double buffering scheme
      fbDatabase.ref(worldStateLocation + "/ptr").once("value", worldPtr);
    };
    var worldPtr = function(snapshot) {
      //the value could be null, if the ptr has not been set yet , we will check that next
      _worldPtr = snapshot.val();
      if (_worldPtr) {
        fbDatabase
          .ref(worldStateLocation + "/" + _worldPtr)
          .orderByKey()
          .once("value", processReadWorld);
      } else {
        //this will get run at the end of processReadWorld. this case is for when there is no world state
        //this happens only in the early minutes of the worlds existance.
        readTerrain();
      }
    };
    var processReadWorld = function(snapshot) {
      var r = snapshot.val();
      worldStateNumChildren = snapshot.numChildren();
      //note the key "last" indicates the last transaction that is in the world
      //unfortunately it must be lexagraphically sorted last under /world.
      snapshot.forEach(processWorldHex);
    };
    var processWorldNode = function(snapshot) {
      worldStateNumChildren--;
      if (snapshot.key === "last") {
        //console.log("last "+snapshot.val());
        lastTransaction = snapshot.val();
        return;
      }
      processWorldCallback(r);
      if (worldStateNumChildren === 0) {
        readTerrain();
      }
    };
    var readTerrain = function() {
      //console.log("readTerrain");
      fbDatabase
        .ref(game.world() + "/terrain")
        .limitToLast(10)
        .once("value", terrain);
    };
    var terrain = function(snapshot) {
      var numChildren = snapshot.numChildren();
      if (numChildren > 0) {
        //console.log("reading terrain");
        fbDatabase
          .ref(game.world() + "/terrain")
          .on("child_added", processTerrain);
      } else {
        //console.log("generating terrain");
        fbDatabase
          .ref(game.world() + "/terrain")
          .on("child_added", processTerrain);
        for (var i = 0; i < 1800; i++) {
          var x = game.util.pugetRandomIntInclusive(0, 300);
          var y = game.util.getRandomIntInclusive(0, 300);
          var r = game.util.createRecord({
            hexID: x + "_" + y,
            M: game.util.getRandomIntInclusive(1, 2)
          });
          fbDatabase.ref(game.world() + "/terrain").push(r);
        }
      }
      readUpdates();
    };
    var printRecord = function(r) {
      var s = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
      s += " &nbsp;&nbsp;&nbsp; UID " + r["UID"];
      s += " &nbsp;&nbsp;&nbsp; hexID " + r["hexID"];
      s += " &nbsp;&nbsp;&nbsp; A " + r["A"];
      s += " &nbsp;&nbsp;&nbsp; K " + r["K"];

      s += "<BR>";
      //  $("#recieved").append(s);
    };
    var updateLeaderBoard = function(update) {
      fbDatabase
        .ref(game.world() + "/leaderBoard/" + update.UID)
        .set(update.score);
    };
    return {
      initModule: initModule,
      openTransaction: openTransaction,
      pushUpdate: pushUpdate,
      pushDiffUpdate: pushDiffUpdate,
      updateWorldCoordinate: updateWorldCoordinate,
      updatePingList: updatePingList,
      getPingData: getPingData,
      pushUser: pushUser,
      readWorld: readWorld,
      readUpdates: readUpdates,
      closeTransaction: closeTransaction,
      bandwidth: bandwidth,
      tryUpdate: tryUpdate,
      setLDB: setLDB,
      updateLeaderBoard: updateLeaderBoard,
      join: join
    };
  };
  return { create: create };
})();

/* global game  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

database = (function(){
    "use strict";
    var localDb = simpleTable.create();
    localDb.uniqueKey('hexID');
    localDb.Fields(['hexID', 'h' , 'UID', 'K', 'C', 'W', 'A', 'S', 'V', 'M']);
    var updatesDb = simpleTable.create();
    updatesDb.uniqueKey('ID');
    updatesDb.Fields(['ID', 'date', 'r', 'seq', 'sendseq']);
    var remoteDb = remoteDatabase.create();
    remoteDb.setLDB(localDb);



    var addIndex = function(I){
	localDb.addIndex(I);
	this[I.name]=localDb[I.name];
    };

    var joinWorld = function(completeCallback){
        remoteDb.join(completeCallback);
    };
    
    return {
	insert            : localDb.insert,
	insertOrUpdate    : localDb.insertOrUpdate,
	query             : localDb.query,
	uniqueKey         : localDb.uniqueKey,
	Fields            : localDb.Fields,
	sumAllUniqueField : localDb.sumAllUniqueField,
	recordCount       : localDb.recordCount,
	update            : localDb.update,
	keyExists         : localDb.keyExists,
	addIndex          : addIndex,
        print             : localDb.print,

	initModule            : remoteDb.initModule,
        openTransaction       : remoteDb.openTransaction,
        pushUpdate            : remoteDb.pushUpdate,
        pushDiffUpdate        : remoteDb.pushDiffUpdate,
        updateWorldCoordinate : remoteDb.updateWorldCoordinate,
        updatePingList : remoteDb.updatePingList,
        getPingData : remoteDb.getPingData,
        pushUser              : remoteDb.pushUser,
        readWorld             : remoteDb.readWorld,
        closeTransaction      : remoteDb.closeTransaction,
        bandwidth             : remoteDb.bandwidth,
        updateLeaderBoard     : remoteDb.updateLeaderBoard,

	joinWorld : joinWorld
    }

}());
/* global game, $, radio , Image ,HexLib*/
/* eslint semi:["error", "always"] , indent:["error",2] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */
game.drawLayer = (function() {
  "use strict";
  // ---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var size = 15;
  var layout = HexLib.Layout(HexLib.layout_flat, { x: size, y: size }, {
    x: 0,
    y: 0
  });
  var canvasImage;
  var numberOfSides = 6;
  // Xcenter and Ycenter are in pixels
  // also it is actually the location of the
  // top left corner of the screen.
  var Xcenter = 0;
  var Ycenter = 0;
  var XcenterHex = 0;
  var YcenterHex = 0;
  var startXcenter;
  var startYcenter;
  var startXpoint = null;
  var startYpoint;
  var endPoint = {};
  var select;
  var r = size * Math.sqrt(3) / 2;
  var cxt;
  // must match with kPingRangeSquared in the model
  var kPingRange = game.constant.kPingRange;
  var boardWidth = 1200;
  var boardHeight = 600;
  var pingLayout = HexLib.Layout(HexLib.layout_flat, { x: .5, y: .5 }, {
    x: boardWidth - 200,
    y: boardHeight - 200
  });
  var pingFrameLayout;
  var boardWidthInHex = 52;
  var boardHeightInHex = 24;
  var cityCost = 1;
  var wallCost = 1;
  var pingBox = {};
  pingBox.x = 145;
  pingBox.y = 35;
  pingBox.width = 30;
  var city = {};
  city.x = 5;
  city.y = 35;
  city.width = 30;
  var wall = {};
  wall.x = 40;
  wall.y = 35;
  wall.width = 30;
  var trails = {};
  trails.x = 75;
  trails.y = 35;
  trails.width = 30;
  var queen = {};
  queen.x = 110;
  queen.y = 35;
  queen.width = 30;
  var leaderBoardArea = {};
  var messageArea = {};
  messageArea.x = 250;
  messageArea.y = 0;
  messageArea.width = 500;
  messageArea.height = 30;
  var controlArea = {};
  controlArea.x = 0;
  controlArea.y = 0;
  controlArea.width = 200;
  controlArea.height = 70;
  var pingArea = {};

  var queenOn = false;
  var trailsOn = false;
  var colorList = [
    "DeepPink",
    "MediumVioletRed",
    "DarkRed",
    "Orange",
    "Yellow",
    "Brown",
    "Blue",
    "LightBlue",
    "Aqua",
    "Green",
    "LimeGreen",
    "Purple"
  ];
  var colorMap = {};
  var currColor = 0;
  var beginPanX, beginPanY;
  var dontClick;
  var cachedGold = 0;
  var cachedCursor = { hexID: "0_0_0" };
  var UidToName = {};
  var cachedLeaderBoard = [
    { UID: "qwertyy", name: "12345678901234567890123", score: 10 },
    { UID: "asdfgfasdf", name: "jane", score: 9 },
    { UID: "zxcvbb", name: "sally", score: 8 },
    { UID: "jkl;;", name: "fitz", score: 7 },
    { UID: "uioppoip", name: "sandy", score: 6 }
  ];
  var keyQ = [];
  var keyInterval;
  var drawInterval;
  var pingImgData = [];
  var allowRecenter = false;
  var message;
  // ----------------- END MODULE SCOPE VARIABLES ---------------
  // ------------------- BEGIN UTILITY METHODS ------------------
  //  example : getTrimmedString
  // -------------------- END UTILITY METHODS -------------------
  // --------------------- BEGIN DOM METHODS --------------------
  //  End public method /configModule/
  var hPxToHex = function(px) {
    return Math.ceil(px / (size * 1.5));
    // var offset = $('#GameBoard').offset();
    // var hex =  Math.round((px - offset.left) / (3 * size));
    // return hex;
  };
  var vPxToHex = function(px) {
    return Math.ceil(px / (size * Math.sqrt(3)));
    //var offset = $('#GameBoard').offset();
    //var hex = Math.round((px - offset.top) / (2 * r));
    //return hex;
  };
  //  Begin public method /initModule/
  //  Purpose    : Initializes module
  //  Arguments  :
  //   * $container the jquery element used by this feature
  //  Returns    : true
  //  Throws     : none
  //
  var getColor = function(UID) {
    var color;

    if (colorMap.hasOwnProperty(UID)) {
      color = colorMap[UID];
    } else {
      color = colorList.shift();
      colorMap[UID] = color;
      colorList.push(color);
    }
    return color;
  };
  var initModule = function(playerName) {
    UidToName[game.uid()] = playerName;
    colorMap[game.uid()] = "red";
    cxt = document.getElementById("GameBoard").getContext("2d");
    console.log("window height " + $(window).height());
    console.log("window width " + $(window).width());
    boardWidth = window.innerWidth - 30;
    boardHeight = window.innerHeight - 30;
    pingFrameLayout = HexLib.Layout(HexLib.layout_flat, { x: 95, y: 95 }, {
      x: (-1) * (boardWidth - 95),
      y: (-1) * (boardHeight - Math.sqrt(3) * 95 / 2)
    });
    pingArea.x = boardWidth - 200;
    pingArea.y = boardHeight - 175;
    pingArea.width = 200;
    pingArea.height = 175;

    pingLayout.origin.x = boardWidth - 200;
    pingLayout.origin.y = boardHeight - 200;
    boardWidthInHex = hPxToHex(boardWidth);
    boardHeightInHex = vPxToHex(boardHeight);
    document.getElementById("GameBoard").width = boardWidth;
    document.getElementById("GameBoard").height = boardHeight;
    $("#GameBoard").on("click", resolveClick);
    $("#GameBoard").on("mousedown", beginPan);
    $("#GameBoard").on("mouseup", endPan);
    //  $(document).on("keypress" , resolveKey);
    $(document).on("keydown", resolveKey);
    radio("draw-hexagon").subscribe(drawHexagon);
    radio("draw-gold").subscribe(drawGold);
    radio("losing-message").subscribe(drawLosingMessage);
    radio("draw-leader-board").subscribe(drawLeaderBoard);
    radio("update-city-cost").subscribe(updateCityCost);
    radio("update-wall-cost").subscribe(updateWallCost);
    //radio("ping-data").subscribe(ping);
    radio("center-on-queen").subscribe(centerBoard);
    radio("message").subscribe(saveMessage);
    radio("ping-data-point").subscribe(pingDataPoint);
    radio("update-cursor").subscribe(updateCursor);
    pingImgData = [];
    // cxt.createImageData(kPingRange * 2, kPingRange * 2);
    //centerBoard(queenLocation);
    // allow 4 moves per second.
    keyInterval = setInterval(executeKey, 250);
    // $(window).bind('beforeunload' ,  function(){radio('debug-clear-fb').broadcast();});
    drawInterval = setInterval(
      function() {
        centerBoard(null, true);
      },
      100
    );
  };
  var updateCursor = function(r) {
    cachedCursor = r;
  };

  var centerBoardOnQueen = function() {
    var h = game.model.queenLocation();
    centerBoard(h, true);
  };
  var centerBoard = function(h, redraw) {
    //console.log("centerBoard");
    if (h) {
      var newCenter = HexLib.hex_to_pixel(layout, h);
      layout.origin.x = newCenter.x - boardWidth / 2;
      layout.origin.y = newCenter.y - boardHeight / 2;
    }
    //console.log(h);
    //console.log("boardWidth: "+boardWidth+" boardHeight "+boardHeight);
    //console.log(newCenter);
    //console.log(layout);
    //        Ycenter = (location.y - Math.floor(boardHeightInHex * 0.5)) * (size * Math.sqrt(3)) * -1;
    //        Xcenter = (location.x - Math.floor(boardWidthInHex * 0.5)) * (size * 1.5) * -1;
    //        XcenterHex = location.x - (boardWidthInHex / 2);
    //        YcenterHex = location.y - (boardHeightInHex / 2);
    if (redraw) {
      drawBoard();
      radio(
        "request-hex-in-square"
      ).broadcast({ x: layout.origin.x, y: layout.origin.y, width: boardWidth, height: boardHeight });
    }
  };
  // var ping = function(data) {
  //   pingImgData = data;
  //   console.log("ping");
  //        pingImgData =  cxt.createImageData(kPingRange*2 , kPingRange*2);
  //        var pd = pingImgData.data;
  // console.log(pingImgData.data.length);
  //   drawPingMap();
  // };
  var pingDataPoint = function(h) {
    console.log("pingDataPoint");
    console.log(h);
    pingImgData.push(h);
  };
  var drawPingPoint = function(d) {
    //    	console.log("drawPingPoint");
    //	console.log("q:"+d.q+" r:"+d.r+" s:"+d.s);
    var p = HexLib.hex_to_pixel(pingLayout, d);
    //	console.log("x:"+p.x+" y:"+p.y);
    cxt.save();
    cxt.fillStyle = getColor(d.UID);
    //    if (d.UID == game.uid()) {
    //      cxt.fillStyle = "red";
    //    } else {
    //      cxt.fillStyle = "green";
    //    }
    cxt.fillRect(
      Math.round(p.x + pingLayout.origin.x),
      Math.round(p.y + pingLayout.origin.y),
      2,
      2
    );
    cxt.restore();
  };
  var drawPingMap = function() {
    //console.log("drawPingMap");
    var pingCenter = HexLib.hex_to_pixel_windowed(
      pingFrameLayout,
      HexLib.Hex(0, 0, 0)
    );
    //console.log("PingCenter x:"+pingCenter.x+" y:"+pingCenter.y);
    pingLayout.origin = pingCenter;
    var c = HexLib.polygon_corners(pingFrameLayout, HexLib.Hex(0, 0, 0));
    cxt.save();
    cxt.beginPath();
    cxt.fillStyle = "white";
    c.forEach(function(v) {
      //console.log("x:"+v.x+" y:"+v.y);
      cxt.lineTo(v.x, v.y);
    });
    cxt.fill();
    pingImgData.forEach(function(d) {
      // console.log('point ' + d.x + ' ' + d.y);
      drawPingPoint(d);
    });
  };
  var drawLosingMessage = function() {
    //console.log('loosing message');
    cxt.clearRect(300, 150, 600, 300);

    var img = new Image();
    img.addEventListener("load", function() {
      cxt.drawImage(img, 200, 100);
      cxt.fillStyle = "black";
      cxt.font = "40px serif";
      cxt.fillText("You have died.", 400, 300);
    });
    img.src = "defeat.jpg";
    clearInterval(keyInterval);
  };
  //  End public method /initModule/
  var drawBoard = function() {
    cxt.clearRect(0, 0, boardWidth, boardHeight + 100);
    drawBoardFrame();
    drawBuildCity();
    drawBuildWall();
    drawMoveTrails();
    drawPing();
    drawQueen();
    drawMessage();
    drawGold(cachedGold);
    drawLeaderBoard(cachedLeaderBoard);
    drawPingMap();
    drawSelectionSquare();
  };
  var drawSelectionSquare = function() {
    if (startXpoint !== null) {
      cxt.save();
      cxt.strokeStyle = "white";
      cxt.strokeRect(
        startXpoint,
        startYpoint,
        Math.abs(startXpoint - endPoint.x),
        Math.abs(startYpoint - endPoint.y)
      );
      cxt.restore();
    }
  };
  var beginPan = function(e) {
    //console.log('beginPan');
    // how multiple select might work
    //console.log('shift key ' + e.shiftKey);
    //console.log('control key ' + e.ctrlKey);
    beginPanX = e.pageX;
    beginPanY = e.pageY;
    //console.log("beginx: "+beginPanX+" beginy: "+beginPanY);
    startXcenter = layout.origin.x;
    startYcenter = layout.origin.y;
    startXpoint = e.pageX;
    startYpoint = e.pageY;
    endPoint.x = e.pageX;
    endPoint.y = e.pageY;
    select = "none";
    if (e.shiftKey) {
      select = "shift";
    }
    if (e.ctrlKey) {
      select = "control";
    }
    canvasImage = cxt.getImageData(
      0,
      0,
      document.getElementById("GameBoard").width,
      document.getElementById("GameBoard").height
    );
    $("#GameBoard").on("mousemove", function(e) {
      pan(e, select);
    });
  };
  var pan = function(e, select) {
    //console.log(select);
    //console.log("pan");
    var diffX = beginPanX - e.pageX;
    // - beginPanX;
    var diffY = beginPanY - e.pageY;
    // - beginPanY;
    beginPanX = e.pageX;
    beginPanY = e.pageY;

    //console.log("pan X:"+diffX+" Y:"+diffY);
    //console.log("pan moved x: "+(startXpoint - e.pageX)+" y: "+(startYpoint- e.pageY));
    //console.log("beginx: "+beginPanX+" beginy: "+beginPanY);
    if (select === "none") {
      if (
        Math.abs(startXpoint - e.pageX) + Math.abs(startYpoint - e.pageY) < 3
      ) {
        return;
      }
      layout.origin.x += diffX;
      layout.origin.y += diffY;
      // drawBoard();
      // multiply by negative 1 ,  because the x and y center points
      // are how far the window has moved ,  so when you drag the
      // the window right ,  increasing xcenter ,  you are showing
      // board to the left ( lower x values)
      YcenterHex = vPxToHex(Ycenter) * (-1);
      XcenterHex = hPxToHex(Xcenter) * (-1);
      // console.log("Xcenter "+ Xcenter + " Ycenter "+Ycenter);
      radio(
        "request-hex-in-square"
      ).broadcast({ x: layout.origin.x, y: layout.origin.y, width: boardWidth, height: boardHeight, select: "none" });
    } else {
      cxt.putImageData(canvasImage, 0, 0);
      cxt.strokeStyle = "white";
      endPoint.x = e.pageX;
      endPoint.y = e.pageY;
      cxt.strokeRect(
        startXpoint,
        startYpoint,
        Math.abs(startXpoint - e.pageX),
        Math.abs(startYpoint - e.pageY)
      );
    }
  };

  var endPan = function(e) {
    //console.log("endpan");
    if (
      Math.abs(startXcenter - layout.origin.x) > 3 ||
        Math.abs(startYcenter - layout.origin.y) > 3
    ) {
      dontClick = true;
    }
    $("#GameBoard").off("mousemove");
    if (select === "shift" || select === "control") {
      cxt.putImageData(canvasImage, 0, 0);
      radio(
        "request-hex-in-square"
      ).broadcast({ x: startXpoint + layout.origin.x, y: startYpoint + layout.origin.y, width: Math.abs(startXpoint - e.pageX), height: Math.abs(startYpoint - e.pageY), select: select });
      startXpoint = null;
    }
  };

  // executeKey is called when the moveRate interval
  // timer expires.
  var executeKey = function(e) {
    if (keyQ.length === 0) {
      return;
    }
    console.log("execute kepress");
    var key = keyQ.shift();
    if (key === "w") {
      radio("move").broadcast("north");
    }
    if (key === "s") {
      radio("move").broadcast("south");
    }
    if (key === "a") {
      radio("move").broadcast("west");
    }
    if (key === "d") {
      radio("move").broadcast("east");
    }
    if (key === "q") {
      radio("move").broadcast("up");
    }
    if (key === "e") {
      radio("move").broadcast("down");
    }
  };
  var resolveKey = function(e) {
    //  console.log("kepress :"+e.key);
    console.log("e : " + e.which);
    if (e.key === "W" || e.key === "w" || e.which === 38) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("north");
        } else {
          keyQ.push("w");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "S" || e.key === "s" || e.which === 40) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("south");
        } else {
          keyQ.push("s");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "A" || e.key === "a" || e.which === 37) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("west");
        } else {
          keyQ.push("a");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "D" || e.key === "d") {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("east");
        } else {
          keyQ.push("d");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "Q" || e.key === "q") {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("up");
        } else {
          keyQ.push("q");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "E" || e.key === "e" || e.which === 39) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("down");
        } else {
          keyQ.push("e");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "1") {
      buildCity();
      return;
    }
    if (e.key === "2") {
      buildWall();
      return;
    }
    if (e.key === "3") {
      toggleTrails();
      return;
    }
    if (e.key === "4") {
      toggleQueen();
      return;
    }
    if (e.key === "C" || e.key === "c") {
      buildCity();
      return;
    }
    if (e.key === "Escape") {
      radio("clear-selection").broadcast();
      return;
    }
    if (e.key === "X" || e.key === "x") {
      centerBoardOnQueen();
      return;
    }
    if (e.key === "P" || e.key === "p") {
      if (cachedGold > game.constant.kPingCost) {
        pingImgData = [];
      }
      radio("ping").broadcast();
      return;
    }
    if (e.key === "M" || e.key === "m") {
      radio("toggle-marker").broadcast();
      return;
    }
    if (e.key === "j" || e.key === "j") {
      radio("jump-next-marker").broadcast();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      radio("recruit-troops").broadcast();
      return;
    }
    if (e.key === "h" || e.key === "H") {
      radio("help").broadcast();
      return;
    }
    if (e.key === "+") {
      if (layout.size.x < 25) {
        layout.size.x++;
        layout.size.y++;
      }
    }
    if (e.key === "-") {
      if (layout.size.x > 5) {
        layout.size.x--;
        layout.size.y--;
      }
    }
    // debug keystrokes
    if (e.key === ";") {
      radio("dump-database").broadcast();
      return;
    }
    if (e.key === ".") {
      radio("stop-updates").broadcast();
      return;
    }
    if (e.key === "/") {
      radio("dump-transactions").broadcast();
      return;
    }
    if (e.shiftKey) {
      return;
    }
    if (e.ctrlKey) {
      return;
    }
    e.preventDefault();
    radio("message").broadcast("unknown key pressed : " + e.key);
  };
  var resolveClick = function(e) {
    if (dontClick) {
      dontClick = false;
      return;
    }
    var canvasCords = {};
    var offset = $("#GameBoard").offset();
    canvasCords.x = e.pageX - offset.left;
    canvasCords.y = e.pageY - offset.top;
    // console.log("e x:"+e.pageX+" y:"+e.pageY+"o x:"+offset.left+" y:"+offset.top);
    // the controls are window/canvas relative ,  so don't translate them to
    // the board.
    if (
      canvasCords.x > city.x &&
        canvasCords.x < city.x + city.width &&
        canvasCords.y > city.y &&
        canvasCords.y < city.y + city.width
    ) {
      buildCity();
      return;
    }
    if (
      canvasCords.x > wall.x &&
        canvasCords.x < wall.x + wall.width &&
        canvasCords.y > wall.y &&
        canvasCords.y < wall.y + wall.width
    ) {
      buildWall();
      return;
    }
    if (
      canvasCords.x > trails.x &&
        canvasCords.x < trails.x + trails.width &&
        canvasCords.y > trails.y &&
        canvasCords.y < trails.y + trails.width
    ) {
      toggleTrails();
      return;
    }
    if (
      canvasCords.x > queen.x &&
        canvasCords.x < queen.x + queen.width &&
        canvasCords.y > queen.y &&
        canvasCords.y < queen.y + queen.width
    ) {
      toggleQueen();
      return;
    }
    if (
      canvasCords.x > pingBox.x &&
        canvasCords.x < pingBox.x + pingBox.width &&
        canvasCords.y > pingBox.y &&
        canvasCords.y < pingBox.y + pingBox.width
    ) {
      radio("ping").broadcast();
      return;
    }
    var translatedE = {};
    var h = findHex(e);
    console.log("find hex : " + HexLib.hexToId(h));

    radio("toggle-selection").broadcast({ hexID: HexLib.hexToId(h) });
  };
  var buildCity = function() {
    radio("build-city").broadcast();
  };
  var updateCityCost = function(v) {
    console.log("update city cost v:" + v);
    cityCost = v / 100;
    drawBuildCity();
  };
  var updateWallCost = function(v) {
    console.log("update wall cost v:" + v);
    wallCost = v / 100;
    drawBuildWall();
  };
  var buildWall = function() {
    radio("build-wall").broadcast();
  };
  var toggleTrails = function() {
    trailsOn = !trailsOn;
    drawMoveTrails();
    radio("toggle-trails").broadcast(trailsOn);
  };
  var toggleQueen = function() {
    queenOn = !queenOn;
    drawQueen();
    radio("toggle-queen").broadcast(queenOn);
  };
  var drawPing = function() {
    cxt.clearRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
    cxt.strokeStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
    cxt.fillText("P", pingBox.x + 7, pingBox.y + pingBox.width - 8);
  };
  var drawBuildCity = function() {
    cxt.clearRect(city.x, city.y, city.width, city.width);
    cxt.strokeStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(city.x, city.y, city.width, city.width);
    cxt.strokeText("C", city.x + 7, city.y + city.width - 12);
    cxt.font = "10px san-serif";
    cxt.fillText(cityCost, city.x + 2, city.y + city.width - 3);
  };
  var drawBuildWall = function() {
    cxt.clearRect(wall.x, wall.y, wall.width, wall.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(wall.x, wall.y, wall.width, wall.width);
    cxt.fillText("W", wall.x + 7, wall.y + wall.width - 12);
    cxt.font = "10px san-serif";
    cxt.fillText(wallCost, wall.x + 7, wall.y + wall.width - 3);
  };

  var drawMoveTrails = function() {
    cxt.clearRect(trails.x, trails.y, trails.width, trails.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";

    if (trailsOn) {
      cxt.filStyle = "grey";
      cxt.fillRect(trails.x, trails.y, trails.width, trails.width);
      cxt.fillStyle = "white";
    } else {
      cxt.strokeStyle = "black";
      cxt.strokeRect(trails.x, trails.y, trails.width, trails.width);
      cxt.fillStyle = "black";
    }
    cxt.fillText("T", trails.x + 7, trails.y + trails.width - 8);
  };
  var drawQueen = function() {
    cxt.clearRect(queen.x, queen.y, queen.width, queen.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";

    if (queenOn) {
      cxt.filStyle = "grey";
      cxt.fillRect(queen.x, queen.y, queen.width, queen.width);
      cxt.fillStyle = "white";
    } else {
      cxt.strokeStyle = "black";
      cxt.strokeRect(queen.x, queen.y, queen.width, queen.width);
      cxt.fillStyle = "black";
    }
    cxt.fillText("Q", queen.x + 7, queen.y + queen.width - 8);
  };

   var drawStar = function(cx,cy,spikes,outerRadius,innerRadius){
       var rot=Math.PI/2*3;
       var x=cx;
       var y=cy;
       var step=Math.PI/spikes;
       
       cxt.beginPath();
       cxt.moveTo(cx,cy-outerRadius);
       for(let i=0;i<spikes;i++){
           x=cx+Math.cos(rot)*outerRadius;
           y=cy+Math.sin(rot)*outerRadius;
           cxt.lineTo(x,y);
           rot+=step;
           
           x=cx+Math.cos(rot)*innerRadius;
           y=cy+Math.sin(rot)*innerRadius;
           cxt.lineTo(x,y);
           rot+=step;
       }
       cxt.lineTo(cx,cy-outerRadius);
       cxt.closePath();
       cxt.lineWidth=5;
       cxt.strokeStyle='black';
       cxt.stroke();
       cxt.fillStyle='black';
      // cxt.fill();
   };
    
  var drawLeaderBoard = function(data) {
    cxt.save();
    cachedLeaderBoard = data;
    // map uid to names here.
    // cachedLeaderBoard.forEach(function(r){r.name = data.p[r.UID]});
    // console.log(cachedLeaderBoard);
    //TODO move this out of the function.
    var leaderWidth = 300;
    var leaderHeight = 100;
    var topLeft = {};
    topLeft.x = boardWidth - leaderWidth;
    var nameHeight = leaderHeight / 5;
    var nameWidth = 200;
    var scoreWidth = leaderWidth - nameWidth;
    var color;
    topLeft.y = 0;
    leaderBoardArea.x = topLeft.x;
    leaderBoardArea.y = topLeft.y;
    leaderBoardArea.width = 300;
    leaderBoardArea.height = 100;
    /////////////////
    cxt.font = "17px serif";
    cxt.fillStyle = "black";
    cxt.strokeStyle = "black";
    cxt.clearRect(topLeft.x, topLeft.y, leaderWidth, leaderHeight);
    for (var i = 0; i < cachedLeaderBoard.length; i++) {
      cxt.strokeRect(
        topLeft.x,
        topLeft.y + nameHeight * i,
        nameWidth,
        nameHeight
      );
      cxt.strokeRect(
        topLeft.x + nameWidth,
        topLeft.y + nameHeight * i,
        scoreWidth,
        nameHeight
      );
      color = getColor(cachedLeaderBoard[i].UID);
      cxt.fillStyle = color;
      cxt.beginPath();
      cxt.arc(
        topLeft.x + 10,
        topLeft.y + nameHeight * i + 10,
        5,
        0,
        Math.PI * 2,
        false
      );
      cxt.fill();
      cxt.fillStyle = "black";
      cxt.fillText(
        cachedLeaderBoard[i].name.substr(0, 23),
        topLeft.x + 20,
        topLeft.y + nameHeight * i + nameHeight - 5
      );
      cxt.fillText(
        cachedLeaderBoard[i].score,
        topLeft.x + nameWidth + 4,
        topLeft.y + nameHeight * i + nameHeight - 5
      );
    }
    cxt.restore();
  };
  var drawGold = function(gold) {
    cxt.save();
    cachedGold = gold;
    cxt.clearRect(0, 0, 200, 30);
    cxt.strokeStyle = "black";
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(0, 0, 200, 30);
    cxt.fillText("gold : " + gold, 5, 20);
    cxt.restore();
    // drawBuildCity();
    // drawBuildWall();
    // drawMoveTrails();
    // drawQueen();
    //drawPing();
  };
  var onScreen = function(record) {
    //console.log("onScreen origin x:"+layout.origin.x+ " y:"+layout.origin.y);
    var h = record.h;
    var point = HexLib.hex_to_pixel(layout, h);
    //console.log("hex center x:" + point.x + " y:"+point.y);
    if (
      point.x > layout.origin.x &&
        point.x < layout.origin.x + boardWidth &&
        point.y > layout.origin.y &&
        point.y < layout.origin.y + boardHeight
    ) {
      return true;
    }
    return false;
  };

  var distanceToEdge = function(record) {
    var h = record.h;
    var point = HexLib.hex_to_pixel(layout, h);
    var windowPoint = {
      x: point.x - layout.origin.x,
      y: point.y - layout.origin.y
    };
    var northEdge = 0;
    var southEdge = boardHeight;
    var westEdge = 0;
    var eastEdge = boardWidth;
    var dNorth = windowPoint.y / (Math.sqrt(3) / 2 * layout.size.y);
    var dSouth = (southEdge - windowPoint.y) /
      (Math.sqrt(3) / 2 * layout.size.y);
    var dEast = windowPoint.x / (layout.size.x * 2);
    var dWest = (boardWidth - windowPoint.x) / (layout.size.x * 2);
    //    console.log("at : "+windowPoint.x+"  "+windowPoint.y);
    //    console.log("origin : "+layout.origin.x+" "+layout.origin.y);
    //    console.log("dN:"+dNorth+" dS:"+dSouth+" dE:"+dEast+" dW:"+dWest);
    //    console.log("min distance is :"+ Math.min(dNorth, dSouth, dEast, dWest));
    return Math.min(dNorth, dSouth, dEast, dWest);
  };

  // this is the main entry point from the model.
  var drawHexagon = function(record) {
    //console.log("drawHexagon - id:"+record.hexID+" s:"+record.S+" v:"+record.V);
    //
    //game.util.printRecord(record);
    cxt.save();
    //cxt.globalCompositeOperation="destination-over";
    var color;
    if (!onScreen(record)) {
      return;
    }
    if (!record.V && !game.visibility()) {
      drawHexagonBackground(record.h, "black");
      return;
    }
    //don't draw over the leaderboard etc ...
    if (overlap(record.h, leaderBoardArea)) {
      return;
    }
    if (overlap(record.h, messageArea)) {
      return;
    }
    if (overlap(record.h, controlArea)) {
      return;
    }
    if (overlap(record.h, pingArea)) {
      return;
    }
    // console.log("Xcenter "+XcenterHex+ " Ycenter "+YcenterHex);
    // console.log("recordx "+record.x+" recordY "+record.y);
    // console.log("--------");
    if (record.UID === game.uid()) {
      // if the selected hex gets near the edge, and we are allowed
      // to recenter, and if we are selected.
      if (record.hexID === cachedCursor.hexID) {
        if (distanceToEdge(record) < 2 && allowRecenter) {
          allowRecenter = false;
          //console.log("Recentering");
          centerBoard(record.h, true);
          return;
        }
      }
    }
    if (record.UID !== 0) {
      // console.log("drawbackground");
      // look up the uid and get its color ,  or assign it if this
      // is a new uid
      color = getColor(record.UID);
    } else {
      color = "white";
    }
    if (record.S) {
      color = "pink";
    }
    drawHexagonBackground(record.h, color);

    //if (record.S === 1) {
    //  color = "red";
    //} else {
    //  color = "black";
    //}
    drawHexagonFrame(record.h, "black");
    var point = HexLib.hex_to_pixel_windowed(layout, record.h);
    cxt.font = "22px serif";
      if (record.K) {
          cxt.save();
          drawStar(point.x,point.y,5,layout.size.x,5);
          cxt.restore();
    }
    if (record.C) {
      cxt.strokeStyle = "grey";
      cxt.strokeText("C", point.x - 8, point.y + 7);
    }
    if (record.W) {
      cxt.save();
      drawHexagonBackground(record.h, "black");
      drawHexagonBackground(record.h, color, 0.7);
      //cxt.font = "18px serif";
      //cxt.fillStyle = "black";
      //cxt.fillText("W", point.x - 8, point.y + 2);
      //cxt.font = "10px serif";
      //cxt.fillText(record.W, point.x - 8, point.y + 9);
      cxt.restore();
    }
    if (record.M) {
      drawTerain(record.M, record.h);
    }
    if (record.A) {
        cxt.font = "12px san-serif";
        if(record.K){
            cxt.fillStyle='white';
        }else{
            cxt.fillStyle = "black";
        }
      cxt.fillText(record.A, point.x - 8, point.y + 7);
    }
    if (record.Marker) {
      cxt.font = "12px san-serif";
      cxt.fillStyle = "black";
      cxt.fillText("F", point.x - 8, point.y + 7);
    }
    if (record.hexID === cachedCursor.hexID) {
      drawCursor(record.h);
    }
    cxt.restore();
  };
  var drawCursor = function(h) {
    var point = HexLib.hex_to_pixel_windowed(layout, h);
    cxt.save();
    cxt.strokeStyle = "green";
    cxt.arc(point.x, point.y, layout.size.x * 0.75, 0, Math.PI * 2, false);
    cxt.stroke();
    cxt.restore();
  };
  var drawTerain = function(type, h) {
    var point = HexLib.hex_to_pixel_windowed(layout, h);
    if (type === 1) {
      cxt.beginPath();
      cxt.moveTo(point.x - 7, point.y + 7);
      cxt.lineTo(point.x, point.y - 7);
      cxt.lineTo(point.x + 7, point.y + 7);
      cxt.stroke();
    } else {
      drawHexagonBackground(h, "blue");
    }
  };
  var drawHexagonBackground = function(h, color, scale) {
    //console.log("drawHexagonBackground");
    if (!scale) {
      scale = 1;
    }
    cxt.fillStyle = color;
    cxt.lineWidth = 1;
    cxt.beginPath();

    var corners = HexLib.polygon_corners(layout, h, scale);
    corners.forEach(function(c) {
      cxt.lineTo(c.x, c.y);
    });
    cxt.fill();
    //  uncommnent to show where the center of the hexagon is.
    // cxt.beginPath();
    // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
    // cxt.stroke();
  };

  // drawHexagonbackground
  var drawHexagonFrame = function(h, color) {
    // console.log("xc: "+Xcenter+" yc: "+Ycenter+" "+color);
    cxt.beginPath();
    var corners = HexLib.polygon_corners(layout, h);
    corners.forEach(function(c) {
      cxt.lineTo(c.x, c.y);
    });
    cxt.closePath();
    cxt.strokeStyle = color;
    cxt.lineWidth = 1;
    cxt.stroke();
    //  uncommnent to show where the center of the hexagon is.
    // cxt.beginPath();
    // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
    // cxt.stroke();
  };

  // drawHexagonFrame
  var distance = function(x1, y1, x2, y2) {
    var d;
    var x = x1 - x2;
    var y = y1 - y2;
    // console.log("dist "+x1+" "+x2+" "+y1+" "+y2+" "+x+" "+y);
    d = Math.sqrt(x * x + y * y);
    return d;
  };

  // distance
  var drawBoardFrame = function() {
    if (!game.visibility()) {
      cxt.fillStyle = "black";
      cxt.fillRect(0, 0, boardWidth, boardHeight);
    }
    return;
    ////// unreachable !!!!
    var yStepStart = Math.ceil(Ycenter / (size * Math.sqrt(3))) * (-1);
    var xStepStart = Math.ceil(Xcenter / (size * 3)) * (-1);

    for (var ystep = yStepStart; ystep < 24 + yStepStart; ystep++) {
      for (var xstep = xStepStart; xstep < 28 + xStepStart; xstep++) {
        drawHexagonFrame(
          Xcenter + 3 * xstep * size,
          Ycenter + Math.sqrt(3) * size * ystep,
          size,
          "black"
        );
      }
    }
    for (ystep = yStepStart; ystep < 24 + yStepStart; ystep++) {
      for (xstep = xStepStart; xstep < 28 + xStepStart; xstep++) {
        drawHexagonFrame(
          Xcenter + r * Math.sqrt(3) * xstep * 2 + r * Math.sqrt(3),
          Ycenter + r * ystep * 2 + r,
          size,
          "black"
        );
      }
    }
  };

  var saveMessage = function(m) {
    message = m;
  };
  var drawMessage = function() {
    cxt.save();
    cxt.clearRect(250, 0, 500, 30);
    cxt.strokeStyle = "black";
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(0, 0, 250, 30);
    cxt.fillText(message, 255, 20);
    cxt.restore();
  };
  var overlap = function(h, area) {
    var p = HexLib.hex_to_pixel_windowed(layout, h);
    if (
      p.x > area.x &&
        p.x < area.x + area.width &&
        p.y > area.y &&
        p.y < area.y + area.height
    ) {
      return true;
    }
    return false;
  };
  var overlapHex = function(h, area) {
    var p = HexLib.hex_to_pixel_windowed(layout, h);
    var c = HexLib.hex_to_pixel_windowed(pingFrameLayout, HexLib.Hex(0, 0, 0));
    var d = Math.sqrt(Math.pow(p.x - c.x, 2) - Math.pow(p.y - c.y, 2));
    console.log(p);
    console.log(c);
    console.log(d);
    if (d < area.r) {
      return true;
    }
    return false;
  };
  var findHex = function(e) {
    var offset = $("#GameBoard").offset();
    var found = false;
    var translatedE = {};
    translatedE.x = e.pageX - offset.left + layout.origin.x;
    translatedE.y = e.pageY - offset.top + layout.origin.y;
    var h = HexLib.hex_round(HexLib.pixel_to_hex(layout, translatedE));

    return h;
  };
  // findHex
  //  return public methods
  return { initModule: initModule, layout: layout };
  // ------------------- END PUBLIC METHODS ---------------------
})();

/* global game, $, radio , Image */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

 game.splash = (function (){
     'use strict';
     var splashImage;
     var sCanvas;
     var displayTimer;
     var displayCount = 0;
     var modalHtml = '<div id="myModal" class="modal">' +
                  '<div class="modal-content">' +
                  '<canvas id="splashScreen"></canvas>' +
                  '</div>' +
                  '</div>';

     var initModule = function (container){
         radio('launch-complete').subscribe(landSplash);
         $(container).append(modalHtml);

         sCanvas = document.getElementById('splashScreen').getContext('2d');
         splashImage = new Image();
         splashImage.src = 'splash.jpg';
     };
     var launchSplash = function (){
         console.log("launch splash");
         sCanvas.canvas.height = 400;
         sCanvas.canvas.width = 600;
         sCanvas.drawImage(splashImage, 0, 0);
         sCanvas.fillStyle = 'black';
         sCanvas.font = '40px serif';
         sCanvas.fillText('Splash Screen Here ', 200, 300);
         $('#myModal').css({'display': 'block'});
         displayTimer = setInterval(updateSplash, 100);
     };
     var landSplash = function (){
         // set a min time for the splash screen display
         if (displayCount > 25){
             console.log('land splash');
             $('#myModal').css({'display': 'none'});
             clearInterval(displayTimer);
         } else { setTimeout(landSplash, 1000); }
     };
     var updateSplash = function (){
         displayCount++;
         // console.log('display count ' + displayCount);
         var xStart = (displayCount % 15) * 40;
         if ((displayCount % 15) === 0){
             //console.log('clear run');
             sCanvas.clearRect(5, 375, 595, 10);
         }
         if(displayCount > 25){landSplash();}
         sCanvas.fillStyle = 'black';
         sCanvas.fillRect(xStart, 375, 35, 10);
     };
     return { initModule   : initModule,
              launchSplash : launchSplash
     };
 }());
/* global game, radio  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

game.model = (function() {
  "use strict";
  // ---------------- BEGIN MODULE SCOPE VARIABLES --------------
  //  var db = simpleTable.create();
  //  db.uniqueKey('hexID');
  //  db.Fields(['hexID', 'x', 'y', 'UID', 'K', 'C', 'W', 'A', 'S', 'V', 'M']);
  //  var updatesDb = simpleTable.create();
  //  updatesDb.uniqueKey('ID');
  //  updatesDb.Fields(['ID', 'date', 'r', 'seq', 'sendseq']);
  //  var rDB=remoteDatabase.create();
  //     // database filter functions
  var rDB = database;
  var db = database;
  var markerRing = [];
  var matchSelected = function(r) {
    return r.S;
  };
  var matchSelectedArmies = function(r) {
    return r.S && r.UID == game.uid() && r.A;
  };
  var matchSelectedCities = function(r) {
    return r.S && r.UID == game.uid() && (r.C || r.K);
  };
  var matchTroopSites = function(r) {
    return (r.K || r.C) && r.UID == game.uid();
  };
  var myHex = function(r) {
    return r.UID == game.uid() && !r.W;
  };
  var matchQueen = function(r) {
    return r.K && r.UID == game.uid();
  };
  var decaySites = function(r) {
    return r.UID !== game.uid() && r.V;
  };
  var matchGeography = function(r, square) {
    var h;
    var p;
    if (r.V) {
      p = HexLib.hex_to_pixel(game.drawLayer.layout, r.h);
      if (
        square.x <= p.x &&
          p.x <= square.x + square.width &&
          square.y <= p.y &&
          p.y <= square.y + square.height
      ) {
        return true;
      }
    }
    return false;
  };
  var matchCities = function(r) {
    return r.UID == game.uid() && r.C > 0;
  };
  db.addIndex(matchQueen);
  db.addIndex(matchCities);
  db.addIndex(decaySites);
  db.addIndex(myHex);
  db.addIndex(matchTroopSites);
  db.addIndex(matchSelectedArmies);
  db.addIndex(matchSelected);
  var leaderBoard = [];
  var moveDb;
  var gold = 2000;
  var kTroopLimit = 100;
  var kCityCost = 100;
  var kCityCostIncr = 100;
  var kWallCost = 500;
  var kWallStrength = 100;
  var kWallCostInc = 10;
  var kAllowStrongerWalls = false;
  var kPingCost = game.constant.kPingCost;
  var kPingRange = game.constant.kPingRange;
  var kPingRangeSquared = kPingRange * kPingRange;
  var trailsOn = false;
  var queenOn = false;
  var updateIntervalID;
  var seqNum = 0;
  var sendSeq = 0;
  var initialKingLocation;
  var playerMap = {};
  var updatedRecords = [];
  var cursorRecord;
  var totalLeaderBoard = {};
  var dumpDatabase = function() {
    console.log("-------- dumpDatabase!!!!");
    db.print();
    console.log("end-------- dumpDatabase!!!!");
  };
  // retrun an array of neighbors for the given hex
  // and put them in the db if they are not there.
  var findNeighbors = function(r) {
    var neighborHexs = [];
    var neighborIDs = [];
    var neighborRecords = [];
    var t;
    var dirs = Object.keys(HexLib.hex_directions);
    dirs.forEach(function(d) {
      neighborHexs.push(HexLib.hex_neighbor(r.h, d));
    });

    for (var i = 0; i < neighborHexs.length; i++) {
      if (db.keyExists(HexLib.hexToId(neighborHexs[i]))) {
        t = db.query({ hexID: HexLib.hexToId(neighborHexs[i]) });
        neighborRecords.push(t[0]);
      } else {
        //        console.log("adding a neighbor");
        t = game.util.createRecord({ hexID: HexLib.hexToId(neighborHexs[i]) });
        //t.V=1;
        //TODO do we really need this insert?
        neighborRecords.push(t);
        db.insert(t);
          rDB.pushUpdate(t);
          var trans = game.util.getID();
          var from = Object.assign({},t);
          from.T = trans;
          rDB.pushDiffUpdate(from , null);

      }
    }
    return neighborRecords;
  };

  // -------------------- END UTILITY METHODS -------------------
  var toggleSelection = function(data) {
    var hexID = data.hexID;
    var records = db.query({ hexID: hexID });
    var record, selected;
    var newRecord;

    if (records.length == 0) {
      return;
    }
    //db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    //cursorRecord.Cursor = 0;
    //radio("draw-hexagon").broadcast(cursorRecord);
    // console.log("game.model received toggle-selection message"+data.hexID);
    // console.log("count "+records.length);
    // assert that there is only one record
    // if(records.length>1){console.log("toggleSelection found "+records.length+" records")}
    record = records[0];
    cursorRecord = record;
    radio("update-cursor").broadcast(cursorRecord);
    if (!record.V) {
      return;
    }
    if (record.UID !== game.uid() && record.UID !== 0) {
      radio("message").broadcast("Hex belongs to : " + playerMap[record.UID]);
      return;
    }
    selected = record.S;
    if (selected == 1) {
      selected = 0;
    } else {
      selected = 1;
    }
    db.update({ hexID: record.hexID, S: selected });
    record.S = selected;
    //radio("draw-hexagon").broadcast(record);
  };
  var clearSelection = function() {
    var records = db.matchSelected();
    records.forEach(function(r) {
      r.S = 0;
      db.update(r);
      //radio("draw-hexagon").broadcast(r);
    });
  };
  //    var updateWorld = function (r){
  //        db.insert(r);
  //    };
  var diffUpdate = function(record) {
    var A;
    var UID;
    var C = 0;
    var W = 0;
    var K = 0;
      var S;
    console.log("diffUpdate");
      console.log("     "+game.util.formatRecord(record));

    var localRecord = db.query({ hexID: record.hexID })[0];
    A = localRecord.A;
    K = localRecord.K;
    W = localRecord.W;
    C = localRecord.C;
      UID = localRecord.UID;
      S = record.S;
      console.log("     local record");
      console.log("          "+game.util.formatRecord(localRecord));

    //the basic alg is this
    //1. get the local record.
    //2. if the UID is different
    //   1. subtract armies
    //   2. if the result is negative
    //      change the sign and change the ownership
    //
    //3. if the uid is the same
    //   1. add the armies.
    //4. k,c,w all just add, and change the id if it is 0
    //
    var recordA = record.A;
    if (recordA) {
      if (record.UID !== localRecord.UID) {
        if (W) {
            W = W - recordA;
            recordA=0;
          if (W < 0) {
              recordA = W * (-1);
              W=0;
          }
        }
        A = A - recordA;
        if (A < 0) {
          A = A * (-1);
            UID = record.UID;
            C=0;
            K=0;
        }else{
            S=0;
        }
      } else {
          A = A + record.A;
      }
    }

    if (record.K) {
      K = record.K;
      UID = record.UID;
    }
    if (record.C) {
      C = 1;
      UID = record.UID;
    }
    if (record.W) {
      W = record.W;
      UID = record.UID;
    }
    if (A === 0 && C === 0 && K === 0 && W === 0) {
      UID = 0;
    }
    var newRecord = game.util.createRecord({
      hexID: localRecord.hexID,
      A: A,
      K: K,
      C: C,
        W: W,
        S:S,
      UID: UID,
      V: UID === game.uid() || localRecord.V
    });
      console.log("     updated record");
      console.log("          "+game.util.formatRecord(newRecord));
    db.update(newRecord);

    if (
      record.UID == game.uid() && (record.A || record.C || record.K || record.W)
    ) {
      let n = findNeighbors(localRecord);
      n.forEach(function(_r) {
        if (!_r.V) {
          _r.V = 1;
          db.update(_r);
          window.neighborDrawing++;
        }
      });
    }
  };
  var update = function(record) {
    //      console.log("update");
    radio("debug-transactions").broadcast({ f: "Update" });
    window.updateCount++;
    var r;
    var records, n, localR, localV;
    var queenR;
    var newOwner;
    var myCities;
    // console.log("record id "+snapshot.key+" at "+record.date)
    // if we have recieved this update before, dont do it again.
    // radio('debug-transactions').broadcast({ID:snapshot.key,date:record.date,r:record.record});
    r = Object.assign({}, record);
    radio("debug-transactions").broadcast(r);

    //game.util.printRecord(r);
    // because the selected (S) field is sometimes passed through
    // fb, here we can get selected tiles that we did not select.
    // so clear the selected field if this tile is not ours.
    // and set the Visibility if the hex is ours
    //     game.util.printRecord(r);
    if (!db.keyExists(r.hexID)) {
      // if the record does not exist this rule applies
      if (r.UID !== game.uid()) {
        r.S = 0;
        r.V = 0;
      } else {
        r.V = 1;
      }

      //      console.log("insert a new record from fb");
      //      game.util.printRecord(r);
      db.insert(r);
    } else {
      localR = db.query({ hexID: r.hexID });
      //filter out records that do no changes
      if (game.util.recordsEqual(r, localR[0])) {
        return;
      }
      window.updateWorkCount++;
      //        console.log("local Record");
      //        game.util.printRecord(localR[0]);
      radio("debug-transactions").broadcast(localR[0]);

      if (r.UID !== game.uid()) {
        r.S = 0;
      }
      // if the record does exist, keep the local visibility
      //console.log("update a record from fb")
      localV = localR[0].V;
      //game.util.printRecord(localR[0]);
      //game.util.printRecord(r);
      r.V = localV;
      if (!r.local) {
        r.S = localR[0].S;
        r.Marker = localR[0].Marker;
      }
      delete r.local;
      //game.util.printRecord(r);
      // console.log("there are "+records.length+" records with "+r.hexID);
      // game.util.printRecord(r);
      // here we need to check for winning and loosing.
      // so get the current state of the hex.
      // because the update is just going to have K =0, but
      // if it currently is K=1, our queen just died.
      queenR = db.matchQueen()[0];

      // console.log("queen R ");
      // game.util.printRecord(queenR);
      // BUG once the queen has been removed this causes errors
      // because teh queen cant be found on line 243
      if (queenR && r.hexID == queenR.hexID && r.UID !== game.uid()) {
        // we are updating the queen
        if (r.K == 0 && queenR.K == 1) {
          // we died.
          // now update all our cits to the new owner.
          //           console.log("we are loosing");
          //myCities = db.matchCities();
          //newOwner = r.UID;
          //rDB.openTransaction();
          // myCities.forEach(function(_r) {
          //   _r.UID = newOwner;
          //   _r.V = 0;
          //   rDB.pushUpdate(_r);
          // });
          // rDB.closeTransaction();
          radio("losing-message").broadcast();
        }
      }
      db.update(r);
    }
    if (r.V || game.visibility()) {
      //radio("draw-hexagon").broadcast(r);
    }

    // update the visibility of the neighbors
    if (r.UID == game.uid() && (r.A || r.C || r.K || r.W)) {
      n = findNeighbors(r);
      n.forEach(function(_r) {
        if (!_r.V) {
          _r.V = 1;
          db.update(_r);
          window.neighborDrawing++;
          //radio("draw-hexagon").broadcast(_r);
        }
      });
    }
  };

  // visibility alg
  // 1. when we get an update from fb set V=1, find neighbors and settable
  //   their visibility to one also.
  // 2. send those 9 hexes to the drawlayer
  // note: it is only tiles that are not ours that can go invisible,
  // 3. get list of potentially invisible tiles (eg visible tiles that are not ours)
  // 4. if at least 1 neighbor is our tile stay visible , else clear the visibility
  //   tag and send that hex to the drawlayer
  // Begin public method /initModule/
  // Purpose    : Initializes module
  // Arguments  :
  //  * $container the jquery element used by this feature
  // Returns    : true
  // Throws     : none
  //
  var createKing = function() {
    var done = false;
    var x, y, z;
    x = game.util.getRandomIntInclusive(5, game.constant.kSpawnRange);
      y = game.util.getRandomIntInclusive(5, game.constant.kSpawnRange);
    z = -x - y;
    console.log("creating king at x:" + x + " y:" + y + " z:" + z);
    console.log("ocnstraint x+y+z= 0 :" + (x + y + z));
    var h = HexLib.Hex(x, y, z);
    var r = game.util.createRecord({
      UID: game.uid(),
      hexID: HexLib.hexToId(h),
      K: 1,
      A: 5,
      h: h,
      V: 1
    });
    cursorRecord = r;
      //    db.insert(game.util.createRecord({ hexID: r.hexID }));
      var expected = null;
    // r.expected = expected;
      rDB.pushUpdate(r);
    var trans = game.util.getID();

//    var from = game.util.createRecord({ hexID: r.hexID });
//    from.T = trans;
//    rDB.pushDiffUpdate(from, null);
    rDB.updatePingList(r);
    radio("center-on-queen").broadcast(h, true);
    radio("launch-complete").broadcast();
    radio("update-cursor").broadcast(cursorRecord);
//    trans = game.util.getID();
//    var next = { K: 1, A: 5, UID: game.uid(), T: trans, hexID: r.hexID };
//    radio("diff").broadcast(next);
//      rDB.pushDiffUpdate(next, null);
    updateIntervalID = setInterval(oneSecondUpdate, 1000);
    //setTimeout(oneSecondUpdate,10000);
      
  };
  var queenLocation = function() {
    var rs = db.matchQueen();
    return rs[0].h;
  };
  var initializeWorld = function() {
    // here we would download the db and send a bunch of messages to the drawlayser
    // TODO download the database
    // make some mountians
    for (var i = 0; i < 3600; i++) {
      var x = game.util.getRandomIntInclusive(0, 300);
      var y = game.util.getRandomIntInclusive(0, 300);
      var z = -x - y;
      var h = HexLib.Hex(x, y, z);
      var r = game.util.createRecord({
        hexID: x + "_" + y + "_" + z,
        M: game.util.getRandomIntInclusive(1, 2),
        h: h
      });
      rDB.updateWorldCoordinate(r);
    }
  };
  var generateNewTroop = function(record, recordNumber) {
    //console.log("genNewTroop "+record);
    if (record.A >= kTroopLimit) {
      return;
    }
    var count = record.A + 1;
    var newRecord = Object.assign({}, record);
    newRecord.A = count;
    rDB.openTransaction();
      rDB.pushUpdate(newRecord);
    rDB.closeTransaction();
    var next;
    var trans = game.util.getID();
      //next = { A: 1, UID: game.uid(), T: trans, hexID: record.hexID , S:record.S};
    //radio("diff").broadcast(next);
    //rDB.pushDiffUpdate(next, null);
  };
  var oneSecondUpdate = function() {
    //console.log("oneSecondUpdate");
    // update army generation at cities and king
    // console.log("simpleTable record count "+db.recordCount());
    // console.log("rDB "+rDB.bandwidth());
    // update gold for occupied land
    var records = db.myHex();
    var newGold = records.length;
    var score = 0;
    records.forEach(function(r) {
      score += r.A;
    });
    var UID = game.uid();
    rDB.updateLeaderBoard({ UID: UID, score: score });
    radio("draw-leader-board").broadcast(leaderBoard);
    //console.log("new gold :"+newGold);
    gold += newGold;
    radio("draw-gold").broadcast(gold);
    var troopSites = db.matchTroopSites();
    //console.log("troop sites "+troopSites.length);
    troopSites.forEach(generateNewTroop);
  };

  var computeLeaderBoard = function(r) {
    //console.log("computeLeaderBoard");
    //console.log(r);
    totalLeaderBoard[r.UID] = r.score;
    var nextLeaderBoard = [];
    var keys = Object.keys(totalLeaderBoard);
    keys.forEach(function(k) {
      nextLeaderBoard.push({
        UID: k,
        score: totalLeaderBoard[k],
        name: playerMap[k]
      });
    });
    nextLeaderBoard.sort(function(a, b) {
      return b.score - a.score;
    });
    let found = false;
    var limit = Math.min(5, nextLeaderBoard.length);
    var i;
    if (nextLeaderBoard.length > 5) {
      for (i = 0; i < 4; i++) {
        if (nextLeaderBoard[i].UID === game.uid()) {
          found = true;
        }
      }
      if (!found) {
        //console.log("not found");
        nextLeaderBoard[4] = {
          UID: game.uid(),
          score: totalLeaderBoard[game.uid()],
          name: playerMap[game.uid()]
        };
      }
      //        nextLeaderBoard.forEach(function(r) {
      //          console.log(r);
      //      });
      leaderBoard = nextLeaderBoard.slice(0, 5);
    } else {
      leaderBoard = nextLeaderBoard;
    }
    //    leaderBoard.forEach(function(r) {
    //      console.log(r);
    //    });
  };
  var totalCityCost;
  var totalCitiesBuilt;
  var buildCities = function() {
    totalCityCost = 0;
    totalCitiesBuilt = 0;
    var myCities = db.matchTroopSites();
    kCityCost = myCities.length * kCityCostIncr;
    var cities = db.matchSelected();
    //console.log("found " + cities.length + " selected hexes");
    //    cities.forEach(game.util.printRecord);
    rDB.openTransaction();
    cities.forEach(buildCity);
    rDB.closeTransaction();
    if (cities.length === 0) {
      radio("message").broadcast("You must select a clear hex to build a city");
    }
    if (totalCitiesBuilt === 0 && cities.length > 0) {
      radio("message").broadcast("No cities were built : insufficient gold");
    } else {
      radio(
        "message"
      ).broadcast("Cities built : " + totalCitiesBuilt + " for : " + totalCityCost + " gold");
    }
  };
  var buildCity = function(record, recordNumber) {
    //console.log('city cost ' + kCityCost);
    // game.util.printRecord(record);
    if (
      record.C == 0 &&
        record.W == 0 &&
        record.K == 0 &&
        record.M == 0 &&
        gold > kCityCost
    ) {
      //console.log('empty and enough gold');
      var r = Object.assign({}, record);
      totalCityCost += kCityCost;
      totalCitiesBuilt++;
      gold -= kCityCost;
      kCityCost += kCityCostIncr;
      radio("update-city-cost").broadcast(kCityCost);
      r.C = 1;
      if (r.UID == 0) {
        r.UID = game.uid();
      }
      // game.util.printRecord(record);
      rDB.pushUpdate(r);
      radio("draw-gold").broadcast(gold);
      var trans = game.util.getID();
      var next = { C: 1, UID: game.uid(), T: trans, hexID: record.hexID };
      radio("diff").broadcast(next);
      rDB.pushDiffUpdate(next, null);
    }
  };
  var totalWallCost;
  var totalWallsBuilt;
  var buildWalls = function() {
    var walls = db.matchSelected();
    totalWallCost = 0;
    totalWallsBuilt = 0;
    rDB.openTransaction();
    walls.forEach(buildWall);
    rDB.closeTransaction();
    if (walls.length === 0) {
      radio("message").broadcast("You must select a hex to build a wall");
    } else if (totalWallsBuilt === 0 && walls.length > 0) {
      radio("message").broadcast("No walls were built : insufficient gold");
    } else {
      radio(
        "message"
      ).broadcast("Walls built : " + totalWallsBuilt + " for : " + totalWallCost + " gold");
    }
  };
  var buildWall = function(record, recordNumber) {
    var thisWallCost = 1;
    var wallStrength = record.W;
    var exp = Math.floor(wallStrength / 100);
    if (kAllowStrongerWalls) {
      for (let i = 0; i < exp; i++) {
        thisWallCost *= 2;
      }
      thisWallCost *= kWallCost;
    } else {
      if (wallStrength) {
        return;
      }
    }
    if (
      record.K == 0 && record.M == 0 && record.C == 0 && gold >= thisWallCost
    ) {
      kWallCost += kWallCostInc;
      thisWallCost = kWallCost;
      radio("update-wall-cost").broadcast(kWallCost);
      totalWallsBuilt++;
      totalWallCost += thisWallCost;
      gold -= thisWallCost;
      rDB.pushUpdate(
        game.util.createRecord({
          hexID: record.hexID,
          A: record.A,
          W: kWallStrength + wallStrength,
          UID: game.uid()
        })
      );
      radio("draw-gold").broadcast(gold);
      var trans = game.util.getID();
      var next = {
        W: kWallStrength + wallStrength,
        UID: game.uid(),
        T: trans,
        hexID: record.hexID
      };
      radio("diff").broadcast(next);
      rDB.pushDiffUpdate(next, null);
    }
  };
  var geoSort = function(dir) {
    if (dir == "down") {
      return function(a, b) {
        return b.h.q - a.h.q;
      };
    }
    if (dir == "west") {
      return function(a, b) {
        return a.h.q - b.h.q;
      };
    }
    if (dir == "up") {
      return function(a, b) {
        return a.h.q - b.h.q;
      };
    }
    if (dir == "east") {
      return function(a, b) {
        return b.h.q - a.h.q;
      };
    }
    if (dir == "north") {
      return function(a, b) {
        return a.h.r - b.h.r;
      };
    }
    if (dir == "south") {
      return function(a, b) {
        return b.h.r - a.h.r;
      };
    }
  };
  var toggleTrails = function(v) {
    trailsOn = v;
  };
  var toggleQueen = function(v) {
    queenOn = v;
  };
  var moveCursor = function(dir) {
    //console.log("moveCursor");
    //game.util.printRecord(cursorRecord);
    var targetRecord = getTarget(dir, cursorRecord);
    if (!targetRecord.V) {
      return;
    }
    //game.util.printRecord(targetRecord);
    //db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    //radio("draw-hexagon").broadcast(cursorRecord);
    cursorRecord = targetRecord;
    db.update({ hexID: cursorRecord.hexID, S: 1 });
    radio("update-cursor").broadcast(cursorRecord);
  };
  var move = function(dir) {
    // you cant move the queen and troops at the same
    // time;
    // BUG you cant move an empty square
    window.neighborDrawing = 0;
    window.updateCount = 0;
    window.updateWorkCount = 0;
    if (queenOn) {
      moveQueen(dir);
      return;
    }
    var records = db.matchSelectedArmies();
    // console.log("=======GeoSort "+dir);
    records.sort(geoSort(dir));
    // console.log("=======GeoSort "+dir);
    records.forEach(function(record) {
      oneMove(dir, record);
    });
    //rDB.openTransaction();
    // updatedRecords.forEach(rDB.pushUpdate);
    // rDB.closeTransaction();
    // updatedRecords=[];
    //console.log("drew : " + window.neighborDrawing);
    //console.log("update : " + window.updateCount);
    //console.log("update work : " + window.updateWorkCount);
  };
  var moveQueen = function(dir) {
    // var records = db.query(matchQueen);
    var record = db.matchQueen()[0];
    var r = Object.assign({}, record);
    // game.util.printRecord(record);
    var tr = getTarget(dir, record);
    var targetRecord = Object.assign({}, tr);
    if (targetRecord.M) {
      return;
    }
    if (targetRecord.UID !== game.uid() && targetRecord.UID != 0) {
      return;
    }
    if (r.A || r.C || r.W) {
      //            db.update({hexID: r.hexID, K: 0});
      r.K = 0;
    } else {
      // db.update({ hexID: r.hexID, K: 0, UID: 0 });
      r.K = 0;
      r.UID = 0;
    }
    //if the queen is moving , keep the cursor with her.
    //db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    //    r.Cursor = 0;
    cursorRecord = targetRecord;
    //db.update(r);
    //db.update({ hexID: targetRecord.hexID, K: 1, UID: game.uid(), Cursor: 1 });
    targetRecord.K = 1;
    targetRecord.UID = game.uid();
    //targetRecord.Cursor = 1;
    rDB.pushUpdate(r);
    rDB.pushUpdate(targetRecord);
    var trans = game.util.getID();
    var nextR = {
      K: -1,
      UID: game.uid(),
      T: trans,
      hexID: r.hexID,
      to: t.hexID
    };
    var nextT = {
      k: 1,
      UID: game.uid(),
      T: trans,
      hexID: t.hexID,
      from: r.hexID
    };
    radio("diff").broadcast(nextR);
    radio("diff").broadcast(nextT);
    rDB.pushDiffUpdate(nextR, nextT);
  };
  var getTarget = function(dir, record) {
    var targetHex = HexLib.hex_neighbor(record.h, dir);
    var targetRecord = db.query({ hexID: HexLib.hexToId(targetHex) });
    // there must be only one so..
    if (targetRecord.length == 1) {
      var t = targetRecord[0];
      return t;
    } else {
      // if the record is not in the db, it must be an empty square, so create an empty record
      // and return it
      throw new Error("getTarget should never need to create a record");
      //return game.util.createRecord({hexID: HexLib.hexToId(targetHex)});
    }
  };
  var moveArmy = function(r, t) {
    var nextR, nextT;
      var count;
      var rS;
    count = r.A;
    if (t.UID === game.uid()) {
      var a = r.A;
        var tA = t.A;
        rS= 0;
      if (tA + a > kTroopLimit) {
          count = kTroopLimit - tA;
          rS = 1;
      }
    }else {rS = 0;}
    var trans = game.util.getID();
    nextR = {
      A: count * (-1),
      UID: game.uid(),
      T: trans,
      hexID: r.hexID,
        to: t.hexID,
        S : rS
    };
    nextT = {
      A: count,
      UID: game.uid(),
      T: trans,
      hexID: t.hexID,
        from: r.hexID,
        S:1
    };
      if(r.hexID === cursorRecord.hexID){
          cursorRecord = t;
           radio("update-cursor").broadcast(cursorRecord);
      }
    radio("diff").broadcast(nextR);
    radio("diff").broadcast(nextT);
    rDB.pushDiffUpdate(nextR, nextT);
  };
  var oneMove = function(dir, recordTemp) {
    // rules
    // 1. cant move onto mountains
    // 2. cant move troops that arn't yours
    // console.log("oneMove");
    var a, r, totalTroops, finalTroops, c;
    var tr = getTarget(dir, recordTemp);
    var targetRecord = Object.assign({}, tr);
    var record = Object.assign({}, recordTemp);
    var mUID, tUID, rUID;
      //moveArmy(record, targetRecord);
    // console.log("targetRecord");
    // game.util.printRecord(targetRecord);
    // console.log("record");
    // game.util.printRecord(record);
    if (targetRecord.M) {
      return;
    }
    // rule 1;
    if (record.UID != game.uid()) {
      return;
    }
    // rule 2;
    if (targetRecord.W && targetRecord.UID != game.uid()) {
      if (record.W || record.C || record.K) {
        rUID = record.UID;
      } else {
        rUID = 0;
      }
      var wallStrength = targetRecord.W;
      var troops = record.A;
      if (troops > wallStrength) {
        var newTroops = troops - wallStrength;
        if (targetRecord.A) {
          //if there are troops too, then adjust them
          if (newTroops > targetRecord.A) {
            finalTroops = targetRecord.A - newTroops;
            //                        db.update({hexID: targetRecord.hexID, A: finalTroops, UID: record.UID, W: 0, S: 1});
            targetRecord.A = finalTroops;
            targetRecord.UID = record.UID;
            targetRecord.W = 0;
            targetRecord.S = 1;
          } else if (newTroops < targetRecord.A) {
            finalTroops = record.A - newTroops;
            //                        db.update({hexID: targetRecord.hexID, A: finalTroops, UID: targetRecord.UID, W: 0, S: 0});
            targetRecord.A = finalTroops;
            targetRecord.UID = targetRecord.UID;
            targetRecord.W = 0;
            targetRecord.S = 0;
          } else {
            //                        db.update({hexID: targetRecord.hexID, A: 0, UID: 0, W: 0, S: 0});
            targetRecord.A = 0;
            targetRecord.UID = 0;
            targetRecord.W = 0;
            targetRecord.S = 0;
          }
        } else {
          //                    db.update({hexID: targetRecord.hexID, A: newTroops, UID: record.UID, W: 0, S: 1});
          targetRecord.A = newTroops;
          targetRecord.UID = record.UID;
          targetRecord.W = 0;
          targetRecord.S = 1;
        }
        //                db.update({hexID: record.hexID, A: 0, UID: rUID, S: 0});
        record.A = 0;
        record.UID = rUID;
        record.S = 0;
      } else if (troops < wallStrength) {
        var newWall = wallStrength - troops;
        //                db.update({hexID: targetRecord.hexID, W: newWall});
        targetRecord.W = newWall;
        //                db.update({hexID: record.hexID, UID: rUID, A: 0, S: 0});
        record.A = 0;
        record.S = 0;
        record.UID = rUID;
      } else {
        // all troops are gone and the wall is gone too.
        if (targetRecord.A || targetRecord.C || targetRecord.K) {
          // if there are troops , the ownership stays put
          //                    db.update({hexID: targetRecord.hexID, W: 0});
          targetRecord.W = 0;
        } else {
          //                    db.update({hexID: targetRecord.hexID, W: 0, UID: 0});
          targetRecord.W = 0;
          targetRecord.UID = 0;
        }
        //                db.update({hexID: record.hexID, A: 0, UID: rUID});
        record.A = 0;
        record.UID = rUID;
      }
      //            updatedRecords.push(targetRecord);
      //            updatedRecords.push(record);
      //            return;
    } else if (targetRecord.UID == record.UID) {
      // we own this square so combine our armies up to the limit, remainder stays in the
      // orig hex
      // console.log("combining with our army");
      totalTroops = targetRecord.A + record.A;
      a = totalTroops - kTroopLimit;

      // console.log("total troops :"+totalTroops+"a:"+a);
      if (totalTroops > kTroopLimit) {
        //console.log('exceeding troop limit');
        //                db.update({hexID: record.hexID, A: a, S: 1});
        //                db.update({hexID: targetRecord.hexID, A: kTroopLimit, S: 1});
        record.A = a;
        record.S = 1;
        targetRecord.A = kTroopLimit;
        targetRecord.S = 1;
      } else {
        // console.log("comine all troops");
        // if there are no troops left, we don't own this square any longer
        // unless the square we are leaving is a city or king or a wall
        if (record.C || record.K || record.W) {
          mUID = record.UID;
        } else {
          mUID = 0;
        }
        if (trailsOn) {
          if (totalTroops > 10) {
            //                        db.update({hexID: record.hexID, A: 10, UID: game.uid(), S: 0});
            //                        db.update({hexID: targetRecord.hexID, A: totalTroops - 10, S: 1});
            record.A = 10;
            record.UID = game.uid();
            record.S = 0;
            targetRecord.A = totalTroops - 10;
            targetRecord.S = 1;
          } else {
            //                        db.update({hexID: record.hexID, A: 0, UID: mUID, S: 0});
            //                        db.update({hexID: targetRecord.hexID, A: totalTroops, S: 1});
            record.A = 0;
            record.UID = mUID;
            record.S = 0;
            targetRecord.A = totalTroops;
            targetRecord.S = 1;
          }
        } else {
          //                    db.update({hexID: record.hexID, A: 0, UID: mUID, S: 0});
          //                    db.update({hexID: targetRecord.hexID, A: totalTroops, S: 1});
          record.A = 0;
          record.UID = mUID;
          record.S = 0;
          targetRecord.A = totalTroops;
          targetRecord.S = 1;
        }
      }
      //            db.update(record);
      //            db.update(targetRecord);
      //            updatedRecords.push(targetRecord);
      //            updatedRecords.push(record);
      //            return;
    } else if (record.UID !== targetRecord.UID && targetRecord.UID != 0) {
      // console.log("attack");
      // this is an attack so ...
      if (record.C || record.K || record.W) {
        mUID = record.UID;
      } else {
        mUID = 0;
      }
      if (targetRecord.A > record.A) {
        // the attacked square wins the battle
        a = targetRecord.A - record.A;
        //                db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
        //                db.update({hexID: targetRecord.hexID, A: a, S: 0});
        record.A = 0;
        record.UID = mUID;
        record.S = 0;
        targetRecord.A = a;
        targetRecord.S = 0;
      } else if (record.A > targetRecord.A) {
        // we win the battle .
        a = record.A - targetRecord.A;
        // keep position of citys and queens if they are in the
        // square we are leaving to attack
        if (record.C || record.K || record.W) {
          mUID = record.UID;
        } else {
          mUID = 0;
        }
        c = targetRecord.C;
        // if we were attacking a city it is destroyed
        if (targetRecord.C) {
          c = 0;
        }
        // if we were attacking a queen it becomes a city;
        // and the queen dies.
        if (targetRecord.K) {
          c = 1;
        }
        //                db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
        //                db.update({hexID: targetRecord.hexID, A: a, UID: game.uid(), S: 1, C: c, K: 0});
        record.A = 0;
        record.UID = mUID;
        record.S = 0;
        targetRecord.A = a;
        targetRecord.S = 1;
        targetRecord.C = c;
        targetRecord.K = 0;
        targetRecord.UID = game.uid();
      } else {
        // this is a tie. the original owners stay put and all
        // armies are destroyed.
        if (targetRecord.C || targetRecord.K || targetRecord.W) {
          tUID = targetRecord.UID;
        } else {
          tUID = 0;
        }
        //                db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
        //                db.update({hexID: targetRecord.hexID, A: 0, S: 1, UID: tUID});
        record.A = 0;
        record.UID = mUID;
        record.S = 0;
        targetRecord.A = 0;
        targetRecord.S = 1;
        targetRecord.UID = tUID;
      }
      //            updatedRecords.push(targetRecord);
      //            updatedRecords.push(record);
      //            return;
    } else if (targetRecord.UID == 0) {
      // console.log("move to empty square");
      // the target is an empty square , move the troops and update the ownership
      if (trailsOn && record.A > 10) {
        a = record.A - 10;
        r = 10;
        mUID = record.UID;
      } else {
        a = record.A;
        r = 0;
        mUID = 0;
      }
      //            db.update({hexID: targetRecord.hexID, UID: game.uid(), A: a, S: 1});
      targetRecord.A = a;
      targetRecord.S = 1;
      targetRecord.UID = game.uid();
      if (record.K || record.C || record.W) {
        // the king does not lose ownership when it has no troops
        //              db.update({hexID: record.hexID, A: r, S: 0});
        record.A = r;
        record.S = 0;
      } else {
        //                db.update({hexID: record.hexID, UID: mUID, A: r, S: 0});
        record.A = r;
        record.UID = mUID;
        record.S = 0;
      }
    }
    if (record.hexID === cursorRecord.hexID) {
      //      record.Cursor = 0;
      //      targetRecord.Cursor = 1;
      cursorRecord = targetRecord;
      radio("update-cursor").broadcast(cursorRecord);
    }
    //db.update(record);
    //db.update(targetRecord);
    rDB.pushUpdate(record);
    rDB.pushUpdate(targetRecord);
    //updatedRecords.push(targetRecord);
    //updatedRecords.push(record);
  };
  var requestHexInSquare = function(square) {
    //        console.log("requestHexInSquare");
    //console.log(square);
    var records = db.query(function(r) {
      return matchGeography(r, square);
    });
    //        console.log("records.length "+records.length);
    //      records.forEach(game.util.printRecord);
    if (square.select === "shift") {
      records.forEach(function(r) {
        if (r.A) {
          db.update({ hexID: r.hexID, S: 1 });
        }
      });
    }
    if (square.select === "control") {
      records.forEach(function(r) {
        if (r.A == 0 && r.C === 0 && r.K === 0 && r.M === 0 && r.W === 0) {
          db.update({ hexID: r.hexID, S: 1 });
        }
      });
    }

    records.forEach(function(r) {
      //keep this one
      radio("draw-hexagon").broadcast(r);
    });
  };
  var ping = function() {
    // the ping originates for a selected army if there is only 1
    // the ping originates from the queen if there are no selected armies
    // else nothing happens.
    // pings cost a lot.
    if (gold < kPingCost) {
      //TODO post a message explaining why not enough gold for a ping
      radio("message").broadcast("You do not have enough gold for a ping");
      return;
    }
    var h;
    var records = db.matchSelectedArmies();
    if (records.length == 1) {
      h = records[0].h;
    } else if (records.length == 0) {
      records = db.matchQueen();
      h = records[0].h;
    } else {
      radio("message").broadcast("Please select 0 or 1 armies for the ping");
      return;
    }
    //console.log('ping origin ' + HexLib.hexToId(h));
    rDB.getPingData(
      function(data) {
        createPingData(data, h);
      },
      h
    );
    gold -= kPingCost;
    // kPingCost;
    radio("draw-gold").broadcast(gold);
  };
  var createPingData = function(pingData, h) {
    //filter to hexes within 100
    //        console.log("createPingData");
    //        console.log(h);
    h.UID = game.uid();
    var finalPing = [];
    pingData.forEach(function(r) {
      if (HexLib.hex_distance(r, h) < kPingRange) {
        let id = r.UID;
        r = HexLib.hex_subtract(r, h);
        r.UID = id;
        finalPing.push(r);
      }
    });
    finalPing.push(h);
    radio("ping-data").broadcast(finalPing);
  };
  var addPlayerNameToList = function(r) {
    playerMap[r.UID] = r.name;
  };
  var totalNewTroops;
  var recruitTroops = function() {
    totalNewTroops = 0;
    //    console.log("recruitTroops");
    var troopSites = db.matchTroopSites();
    troopSites.forEach(recruitCity);
    radio("draw-gold").broadcast(gold);
    radio("message").broadcast(
      "Recruited " + totalNewTroops + " for " + totalNewTroops + " gold"
    );
  };
  var recruitCity = function(r) {
    //    console.log("recruitCity");
    var a = r.A;
    var diff = kTroopLimit - a;
    if (gold < diff) {
      return;
    }
    gold -= diff;
    totalNewTroops += diff;

    var newR = Object.assign({}, r);
    newR.A = kTroopLimit;
    rDB.pushUpdate(newR);
    var trans = game.util.getID();
    var next = { A: diff, UID: game.uid(), T: trans, hexID: r.hexID };
    radio("diff").broadcast(next);
    rDB.pushDiffUpdate(next, null);
  };
  var initModule = function(playerName) {
    if (!playerName) {
      playerName = "anonymous";
    }
    rDB.initModule(
      { location: game.world() + "/updates", callback: update },
      { location: game.world() + "/users", callback: addPlayerNameToList },
      { location: game.world() + "/world" },
      { location: game.world() + "/leaderBoard", callback: computeLeaderBoard },
      { location: game.world() + "/newWorld", callback: diffUpdate }
    );

    rDB.pushUser({ UID: game.uid(), name: playerName });
    // spawn the king
    // TODO spawn the king away from everyone else.
    //initializeWorld();
    //      rDB.tryUpdate();
    //rDB.joinWorld(createKing);
    setTimeout(createKing, 1000);
    radio("toggle-selection").subscribe(toggleSelection);
    radio("build-wall").subscribe(buildWalls);
    radio("build-city").subscribe(buildCities);
    radio("toggle-trails").subscribe(toggleTrails);
    radio("toggle-queen").subscribe(toggleQueen);
    radio("move").subscribe(move);
    radio("move-cursor").subscribe(moveCursor);
    radio("dump-database").subscribe(dumpDatabase);
    radio("clear-selection").subscribe(clearSelection);
    radio("request-hex-in-square").subscribe(requestHexInSquare);
    radio("ping").subscribe(ping);
    radio("toggle-marker").subscribe(toggleMarker);
    radio("jump-next-marker").subscribe(jumpNextMarker);
    radio("recruit-troops").subscribe(recruitTroops);
    // radio('debug-clear-fb').subscribe(clearFb);
    radio("stop-updates").subscribe(stopUpdates);
    radio("dump-transactions").subscribe(dumpTransactions);
    return true;
  };
  var toggleMarker = function() {
    var records = db.matchSelected();
    var record, marked;
    var newRecord;
    //    console.log("game.model received toggle-marker message");
    //    console.log("count " + records.length);
    // assert that there is only one record
    // if(records.length>1){console.log("toggleSelection found "+records.length+" records")}
    if (records.length == 1) {
      record = records[0];
      if (!record.V) {
        return;
      }
      marked = record.Marker;
      if (marked == 1) {
        marked = 0;
        let index = markerRing.findIndex(function(e) {
          return e === record.hexID;
        });
        markerRing.splice(index, 1);
      } else {
        marked = 1;
        markerRing.push(record.hexID);
      }
      db.update({ hexID: record.hexID, Marker: marked });
      record.Marker = marked;
      //radio("draw-hexagon").broadcast(record);
    } else {
      radio("draw-message").broadcast("select only 1 hex to toggle a marker");
    }
  };
  var jumpNextMarker = function() {
    //    console.log('marker ring');
    //    console.log(markerRing);
    var m = markerRing.shift();
    markerRing.push(m);
    //console.log(m);
    var r = db.query({ hexID: m });
    //game.util.printRecord(r[0]);
    //console.log(r[0].h);
    radio("center-on-queen").broadcast(r[0].h, true);
  };
  var stopUpdates = function() {
    clearInterval(updateIntervalID);
  };
  var dumpTransactions = function() {
    // console.log("dump transactions");
    var trans = updatesDb.query(function(r) {
      return true;
    });
    trans.sort(function(a, b) {
      return a.seq - b.seq;
    });
    radio("debug-transactions").broadcast(trans);
  };
  // End public method /initModule/
  // return public methods
  return { initModule: initModule, queenLocation: queenLocation };
  // ------------------- END PUBLIC METHODS ---------------------
})();

