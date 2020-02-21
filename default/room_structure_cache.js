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