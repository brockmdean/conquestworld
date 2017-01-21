/*
 * game.js
 * Root namegamece module
*/

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $, game, uuid */

var game = (function () {
  'use strict';
  var _world="dev6";
  var _UID;
  var _visibility =false;
  var _debug=false;
  var landingHtml = '<span id = "pname"><input type="text" name="playerName" id="playerName"></input>'+
                     '<img id ="playButton" src="play.jpg">'+
                     '<BR><BR><BR><BR><BR><BR>'+
                     'Guide <BR>'+
                     'Movement keys q,w,e,a,s,d will move selected armies in the 6 directions .<BR>'+
                     'arrow keys : Move a selected armies in 4 of the 6 directions.<BR>.'+
                     '1 : Build a city, cost starts at 100 gold, current cost is displayed in 100s. or click "C" button.<BR>'+
                     '2 : Build a wall, costs 50 gold. walls take 100 troops to breach or click "W" button.<BR>'+
                     '4 : Enable Queen movement or click "Q" button.<BR>'+
                     'c : Clear all selected armies.<BR>'+
                     'p : Send a radar ping and reveal all units within 100 hex. costs at least 1000.<BR>'+
                     'x : Recenter the map on the Queen<BR>'+
                     'Click to select  a tile.<br>'+
                     'Shift click and drag to select multiple armies.<BR>'+
                     'Control click and drag to select multiple empty .<BR></span> ';

    var visibility = function(){return _visibility;};
    var world= function (w){
        if(w){
	    _world=w;
	    return _world;
        }
        else{
	    return _world;
        }
    };
    
    var uid= function (){
	return _UID;
    };
    var printRecord= function(r){
        var s="record ";
        var k;
	for( k in r){
	    s= s+k+" "+r[k]+" ";
	}
        return s;
    };
    var formatRecord = function(r){
        var s;
        s=r.ID+"  "+r.date+"   "+r.seq+" "+r.sendseq+"<br>&nbsp;&nbsp;&nbsp;"+printRecord(r.r)+"<BR>";
        return s;
    };
    var debugTransactions = function(r){
        var s="";
        
        //console.log("game---debugTransactions");
        //console.log(r);
        r.forEach(function(_r){s=s+formatRecord(_r);});
        if(_debug){
            $('#debug_transactions').append(s);
        }
    };
    
    var initGame = function(){
        var name ;
        name = $('#playerName').val();
        //console.log(name);
        $('#pname').remove();
        $('#ConquestWorld').append("<canvas id='GameBoard' width=\"1200\" height=\"600\"></canvas>");
        game.splash.launchSplash();
        game.model.initModule(name);
        game.drawLayer.initModule('#GameBoard' );
    };
    var initModule = function ( $container ) {
        _UID=uuid();
	console.log("my UID is "+_UID);
        $($container).html(landingHtml);
        $('#playButton').on("click",initGame);
        game.splash.initModule($container);
        
        
        //radio('debug-transactions').subscribe(debugTransactions);
        
    };
    
    
    return { initModule : initModule,
	     world      : world,
	     uid        : uid,
             visibility : visibility
           };
}());
