/* global game  */
/* eslint semi:["error", "always"] , indent:["error",4] , space-before-blocks:["error","never"] */
/* eslint key-spacing: ["error", {
    "align": {
        "beforeColon": true,
        "afterColon": true,
        "on": "colon"
    }
}] */

database = (function(){
    "use strict";
    var localDb = simpleTable.create();
    localDb.uniqueKey('hexID');
    localDb.Fields(['hexID', 'h' , 'UID', 'K', 'C', 'W', 'A', 'S', 'V', 'M']);
    var updatesDb = simpleTable.create();
    updatesDb.uniqueKey('ID');
    updatesDb.Fields(['ID', 'date', 'r', 'seq', 'sendseq']);
    var remoteDb = remoteDatabase.create();
    remoteDb.setLDB(localDb);



    var addIndex = function(I){
	localDb.addIndex(I);
	this[I.name]=localDb[I.name];
    };

    var joinWorld = function(completeCallback){
        remoteDb.join(completeCallback);
    };
    
    return {
	insert            : localDb.insert,
	insertOrUpdate    : localDb.insertOrUpdate,
	query             : localDb.query,
	uniqueKey         : localDb.uniqueKey,
	Fields            : localDb.Fields,
	sumAllUniqueField : localDb.sumAllUniqueField,
	recordCount       : localDb.recordCount,
	update            : localDb.update,
	keyExists         : localDb.keyExists,
	addIndex          : addIndex,
        print             : localDb.print,

	initModule            : remoteDb.initModule,
        openTransaction       : remoteDb.openTransaction,
        pushUpdate            : remoteDb.pushUpdate,
        pushDiffUpdate        : remoteDb.pushDiffUpdate,
        updateWorldCoordinate : remoteDb.updateWorldCoordinate,
        updatePingList : remoteDb.updatePingList,
        getPingData : remoteDb.getPingData,
        pushUser              : remoteDb.pushUser,
        readWorld             : remoteDb.readWorld,
        closeTransaction      : remoteDb.closeTransaction,
        bandwidth             : remoteDb.bandwidth,
        updateLeaderBoard     : remoteDb.updateLeaderBoard,

	joinWorld : joinWorld
    }

}());
