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
     var s = "";
     for (var k in record) {
         if (typeof record[k] === 'object') {
           s = s + k + " { " + formatRecord(record[k]) + " }, " ;
         } else {
             s = s + k + ":" + record[k] + ", ";
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
    var fBRecordsEqual = function(a,b){
        if(!a){
            if( !b){return true;}
            else{
                if(b.hasOwnProperty('UID')){return false;}
                if(b.hasOwnProperty('A')){return false;}
                if(b.hasOwnProperty('C')){return false;}
                if(b.hasOwnProperty('K')){return false;}
                if(b.hasOwnProperty('W')){return false;}
                if(b.hasOwnProperty('M')){return false;}
                return true;
            }
        }else{
        var t1 = testProperty('UID',a,b);
        var t2 = testProperty('A',a,b);
        var t3 = testProperty('C',a,b);
        var t4 = testProperty('K',a,b);
        var t5 = testProperty('W',a,b);
        var t6 = testProperty('M',a,b);
            return t1 && t2 && t3 && t4 && t5 && t6 ;
        }
    };
    var testProperty = function(p,a,b){
        if(a.hasOwnProperty(p)){
            if(b.hasOwnProperty(p)){
                if(a[p] === b[p]){return true;}return false;
            }
            return false;
        }else if(!b.hasOwnProperty(p)){
            return true;
        }
        return false;
            
        
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
      fBRecordsEqual : fBRecordsEqual,
    getID: getID
  };
})();

