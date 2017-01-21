/* global game,  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */



game.util = (function (){

    var assert = function(b,m){
        if(!b){throw "Assert failed "+ m;}
    };
  // Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!               
    var getRandomIntInclusive = function (min, max){
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    var createRecord = function (keys){
        var r = {UID: 0, hexID: '', K: 0, C: 0, W: 0, A: 0, S: 0, V: 0, M: 0};
        assert(keys.hexID,"createRecord missing required field hexID");
        for (var k in keys){
            if(k =='x' || k=='y' ){throw "invalid key "+k+ " at creatRecord";}
            r[k] = keys[k];
        }
        var id = keys.hexID;
        r.h = HexLib.idToHex(id);
        
        // console.log("createRecord ");
        // console.log(r);
        return r;
    };
    var printRecord = function (record){
          var s = 'record ';
          for (var k in record){
              if(k === 'h' ){
                  s = s + k + ' {' + record[k].q + ', ' + record[k].r + ', ' + record[k].s + ' } '; 
              }else{
                  s = s + k + ' ' + record[k] + ' ';
              }
          }
          console.log(s);
    };
    
    return {
        getRandomIntInclusive : getRandomIntInclusive,
        createRecord          : createRecord,
        printRecord           : printRecord
    };

}());
