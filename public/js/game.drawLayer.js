/* global game, $, radio , Image ,HexLib*/
/* eslint semi:["error", "always"] , indent:["error",2] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */
game.drawLayer = (function() {
  "use strict";
  // ---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var size = 15;
  var layout = HexLib.Layout(HexLib.layout_flat, { x: size, y: size }, {
    x: 0,
    y: 0
  });
  var canvasImage;
  var numberOfSides = 6;
  // Xcenter and Ycenter are in pixels
  // also it is actually the location of the
  // top left corner of the screen.
  var Xcenter = 0;
  var Ycenter = 0;
  var XcenterHex = 0;
  var YcenterHex = 0;
  var startXcenter;
  var startYcenter;
  var startXpoint = null;
  var startYpoint;
  var endPoint = {};
  var select;
  var r = size * Math.sqrt(3) / 2;
  var cxt;
  // must match with kPingRangeSquared in the model
  var kPingRange = 100;
  var boardWidth = 1200;
  var boardHeight = 600;
  var pingLayout = HexLib.Layout(HexLib.layout_flat, { x: .5, y: .5 }, {
    x: boardWidth - 200,
    y: boardHeight - 200
  });
  var pingFrameLayout;
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
  var colorList = [
    "DeepPink",
    "MediumVioletRed",
    "DarkRed",
    "Orange",
    "Yellow",
    "Brown",
    "Blue",
    "LightBlue",
    "Aqua",
    "Green",
    "LimeGreen",
    "Purple"
  ];
  var colorMap = {};
  var currColor = 0;
  var beginPanX, beginPanY;
  var dontClick;
  var cachedGold = 0;
  var UidToName = {};
  var cachedLeaderBoard = [
    { UID: "qwertyy", name: "12345678901234567890123", score: 10 },
    { UID: "asdfgfasdf", name: "jane", score: 9 },
    { UID: "zxcvbb", name: "sally", score: 8 },
    { UID: "jkl;;", name: "fitz", score: 7 },
    { UID: "uioppoip", name: "sandy", score: 6 }
  ];
  var keyQ = [];
  var keyInterval;
  var drawInterval;
  var pingImgData = [];
  var allowRecenter = false;
  var message;
  // ----------------- END MODULE SCOPE VARIABLES ---------------
  // ------------------- BEGIN UTILITY METHODS ------------------
  //  example : getTrimmedString
  // -------------------- END UTILITY METHODS -------------------
  // --------------------- BEGIN DOM METHODS --------------------
  //  End public method /configModule/
  var hPxToHex = function(px) {
    return Math.ceil(px / (size * 1.5));
    // var offset = $('#GameBoard').offset();
    // var hex =  Math.round((px - offset.left) / (3 * size));
    // return hex;
  };
  var vPxToHex = function(px) {
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
  var initModule = function(playerName) {
    UidToName[game.uid()] = playerName;
    colorMap[game.uid()] = "red";
    cxt = document.getElementById("GameBoard").getContext("2d");
    console.log("window height " + $(window).height());
    console.log("window width " + $(window).width());
    boardWidth = window.innerWidth - 30;
    boardHeight = window.innerHeight - 30;
    pingFrameLayout = HexLib.Layout(HexLib.layout_flat, { x: 95, y: 95 }, {
      x: (-1) * (boardWidth - 95),
      y: (-1) * (boardHeight - Math.sqrt(3) * 95 / 2)
    });
    pingLayout.origin.x = boardWidth - 200;
    pingLayout.origin.y = boardHeight - 200;
    boardWidthInHex = hPxToHex(boardWidth);
    boardHeightInHex = vPxToHex(boardHeight);
    document.getElementById("GameBoard").width = boardWidth;
    document.getElementById("GameBoard").height = boardHeight;
    $("#GameBoard").on("click", resolveClick);
    $("#GameBoard").on("mousedown", beginPan);
    $("#GameBoard").on("mouseup", endPan);
    //  $(document).on("keypress" , resolveKey);
    $(document).on("keydown", resolveKey);
    radio("draw-hexagon").subscribe(drawHexagon);
    radio("draw-gold").subscribe(drawGold);
    radio("losing-message").subscribe(drawLosingMessage);
    radio("draw-leader-board").subscribe(drawLeaderBoard);
    radio("update-city-cost").subscribe(updateCityCost);
    //radio("ping-data").subscribe(ping);
    radio("center-on-queen").subscribe(centerBoard);
    radio("message").subscribe(saveMessage);
    radio("ping-data-point").subscribe(pingDataPoint);
    pingImgData = [];
    // cxt.createImageData(kPingRange * 2, kPingRange * 2);
    //centerBoard(queenLocation);
    // allow 4 moves per second.
    keyInterval = setInterval(executeKey, 250);
    // $(window).bind('beforeunload' ,  function(){radio('debug-clear-fb').broadcast();});
    drawInterval = setInterval(
      function() {
        centerBoard(null, true);
      },
      150
    );
  };
  var centerBoardOnQueen = function() {
    var h = game.model.queenLocation();
    centerBoard(h, true);
  };
  var centerBoard = function(h, redraw) {
    //console.log("centerBoard");
    if (h) {
      var newCenter = HexLib.hex_to_pixel(layout, h);
      layout.origin.x = newCenter.x - boardWidth / 2;
      layout.origin.y = newCenter.y - boardHeight / 2;
    }
    //console.log(h);
    //console.log("boardWidth: "+boardWidth+" boardHeight "+boardHeight);
    //console.log(newCenter);
    //console.log(layout);
    //        Ycenter = (location.y - Math.floor(boardHeightInHex * 0.5)) * (size * Math.sqrt(3)) * -1;
    //        Xcenter = (location.x - Math.floor(boardWidthInHex * 0.5)) * (size * 1.5) * -1;
    //        XcenterHex = location.x - (boardWidthInHex / 2);
    //        YcenterHex = location.y - (boardHeightInHex / 2);
    if (redraw) {
      drawBoard();
      radio(
        "request-hex-in-square"
      ).broadcast({ x: layout.origin.x, y: layout.origin.y, width: boardWidth, height: boardHeight });
    }
  };
 // var ping = function(data) {
 //   pingImgData = data;
 //   console.log("ping");
    //        pingImgData =  cxt.createImageData(kPingRange*2 , kPingRange*2);
    //        var pd = pingImgData.data;
    // console.log(pingImgData.data.length);
 //   drawPingMap();
 // };
    var pingDataPoint = function(h) {
        console.log("pingDataPoint");
        console.log(h);
        pingImgData.push(h);
  };
  var drawPingPoint = function(d) {
    //    	console.log("drawPingPoint");
    //	console.log("q:"+d.q+" r:"+d.r+" s:"+d.s);
    var p = HexLib.hex_to_pixel(pingLayout, d);
    //	console.log("x:"+p.x+" y:"+p.y);
    cxt.save();
    if (d.UID == game.uid()) {
      cxt.fillStyle = "red";
    } else {
      cxt.fillStyle = "green";
    }
    cxt.fillRect(
      Math.round(p.x + pingLayout.origin.x),
      Math.round(p.y + pingLayout.origin.y),
      2,
      2
    );
    cxt.restore();
  };
  var drawPingMap = function() {
    //console.log("drawPingMap");
    var pingCenter = HexLib.hex_to_pixel_windowed(
      pingFrameLayout,
      HexLib.Hex(0, 0, 0)
    );
    //console.log("PingCenter x:"+pingCenter.x+" y:"+pingCenter.y);
    pingLayout.origin = pingCenter;
    var c = HexLib.polygon_corners(pingFrameLayout, HexLib.Hex(0, 0, 0));
    cxt.save();
    cxt.beginPath();
    cxt.fillStyle = "white";
    c.forEach(function(v) {
      //console.log("x:"+v.x+" y:"+v.y);
      cxt.lineTo(v.x, v.y);
    });
    cxt.fill();
    pingImgData.forEach(function(d) {
      // console.log('point ' + d.x + ' ' + d.y);
      drawPingPoint(d);
    });
  };
  var drawLosingMessage = function() {
    //console.log('loosing message');
    cxt.clearRect(300, 150, 600, 300);

    var img = new Image();
    img.addEventListener("load", function() {
      cxt.drawImage(img, 200, 100);
      cxt.fillStyle = "black";
      cxt.font = "40px serif";
      cxt.fillText("You have died.", 400, 300);
    });
    img.src = "defeat.jpg";
    clearInterval(keyInterval);
  };
  //  End public method /initModule/
  var drawBoard = function() {
    cxt.clearRect(0, 0, boardWidth, boardHeight + 100);
    drawBoardFrame();
    drawBuildCity();
    drawBuildWall();
    drawMoveTrails();
    drawPing();
    drawQueen();
    drawMessage();
    drawGold(cachedGold);
    drawLeaderBoard(cachedLeaderBoard);
    drawPingMap();
    drawSelectionSquare();
  };
  var drawSelectionSquare = function() {
    if (startXpoint !== null) {
      cxt.save();
      cxt.strokeStyle = "white";
      cxt.strokeRect(
        startXpoint,
        startYpoint,
        Math.abs(startXpoint - endPoint.x),
        Math.abs(startYpoint - endPoint.y)
      );
      cxt.restore();
    }
  };
  var beginPan = function(e) {
    //console.log('beginPan');
    // how multiple select might work
    //console.log('shift key ' + e.shiftKey);
    //console.log('control key ' + e.ctrlKey);
    beginPanX = e.pageX;
    beginPanY = e.pageY;
    //console.log("beginx: "+beginPanX+" beginy: "+beginPanY);
    startXcenter = layout.origin.x;
    startYcenter = layout.origin.y;
    startXpoint = e.pageX;
    startYpoint = e.pageY;
    endPoint.x = e.pageX;
    endPoint.y = e.pageY;
    select = "none";
    if (e.shiftKey) {
      select = "shift";
    }
    if (e.ctrlKey) {
      select = "control";
    }
    canvasImage = cxt.getImageData(
      0,
      0,
      document.getElementById("GameBoard").width,
      document.getElementById("GameBoard").height
    );
    $("#GameBoard").on("mousemove", function(e) {
      pan(e, select);
    });
  };
  var pan = function(e, select) {
    //console.log(select);
    //console.log("pan");
    var diffX = beginPanX - e.pageX;
    // - beginPanX;
    var diffY = beginPanY - e.pageY;
    // - beginPanY;
    beginPanX = e.pageX;
    beginPanY = e.pageY;

    //console.log("pan X:"+diffX+" Y:"+diffY);
    //console.log("pan moved x: "+(startXpoint - e.pageX)+" y: "+(startYpoint- e.pageY));
    //console.log("beginx: "+beginPanX+" beginy: "+beginPanY);
    if (select === "none") {
      if (
        Math.abs(startXpoint - e.pageX) + Math.abs(startYpoint - e.pageY) < 3
      ) {
        return;
      }
      layout.origin.x += diffX;
      layout.origin.y += diffY;
      // drawBoard();
      // multiply by negative 1 ,  because the x and y center points
      // are how far the window has moved ,  so when you drag the
      // the window right ,  increasing xcenter ,  you are showing
      // board to the left ( lower x values)
      YcenterHex = vPxToHex(Ycenter) * (-1);
      XcenterHex = hPxToHex(Xcenter) * (-1);
      // console.log("Xcenter "+ Xcenter + " Ycenter "+Ycenter);
      radio(
        "request-hex-in-square"
      ).broadcast({ x: layout.origin.x, y: layout.origin.y, width: boardWidth, height: boardHeight, select: "none" });
    } else {
      cxt.putImageData(canvasImage, 0, 0);
      cxt.strokeStyle = "white";
      endPoint.x = e.pageX;
      endPoint.y = e.pageY;
      cxt.strokeRect(
        startXpoint,
        startYpoint,
        Math.abs(startXpoint - e.pageX),
        Math.abs(startYpoint - e.pageY)
      );
    }
  };

  var endPan = function(e) {
    //console.log("endpan");
    if (
      Math.abs(startXcenter - layout.origin.x) > 3 ||
        Math.abs(startYcenter - layout.origin.y) > 3
    ) {
      dontClick = true;
    }
    $("#GameBoard").off("mousemove");
    if (select === "shift" || select === "control") {
      cxt.putImageData(canvasImage, 0, 0);
      radio(
        "request-hex-in-square"
      ).broadcast({ x: startXpoint + layout.origin.x, y: startYpoint + layout.origin.y, width: Math.abs(startXpoint - e.pageX), height: Math.abs(startYpoint - e.pageY), select: select });
      startXpoint = null;
    }
  };

  // executeKey is called when the moveRate interval
  // timer expires.
  var executeKey = function(e) {
    if (keyQ.length === 0) {
      return;
    }
    console.log("execute kepress");
    var key = keyQ.shift();
    if (key === "w") {
      radio("move").broadcast("north");
    }
    if (key === "s") {
      radio("move").broadcast("south");
    }
    if (key === "a") {
      radio("move").broadcast("west");
    }
    if (key === "d") {
      radio("move").broadcast("east");
    }
    if (key === "q") {
      radio("move").broadcast("up");
    }
    if (key === "e") {
      radio("move").broadcast("down");
    }
  };
  var resolveKey = function(e) {
    //  console.log("kepress :"+e.key);
    console.log("e : " + e.which);
    if (e.key === "W" || e.key === "w" || e.which === 38) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("north");
        } else {
          keyQ.push("w");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "S" || e.key === "s" || e.which === 40) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("south");
        } else {
          keyQ.push("s");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "A" || e.key === "a" || e.which === 37) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("west");
        } else {
          keyQ.push("a");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "D" || e.key === "d") {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("east");
        } else {
          keyQ.push("d");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "Q" || e.key === "q") {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("up");
        } else {
          keyQ.push("q");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "E" || e.key === "e" || e.which === 39) {
      if (keyQ.length === 0) {
        if (e.shiftKey) {
          radio("move-cursor").broadcast("down");
        } else {
          keyQ.push("e");
          allowRecenter = true;
        }
      }
      return;
    }
    if (e.key === "1") {
      buildCity();
      return;
    }
    if (e.key === "2") {
      buildWall();
      return;
    }
    if (e.key === "3") {
      toggleTrails();
      return;
    }
    if (e.key === "4") {
      toggleQueen();
      return;
    }
    if (e.key === "C" || e.key === "c") {
      buildCity();
      return;
    }
    if (e.key === "Escape") {
      radio("clear-selection").broadcast();
      return;
    }
    if (e.key === "X" || e.key === "x") {
      centerBoardOnQueen();
      return;
    }
    if (e.key === "P" || e.key === "p") {
      pingImgData = [];
      radio("ping").broadcast();
      return;
    }
    if (e.key === "M" || e.key === "m") {
      radio("toggle-marker").broadcast();
      return;
    }
    if (e.key === "j" || e.key === "j") {
      radio("jump-next-marker").broadcast();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      radio("recruit-troops").broadcast();
      return;
    }
    // debug keystrokes
    if (e.key === ";") {
      radio("dump-database").broadcast();
      return;
    }
    if (e.key === ".") {
      radio("stop-updates").broadcast();
      return;
    }
    if (e.key === "/") {
      radio("dump-transactions").broadcast();
      return;
    }
    if (e.shiftKey) {
      return;
    }
    if (e.ctrlKey) {
      return;
    }
    e.preventDefault();
    radio("message").broadcast("unknown key pressed : " + e.key);
  };
  var resolveClick = function(e) {
    if (dontClick) {
      dontClick = false;
      return;
    }
    var canvasCords = {};
    var offset = $("#GameBoard").offset();
    canvasCords.x = e.pageX - offset.left;
    canvasCords.y = e.pageY - offset.top;
    // console.log("e x:"+e.pageX+" y:"+e.pageY+"o x:"+offset.left+" y:"+offset.top);
    // the controls are window/canvas relative ,  so don't translate them to
    // the board.
    if (
      canvasCords.x > city.x &&
        canvasCords.x < city.x + city.width &&
        canvasCords.y > city.y &&
        canvasCords.y < city.y + city.width
    ) {
      buildCity();
      return;
    }
    if (
      canvasCords.x > wall.x &&
        canvasCords.x < wall.x + wall.width &&
        canvasCords.y > wall.y &&
        canvasCords.y < wall.y + wall.width
    ) {
      buildWall();
      return;
    }
    if (
      canvasCords.x > trails.x &&
        canvasCords.x < trails.x + trails.width &&
        canvasCords.y > trails.y &&
        canvasCords.y < trails.y + trails.width
    ) {
      toggleTrails();
      return;
    }
    if (
      canvasCords.x > queen.x &&
        canvasCords.x < queen.x + queen.width &&
        canvasCords.y > queen.y &&
        canvasCords.y < queen.y + queen.width
    ) {
      toggleQueen();
      return;
    }
    if (
      canvasCords.x > pingBox.x &&
        canvasCords.x < pingBox.x + pingBox.width &&
        canvasCords.y > pingBox.y &&
        canvasCords.y < pingBox.y + pingBox.width
    ) {
      radio("ping").broadcast();
      return;
    }
    var translatedE = {};
    var h = findHex(e);
    console.log("find hex : " + HexLib.hexToId(h));

    radio("toggle-selection").broadcast({ hexID: HexLib.hexToId(h) });
  };
  var buildCity = function() {
    radio("build-city").broadcast();
  };
  var updateCityCost = function(v) {
    console.log("update city cost v:" + v);
    cityCost = v / 100;
    drawBuildCity();
  };
  var buildWall = function() {
    radio("build-wall").broadcast();
  };
  var toggleTrails = function() {
    trailsOn = !trailsOn;
    drawMoveTrails();
    radio("toggle-trails").broadcast(trailsOn);
  };
  var toggleQueen = function() {
    queenOn = !queenOn;
    drawQueen();
    radio("toggle-queen").broadcast(queenOn);
  };
  var drawPing = function() {
    cxt.clearRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
    cxt.strokeStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(pingBox.x, pingBox.y, pingBox.width, pingBox.width);
    cxt.fillText("P", pingBox.x + 7, pingBox.y + pingBox.width - 8);
  };
  var drawBuildCity = function() {
    cxt.clearRect(city.x, city.y, city.width, city.width);
    cxt.strokeStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(city.x, city.y, city.width, city.width);
    cxt.strokeText("C", city.x + 7, city.y + city.width - 12);
    cxt.font = "10px san-serif";
    cxt.fillText(cityCost, city.x + 2, city.y + city.width - 3);
  };
  var drawBuildWall = function() {
    cxt.clearRect(wall.x, wall.y, wall.width, wall.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(wall.x, wall.y, wall.width, wall.width);
    cxt.fillText("W", wall.x + 7, wall.y + wall.width - 12);
    cxt.font = "10px san-serif";
    cxt.fillText("100", wall.x + 7, wall.y + wall.width - 3);
  };

  var drawMoveTrails = function() {
    cxt.clearRect(trails.x, trails.y, trails.width, trails.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";

    if (trailsOn) {
      cxt.filStyle = "grey";
      cxt.fillRect(trails.x, trails.y, trails.width, trails.width);
      cxt.fillStyle = "white";
    } else {
      cxt.strokeStyle = "black";
      cxt.strokeRect(trails.x, trails.y, trails.width, trails.width);
      cxt.fillStyle = "black";
    }
    cxt.fillText("T", trails.x + 7, trails.y + trails.width - 8);
  };
  var drawQueen = function() {
    cxt.clearRect(queen.x, queen.y, queen.width, queen.width);
    cxt.fillStyle = "black";
    cxt.font = "22px serif";

    if (queenOn) {
      cxt.filStyle = "grey";
      cxt.fillRect(queen.x, queen.y, queen.width, queen.width);
      cxt.fillStyle = "white";
    } else {
      cxt.strokeStyle = "black";
      cxt.strokeRect(queen.x, queen.y, queen.width, queen.width);
      cxt.fillStyle = "black";
    }
    cxt.fillText("Q", queen.x + 7, queen.y + queen.width - 8);
  };
  var drawLeaderBoard = function(data) {
    cxt.save();
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
    cxt.font = "17px serif";
    cxt.fillStyle = "black";
    cxt.strokeStyle = "black";
    cxt.clearRect(topLeft.x, topLeft.y, leaderWidth, leaderHeight);
    for (var i = 0; i < cachedLeaderBoard.length; i++) {
      cxt.strokeRect(
        topLeft.x,
        topLeft.y + nameHeight * i,
        nameWidth,
        nameHeight
      );
      cxt.strokeRect(
        topLeft.x + nameWidth,
        topLeft.y + nameHeight * i,
        scoreWidth,
        nameHeight
      );
      cxt.fillText(
        cachedLeaderBoard[i].name.substr(0, 23),
        topLeft.x + 4,
        topLeft.y + nameHeight * i + nameHeight - 5
      );
      cxt.fillText(
        cachedLeaderBoard[i].score,
        topLeft.x + nameWidth + 4,
        topLeft.y + nameHeight * i + nameHeight - 5
      );
    }
    cxt.restore();
  };
  var drawGold = function(gold) {
    // cxt.strokeStyle='white';
    cachedGold = gold;
    cxt.clearRect(0, 0, 200, 30);
    cxt.strokeStyle = "black";
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(0, 0, 200, 30);
    cxt.fillText("gold : " + gold, 5, 20);

    drawBuildCity();
    drawBuildWall();
    drawMoveTrails();
    drawQueen();
    drawPing();
  };
  var onScreen = function(record) {
    //console.log("onScreen origin x:"+layout.origin.x+ " y:"+layout.origin.y);
    var h = record.h;
    var point = HexLib.hex_to_pixel(layout, h);
    //console.log("hex center x:" + point.x + " y:"+point.y);
    if (
      point.x > layout.origin.x &&
        point.x < layout.origin.x + boardWidth &&
        point.y > layout.origin.y &&
        point.y < layout.origin.y + boardHeight
    ) {
      return true;
    }
    return false;
  };

  var distanceToEdge = function(record) {
    var h = record.h;
    var point = HexLib.hex_to_pixel(layout, h);
    var windowPoint = {
      x: point.x - layout.origin.x,
      y: point.y - layout.origin.y
    };
    var northEdge = 0;
    var southEdge = boardHeight;
    var westEdge = 0;
    var eastEdge = boardWidth;
    var dNorth = windowPoint.y / (Math.sqrt(3) / 2 * layout.size.y);
    var dSouth = (southEdge - windowPoint.y) /
      (Math.sqrt(3) / 2 * layout.size.y);
    var dEast = windowPoint.x / (layout.size.x * 2);
    var dWest = (boardWidth - windowPoint.x) / (layout.size.x * 2);
    //    console.log("at : "+windowPoint.x+"  "+windowPoint.y);
    //    console.log("origin : "+layout.origin.x+" "+layout.origin.y);
    //    console.log("dN:"+dNorth+" dS:"+dSouth+" dE:"+dEast+" dW:"+dWest);
    //    console.log("min distance is :"+ Math.min(dNorth, dSouth, dEast, dWest));
    return Math.min(dNorth, dSouth, dEast, dWest);
  };

  // this is the main entry point from the model.
  var drawHexagon = function(record) {
    //console.log("drawHexagon - id:"+record.hexID+" s:"+record.S+" v:"+record.V);
    //
    //game.util.printRecord(record);
    cxt.save();
    //cxt.globalCompositeOperation="destination-over";
    var color;
    if (!onScreen(record)) {
      return;
    }
    if (!record.V && !game.visibility()) {
      drawHexagonBackground(record.h, "black");
      return;
    }
    // console.log("Xcenter "+XcenterHex+ " Ycenter "+YcenterHex);
    // console.log("recordx "+record.x+" recordY "+record.y);
    // console.log("--------");
    if (record.UID === game.uid()) {
      // if the selected hex gets near the edge, and we are allowed
      // to recenter, and if we are selected.
      if (record.Cursor) {
        if (distanceToEdge(record) < 2 && allowRecenter) {
          allowRecenter = false;
          //console.log("Recentering");
          centerBoard(record.h, true);
          return;
        }
      }
    }
    if (record.UID !== 0) {
      // console.log("drawbackground");
      // look up the uid and get its color ,  or assign it if this
      // is a new uid
      if (colorMap.hasOwnProperty(record.UID)) {
        color = colorMap[record.UID];
      } else {
        colorMap[record.UID] = colorList[currColor++];
        currColor = currColor % colorList.length;
        color = colorMap[record.UID];
      }
    } else {
      color = "white";
    }
    if (record.S) {
      color = "pink";
    }
    drawHexagonBackground(record.h, color);

    if (record.S === 1) {
      color = "red";
    } else {
      color = "black";
    }
    drawHexagonFrame(record.h, color);
    var point = HexLib.hex_to_pixel_windowed(layout, record.h);
    cxt.font = "22px serif";
    if (record.K) {
      cxt.strokeStyle = "grey";
      cxt.strokeText("Q", point.x - 8, point.y + 7);
    }
    if (record.C) {
      cxt.strokeStyle = "grey";
      cxt.strokeText("C", point.x - 8, point.y + 7);
    }
    if (record.W) {
      cxt.font = "18px serif";
      cxt.fillStyle = "black";
      cxt.fillText("W", point.x - 8, point.y + 2);
      cxt.font = "10px serif";
      cxt.fillText(record.W, point.x - 8, point.y + 9);
    }
    if (record.M) {
      drawTerain(record.M, record.h);
    }
    if (record.A) {
      cxt.font = "12px san-serif";
      cxt.fillStyle = "black";
      cxt.fillText(record.A, point.x - 8, point.y + 7);
    }
    if (record.Marker) {
      cxt.font = "12px san-serif";
      cxt.fillStyle = "black";
      cxt.fillText("F", point.x - 8, point.y + 7);
    }
    if (record.Cursor) {
      drawCursor(record.h);
    }
    cxt.restore();
  };
  var drawCursor = function(h) {
    var point = HexLib.hex_to_pixel_windowed(layout, h);
    cxt.save();
    cxt.strokeStyle = "green";
    cxt.arc(point.x, point.y, layout.size.x * 0.75, 0, Math.PI * 2, false);
    cxt.stroke();
    cxt.restore();
  };
  var drawTerain = function(type, h) {
    var point = HexLib.hex_to_pixel_windowed(layout, h);
    if (type === 1) {
      cxt.beginPath();
      cxt.moveTo(point.x - 7, point.y + 7);
      cxt.lineTo(point.x, point.y - 7);
      cxt.lineTo(point.x + 7, point.y + 7);
      cxt.stroke();
    } else {
      drawHexagonBackground(h, "blue");
    }
  };
  var drawHexagonBackground = function(h, color) {
    //console.log("drawHexagonBackground");
    cxt.fillStyle = color;
    cxt.lineWidth = 1;
    cxt.beginPath();

    var corners = HexLib.polygon_corners(layout, h);
    corners.forEach(function(c) {
      cxt.lineTo(c.x, c.y);
    });
    cxt.fill();
    //  uncommnent to show where the center of the hexagon is.
    // cxt.beginPath();
    // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
    // cxt.stroke();
  };

  // drawHexagonbackground
  var drawHexagonFrame = function(h, color) {
    // console.log("xc: "+Xcenter+" yc: "+Ycenter+" "+color);
    cxt.beginPath();
    var corners = HexLib.polygon_corners(layout, h);
    corners.forEach(function(c) {
      cxt.lineTo(c.x, c.y);
    });
    cxt.closePath();
    cxt.strokeStyle = color;
    cxt.lineWidth = 1;
    cxt.stroke();
    //  uncommnent to show where the center of the hexagon is.
    // cxt.beginPath();
    // cxt.ellipse(Xcenter ,  Ycenter ,  1 ,  1 ,  0 ,  0 ,  2 * Math.PI);
    // cxt.stroke();
  };

  // drawHexagonFrame
  var distance = function(x1, y1, x2, y2) {
    var d;
    var x = x1 - x2;
    var y = y1 - y2;
    // console.log("dist "+x1+" "+x2+" "+y1+" "+y2+" "+x+" "+y);
    d = Math.sqrt(x * x + y * y);
    return d;
  };

  // distance
  var drawBoardFrame = function() {
    if (!game.visibility()) {
      cxt.fillStyle = "black";
      cxt.fillRect(0, 0, boardWidth, boardHeight);
    }
    return;
    ////// unreachable !!!!
    var yStepStart = Math.ceil(Ycenter / (size * Math.sqrt(3))) * (-1);
    var xStepStart = Math.ceil(Xcenter / (size * 3)) * (-1);

    for (var ystep = yStepStart; ystep < 24 + yStepStart; ystep++) {
      for (var xstep = xStepStart; xstep < 28 + xStepStart; xstep++) {
        drawHexagonFrame(
          Xcenter + 3 * xstep * size,
          Ycenter + Math.sqrt(3) * size * ystep,
          size,
          "black"
        );
      }
    }
    for (ystep = yStepStart; ystep < 24 + yStepStart; ystep++) {
      for (xstep = xStepStart; xstep < 28 + xStepStart; xstep++) {
        drawHexagonFrame(
          Xcenter + r * Math.sqrt(3) * xstep * 2 + r * Math.sqrt(3),
          Ycenter + r * ystep * 2 + r,
          size,
          "black"
        );
      }
    }
  };

  var saveMessage = function(m) {
    message = m;
  };
  var drawMessage = function() {
    cxt.save();
    cxt.clearRect(250, 0, 500, 30);
    cxt.strokeStyle = "black";
    cxt.fillStyle = "black";
    cxt.font = "22px serif";
    cxt.strokeRect(0, 0, 250, 30);
    cxt.fillText(message, 255, 20);
    cxt.restore();
  };
  var findHex = function(e) {
    var offset = $("#GameBoard").offset();
    var found = false;
    var translatedE = {};
    translatedE.x = e.pageX - offset.left + layout.origin.x;
    translatedE.y = e.pageY - offset.top + layout.origin.y;
    var h = HexLib.hex_round(HexLib.pixel_to_hex(layout, translatedE));

    return h;
  };
  // findHex
  //  return public methods
  return { initModule: initModule, layout: layout };
  // ------------------- END PUBLIC METHODS ---------------------
})();

