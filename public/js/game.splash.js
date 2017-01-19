/* global game, $, radio , Image */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

 game.splash = (function (){
     'use strict';
     var splashImage;
     var sCanvas;
     var displayTimer;
     var displayCount = 0;
     var modalHtml = '<div id="myModal" class="modal">' +
                  '<div class="modal-content">' +
                  '<canvas id="splashScreen"></canvas>' +
                  '</div>' +
                  '</div>';

     var initModule = function (container){
         radio('launch-complete').subscribe(landSplash);
         $(container).append(modalHtml);

         sCanvas = document.getElementById('splashScreen').getContext('2d');
         splashImage = new Image();
         splashImage.src = 'splash.jpg';
     };
     var launchSplash = function (){
         console.log("launch splash");
         sCanvas.canvas.height = 400;
         sCanvas.canvas.width = 600;
         sCanvas.drawImage(splashImage, 0, 0);
         sCanvas.fillStyle = 'black';
         sCanvas.font = '40px serif';
         sCanvas.fillText('Splash Screen Here ', 200, 300);
         $('#myModal').css({'display': 'block'});
         displayTimer = setInterval(updateSplash, 100);
     };
     var landSplash = function (){
         // set a min time for the splash screen display
         if (displayCount > 25){
             console.log('land splash');
             $('#myModal').css({'display': 'none'});
             clearInterval(displayTimer);
         } else { setTimeout(landSplash, 1000); }
     };
     var updateSplash = function (){
         displayCount++;
         // console.log('display count ' + displayCount);
         var xStart = (displayCount % 15) * 40;
         if ((displayCount % 15) === 0){
             //console.log('clear run');
             sCanvas.clearRect(5, 375, 595, 10);
         }
         sCanvas.fillStyle = 'black';
         sCanvas.fillRect(xStart, 375, 35, 10);
     };
     return { initModule   : initModule,
              launchSplash : launchSplash
     };
 }());
