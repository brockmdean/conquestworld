/*
* module_template.js
* Template for browser feature modules
*
* Michael S. Mikowski - mike.mikowski@gmail.com
* Copyright (c) 2011-2012 Manning Publications Co.
*/

/*jslint         browser : true, continue : true,
devel  : true, indent  : 2,    maxerr   : 50,
newcap : true, nomen   : true, plusplus : true,
regexp : true, sloppy  : true, vars     : false,
white  : true
*/

/*global $, simpleDB */

simpleTable = (function() {
  "use strict";
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  // example : getTrimmedString
  //-------------------- END UTILITY METHODS -------------------

  var create = function() {
    var _count = 0;
    var _storage = {};
    var _indexFunctions = [];
    var _indexes = [];
    var key;
    var fields = [];
    var uniqueKey = function(k) {
      key = k;
    };
    var Fields = function(f) {
      fields = f;
    };
    var recordCount = function() {
      return _count;
    };
    var unique = function(r) {
      if (!_storage.hasOwnProperty(r[key])) {
        return true;
      }
      return false;
    };

    var verifyRecord = function(r) {
      for (var i = 0; i < fields.length; i++) {
        //console.log("f:"+fields[i]);
        if (!r.hasOwnProperty(fields[i])) {
          console.log("found missing field " + fields[i]);
          return false;
        }
      }
      return true;
    };
    var sumAllUniqueField = function(uniqueField, sumField) {
      var uniqueKey = {};
      var _uniqueField;
      for (var k in _storage) {
        _uniqueField = _storage[k][uniqueField];
        if (!uniqueKey.hasOwnProperty(_uniqueField)) {
          uniqueKey[_uniqueField] = _storage[k][sumField];
        } else {
          uniqueKey[_uniqueField] += _storage[k][sumField];
        }
      }
      return uniqueKey;
    };
    var testIndex = function(I, r) {
      return I.f(r);
    };
    var insert = function(r) {
      //console.log("insert");
      //printRecord(r.hexID,r);
      var nr = Object.assign({}, r);
      _count++;
      if (!verifyRecord(nr)) {
        return false;
      }
      if (unique(r)) {
        //console.log("inserting a record");
        _storage[nr[key]] = nr;
        _indexFunctions.forEach(function(I) {
          if (testIndex(I, r)) {
            _indexes[I.n][nr[key]] = r;
          }
        });
        return true;
      } else {
        return false;
      }
    };
    var insertOrUpdate = function(r) {
      if (!insert(r)) {
        update(r);
      }
    };
    var query = function(arg) {
      var result = [];
      //console.log(compFunction);
      if (typeof arg === "function") {
        for (var k in _storage) {
          if (arg(_storage[k])) {
            result.push(_storage[k]);
          }
        }
        return result;
      }
      if (_storage.hasOwnProperty(arg[key])) {
        result.push(_storage[arg[key]]);
      }
      return result;
    };

    var update = function(newR) {
      //  console.log("update");

      var currentR = _storage[newR[key]];
      //printRecord(newR[key],currentR);
      //printRecord(newR[key],newR);
      for (var k in newR) {
        currentR[k] = newR[k];
      }
      _storage[newR[key]] = currentR;
      //update the indexes
      //the updated object may need to be
      //added or removed from the indexe
      //since the index holds unique records
      //we can add the record if it matches or needs
      //to be deleted regardless of whether it is
      //in the index or not.
      _indexFunctions.forEach(function(I) {
        if (testIndex(I, currentR)) {
          _indexes[I.n][currentR[key]] = currentR;
        } else {
          delete _indexes[I.n][currentR[key]];
        }
      });
    };
    var keyExists = function(k) {
      return _storage.hasOwnProperty(k);
    };
    var print = function() {
      //var string =JSON.stringify(_storage);
      //console.log("JSON string is "+string.length+" long");
      //var compressed = LZString.compressToUint8Array(string);
      //console.log("compressed is "+compressed.length+" long");
      for (var k in _storage) {
        if (_storage[k].UID) {
          printRecord(k, _storage[k]);
        }
      }
    };
    var printRecord = function(key, record) {
      var s = "record " + key + ": ";
      for (var k in record) {
        s = s + k + ":" + record[k] + " ";
      }
      console.log(s);
    };
    var addIndex = function(I) {
      console.log("index name is " + I.name);
      this[I.name] = function() {
        return Object.values(_indexes[I.name]);
      };
      _indexFunctions.push({ n: I.name, f: I });
      //use a hash for the index, it will make updates easier.
      _indexes[I.name] = {};
    };
    var getAll = function() {
      return Object.values(_storage);
    };
    return {
      insert: insert,
      insertOrUpdate: insertOrUpdate,
      query: query,
      uniqueKey: uniqueKey,
      Fields: Fields,
      sumAllUniqueField: sumAllUniqueField,
      recordCount: recordCount,
      //remove : remove,
      update: update,
      keyExists: keyExists,
      addIndex: addIndex,
      getAll: getAll,
      print: print
    };
  };

  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin public method /configModule/
  // Purpose    : Adjust configuration of allowed keys
  // Arguments  : A map of settable keys and values
  //   * color_name - color to use
  // Settings   :
  //   * configMap.settable_map declares allowed keys
  // Returns    : true
  // Throws     : none
  //

  // return public methods
  return {
    create: create
  };
  //------------------- END PUBLIC METHODS ---------------------
})();
