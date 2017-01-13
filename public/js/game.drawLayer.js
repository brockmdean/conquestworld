/* global game, $, radio , Image */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */
game.drawLayer = (function (){
    'use strict';
    // ---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var canvasImage;
    var numberOfSides = 6;
    var size = 15;
    // Xcenter and Ycenter are in pixels
    // also it is actually the location of the
    // top left corner of the screen.
    var Xcenter = 0;
    var Ycenter = 0;
    var XcenterHex = 0;
    var YcenterHex = 0;
    var startXcenter;
    var startYcenter;
    var startXpoint;
    var startYpoint;
    var select;
    var r = size * Math.sqrt(3) / 2;
    var cxt;
    // must match with kPingRangeSquared in the model
    var kPingRange = 100;
    var boardWidth = 1200;
    var boardHeight = 600;
    var boardWidthInHex = 52;
    var boardHeightInHex = 24;
    var cityCost = 1;
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
    var queenOn = false;
    var trailsOn = false;
    var colorList = ['DeepPink', 'MediumVioletRed', 'DarkRed',
        'Orange', 'Yellow', 'Brown', 'Blue', 'LightBlue', 'Aqua',
        'Green', 'LimeGreen', 'Purple'];
    var colorMap = {};
    var currColor = 0;
    var beginPanX, beginPanY;
    var dontClick;
    var cachedGold = 0;
    var UidToName = {};
    var cachedLeaderBoard = [{UID: 'qwertyy', name: '12345678901234567890123', score: 10},
                           {UID: 'asdfgfasdf', name: 'jane', score: 9},
                           {UID: 'zxcvbb', name: 'sally', score: 8},
                           {UID: 'jkl;;', name: 'fitz', score: 7},
                           {UID: 'uioppoip', name: 'sandy', score: 6}];
    var keyQ = [];
    var keyInterval;
    var queenLocation;
    var terain = [];
    var pingImgData;
    var allowRecenter=false;
    // ----------------- END MODULE SCOPE VARIABLES ---------------

    // ------------------- BEGIN UTILITY METHODS ------------------
    //  example : getTrimmedString
    // -------------------- END UTILITY METHODS -------------------

    // --------------------- BEGIN DOM METHODS --------------------
    //  End public method /configModule/

    var hPxToHex = function (px){
	return Math.ceil(px / (size * 1.5));
	// var offset = $('#GameBoard').offset();
	// var hex =  Math.round((px - offset.left) / (3 * size));
        // return hex;
    };
    var vPxToHex = function (px){
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
    var initModule = function (playerName){
        UidToName[game.uid()] = playerName;
        colorMap[game.uid()] = "red";
        cxt = document.getElementById('GameBoard').getContext('2d');
        console.log('window height ' + $(window).height());
        console.log('window width ' + $(window).width());
        boardWidth = window.innerWidth - 30;
        boardHeight = window.innerHeight - 30;
        boardWidthInHex = hPxToHex(boardWidth);
        boardHeightInHex = vPxToHex(boardHeight);
        document.getElementById('GameBoard').width = boardWidth;
        document.getElementById('GameBoard').height = boardHeight;
        $('#GameBoard').on('click', resolveClick);
        $('#GameBoard').on('mousedown', beginPan);
        $('#GameBoard').on('mouseup', endPan);
        //  $(document).on("keypress" , resolveKey);
        $(document).on('keydown', resolveKey);
        radio('draw-hexagon').subscribe(drawHexagon);
        radio('draw-gold').subscribe(drawGold);
        radio('losing-message').subscribe(drawLosingMessage);
        radio('draw-leader-board').subscribe(drawLeaderBoard);
        radio('update-city-cost').subscribe(updateCityCost);
        radio('ping-data').subscribe(ping);
        queenLocation = game.model.createdKingLocation();
        pingImgData = cxt.createImageData(kPingRange * 2, kPingRange * 2);
        centerBoard(queenLocation);
        // allow 4 moves per second.
        keyInterval = setInterval(executeKey, 250);

        terain[1] = new Image();
        terain[1].src = 'M1.jpg';
        // $(window).bind('beforeunload' ,  function(){radio('debug-clear-fb').broadcast();});
    };
    var centerBoard = function (location, redraw){
        Ycenter = (location.y - Math.floor(boardHeightInHex * 0.5)) * (size * Math.sqrt(3)) * -1;
        Xcenter = (location.x - Math.floor(boardWidthInHex * 0.5)) * (size * 1.5) * -1;
        XcenterHex = location.x - (boardWidthInHex / 2);
        YcenterHex = location.y - (boardHeightInHex / 2);
        drawBoard();
        // console.log("l.x "+location.x+" l.y "+location.y+" Xcenter "+Xcenter+" Ycenter "+Ycenter);
        if (redraw){
            radio('request-hex-in-square').broadcast({x      : XcenterHex,
                y      : YcenterHex,
                width  : boardWidthInHex,
                height : boardHeightInHex});
        }
    };
    var ping = function (data){
        // pingImgData =  cxt.createImageData(kPingRange*2 , kPingRange*2);
        var pd = pingImgData.data;
        // console.log(pingImgData.data.length);
        // console.log(data);
        data.forEach(function (d){
            // console.log('point ' + d.x + ' ' + d.y);
            for (var i = 0; i < 2; i++){
                for (var j = 0; j < 2; j++){
                    if (d.v === 1){ // we are red
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4] = 255;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 1] = 0;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 2] = 0;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 3] = 255;
                    } else { // they are black
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4] = 0;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 1] = 0;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 2] = 0;
                        pd[(d.y + i) * pingImgData.width * 4 + (d.x + j) * 4 + 3] = 255;
                    }
                }
            }
        });
        drawPingMap();
    };
    var drawPingMap = function (){
        cxt.putImageData(pingImgData, boardWidth - kPingRange * 2, boardHeight - kPingRange * 2);
        cxt.fillStyle = 'black';
        cxt.beginPath();
        cxt.arc(boardWidth - kPingRange, boardHeight - kPingRange, kPingRange, 0, Math.PI / 2);
        cxt.lineTo(boardWidth, boardHeight);
        cxt.lineTo(boardWidth, boardHeight - kPingRange);
        cxt.fill();
        cxt.beginPath();
        cxt.arc(boardWidth - kPingRange, boardHeight - kPingRange, kPingRange, Math.PI / 2, Math.PI);
        cxt.lineTo(boardWidth - 2 * kPingRange, boardHeight);
        cxt.lineTo(boardWidth - kPingRange, boardHeight);
        cxt.fill();
        cxt.beginPath();
        cxt.arc(boardWidth - kPingRange, boardHeight - kPingRange, kPingRange, Math.PI, 3 * (Math.PI / 2));
        cxt.lineTo(boardWidth - 2 * kPingRange, boardHeight - 2 * kPingRange);
        cxt.lineTo(boardWidth - 2 * kPingRange, boardHeight - kPingRange);
        cxt.fill();
        cxt.beginPath();
        cxt.arc(boardWidth - kPingRange, boardHeight - kPingRange, kPingRange, 3 * (Math.PI / 2), 0);
        cxt.lineTo(boardWidth, boardHeight - 2 * kPingRange);
        cxt.lineTo(boardWidth - kPingRange, boardHeight - 2 * kPingRange);
        cxt.fill();
    };
    var drawLosingMessage = function (){
        console.log('loosing message');
        cxt.clearRect(300, 150, 600, 300);

        var img = new Image();
        img.addEventListener('load', function (){
            cxt.drawImage(img, 200, 100);
            cxt.fillStyle = 'black';
            cxt.font = '40px serif';
            cxt.fillText('You have died.', 400, 300);
        });
        img.src = 'defeat.jpg';
        clearInterval(keyInterval);
    };
    //  End public method /initModule/
    var drawBoard = function (){
        cxt.clearRect(0, 0, boardWidth, boardHeight+100);
        drawBoardFrame();
        drawBuildCity();
        drawBuildWall();
        drawMoveTrails();
        drawPing();
        drawQueen();
        drawGold(cachedGold);
        drawLeaderBoard(cachedLeaderBoard);
        drawPingMap();
    };
    var beginPan = function (e){
        console.log('beginPan');
        // how multiple select might work
        console.log('meta key ' + e.shiftKey);
        beginPanX = e.pageX - Xcenter;
        beginPanY = e.pageY - Ycenter;
        startXcenter = Xcenter;
        startYcenter = Ycenter;
        startXpoint= e.pageX ;
        startYpoint= e.pageY;
        select = e.shiftKey;
        canvasImage= cxt.getImageData(0,
                                      0,
                                      document.getElementById('GameBoard').width,
                                      document.getElementById('GameBoard').height);
        $('#GameBoard').on('mousemove',function(e){pan(e,select);});
    };
    var pan = function (e, select){
        console.log(select);
        var diffX = e.pageX - beginPanX;
        var diffY = e.pageY - beginPanY;
        // console.log("pan x"+diffX+" Y:"+diffY);
        if( !select ){
            Xcenter = diffX;
            Ycenter = diffY;
            drawBoard();
            // multiply by negative 1 ,  because the x and y center points
            // are how far the window has moved ,  so when you drag the
            // the window right ,  increasing xcenter ,  you are showing
            // board to the left ( lower x values)
            YcenterHex = vPxToHex(Ycenter) * -1;
            XcenterHex = hPxToHex(Xcenter) * -1;
            // console.log("Xcenter "+ Xcenter + " Ycenter "+Ycenter);
            radio('request-hex-in-square').broadcast({x      : XcenterHex,
                                                      y      : YcenterHex,
                                                      width  : boardWidthInHex,
                                                      height : boardHeightInHex,
                                                      select : false});
        }else{
            cxt.putImageData(canvasImage,0,0);
            cxt.strokeStyle='white';
            cxt.strokeRect(startXpoint,startYpoint,Math.abs(startXpoint-e.pageX),Math.abs(startYpoint-e.pageY));
        }
    };
        
    var endPan = function (e){
        // console.log("endpan");
        if (Math.abs(startXcenter - Xcenter) > 3 || Math.abs(startYcenter - Ycenter) > 3){
            dontClick = true;
        }
        $('#GameBoard').off('mousemove');
        if(select){
            cxt.putImageData(canvasImage,0,0);
	    var startPoint =findHex({pageX:startXpoint, pageY:startYpoint});
            var startXInHex = hPxToHex(startXpoint);
            var startYInHex = vPxToHex(startYpoint);
	    var endPoint = findHex(e);
            var endXInHex   = hPxToHex(Math.abs(startXpoint-e.pageX));
            var endYInHex   = vPxToHex(Math.abs(startYpoint-e.pageY));
            radio('request-hex-in-square').broadcast({x      : startPoint.x,
                                                      y      : startPoint.y,
                                                      width  : Math.abs(startPoint.x-endPoint.x),
                                                      height : Math.abs(startPoint.y-endPoint.y),
                                                      select : true});
            
        }
    };

    // executeKey is called when the moveRate interval
    // timer expires.
    var executeKey = function (e){
        if (keyQ.length === 0){ return; }
        console.log("execute kepress");
        var key = keyQ.shift();
        if (key === 'w'){ radio('move').broadcast('north'); }
        if (key === 's'){ radio('move').broadcast('south'); }
        if (key === 'a'){ radio('move').broadcast('west'); }
        if (key === 'd'){ radio('move').broadcast('east'); }
    };
    var resolveKey = function (e){
        //  console.log("kepress :"+e.key);
        // console.log("e : "+e.which);
        if (e.key === 'w' || e.which === 38){ if (keyQ.length === 0){ keyQ.push('w'); allowRecenter = true;} }
        if (e.key === 's' || e.which === 40){ if (keyQ.length === 0){ keyQ.push('s'); allowRecenter = true;} }
        if (e.key === 'a' || e.which === 37){ if (keyQ.length === 0){ keyQ.push('a'); allowRecenter = true;} }
        if (e.key === 'd' || e.which === 39){ if (keyQ.length === 0){ keyQ.push('d'); allowRecenter = true;} }
        if (e.key === '1'){ buildCity(); }
        if (e.key === '2'){ buildWall(); }
        // if(e.key==='3'){toggleTrails();}
        if (e.key === '4'){ toggleQueen(); }
        if (e.key === 'q'){ radio('clear-selection').broadcast(); }
        if (e.key === 'e'){ centerBoard(queenLocation, true); }
        if (e.key === 'p'){ radio('ping').broadcast(); }
        // debug keystrokes
        if (e.key === ';'){ radio('dump-database').broadcast(); }
        if (e.key === '.'){ radio('stop-updates').broadcast(); }
        if (e.key === '/'){ radio('dump-transactions').broadcast(); }
        e.preventDefault();
    };
    var resolveClick = function (e){
        if (dontClick){ dontClick = false; return; }
        var canvasCords = {};
        var offset = $('#GameBoard').offset();
        canvasCords.x = e.pageX - offset.left;
        canvasCords.y = e.pageY - offset.top;
        // console.log("e x:"+e.pageX+" y:"+e.pageY+"o x:"+offset.left+" y:"+offset.top);
        // the controls are window/canvas relative ,  so don't translate them to
        // the board.
        if (canvasCords.x > city.x && canvasCords.x < (city.x + city.width) &&
           canvasCords.y > city.y && canvasCords.y < (city.y + city.width)){
            buildCity();
            return;
        }
        if (canvasCords.x > wall.x && canvasCords.x < (wall.x + wall.width) &&
           canvasCords.y > wall.y && canvasCords.y < (wall.y + wall.width)){
            buildWall();
            return;
        }
        if (canvasCords.x > trails.x && canvasCords.x < (trails.x + trails.width) &&
           canvasCords.y > trails.y && canvasCords.y < (trails.y + trails.width)){
            // toggleTrails();
            return;
        }
        if (canvasCords.x > queen.x && canvasCords.x < (queen.x + queen.width) &&
           canvasCords.y > queen.y && canvasCords.y < (queen.y + queen.width)){
            toggleQueen();
            return;
        }
        if (canvasCords.x > pingBox.x && canvasCords.x < (pingBox.x + pingBox.width) &&
           canvasCords.y > pingBox.y && canvasCords.y < (pingBox.y + pingBox.width)){
            radio('ping').broadcast();
            return;
        }
        var translatedE = {};
        var r = findHex(e);
        radio('toggle-selection').broadcast({hexID: r.hexID});
	
    };
    var buildCity = function (){
        radio('build-city').broadcast();
    };
    var updateCityCost = function (v){
        console.log('update city cost v:' + v);
        cityCost = v / 100;
        drawBuildCity();
    };
    var buildWall = function (){
        radio('build-wall').broadcast();
    };
    var toggleTrails = function (){
        trailsOn = !trailsOn;
        drawMoveTrails();
        radio('toggle-trails').broadcast(trailsOn);
    };
    var toggleQueen = function (){
        queenOn = !queenOn;
        drawQueen();
        radio('toggle-queen').broadcast(queenOn);
    };
    var drawPing = function (){
        cxt.clearRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
        cxt.strokeStyle  = 'black';
        cxt.font = '22px serif';
        cxt.strokeRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
        cxt.fillText('P', pingBox.x + 7, pingBox.y + pingBox.width - 8);
    };
    var drawBuildCity = function (){
        cxt.clearRect(city.x, city.y, city.width, city.width);
        cxt.strokeStyle = 'black';
        cxt.font = '22px serif';
        cxt.strokeRect(city.x, city.y, city.width, city.width);
        cxt.strokeText('C', city.x + 7, city.y + city.width - 12);
        cxt.font = '10px san-serif';
        cxt.fillText(cityCost, city.x + 2, city.y + city.width - 3);
    };
    var drawBuildWall = function (){
        cxt.clearRect(wall.x, wall.y, wall.width, wall.width);
        cxt.fillStyle = 'black';
        cxt.font = '22px serif';
        cxt.strokeRect(wall.x, wall.y, wall.width, wall.width);
        cxt.fillText('W', wall.x + 7, wall.y + wall.width - 12);
        cxt.font = '10px san-serif';
        cxt.fillText('50', wall.x + 7, wall.y + wall.width - 3);
    };

    var drawMoveTrails = function (){
        cxt.clearRect(trails.x, trails.y, trails.width, trails.width);
        cxt.fillStyle = 'black';
        cxt.font = '22px serif';

        if (trailsOn){
            cxt.filStyle = 'grey';
            cxt.fillRect(trails.x, trails.y, trails.width, trails.width);
            cxt.fillStyle = 'white';
        } else {
            cxt.strokeStyle = 'black';
            cxt.strokeRect(trails.x, trails.y, trails.width, trails.width);
            cxt.fillStyle = 'black';
        }
        cxt.fillText('T', trails.x + 7, trails.y + trails.width - 8);
    };
    var drawQueen = function (){
        cxt.clearRect(queen.x, queen.y, queen.width, queen.width);
        cxt.fillStyle = 'black';
        cxt.font = '22px serif';

        if (queenOn){
            cxt.filStyle = 'grey';
            cxt.fillRect(queen.x, queen.y, queen.width, queen.width);
            cxt.fillStyle = 'white';
        } else {
            cxt.strokeStyle = 'black';
            cxt.strokeRect(queen.x, queen.y, queen.width, queen.width);
            cxt.fillStyle = 'black';
        }
        cxt.fillText('Q', queen.x + 7, queen.y + queen.width - 8);
    };
    var drawLeaderBoard = function (data){
        cachedLeaderBoard = data;
        // map uid to names here.
        // cachedLeaderBoard.forEach(function(r){r.name = data.p[r.UID]});
        // console.log(cachedLeaderBoard);
        var leaderWidth = 300;
        var leaderHeight = 100;
        var topLeft = {};
        topLeft.x = boardWidth - leaderWidth;
        var nameHeight = leaderHeight / 5;
        var nameWidth = 200;
        var scoreWidth = leaderWidth - nameWidth;
        topLeft.y = 0;
        cxt.font = '17px serif';
        cxt.fillStyle = 'black';
        cxt.clearRect(topLeft.x, topLeft.y, leaderWidth, leaderHeight);
        for (var i = 0; i < cachedLeaderBoard.length; i++){
            cxt.strokeRect(topLeft.x, topLeft.y + nameHeight * i, nameWidth, nameHeight);
            cxt.strokeRect(topLeft.x + nameWidth, topLeft.y + nameHeight * i, scoreWidth, nameHeight);
            cxt.fillText(cachedLeaderBoard[i].name.substr(0, 23), topLeft.x + 4, topLeft.y + nameHeight * i + nameHeight - 5);
            cxt.fillText(cachedLeaderBoard[i].score, topLeft.x + nameWidth + 4, topLeft.y + nameHeight * i + nameHeight - 5);
        }
    };
    var drawGold = function (gold){
        // cxt.strokeStyle='white';
        cachedGold = gold;
        cxt.clearRect(0, 0, 200, 30);
        cxt.strokeStyle = 'black';
        cxt.fillStyle = 'black';
        cxt.font = '22px serif';
        cxt.strokeRect(0, 0, 200, 30);
        cxt.fillText('gold : ' + gold, 5, 20);

        drawBuildCity();
        drawBuildWall();
        drawMoveTrails();
        drawQueen();
        drawPing();
    };
    var onScreen = function (record){
        //       console.log("Xcenter "+XcenterHex+ " Ycenter "+YcenterHex);
        //       console.log("recordx "+record.x+" recordY "+record.y);
        if (record.x > XcenterHex && record.x < XcenterHex + boardWidthInHex &&
           record.y > YcenterHex && record.y < YcenterHex + boardHeightInHex){
            return true;
        }
        return false;
    };

    var distanceToEdge = function(point){
	var dNorth = Math.abs(point.y - YcenterHex);
	var dSouth = Math.abs(point.y - (YcenterHex + boardHeightInHex));
	var dEast  = Math.abs(point.x - XcenterHex);
	var dWest  = Math.abs(point.x - (XcenterHex + boardWidthInHex));
        // console.log("at : "+point.x+"  "+point.y);
        // console.log("xc:"+XcenterHex+" xwidth:"+boardWidthInHex+" yheight:"+boardHeightInHex+" yc:"+ YcenterHex);
        // console.log("dN:"+dNorth+" dS:"+dSouth+" dE:"+dEast+" dW:"+dWest);
	return Math.min(dNorth,dSouth,dEast,dWest);
	
    };
    
    // this is the main entry point from the model.
    var drawHexagon = function (record){
        // console.log("drawLayer - id:"+record.hexID+" s:"+record.S+" v:"+record.V);
        //
        var color;
        var point = getPixelXyFromHexID(record.hexID);
        if (!record.V && !game.visibility()){
            drawHexagonBackground(point.x, point.y, size, 'black');
            return;
        }
        if (!onScreen(record)){ return; }
        // console.log("Xcenter "+XcenterHex+ " Ycenter "+YcenterHex);
        // console.log("recordx "+record.x+" recordY "+record.y);
        // console.log("--------");
        if(record.UID === game.uid()){
            // if the selected hex gets near the edge, and we are allowed
            // to recenter, and if we are selected. 
            if(distanceToEdge(record) < 2 && allowRecenter && record.S){
                allowRecenter=false;
                console.log("Recentering");
                centerBoard(record,true);
                return;
            }
        }
        if (record.UID !== 0){
            // console.log("drawbackground");
            // look up the uid and get its color ,  or assign it if this
            // is a new uid
            if (colorMap.hasOwnProperty(record.UID)){
                color = colorMap[record.UID];
            } else {
                colorMap[record.UID] = colorList[currColor++];
                currColor = currColor % colorList.length;
                color = colorMap[record.UID];
            }
        } else {
            color = 'white';
        }
        if (record.S){ color = 'pink'; }
        drawHexagonBackground(point.x, point.y, size, color);

        //   drawHexagonBackground(point.x , point.y , size , 'white');
        // }
        if (record.S === 1){
            color = 'red';
        } else {
            color = 'black';
        }
        drawHexagonFrame(point.x, point.y, size, color);
        cxt.font = '22px serif';
        if (record.K){
            cxt.strokeStyle = 'grey';
            cxt.strokeText('Q', point.x - 8, point.y + 7);
        }
        if (record.C){
            cxt.strokeStyle = 'grey';
            cxt.strokeText('C', point.x - 8, point.y + 7);
        }
        if (record.W){
            cxt.fillStyle = 'black';
            cxt.fillText('W', point.x - 8, point.y + 7);
        }
        if (record.M){
            drawTerain(record.M, point);
            // cxt.fillStyle = 'black';
            // cxt.fillText('M' , point.x-8 , point.y+7);
        }
        if (record.A){
            cxt.font = '12px san-serif';
            cxt.fillStyle = 'black';
            cxt.fillText(record.A, point.x - 8, point.y + 7);
        }
    };
    var drawTerain = function (type, point){
        if (type === 1){
            cxt.beginPath();
            cxt.moveTo(point.x - 7, point.y + 7);
            cxt.lineTo(point.x, point.y - 7);
            cxt.lineTo(point.x + 7, point.y + 7);
            cxt.stroke();
        } else {
            drawHexagonBackground(point.x, point.y, size, 'blue');
        }
    };
    var getPixelXyFromHexID = function (hexID){
        // convert from board xy to window xy
        // TODO convert from board xy to window xy
        var xy = hexID.split('_');
        var point = {};
        point.x = parseInt(xy[0]);
        point.y = parseInt(xy[1]);
        if (point.x % 2 === 0){
            point.x = point.x * 1.5 * size;
            point.y = point.y * Math.sqrt(3) * size;
        } else {
            point.x = point.x * r * Math.sqrt(3);
            point.y = point.y * r * 2 + r;
        }
        point.x = point.x + Xcenter;
        point.y = point.y + Ycenter;
        return point;
    };

    var drawHexagonBackground = function (Xcenter, Ycenter, size, color){
        // console.log("dhb->xc: "+Xcenter+" yc: "+Ycenter+" "+color);
        cxt.fillStyle = color;
        cxt.lineWidth = 1;
        cxt.beginPath();
        cxt.moveTo(Xcenter + size * Math.cos(0), Ycenter + size * Math.sin(0));

        for (var i = 1; i <= numberOfSides; i += 1){
            cxt.lineTo(Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides));
        }
        cxt.fill();
        //  uncommnent to show where the center of the hexagon is.
        // cxt.beginPath();
        // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
        // cxt.stroke();
    };// drawHexagonbackground

    var drawHexagonFrame = function (Xcenter, Ycenter, size, color){
        // console.log("xc: "+Xcenter+" yc: "+Ycenter+" "+color);
        cxt.beginPath();
        cxt.moveTo(Xcenter + size * Math.cos(0), Ycenter + size * Math.sin(0));

        for (var i = 1; i <= numberOfSides; i += 1){
            cxt.lineTo(Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides));
        }

        cxt.strokeStyle = color;
        cxt.lineWidth = 1;
        cxt.stroke();
        //  uncommnent to show where the center of the hexagon is.
        // cxt.beginPath();
        // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
        // cxt.stroke();
    };// drawHexagonFrame

    var distance = function (x1, y1, x2, y2){
        var d;
        var x = x1 - x2;
        var y = y1 - y2;
        // console.log("dist "+x1+" "+x2+" "+y1+" "+y2+" "+x+" "+y);
        d = Math.sqrt(x * x + y * y);
        return d;
    };// distance

    var drawBoardFrame = function (){
        if (!game.visibility()){
            cxt.fillStyle = 'black';
            cxt.fillRect(0, 0, boardWidth, boardHeight);
        }
        var yStepStart = Math.ceil(Ycenter / (size * Math.sqrt(3))) * -1;
        var xStepStart = Math.ceil(Xcenter / (size * 3)) * -1;

        for (var ystep = yStepStart; ystep < 24 + yStepStart; ystep++){
            for (var xstep = xStepStart; xstep < 28 + xStepStart; xstep++){
                drawHexagonFrame(Xcenter + 3 * xstep * size, Ycenter + Math.sqrt(3) * size * ystep, size, 'black');
            }
        }
        for (ystep = yStepStart; ystep < 24 + yStepStart; ystep++){
            for (xstep = xStepStart; xstep < 28 + xStepStart; xstep++){
                drawHexagonFrame(Xcenter + r * Math.sqrt(3) * xstep * 2 + r * Math.sqrt(3), Ycenter + r * ystep * 2 + r, size, 'black');
            }
        }
    };
    var findHex = function (e){
        var offset = $('#GameBoard').offset();
        var found = false;
	var translatedE={};
	translatedE.pageX = e.pageX - Xcenter;
        translatedE.pageY = e.pageY - Ycenter;
        console.log('e.x ' + e.pageX + ' e.y ' + e.pageY + ' xc ' + Xcenter + ' yc ' + Ycenter + ' t.x ' + translatedE.pageX + ' t.y ' + translatedE.pageY);

        var boardx = Math.round((translatedE.pageX - offset.left) / (3 * size));
        var boardy = Math.round((translatedE.pageY - offset.top) / (2 * r));
        var boardxInPx = boardx * 3 * size;
        var boardyInPx = boardy * r * 2;
        var d = distance(boardxInPx, boardyInPx, translatedE.pageX - offset.left, translatedE.pageY - offset.top);
       // var boardyRaw;
        if (d < r){
            // uncomment to draw a dot in the selected square
            // cxt.strokeStyle = 'black';
            // cxt.beginPath();
            // cxt.ellipse(boardxInPx ,  boardyInPx ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
            // cxt.stroke();
            console.log('-' + translatedE.pageX + ' ' + translatedE.pageY + '   ' + (boardx * 2) + ' ' + boardy + '   ' + boardxInPx + '  ' + boardyInPx + 'dist ' + d);
            found = true;
            boardx = boardx * 2;
        } else {
            boardx = Math.round((translatedE.pageX - offset.left) / (r * Math.sqrt(3)));
            if (boardx % 2 === 0){ return; }
            boardy = Math.floor((translatedE.pageY - offset.top) / (r * 2));
            // boardyRaw = (translatedE.pageY - offset.top) / (r * 2);
            boardxInPx = boardx * r * Math.sqrt(3);
            boardyInPx = boardy * r * 2 + r;
            d = distance(boardxInPx, boardyInPx, translatedE.pageX - offset.left, translatedE.pageY - offset.top);

            // uncomment to draw a dot in the selected square
            // console.log(translatedE.pageX+" "+(translatedE.pageY-offset.top)+"   "+boardx+" "+boardy+"  "+boardyRaw+"   "+boardxInPx+"  "+boardyInPx+"dist "+d);
            // cxt.strokeStyle = 'red';
            // cxt.beginPath();
            // cxt.ellipse(boardxInPx ,  boardyInPx ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
            // cxt.stroke();
            found = true;
        }
        if (found){
            // TODO convert window cord into board cords
            var hexID = boardx + '_' + boardy;
            console.log('hexID: ' + hexID);
	    return {x:boardx,y:boardy,hexID:hexID};
        }
    };// findHex
    //  return public methods
    return {
        initModule: initModule
    };
    // ------------------- END PUBLIC METHODS ---------------------
}());
