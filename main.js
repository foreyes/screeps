var utils = require('utils');

function fetchCtx() {
    if(Memory.ctx == undefined) {
        require('context').InitWhenRespawn();
    }
    return require('context').FetchCtx();
}

var roleMap = {
    spawn: require('role_spawn'),
    harvester: require('role_harvester'),
    upgrader: require('role_upgrader'),
    builder: require('role_builder')
};

// make sure spawn's adjusted 4 cells are not wall when respawn.
// spawn should not near by sources.
// sort from small to big
module.exports.loop = function () {
    var ctx = fetchCtx();

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    var spawn = ctx.spawn, room = ctx.room;
    // TODO: extract level action list.
    if(room.memory.has_get_roads_l1) {
    	utils.get_roads_l1(ctx);
    }
    if(room.controller.level >= 2 && !room.memory.has_get_extensions_l2) {
    	utils.get_extensions_l2(ctx);
    }
    if(room.controller.level >= 3 && !room.memory.has_get_extensions_l3) {
        utils.get_extensions_l3(ctx);
    }
    if(room.controller.level >= 3 && room.memory.has_get_extensions_l3 && !room.memory.has_get_containers_l3) {
        var myConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (site) => {
                return site.my;
            }
        });
        if(myConstructionSites.length == 0) {
            utils.get_containers_l3(ctx);
        }
    }

    // run role logic.
    roleMap['spawn'].Run(ctx, spawn)
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.memory.needMove = false;
        roleMap[creep.memory.role].Run(ctx, creep);
        if(creep.memory.lastPos == undefined) {
            creep.memory.lastPos = creep.pos;
            creep.memory.stuck = 0;
        }
        if(!creep.memory.needMove || creep.pos.x != creep.memory.lastPos.x || creep.pos.y != creep.memory.lastPos.y) {
            creep.memory.stuck = 0;
        } else {
            creep.memory.stuck += 1;
        }
        creep.memory.lastPos = creep.pos;
    }
};