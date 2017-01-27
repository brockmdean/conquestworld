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
  var matchRange = function(r, h) {
    if (r.UID != 0) {
      var d = HexLib.hex_distance(h, r.h);
      return d < kPingRange;
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
  var moveDb;
  var gold = 200000;
  var kTroopLimit = 100;
  var kCityCost = 100;
  var kCityCostIncr = 100;
  var kWallCost = 100;
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
  var updatedRecords = [];
  var cursorRecord;
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
        neighborRecords.push(t);
        db.insert(t);
        rDB.pushUpdate(t);
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
    db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    cursorRecord.Cursor = 0;
    radio("draw-hexagon").broadcast(cursorRecord);

    // console.log("game.model received toggle-selection message"+data.hexID);
    // console.log("count "+records.length);
    // assert that there is only one record
    // if(records.length>1){console.log("toggleSelection found "+records.length+" records")}
    record = records[0];
    cursorRecord = record;
    radio("draw-hexagon").broadcast(cursorRecord);
    if (!record.V) {
      return;
    }
    if (record.UID !== game.uid() && record.UID !== 0) {
      return;
    }
    selected = record.S;
    if (selected == 1) {
      selected = 0;
    } else {
      selected = 1;
    }
    db.update({ hexID: record.hexID, S: selected, Cursor: 1 });
    record.S = selected;
    radio("draw-hexagon").broadcast(record);
  };
  var clearSelection = function() {
    var records = db.matchSelected();
    records.forEach(function(r) {
      r.S = 0;
      db.update(r);
      radio("draw-hexagon").broadcast(r);
    });
  };
  //    var updateWorld = function (r){
  //        db.insert(r);
  //    };
  var update = function(record) {
    // console.log("recieved a record update from fb");
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
    //game.util.printRecord(r);
    // because the selected (S) field is sometimes passed through
    // fb, here we can get selected tiles that we did not select.
    // so clear the selected field if this tile is not ours.
    // and set the Visibility if the hex is ours
    // game.util.printRecord(r);
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
      if (game.util.recordsEqual(r, localR[0])) {
        return;
      }
      window.updateWorkCount++;
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
        r.Cursor = localR[0].Cursor;
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
      if (queenR && r.hexID == queenR.hexID) {
        // we are updating the queen
        if (r.K == 0 && queenR.K == 1) {
          // we died.
          // now update all our cits to the new owner.
          // console.log("we are loosing");
          myCities = db.matchCities();
          newOwner = r.UID;
          rDB.openTransaction();
          myCities.forEach(function(_r) {
            _r.UID = newOwner;
            _r.V = 0;
            rDB.pushUpdate(_r);
          });
          rDB.closeTransaction();
          radio("losing-message").broadcast();
        }
      }
      db.update(r);
    }
    if (r.V || game.visibility()) {
      radio("draw-hexagon").broadcast(r);
    }

    // update the visibility of the neighbors
    if (r.UID == game.uid() && (r.A || r.C || r.K || r.W)) {
      n = findNeighbors(r);
      n.forEach(function(_r) {
        if (!_r.V) {
          _r.V = 1;
          db.update(_r);
          window.neighborDrawing++;
          radio("draw-hexagon").broadcast(_r);
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
    var x, y, z, r;
    do {
      // make sure we don't spawn on an occupied location.
      x = game.util.getRandomIntInclusive(5, 200);
      y = game.util.getRandomIntInclusive(5, 200);
      z = -x - y;
      r = db.query({ hexID: x + "_" + y + "_" + z });
      if (r.length == 0) {
        done = true;
      }
    } while (!done);
    //console.log('creating king at x:' + x + ' y:' + y + ' z:'+ z);
    //console.log('ocnstraint x+y+z= 0 :'+ (x+y+z));
    var h = HexLib.Hex(x, y, z);
    rDB.openTransaction();
    var r = game.util.createRecord({
      UID: game.uid(),
      hexID: HexLib.hexToId(h),
      K: 1,
      A: 5,
      h: h,
      V: 1,
      Cursor: 1
    });
    cursorRecord = r;
    db.insert(r);
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
    radio("center-on-queen").broadcast(h, true);
    radio("launch-complete").broadcast();
  };
  var queenLocation = function() {
    var rs = db.matchQueen();
    return rs[0].h;
  };
  var initializeWorld = function() {
    // here we would download the db and send a bunch of messages to the drawlayser
    // TODO download the database
    // make some mountians
    for (var i = 0; i < 900; i++) {
      var x = game.util.getRandomIntInclusive(0, 300);
      var y = game.util.getRandomIntInclusive(0, 300);
      // var r = game.util.createRecord({hexID:x+"_"+y,M:game.util.getRandomIntInclusive(1,2)});
      // rDB.updateWorldCoordinate(r);
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
    // console.log("genNewTroop "+record);
    rDB.openTransaction();
    rDB.pushUpdate(newRecord);
    rDB.closeTransaction();
  };
  var oneSecondUpdate = function() {
    //console.log("oneSecondUpdate");
    // update army generation at cities and king
    // console.log("simpleTable record count "+db.recordCount());
    // console.log("rDB "+rDB.bandwidth());
    // update gold for occupied land
    var records = db.myHex();
    var newGold = records.length;
    //console.log("new gold :"+newGold);
    gold += newGold;
    radio("draw-gold").broadcast(gold);
    var troopSites = db.matchTroopSites();
    //console.log("troop sites "+troopSites.length);
    troopSites.forEach(generateNewTroop);
    computeLeaderBoard();
  };

  var computeLeaderBoard = function() {
    var UIDpairs = [];
    var leaderBoard;
    // console.log("computeLeaderBoard");
    var UIDsumArmys = db.sumAllUniqueField("UID", "A");
    // console.log(UIDsumArmys);
    var UIDs = Object.keys(UIDsumArmys);
    UIDs.forEach(function(r) {
      if (r != 0) {
        UIDpairs.push({ UID: r, score: UIDsumArmys[r] });
      }
    });

    UIDpairs.sort(function(a, b) {
      return b.score - a.score;
    });
    // console.log(UIDpairs);
    var myIndex = UIDpairs.findIndex(function(r) {
      return r.UID == game.uid();
    });

    // collect the top 5 scores, but always include our score
    if (myIndex > 4) {
      leaderBoard = UIDpairs.slice(0, 4);
      leaderBoard[4] = { UID: game.uid(), score: UIDsumArmys[game.uid()] };
    } else {
      leaderBoard = UIDpairs.slice(0, 5);
    }
    leaderBoard.forEach(function(r) {
      r.name = playerMap[r.UID];
    });
    // console.log(leaderBoard);
    radio("draw-leader-board").broadcast(leaderBoard);
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
    cities.forEach(game.util.printRecord);
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
    console.log(
      "buildCity r:" +
        record.A +
        " " +
        record.W +
        " " +
        record.K +
        " " +
        record.M +
        " " +
        gold
    );
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
    for (let i = 0; i < exp; i++) {
      thisWallCost *= 2;
    }
    thisWallCost *= kWallCost;
    if (
      record.A == 0 &&
        record.K == 0 &&
        record.M == 0 &&
        record.C == 0 &&
        gold >= thisWallCost
    ) {
      totalWallsBuilt++;
      totalWallCost += thisWallCost;
      gold -= thisWallCost;
      rDB.pushUpdate(
        game.util.createRecord({
          hexID: record.hexID,
          W: kWallStrength + record.W,
          UID: game.uid()
        })
      );
      radio("draw-gold").broadcast(gold);
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
    db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    radio("draw-hexagon").broadcast(cursorRecord);
    cursorRecord = targetRecord;
    db.update({ hexID: cursorRecord.hexID, Cursor: 1, S: 1 });
    radio("draw-hexagon").broadcast(cursorRecord);
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
    console.log("drew : " + window.neighborDrawing);
    console.log("update : " + window.updateCount);
    console.log("update work : " + window.updateWorkCount);
  };
  var moveQueen = function(dir) {
    // var records = db.query(matchQueen);
    var record = db.matchQueen()[0];
    // game.util.printRecord(record);
    var targetRecord = getTarget(dir, record);
    if (targetRecord.M) {
      return;
    }
    if (targetRecord.UID !== game.uid() && targetRecord.UID != 0) {
      return;
    }
    if (record.A || record.C || record.W) {
      //            db.update({hexID: record.hexID, K: 0});
      record.K = 0;
    } else {
      db.update({ hexID: record.hexID, K: 0, UID: 0 });
      record.K = 0;
      record.UID = 0;
    }
    //if the queen is moving , keep the cursor with her.
    db.update({ hexID: cursorRecord.hexID, Cursor: 0 });
    cursorRecord = targetRecord;
    db.update(r);
    db.update({ hexID: targetRecord.hexID, K: 1, UID: game.uid(), Cursor: 1 });
    rDB.pushUpdate(record);
    rDB.pushUpdate(targetRecord);
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
    if (record.Cursor) {
      record.Cursor = 0;
      targetRecord.Cursor = 1;
      cursorRecord = targetRecord;
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
        if (r.A == 0 && r.C === 0 && r.K === 0 && r.M === 0) {
          db.update({ hexID: r.hexID, S: 1 });
        }
      });
    }

    records.forEach(function(r) {
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
      //TODO explain that you can only have 0 or 1 army selected to origin the ping
      return;
    }
    //console.log('ping origin ' + HexLib.hexToId(h));
    var pingData = createPingData(h);
    gold = 0;
    // kPingCost;
    radio("draw-gold").broadcast(gold);
    radio("ping-data").broadcast(pingData);
  };
  var createPingData = function(h) {
    var records = db.query(function(r) {
      return matchRange(r, h);
    });
    var pingData = [];
    var t, p;
    //console.log("h "+h.q+" "+h.r+" "+h.s);
    records.forEach(function(r) {
      //recenter the hexes around the ping source (h)
      t = r.h;
      t = HexLib.hex_subtract(t, h);
      // console.log("r "+r.h.q+" "+r.h.r+" "+r.h.s);
      //console.log("t "+t.q+" "+t.r+" "+t.s);
      t.UID = r.UID;
      pingData.push(t);
    });
    //console.log(pingData);
    return pingData;
  };
  var addPlayerNameToList = function(r) {
    playerMap[r.UID] = r.name;
  };
    var totalNewTroops;
  var recruitTroops = function() {
    totalNewTroops=0;
//    console.log("recruitTroops");
    var troopSites = db.matchTroopSites();
    troopSites.forEach(recruitCity);
      radio("draw-gold").broadcast(gold);
      radio('message').broadcast("Recruited "+totalNewTroops+" for "+totalNewTroops+" gold");
  };
  var recruitCity = function(r) {
//    console.log("recruitCity");
    var a = r.A;
    var diff = kTroopLimit - a;
    if (gold < diff) {
      return;
    }
      gold -= diff;
      totalNewTroops+=diff;
      
    var newR = Object.assign({}, r);
    newR.A = kTroopLimit;
    rDB.pushUpdate(newR);
  };
  var initModule = function(playerName) {
    if (!playerName) {
      playerName = "anonymous";
    }
    rDB.initModule(
      { location: game.world() + "/updates", callback: update },
      { location: game.world() + "/users", callback: addPlayerNameToList },
      { location: game.world() + "/world" }
    );

    rDB.pushUser({ UID: game.uid(), name: playerName });
    // spawn the king
    // TODO spawn the king away from everyone else.
    //        initializeWorld();
    //      rDB.tryUpdate();
    rDB.joinWorld(createKing);
    // createKing();
    updateIntervalID = setInterval(oneSecondUpdate, 1000);
    // setTimeout(oneSecondUpdate,10000);
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
    console.log("game.model received toggle-marker message");
    console.log("count " + records.length);
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
        let index = markerRing.find(function(e) {
          return e === record.hexID;
        });
        markerRing.splice(index, 1);
      } else {
        marked = 1;
        markerRing.push(record.hexID);
      }
      db.update({ hexID: record.hexID, Marker: marked });
      record.Marker = marked;
      radio("draw-hexagon").broadcast(record);
    } else {
      radio("draw-message").broadcast("select only 1 hex to toggle a marker");
    }
  };
  var jumpNextMarker = function() {
    //console.log('marker ring');
    //console.log(markerRing);
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

