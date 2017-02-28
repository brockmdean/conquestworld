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
//    var cg = document.getElementById("GameBoard").webkitRequestFullscreen();
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
      //radio('debug-transactions').subscribe(debugTransactions);
      //radio("diff").subscribe(displayDiff);
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

