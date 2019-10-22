var utils = require('utils');

function Run(ctx, creep) {
    if(creep.carry.energy == creep.carryCapacity){
        creep.memory.harvesting = false;
    }
    // TODO
    var source = Game.getObjectById("5bbcaedb9099fc012e639a85");
    if(creep.carry.energy == 0 || creep.memory.harvesting) {
        if(!creep.memory.harvesting) {
            creep.memory.harvesting = true;
        }
        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
            utils.DefaultMoveTo(creep, source);
        }
    } else {
        creep.memory.harvesting = false;
        // TODO
        if(Math.abs(creep.pos.x - source.pos.x) + Math.abs(creep.pos.y - source.pos.y) == 1) {
            utils.DefaultMoveTo(creep, creep.room.controller);
        }
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            utils.DefaultMoveTo(creep, creep.room.controller);
        }
    }
}

module.exports = {
    Run
};