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

    return {
        getRandomIntInclusive : getRandomIntInclusive,
        createRecord          : createRecord
    };

}());
