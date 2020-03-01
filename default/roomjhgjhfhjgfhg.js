/**
Module: prototype.Room.structures v1.7
Author: SemperRabbit
Date:   20180309-13,0411
Usage:  require('prototype.Room.structures');

This module will provide structure caching and extends the Room
  class' prototype to provide `room.controller`-like properties
  for all structure types. It will cache the object IDs of a
  room.find() grouped by type as IDs in global. Once the property
  is requested, it will chech the cache (and refresh if required),
  then return the appropriate objects by maping the cache's IDs
  into game objects for that tick.

Changelog:
1.0: Initial publish
1.1: Changed multipleList empty results from `null` to `[]`
     Bugfix: changed singleList returns from arrays to single objects or undefined
1.2: Added intra-tick caching in addition to inter-tick caching
1.3: Multiple bugfixes
1.4: Moved STRUCTURE_POWER_BANK to `multipleList` due to proof of *possibility* of multiple
        in same room.
1.5: Added CPU Profiling information for Room.prototype._checkRoomCache() starting on line 47
1.6: Added tick check for per-tick caching, in preperation for the potential "persistent Game
        object" update. Edits on lines 73, 77-83, 95, 99-105
1.7; Added Factory support (line 46)
*/

Game.market.createOrder({
    type: ORDER_SELL,
    resourceType: 'spirit',
    price: 6600,
    totalAmount: 2,
    roomName: "E35N38",
});
Game.market.createOrder({
    type: ORDER_BUY,
    resourceType: 'ops',
    price: 0.3,
    totalAmount: 40000,
    roomName: "E33N36",
});



Game.market.deal('单子ID', 1000, 'E33N36');

Object.defineProperty(global, '有啥', { get: sell })

var roomStructures           = {};
var roomStructuresExpiration = {};

const CACHE_TIMEOUT = 50;
const CACHE_OFFSET  = 4;

const multipleList = [
    STRUCTURE_SPAWN,        STRUCTURE_EXTENSION,    STRUCTURE_ROAD,         STRUCTURE_WALL,
    STRUCTURE_RAMPART,      STRUCTURE_KEEPER_LAIR,  STRUCTURE_PORTAL,       STRUCTURE_LINK,
    STRUCTURE_TOWER,        STRUCTURE_LAB,          STRUCTURE_CONTAINER,	STRUCTURE_POWER_BANK,
];

const singleList = [
    STRUCTURE_OBSERVER,     STRUCTURE_POWER_SPAWN,  STRUCTURE_EXTRACTOR,	STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
];

function getCacheExpiration(){
    return CACHE_TIMEOUT + Math.round((Math.random()*CACHE_OFFSET*2)-CACHE_OFFSET);
}

Room.prototype._checkRoomCache = function _checkRoomCache(){
    // if cache is expired or doesn't exist
    if(!roomStructuresExpiration[this.name] || !roomStructures[this.name] || roomStructuresExpiration[this.name] < Game.time){
        roomStructuresExpiration[this.name] = Game.time + getCacheExpiration();
        roomStructures[this.name] = _.groupBy(this.find(FIND_STRUCTURES), s=>s.structureType);
        var i;
        for(i in roomStructures[this.name]){
            roomStructures[this.name][i] = _.map(roomStructures[this.name][i], s=>s.id);
        }
    }
}

multipleList.forEach(function(type){
    Object.defineProperty(Room.prototype, type+'s', {
        get: function(){
            if(this['_'+type+'s'] && this['_'+type+'s_ts'] === Game.time){
                return this['_'+type+'s'];
            } else {
                this._checkRoomCache();
                if(roomStructures[this.name][type]) {
					this['_'+type+'s_ts'] = Game.time;
                    return this['_'+type+'s'] = roomStructures[this.name][type].map(Game.getObjectById);
				} else {
					this['_'+type+'s_ts'] = Game.time;
                    return this['_'+type+'s'] = [];
				}
            }
        },
        set: function(){},
        enumerable: false,
        configurable: true,
    });
});

singleList.forEach(function(type){
    Object.defineProperty(Room.prototype, type, {
        get: function(){
            if(this['_'+type] && this['_'+type+'_ts'] === Game.time){
                return this['_'+type];
            } else {
                this._checkRoomCache();
                if(roomStructures[this.name][type]) {
					this['_'+type+'_ts'] = Game.time;
                    return this['_'+type] = Game.getObjectById(roomStructures[this.name][type][0]);
				} else {
					this['_'+type+'_ts'] = Game.time;
                    return this['_'+type] = undefined;
				}
            }
        },
        set: function(){},
        enumerable: false,
        configurable: true,
    });
});