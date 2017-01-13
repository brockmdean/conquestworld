



var remoteDatabase =(function(){
  "use strict";
  var _incomingCount=0;
  var _outgoingCount=0;
  var _world;
  var _UID;
  var fbDatabase;
  var globalUpdatesRef;
  var usersRef;
  var worldStateLocation;
  var writeSeq=0;
  var transactionID="";
  var processRecordCallback;
  var processUserCallback;
  var processWorldCallback;
  var transactions={}
  var outputQueue=[];
  //public
  var bandwidth = function(){ return "bandwidth I:"+_incomingCount+" O:"+_outgoingCount;};
  var initModule = function(update,user,worldState){
        fbDatabase = firebase.database();

        globalUpdatesRef= fbDatabase.ref(update.location);
        processRecordCallback=update.callback;
        //TODO move to a startRead type functon that also does .startAt().on()..
        //for the initialization algorithm. for now
        //reading from the start is ok.
        globalUpdatesRef.on('child_added',processRecord);

        usersRef=fbDatabase.ref(user.location);
        processUserCallback= user.callback;
        usersRef.on('child_added',processUser);

        worldStateLocation = worldState.location;
        processWorldCallback=worldState.callback;
  };

  //writer functions
  //public
  var openTransaction = function(){
    transactionID=uuid();
    writeSeq=0;
  };

  var closeTransaction = function(){
    var r = {};
    r.seq=writeSeq;
    r.tID=transactionID;
    r.count=writeSeq;
    globalUpdatesRef.push(r);
    _outgoingCount++;
  };
  //public
  var pushUpdate = function(r){
    _outgoingCount++;
    r.seq=writeSeq;
    r.tID=transactionID;
    r.count=0;
    globalUpdatesRef.push(r);
    writeSeq++;
  };
  //end writer functions

  //reader functions
  var processRecord = function(snapshot){
    //add this record to the transaction, or create one and add it.
    //if the record is complete
    //move the records in order to the output queue
    //and remove it from the transaction obj
    _incomingCount++;
    var r=snapshot.val();
    //console.log("processRecord");
    //console.log(r);
    var tID=r.tID;
    var count=r.count;
    var seq=parseInt(r.seq);
    if(!transactions.hasOwnProperty(tID)){
      transactions[tID]={count:-1,recs:[]};
    }
    if(count > 0){ transactions[tID]['count']=count;}
    if(count==0){
      transactions[tID]['recs'][seq]=r;
    }
    //console.log("current length"+transactions[tID]['recs'].length+" expecting "+transactions[tID]['count']);
    if(transactions[tID]['recs'].length == transactions[tID]['count']){
      //console.log("output transaction "+tID);
      //$("#recieved").append("output transaction "+tID+"  count  "+transactions[tID]['count']+"<BR>");
      transactions[tID]['recs'].forEach(function(r){
        delete r.tID;
        delete r.count;
        delete r.seq;
        //printRecord(r)
        processRecordCallback(r);

      });
      //$("#recieved").append("<BR>");
      delete transactions[tID];
    };
  };
  var processUser = function(snapshot){
    var r = snapshot.val();
    processUserCallback(r);
  };
  var pushUser = function(r){
    usersRef.push(r);
  };
  var updateWorldCoordinate = function(r){
    var hexID=r.hexID;
    fbDatabase.ref(worldStateLocation+"/"+hexID).set(r);
  };
  var readWorld = function(completeCallback){
    fbDatabase.ref(worldStateLocation).once('value',function(s){ s.forEach(processReadWorld)});
    completeCallback();
  };
  var processReadWorld = function(snapshot){
    var r = snapshot.val();
    processWorldCallback(r);
  };
  var printRecord=function(r){
    var s="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

      s+= " &nbsp;&nbsp;&nbsp; UID "+r['UID'];
      s+= " &nbsp;&nbsp;&nbsp; hexID "+r['hexID'];
      s+= " &nbsp;&nbsp;&nbsp; A "+r['A'];
      s+= " &nbsp;&nbsp;&nbsp; K "+r['K'];

    s+='<BR>';
  //  $("#recieved").append(s);
  }
  return {
    initModule:initModule,
    openTransaction: openTransaction,
    pushUpdate : pushUpdate,
    updateWorldCoordinate : updateWorldCoordinate,
    pushUser : pushUser,
    readWorld : readWorld,
    closeTransaction : closeTransaction,
    bandwidth:bandwidth
  }
}());
