/* global game, radio  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

game.model = (function (){
    'use strict';
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
    var db  = database;
    var matchSelected = function (r){ return r.S; };
    var matchSelectedArmies = function (r){ return r.S && r.UID == game.uid() && r.A > 0; };
    var matchTroopSites = function (r){ return (r.K > 0 || r.C > 0) && r.UID == game.uid(); };
    var myHex = function (r){ return r.UID == game.uid(); };
    var matchQueen = function (r){ return r.K && r.UID == game.uid(); };
    var decaySites = function (r){ return r.UID !== game.uid() && r.V; };
    var matchGeography = function (r, square){
        var h;
        var p;
        if (r.V){
            p=HexLib.hex_to_pixel(game.drawLayer.layout,r.h);
            if (square.x <= p.x && p.x <= square.x + square.width &&
                square.y <= p.y && p.y <= square.y + square.height){
                return true;
            }
        }
        return false;
    };
    var matchRange = function (r, h){
        if (r.UID != 0){
	    var d = HexLib.hex_distance(h, r.h);
	    return d < kPingRange;
        }
        return false;
    };
    var matchCities = function (r){ return r.UID == game.uid() && r.C > 0; };
    db.addIndex(matchQueen);
    db.addIndex(matchCities);
    db.addIndex(decaySites);
    db.addIndex(myHex);
    db.addIndex(matchTroopSites);
    db.addIndex(matchSelectedArmies);
    db.addIndex(matchSelected);
    var moveDb;
    var fbStorageRef;
    var gold = 200;
    var kTroopLimit = 100;
    var kCityCost = 100;
    var kCityCostIncr = 100;
    var kWallCost = 50;
    var kWallStrength = 100;
    var kPingCost = 1;
    var kPingRange = 100;
    var kPingRangeSquared = kPingRange * kPingRange;
    var trailsOn = false;
    var queenOn = false;
    var updateIntervalID;
    var seqNum = 0;
    var sendSeq = 0;
    var initialKingLocation;
    var playerMap = {};
    var updatedRecords=[];
    
    var dumpDatabase = function (){
          console.log('-------- dumpDatabase!!!!');
          db.print();
          console.log('end-------- dumpDatabase!!!!');
    };
        // retrun an array of neighbors for the given hex
        // and put them in the db if they are not there.
    var findNeighbors = function (r){
        var neighborHexs = [];
        var neighborIDs  = [];
        var neighborRecords = [];
        var t;
        var dirs = Object.keys(HexLib.hex_directions);
        dirs.forEach(function(d){
            neighborHexs.push(HexLib.hex_neighbor(r.h,d));
        });

        for (var i = 0; i < neighborHexs.length; i++){
            if (db.keyExists(HexLib.hexToId(neighborHexs[i]))){
                t = db.query({hexID: HexLib.hexToId(neighborHexs[i])});
                neighborRecords.push(t[0]);
            } else {
                t = game.util.createRecord({hexID: HexLib.hexToId(neighborHexs[i])});
                neighborRecords.push(t);
                db.insert(t);
            }
        }
        return neighborRecords;
    };

  // -------------------- END UTILITY METHODS -------------------

    var toggleSelection = function (data){
        var hexID = data.hexID;
        var records = db.query({'hexID': hexID});
        var record, selected;
        var newRecord;
        // console.log("game.model received toggle-selection message"+data.hexID);
        // console.log("count "+records.length);
        if (records.length == 0){
            // this is the only time the model will add a record to the db,
            // all other records are added in response to a update from firebase.
            // newRecord=game.util.createRecord({'hexID':hexID,S:1});
            // db.insert(newRecord);
            // radio('draw-hexagon').broadcast(newRecord);
        } else {
            // assert that there is only one record
            // if(records.length>1){console.log("toggleSelection found "+records.length+" records")}
            record = records[0];
            if (!record.V){ return; }
            if (record.UID !== game.uid() && record.UID !== 0){ return; }
            selected = record.S;
            if (selected == 1){
                selected = 0;
            } else {
                selected = 1;
            }
            db.update({hexID: record.hexID, S: selected});
            record.S = selected;
            radio('draw-hexagon').broadcast(record);
        }
    };
    var clearSelection = function (){
        var records = db.matchSelected();
        records.forEach(function (r){
            r.S = 0; db.update(r);
            radio('draw-hexagon').broadcast(r);
        });
    };
    var updateWorld = function (r){
        db.insert(r);
    };
    var update = function (record){
                // console.log("recieved a record update from fb");
        var r;
        var records, n, localR, localV;
        var queenR;
        var newOwner;
        var myCities;
        // console.log("record id "+snapshot.key+" at "+record.date)
        // if we have recieved this update before, dont do it again.
        // radio('debug-transactions').broadcast({ID:snapshot.key,date:record.date,r:record.record});
        // if(!updatesDb.insert({ID:snapshot.key,date:record.date,r:record.record,seq:seqNum++,sendseq:record.seq})){
        //      console.log("update: failed insert, recieved duplicate update");return;
        // }
        r = record;
        //game.util.printRecord(r);
        // because the selected (S) field is sometimes passed through
        // fb, here we can get selected tiles that we did not select.
        // so clear the selected field if this tile is not ours.
        // and set the Visibility if the hex is ours
        
        // game.util.printRecord(r);
        if (!db.keyExists(r.hexID)){
            // if the record does not exist this rule applies
            if (r.UID !== game.uid()){ r.S = 0; r.V = 0; } else { r.V = 1; }
	    
            // console.log("insert a new record from fb");
            // game.util.printRecord(r);
            db.insert(r);
        } else {
            if (r.UID !== game.uid()){ r.S = 0; }
            // if the record does exist, keep the local visibility
            // console.log("update a record from fb")
            localR = db.query({hexID: r.hexID});
            localV = localR[0].V;
            // game.util.printRecord(localR[0]);
            // game.util.printRecord(r);
            r.V = localV;
	    
            // game.util.printRecord(r);
            // console.log("there are "+records.length+" records with "+r.hexID);
            // game.util.printRecord(r);
	    
            // here we need to check for winning and loosing.
            // so get the current state of the hex.
            // because the update is just going to have K =0, but
            // if it currently is K=1, our queen just died.
            queenR = db.query(matchQueen)[0];
            // console.log("queen R ");
            // game.util.printRecord(queenR);
            // BUG once the queen has been removed this causes errors
            // because teh queen cant be found on line 243
            if (queenR && r.hexID == queenR.hexID){ // we are updating the queen
                if (r.K == 0 && queenR.K == 1){
                    // we died.
                    // now update all our cits to the new owner.
                    // console.log("we are loosing");
                    myCities = db.matchCities();
                    newOwner = r.UID;
                    rDB.openTransaction();
                    myCities.forEach(function (_r){
                        _r.UID = newOwner;
                        _r.V = 0;
                        rDB.pushUpdate(_r);
                    }
                                    );
                    rDB.closeTransaction();
                    radio('losing-message').broadcast();
                }
            }
            db.update(r);
        }
        if (r.V || game.visibility()){
            radio('draw-hexagon').broadcast(r);
        }
	
        // update the visibility of the neighbors
        if (r.UID == game.uid()){
            n = findNeighbors(r);
            // console.log("found these neighbors");
            //n.forEach(game.util.printRecord);
            n.forEach(function (_r){
                // game.util.printRecord(_r);
                db.update({hexID: _r.hexID, V: 1});
                _r.V = 1;
                radio('draw-hexagon').broadcast(_r);
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
    var createKing = function (){
        var done = false;
        var x, y, z, r;
        do { // make sure we don't spawn on an occupied location.
            x = game.util.getRandomIntInclusive(5, 200);
            y = game.util.getRandomIntInclusive(5, 200);
            z = -x -y;        
            r = db.query({hexID: x + '_' + y + '_' + z});
            if (r.length == 0){ done = true; }
        } while (!done);
        //console.log('creating king at x:' + x + ' y:' + y + ' z:'+ z);
        //console.log('ocnstraint x+y+z= 0 :'+ (x+y+z));
        var h = HexLib.Hex(x,y,z);
        rDB.openTransaction();
        var r = game.util.createRecord({UID: game.uid(), 'hexID': HexLib.hexToId(h), K: 1, A: 5, h :h});
        rDB.pushUpdate(r);
        //      for(var i =1; i<10;i++){
        //              r = game.util.createRecord({UID:"qwerqwef",'hexID':(x+i*10)+"_"+y,A:5});
        //              rDB.pushUpdate(r);
        //      }
        //      playerMap["qwerqwef"]="man";
                // var m = game.util.createRecord({hexID:(x+1)+"_"+y,M:game.util.getRandomIntInclusive(0,3)});
                // this string was 126 bytes long.
                // var JSONstringR = JSON.stringify(r);
                // console.log(r);
                // console.log(JSONstringR);
                // console.log("length "+JSONstringR.length);
                // var backR= JSON.parse(JSONstringR);
                // console.log(backR);

                // rDB.pushUpdate(m);
        rDB.closeTransaction();
        radio('center-on-queen').broadcast(h,true);
        radio('launch-complete').broadcast();
    };
    var queenLocation = function (){ var rs= db.matchQueen();
				     return rs[0].h
				   };
    var initializeWorld = function (){
          // here we would download the db and send a bunch of messages to the drawlayser
          // TODO download the database

          // make some mountians
          for (var i = 0; i < 900; i++){
                  var x = game.util.getRandomIntInclusive(0, 300);
                  var y = game.util.getRandomIntInclusive(0, 300);
                        // var r = game.util.createRecord({hexID:x+"_"+y,M:game.util.getRandomIntInclusive(1,2)});
                        // rDB.updateWorldCoordinate(r);
          }
    };
    var generateNewTroop = function (record, recordNumber){
          // console.log("genNewTroop "+record);
          if (record.A >= kTroopLimit){ return; }
          var count = record.A + 1;
          record.A = count;
          // console.log("genNewTroop "+record);
        rDB.openTransaction();
          rDB.pushUpdate(record);
        rDB.closeTransaction();
    };
    var oneSecondUpdate = function (){
          // update army generation at cities and king
                // console.log("simpleTable record count "+db.recordCount());
                // console.log("rDB "+rDB.bandwidth());
          // update gold for occupied land
          var records = db.myHex();
          var newGold = records.length;
          // console.log("new gold :"+newGold);
          gold += newGold;
          radio('draw-gold').broadcast(gold);
          var troopSites = db.matchTroopSites();
        troopSites.forEach(generateNewTroop);
                // visibilityDecay();
        computeLeaderBoard();
    };

    var computeLeaderBoard = function (){
        var UIDpairs = [];
        var leaderBoard;
                // console.log("computeLeaderBoard");
        var UIDsumArmys = db.sumAllUniqueField('UID', 'A');
                // console.log(UIDsumArmys);
        var UIDs = Object.keys(UIDsumArmys);
        UIDs.forEach(function (r){
            if (r != 0){
                UIDpairs.push({UID: r, score: UIDsumArmys[r]});
            }
        });

        UIDpairs.sort(function (a, b){ return b.score - a.score; });
                // console.log(UIDpairs);
        var myIndex = UIDpairs.findIndex(function (r){ return r.UID == game.uid(); });

                // collect the top 5 scores, but always include our score
        if (myIndex > 4){
            leaderBoard = UIDpairs.slice(0, 4);
            leaderBoard[4] = {UID: game.uid(), score: UIDsumArmys[game.uid()]};
        } else {
            leaderBoard = UIDpairs.slice(0, 5);
        }
        leaderBoard.forEach(function (r){ r.name = playerMap[r.UID]; });
                // console.log(leaderBoard);
        radio('draw-leader-board').broadcast(leaderBoard);
    };
    var visibilityDecay = function (){
                // console.log("-----visibilityDecay")
        var potentialDecaySites = db.decaySites();
                // potentialDecaySites.forEach(game.util.printRecord);
        potentialDecaySites.forEach(doDecay);
    };
    var doDecay = function (r){
                // console.log('------doDecay');
                // game.util.printRecord(r);
                // console.log("uid "+game.uid());
        var neighbors = findNeighbors(r);
                // neighbors.forEach(game.util.printRecord);
        var found = false;
        for (var i = 0; i < neighbors.length; i++){
                        // if we find a neighbor that we own,then this hex does not decay
            if (neighbors[i].UID == game.uid()){
                return;
            }
        }
        r.V = 0;
        db.update(r);
        radio('draw-hexagon').broadcast(r);
    };
    var buildCities = function (){
          var cities = db.matchSelected();
        rDB.openTransaction();
        cities.forEach(buildCity);
        rDB.closeTransaction();
          // console.log("found "+cities.length+" selected hexes");
    };
    var buildCity = function (record, recordNumber){
        //  console.log('buildCity r:' + record.A + ' ' + record.W + ' ' + record.K + ' ' + record.M + ' ' + gold);
        //console.log('city cost ' + kCityCost);
                // game.util.printRecord(record);
          if (record.C == 0 && record.W == 0 && record.K == 0 && record.M == 0 && gold > kCityCost){
                  //console.log('empty and enough gold');
                  gold -= kCityCost;
      kCityCost += kCityCostIncr;
      radio('update-city-cost').broadcast(kCityCost);
      record.C = 1;
      if (record.UID == 0){ record.UID = game.uid(); }
                        // game.util.printRecord(record);
                  rDB.pushUpdate(record);
                  radio('draw-gold').broadcast(gold);
          }
    };
    var buildWalls = function (){
        var cities = db.matchSelected();
        rDB.openTransaction();
        cities.forEach(buildWall);
        rDB.closeTransaction();
    };
    var buildWall = function (record, recordNumber){
        if (record.A == 0 && record.K == 0 &&
	    record.M == 0 && record.C == 0 && gold >= kWallCost){
                  gold -= kWallCost;
                  rDB.pushUpdate(game.util.createRecord({'hexID': record.hexID, W: kWallStrength+record.W}));
                  radio('draw-gold').broadcast(gold);
          }
    };
    var geoSort = function (dir){
        if (dir == 'down'){
            return function (a, b){ return b.h.q - a.h.q;};
        }
        if (dir == 'west'){
            return function (a, b){ return  a.h.q - b.h.q;};
        }
        if (dir == 'up'){
            return function (a, b){ return  a.h.q - b.h.q;};
        }
        if (dir == 'east'){
            return function (a, b){ return  b.h.q - a.h.q;};
        }
        if (dir == 'north'){ 
            return function(a,b){ return a.h.r - b.h.r;};
        };
        if (dir == 'south'){
            return function(a,b){ return b.h.r - a.h.r;};
        };
    };
    var toggleTrails = function (v){
        trailsOn = v;
    };
    var toggleQueen = function (v){
          queenOn = v;
    };
    var move = function (dir){
        // you cant move the queen and troops at the same
        // time;
        // BUG you cant move an empty square
        if (queenOn){
            moveQueen(dir);
            return;
        }
        var records = db.matchSelectedArmies();
        // console.log("=======GeoSort "+dir);
        records.sort(geoSort(dir));
        // console.log("=======GeoSort "+dir);
        records.forEach(function (record){ oneMove(dir, record); });
        rDB.openTransaction();
        updatedRecords.forEach(rDB.pushUpdate);
        rDB.closeTransaction();
        updatedRecords=[];
    };
    var moveQueen = function (dir){
                // var records = db.query(matchQueen);
        var record = db.matchQueen()[0];
                // game.util.printRecord(record);
        var targetRecord = getTarget(dir, record);
                // game.util.printRecord(targetRecord);
                // this record may not be in the db yet.
        db.insert(targetRecord);// insert will do nothing if the hexid already
                // exists in the db.
                // cant move onto mountains walls cities or enemy hexes
        if (targetRecord.M){ return; }
        if (targetRecord.W){ return; }
        if (targetRecord.UID !== game.uid() && targetRecord.UID !== 0){ return; }
        if (targetRecord.C){ return; }
        if (record.A){
            db.update({hexID: record.hexID, K: 0});
        } else {
            db.update({hexID: record.hexID, K: 0, UID: 0});
        }
        db.update({hexID: targetRecord.hexID, K: 1, UID: game.uid()});
        rDB.openTransaction();
        rDB.pushUpdate(record);
        rDB.pushUpdate(targetRecord);
        rDB.closeTransaction();
    };
    var getTarget = function (dir, record){
        var targetHex = HexLib.hex_neighbor(record.h,dir);
        var targetRecord = db.query({hexID: HexLib.hexToId(targetHex)});// there must be only one so..
        if (targetRecord.length == 1){
            var t = targetRecord[0];
            return t;
        } else {
            // if the record is not in the db, it must be an empty square, so create an empty record
            // and return it
            return game.util.createRecord({hexID: HexLib.hexToId(targetHex)});
        }
    };
    var oneMove = function (dir, record){
        // rules
        // 1. cant move onto mountains
        // 2. cant move troops that arn't yours
        // console.log("oneMove");
        var a, r, totalTroops, c;
        var targetRecord = getTarget(dir, record);
        var mUID, tUID;
        // console.log("targetRecord");
        // game.util.printRecord(targetRecord);
        // console.log("record");
        // game.util.printRecord(record);
        if (targetRecord.M){ return; }// rule 1;
        if (record.UID != game.uid()){ return; }// rule 2;
        if (targetRecord.W){
            var wallStrength = targetRecord.W;
            var troops = record.A;
            if (troops > wallStrength){
                var newTroops = troops - wallStrength;
                db.update({hexID: targetRecord.hexID, A: newTroops, UID: record.UID, W: 0, S: 1});
                db.update({hexID: record.hexID, A: 0, UID: 0, S: 0});
            } else if (troops < wallStrength){
                var newWall = wallStrength - troops;
                db.update({hexID: targetRecord.hexID, W: newWall});
                db.update({hexID: record.hexID, UID: 0, A: 0, S: 0});
            } else {
                db.update({hexID: targetRecord.hexID, W: 0, A: 0, UID: 0});
                db.update({hexID: record.hexID, W: 0, A: 0, UID: 0});
            }
            updatedRecords.push(targetRecord);
            updatedRecords.push(record);
            return;
        }
        if (targetRecord.UID == record.UID){
            // we own this square so combine our armies up to the limit, remainder stays in the
            // orig hex
            // console.log("combining with our army");
	    totalTroops = targetRecord.A + record.A;
            a = totalTroops - kTroopLimit;
	    
            // console.log("total troops :"+totalTroops+"a:"+a);
            if ((totalTroops) > kTroopLimit){
                //console.log('exceeding troop limit');
                db.update({hexID: record.hexID, A: a, S: 1});
		db.update({hexID: targetRecord.hexID, A: kTroopLimit, S: 1});
            } else {
                // console.log("comine all troops");
                // if there are no troops left, we don't own this square any longer
                // unless the square we are leaving is a city or king
		if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
		if (trailsOn){
		    db.update({hexID: record.hexID, A: 1, UID: game.uid(), S: 0});
		    db.update({hexID: targetRecord.hexID, A: totalTroops - 1, S: 1});
		} else {
                    db.update({hexID: record.hexID, A: 0, UID: mUID, S: 0});
		    db.update({hexID: targetRecord.hexID, A: totalTroops, S: 1});
		}
            }
            updatedRecords.push(targetRecord);
            updatedRecords.push(record);
	    return;
        }
        if (record.UID !== targetRecord.UID && targetRecord.UID != 0){
            // console.log("attack");
            // this is an attack so ...
            if (targetRecord.A > record.A){
                // the attacked square wins the battle
                a = targetRecord.A - record.A;
		if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
                db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                db.update({hexID: targetRecord.hexID, A: a, S: 0});
            }else if (record.A > targetRecord.A){
                // we win the battle .
                a = record.A - targetRecord.A;
                // keep position of citys and queens if they are in the
                // square we are leaving to attack
		if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
		c = targetRecord.C;
                // if we were attacking a city it is destroyed
		if (targetRecord.C){ c = 0; }
                // if we were attacking a queen it becomes a city;
                // and the queen dies.
		if (targetRecord.K){
		    c = 1;
		}
                db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                db.update({hexID: targetRecord.hexID, A: a, UID: game.uid(), S: 1, C: c, K: 0});
            } else {
                // this is a tie. the original owners stay put and all
                // armies are destroyed.
		if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
		if (targetRecord.C || targetRecord.K){ tUID = targetRecord.UID; } else { tUID = 0; }
		db.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                db.update({hexID: targetRecord.hexID, A: 0, S: 1, UID: tUID});
	    }
            updatedRecords.push(targetRecord);
            updatedRecords.push(record);
	    return;
        }
        if (targetRecord.UID == 0){
            // console.log("move to empty square");
            // the target is an empty square , move the troops and update the ownership
	    if (trailsOn && record.A > 10){
		a = record.A - 10;
		r = 10;
		mUID = record.UID;
	    } else {
		a = record.A;
		r = 0;
		mUID = 0;
	    }
            db.update({hexID: targetRecord.hexID, UID: game.uid(), A: a, S: 1});
            if (record.K || record.C){
                // the king does not lose ownership when it has no troops
                db.update({hexID: record.hexID, A: r, S: 0});
            } else {
		db.update({hexID: record.hexID, UID: mUID, A: r, S: 0});
            }
        }
        updatedRecords.push(targetRecord);
        updatedRecords.push(record);
    };
    var requestHexInSquare = function (square){
//        console.log("requestHexInSquare");
        //console.log(square);
        var records = db.query(function (r){ return matchGeography(r, square); });
//        console.log("records.length "+records.length);
//	records.forEach(game.util.printRecord);
        if(square.select==='shift'){
            records.forEach(function(r){if(r.A){db.update({hexID:r.hexID,S:1});}
                                               });
        }
        if(square.select==='control'){
            records.forEach(function(r){if(r.A==0 && r.C===0 && r.K===0 && r.M===0){db.update({hexID:r.hexID,S:1});}
                                               });
        }
	
        records.forEach(function (r){ radio('draw-hexagon').broadcast(r); });
    };
    var ping = function (){
        // the ping originates for a selected army if there is only 1
        // the ping originates from the queen if there are no selected armies
        // else nothing happens.
        // pings cost a lot.
        if (gold < kPingCost){
	    //TODO post a message explaining why not enough gold for a ping
	    return; }
        var h;
        var records = db.matchSelectedArmies();
        if (records.length == 1){
            h = records[0].h;
        } else if (records.length == 0){
            records = db.matchQueen();
            h = records[0].h;
        } else {
	    //TODO explain that you can only have 0 or 1 army selected to origin the ping
	    return; }
        //console.log('ping origin ' + HexLib.hexToId(h));
        var pingData = createPingData(h);
        //gold = 0;// kPingCost;
        radio('draw-gold').broadcast(gold);
        radio('ping-data').broadcast(pingData);
    };
    var createPingData = function (h){
        var records = db.query(function (r){ return matchRange(r, h); });
        var pingData = [];
	var t , p;
	//console.log("h "+h.q+" "+h.r+" "+h.s);
        records.forEach(function (r){
	    //recenter the hexes around the ping source (h)
	    t = r.h;
	    t = HexLib.hex_subtract(t,h);
	   // console.log("r "+r.h.q+" "+r.h.r+" "+r.h.s);
	    //console.log("t "+t.q+" "+t.r+" "+t.s);
	    t.UID=r.UID;
	    pingData.push(t);
	    
        });
        //console.log(pingData);
        return pingData;
    };
    var addPlayerNameToList = function (r){
        playerMap[r.UID] = r.name;
    };

    var initModule = function (playerName){
        if (!playerName){ playerName = 'anonymous'; };
        rDB.initModule({location: game.world() + '/updates', callback: update},
                       {location: game.world() + '/users', callback: addPlayerNameToList},
                       {location: game.world() + '/world'});

        rDB.pushUser({UID: game.uid(), name: playerName});
      // spawn the king
      // TODO spawn the king away from everyone else.

//        initializeWorld();
//	rDB.tryUpdate();
        rDB.joinWorld(createKing);
      // createKing();
        updateIntervalID = setInterval(oneSecondUpdate, 1000);
      // setTimeout(oneSecondUpdate,10000);
        radio('toggle-selection').subscribe(toggleSelection);
        radio('build-wall').subscribe(buildWalls);
        radio('build-city').subscribe(buildCities);
        radio('toggle-trails').subscribe(toggleTrails);
        radio('toggle-queen').subscribe(toggleQueen);
        radio('move').subscribe(move);
        radio('dump-database').subscribe(dumpDatabase);
        radio('clear-selection').subscribe(clearSelection);
        radio('request-hex-in-square').subscribe(requestHexInSquare);
        radio('ping').subscribe(ping);

        // radio('debug-clear-fb').subscribe(clearFb);
        radio('stop-updates').subscribe(stopUpdates);
        radio('dump-transactions').subscribe(dumpTransactions);
        return true;
    };
    var stopUpdates = function (){
        clearInterval(updateIntervalID);
    };
    var dumpTransactions = function (){
                // console.log("dump transactions");
        var trans = updatesDb.query(function (r){ return true; });
        trans.sort(function (a, b){ return a.seq - b.seq; });
        radio('debug-transactions').broadcast(trans);
    };
  // End public method /initModule/

  // return public methods
    return {
        initModule          : initModule,
        queenLocation : queenLocation
    };
  // ------------------- END PUBLIC METHODS ---------------------
}());
