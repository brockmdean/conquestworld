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
        if (r.V){
            if (square.x <= r.x && r.x <= square.x + square.width &&
                           square.y <= r.y && r.y <= square.y + square.height){
                                         return true;
                                 }
        }
        return false;
    };
    var matchRange = function (r, point){
        if (r.UID != 0){
            var xdiff = r.x - point.x;
            var ydiff = r.y - point.y;
            var d = xdiff * xdiff + ydiff + ydiff;
            if (d < kPingRangeSquared){ return true; }
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
    var gold = 100;
    var kTroopLimit = 100;
    var kCityCost = 100;
    var kCityCostIncr = 100;
    var kWallCost = 50;
    var kWallStrength = 100;
    var kPingCost = 1000;
    var kPingRange = 100;
    var kPingRangeSquared = kPingRange * kPingRange;
    var trailsOn = false;
    var queenOn = false;
    var updateIntervalID;
    var seqNum = 0;
    var sendSeq = 0;
    var initialKingLocation;
    var playerMap = {};
  // ----------------- END MODULE SCOPE VARIABLES ---------------

  // ------------------- BEGIN UTILITY METHODS ------------------
  // example : getTrimmedString
  // Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
    var getRandomIntInclusive = function (min, max){
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    var createRecord = function (keys){
          var r = {UID: 0, hexID: '', x: 0, y: 0, K: 0, C: 0, W: 0, A: 0, S: 0, V: 0, M: 0};
          for (var k in keys){
                  r[k] = keys[k];
          }
          var id = keys.hexID;
          var xy = id.split('_');
          r.x = xy[0];
          r.y = xy[1];
          // console.log("createRecord ");
          // console.log(r);
          return r;
    };
    var dumpDatabase = function (){
          console.log('-------- dumpDatabase!!!!');
          db.print();
          console.log('end-------- dumpDatabase!!!!');
    };
    var printRecord = function (record){
          var s = 'record ';
          for (var k in record){
                  s = s + k + ' ' + record[k] + ' ';
          }
          console.log(s);
    };
        // retrun an array of neighbors for the given hex
        // and put them in the db if they are not there.
    var findNeighbors = function (r){
        var neighbors = [];
        var neighborIDs = [];
        var x, y;
        var xy = r.hexID.split('_');
        var t;
                // console.log("find neighbors of "+r.hexID);
                // crazy , the - is being treated as a subtraction
                // but the + is being treated as a string concatenation
                // force the addition interpretation by using parseint.
//TODO move the parsint calls to the top, so I don't have to make so many 

        x = xy[0] - 1;
        y = xy[1];
        neighborIDs.push(x + '_' + y);
        x = parseInt(xy[0]) + 1;
        y = xy[1];
        neighborIDs.push(x + '_' + y);
        x = xy[0];
        y = xy[1] - 1;
        neighborIDs.push(x + '_' + y);
        x = xy[0];
        y = parseInt(xy[1]) + 1;
        neighborIDs.push(x + '_' + y);

        if (parseInt(xy[0]) % 2 == 0){
            x = parseInt(xy[0]) + 1;
            y = parseInt(xy[1]) - 1;
        } else {
            x = parseInt(xy[0]) + 1;
            y = parseInt(xy[1]) + 1;
        }
        neighborIDs.push(x + '_' + y);

        if (parseInt(xy[0]) % 2 == 0){
            x = parseInt(xy[0]) - 1;
            y = parseInt(xy[1]) - 1;
        } else {
            x = parseInt(xy[0]) - 1;
            y = parseInt(xy[1]) + 1;
        }
        neighborIDs.push(x + '_' + y);
                // console.log("findneighbors!!");
                // neighborIDs.forEach(function(r){console.log(r)});
        for (var i = 0; i < neighborIDs.length; i++){
            if (db.keyExists(neighborIDs[i])){
                t = db.query({hexID: neighborIDs[i]});
                neighbors.push(t[0]);
            } else {
                t = createRecord({hexID: neighborIDs[i]});
                neighbors.push(t);
                db.insert(t);
            }
        }
        return neighbors;
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
                        // newRecord=createRecord({'hexID':hexID,S:1});
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
                // printRecord(r);
                // because the selected (S) field is sometimes passed through
                // fb, here we can get selected tiles that we did not select.
                // so clear the selected field if this tile is not ours.
                // and set the Visibility if the hex is ours

                // printRecord(r);
        if (!db.keyExists(r.hexID)){
            // if the record does not exist this rule applies
            if (r.UID !== game.uid()){ r.S = 0; r.V = 0; } else { r.V = 1; }
	    
            // console.log("insert a new record from fb");
            // printRecord(r);
            db.insert(r);
        } else {
            if (r.UID !== game.uid()){ r.S = 0; }
            // if the record does exist, keep the local visibility
            // console.log("update a record from fb")
            localR = db.query({hexID: r.hexID});
            localV = localR[0].V;
            // printRecord(localR[0]);
            // printRecord(r);
            r.V = localV;
	    
            // printRecord(r);
            // console.log("there are "+records.length+" records with "+r.hexID);
            // printRecord(r);
	    
            // here we need to check for winning and loosing.
            // so get the current state of the hex.
            // because the update is just going to have K =0, but
            // if it currently is K=1, our queen just died.
            queenR = db.query(matchQueen)[0];
            // console.log("queen R ");
            // printRecord(queenR);
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
            // n.forEach(printRecord);
            n.forEach(function (_r){
                // printRecord(_r);
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
        var x, y, r;
        do { // make sure we don't spawn on an occupied location.
                 x = getRandomIntInclusive(5, 200);
                 y = getRandomIntInclusive(5, 200);
                         r = db.query({hexID: x + '_' + y});
                         if (r.length == 0){ done = true; }
        } while (!done);

        rDB.openTransaction();
        var r = createRecord({UID: game.uid(), 'hexID': x + '_' + y, K: 1, A: 5});
        rDB.pushUpdate(r);
        //      for(var i =1; i<10;i++){
        //              r = createRecord({UID:"qwerqwef",'hexID':(x+i*10)+"_"+y,A:5});
        //              rDB.pushUpdate(r);
        //      }
        //      playerMap["qwerqwef"]="man";
                // var m = createRecord({hexID:(x+1)+"_"+y,M:getRandomIntInclusive(0,3)});
                // this string was 126 bytes long.
                // var JSONstringR = JSON.stringify(r);
                // console.log(r);
                // console.log(JSONstringR);
                // console.log("length "+JSONstringR.length);
                // var backR= JSON.parse(JSONstringR);
                // console.log(backR);

                // rDB.pushUpdate(m);
        rDB.closeTransaction();
        console.log('creating king at x:' + x + ' y:' + y);
        initialKingLocation = {x: x, y: y};
    };
    var createdKingLocation = function (){ return initialKingLocation; };
    var initializeWorld = function (){
          // here we would download the db and send a bunch of messages to the drawlayser
          // TODO download the database

          // make some mountians
          for (var i = 0; i < 900; i++){
                  var x = getRandomIntInclusive(0, 300);
                  var y = getRandomIntInclusive(0, 300);
                        // var r = createRecord({hexID:x+"_"+y,M:getRandomIntInclusive(1,2)});
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
                // potentialDecaySites.forEach(printRecord);
        potentialDecaySites.forEach(doDecay);
    };
    var doDecay = function (r){
                // console.log('------doDecay');
                // printRecord(r);
                // console.log("uid "+game.uid());
        var neighbors = findNeighbors(r);
                // neighbors.forEach(printRecord);
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
          console.log('buildCity r:' + record.A + ' ' + record.W + ' ' + record.K + ' ' + record.M + ' ' + gold);
        console.log('city cost ' + kCityCost);
                // printRecord(record);
          if (record.C == 0 && record.W == 0 && record.K == 0 && record.M == 0 && gold > kCityCost){
                  console.log('empty and enough gold');
                  gold -= kCityCost;
      kCityCost += kCityCostIncr;
      radio('update-city-cost').broadcast(kCityCost);
      record.C = 1;
      if (record.UID == 0){ record.UID = game.uid(); }
                        // printRecord(record);
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
          if (record.A == 0 && record.W == 0 && record.K == 0 && record.M == 0 && gold > kWallCost){
                  gold -= kWallCost;
                  rDB.pushUpdate(createRecord({'hexID': record.hexID, W: kWallStrength}));
                  radio('draw-gold').broadcast(gold);
          }
    };
    var geoSort = function (dir){
          if (dir == 'north'){
              return function (a, b){ return a.y - b.y; };
          }
          if (dir == 'south'){
      return function (a, b){ return b.y - a.y; };
          }
          if (dir == 'east'){
                  return function (a, b){ return b.x - a.x; };
          }
          if (dir == 'west'){
                  return function (a, b){ return a.x - b.x; };
          }
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
          moveDb = simpleTable.create();
        moveDb.uniqueKey('hexID');
        moveDb.Fields(['hexID', 'x', 'y', 'UID', 'K', 'C', 'W', 'A', 'S', 'V', 'M']);
          records.forEach(function (r){ moveDb.insert(r); });
          records.forEach(function (record){ buildMoveDb(dir, record); });
          records = moveDb.query(matchSelected);
          // console.log("move database has "+records.length+" records");
          // sort the records by direction of move, so that the leading edge goes first.
                // console.log("=======GeoSort "+dir);
          records.sort(geoSort(dir));
                // console.log("=======GeoSort "+dir);
          records.forEach(function (record){ oneMove(dir, record); });
          var updatedRecords = moveDb.query(function (r){ return true; });
          // console.log("updated records");
          // updatedRecords.forEach(function(r){console.log(r)});
        rDB.openTransaction();
          updatedRecords.forEach(rDB.pushUpdate);
        rDB.closeTransaction();
    };
    var moveQueen = function (dir){
                // var records = db.query(matchQueen);
        var record = db.matchQueen()[0];
                // printRecord(record);
        var targetRecord = getTarget(dir, record, false);
                // printRecord(targetRecord);
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
    var buildMoveDb = function (dir, record){
          var target = getTarget(dir, record, false);
          // console.log("buildMoveDb : dir "+dir+" r:");
          // printRecord(target);
          // console.log(record);
          // console.log("buildMoveDb : T ");
          // console.log(target);
          moveDb.insert(target);
    };
    var getTarget = function (dir, record, useShadowDb){
          var x = record.x;
          var y = record.y;
          var targetX = x, targetY = y;
          var targetRecord;
          if (dir == 'north'){
      targetY--;
          }
          if (dir == 'south'){
      targetY++;
          }
          if (dir == 'east'){
      targetX++;
          }
          if (dir == 'west'){
      targetX--;
          }
          var targetHex = targetX + '_' + targetY;
          if (!useShadowDb){
                  // console.log("use db");
      targetRecord = db.query({hexID: targetHex});// there must be only one so..
          } else {
                  // console.log("use shadow db");
                  targetRecord = moveDb.query({hexID: targetHex});
          }
          if (targetRecord.length == 1){
                 var t = targetRecord[0];
                 return t;
          } else {
                  // if the record is not in the db, it must be an empty square, so create an empty record
                  // and return it
                  return createRecord({hexID: targetHex});
          }
    };
    var oneMove = function (dir, record){
          // rules
          // 1. cant move onto mountains
          // 2. cant move troops that arn't yours
          // console.log("oneMove");
          var a, r, totalTroops, c;
          var targetRecord = getTarget(dir, record, true);
        var mUID, tUID;
          // console.log("targetRecord");
          // printRecord(targetRecord);
          // console.log("record");
          // printRecord(record);
          if (targetRecord.M){ return; }// rule 1;
          if (record.UID != game.uid()){ return; }// rule 2;
        if (targetRecord.W){
            var wallStrength = targetRecord.W;
            var troops = record.A;
            if (troops > wallStrength){
                var newTroops = troops - wallStrength;
                moveDb.update({hexID: targetRecord.hexID, A: newTroops, UID: record.UID, W: 0, S: 1});
                moveDb.update({hexID: record.hexID, A: 0, UID: 0, S: 0});
            } else if (troops < wallStrength){
                var newWall = wallStrength - troops;
                moveDb.update({hexID: targetRecord.hexID, W: newWall});
                moveDb.update({hexID: record.hexID, UID: 0, A: 0, S: 0});
            } else {
                moveDb.update({hexID: targetRecord.hexID, W: 0, A: 0, UID: 0});
                moveDb.update({hexID: record.hexID, W: 0, A: 0, UID: 0});
            }
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
                          console.log('exceeding troop limit');
                          moveDb.update({hexID: record.hexID, A: a, S: 1});
      moveDb.update({hexID: targetRecord.hexID, A: kTroopLimit, S: 1});
                  } else {
                                // console.log("comine all troops");
                          // if there are no troops left, we don't own this square any longer
                                // unless the square we are leaving is a city or king
      if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
      if (trailsOn){
          moveDb.update({hexID: record.hexID, A: 1, UID: game.uid(), S: 0});
          moveDb.update({hexID: targetRecord.hexID, A: totalTroops - 1, S: 1});
      } else {
                                moveDb.update({hexID: record.hexID, A: 0, UID: mUID, S: 0});
          moveDb.update({hexID: targetRecord.hexID, A: totalTroops, S: 1});
      }
                  }
      return;
          }
          if (record.UID !== targetRecord.UID && targetRecord.UID != 0){
                  // console.log("attack");
                  // this is an attack so ...
                  if (targetRecord.A > record.A){
                          // the attacked square wins the battle
                          a = targetRecord.A - record.A;
      if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
                          moveDb.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                          moveDb.update({hexID: targetRecord.hexID, A: a, S: 0});
                  }               else if (record.A > targetRecord.A){
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
                          moveDb.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                          moveDb.update({hexID: targetRecord.hexID, A: a, UID: game.uid(), S: 1, C: c, K: 0});
                  } else {
                                // this is a tie. the original owners stay put and all
                                // armies are destroyed.
      if (record.C || record.K){ mUID = record.UID; } else { mUID = 0; }
      if (targetRecord.C || targetRecord.K){ tUID = targetRecord.UID; } else { tUID = 0; }
      moveDb.update({hexID: record.hexID, A: 0, S: 0, UID: mUID});
                          moveDb.update({hexID: targetRecord.hexID, A: 0, S: 0, UID: tUID});
  }
      return;
          }
          if (targetRecord.UID == 0){
                  // console.log("move to empty square");
                  // the target is an empty square , move the troops and update the ownership
      if (trailsOn && record.A > 1){
          a = record.A - 1;
          r = 1;
          mUID = record.UID;
      } else {
          a = record.A;
          r = 0;
          mUID = 0;
      }
                  moveDb.update({hexID: targetRecord.hexID, UID: game.uid(), A: a, S: 1});
                  if (record.K || record.C){
                          // the king does not lose ownership when it has no troops
                          moveDb.update({hexID: record.hexID, A: r, S: 0});
                  } else {
      moveDb.update({hexID: record.hexID, UID: mUID, A: r, S: 0});
                  }
          }
    };
    var requestHexInSquare = function (square){
        console.log("requestHexInSquare");
        console.log(square);
        var records = db.query(function (r){ return matchGeography(r, square); });
        // console.log("records.length "+records.length);
	// records.forEach(printRecord);
        if(square.select){
            records.forEach(function(r){if(r.A){db.update({hexID:r.hexID,S:1})}
                                               });
        }
        records.forEach(function (r){ radio('draw-hexagon').broadcast(r); });
    };
    var ping = function (){
                // the ping originates for a selected army if there is only 1
                // the ping originates from the queen if there are no selected armies
                // else nothing happens.
                // pings cost a lot.
        if (gold < kPingCost){ return; }
        var point = {};
        var records = db.matchSelectedArmies();
        if (records.length == 1){
            point = {x: records[0].x, y: records[0].y};
        } else if (records.length == 0){
            records = db.matchQueen();
            point = {x: records[0].x, y: records[0].y};
        } else { return; }
        console.log('ping origin ' + point.x + ' ' + point.y);
        var pingData = createPingData(point);
        gold = 0;// kPingCost;
        radio('draw-gold').broadcast(gold);
        radio('ping-data').broadcast(pingData);
    };
    var createPingData = function (point){
        var records = db.query(function (r){ return matchRange(r, point); });
        var pingData = [];
        var x, y;
        records.forEach(function (r){
                        // this record is owned by a us
                        // TODO need to normalize teh xy to thecenter of the image.
            x = parseInt(r.x) - point.x + kPingRange;
            y = parseInt(r.y) - point.y + kPingRange;
            if (r.UID == game.uid()){
                pingData.push({x: x, y: y, v: 1});
            } else {
                                // owned by someone else
                pingData.push({x: x, y: y, v: 2});
            }
        });
        console.log(pingData);
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
        radio('launch-complete').broadcast();
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
        createdKingLocation : createdKingLocation
    };
  // ------------------- END PUBLIC METHODS ---------------------
}());
