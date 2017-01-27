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
  var deflateRecord = function(r) {
    //remove all 0 fields
    //remove the h field , it can be recalculated from the hexID
    //remove S,V,Marked always
    delete r.S;
    delete r.V;
    delete r.Marker;
    delete r.Cursor;
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

  var recordsEqual = function(a,b){
    // a record is the same if 
    if(a.A !== b.A){return false;}
    if(a.C !== b.C){return false;}
    if(a.W !== b.W){return false;}
    if(a.K !== b.K){return false;}
    return true;
  };
  return {
    getRandomIntInclusive: getRandomIntInclusive,
    deflateRecord: deflateRecord,
    inflateRecord: inflateRecord,
    createRecord: createRecord,
    printRecord: printRecord,
    recordsEqual : recordsEqual
  };
})();

