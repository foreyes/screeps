var utils = require('utils');

var rampartHits = 10000000;

function runDefender(ctx, towers) {
    if(Memory.rooms[ctx.room.name].ctx.defendTime == undefined) {
        Memory.rooms[ctx.room.name].ctx.defendTime = 0;
    }
    Memory.rooms[ctx.room.name].ctx.defendTime += 1; 

    if(Memory.rooms[ctx.room.name].ctx.defendTime > 100 && Game.time % 300 > 25) {
        if(!Memory.rooms[ctx.room.name].ctx.defendFlag) {
            Memory.rooms[ctx.room.name].ctx.builderNum += 1;
            Memory.rooms[ctx.room.name].ctx.defendFlag = true;
        }
        // repair ramparts
        var ramparts = ctx.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == 'rampart';
            }
        });
        if(ramparts.length > 0) {
            var target = ramparts.sort((a, b) => {
                return a.hits - b.hits;
            })[0];
            for(var i in towers) {
                towers[i].repair(target);
            }
        }
    } else {
        var lastTower = towers[towers.length-1];
        var target = towers[0].pos.findClosestByRange(ctx.enemies);
        for(var i in towers) {
            if(i == 0 || i != towers.length-1 || ctx.enemies.length == 1) {
                towers[i].attack(target);
            } else {
                var rem_enemies = ctx.enemies.filter((invader) => invader.id != target.id);
                towers[i].attack(towers[i].pos.findClosestByRange(rem_enemies));
            }
        }
    }
}

function Run(ctx) {
    var towers = ctx.towers;
    if(!ctx.towers || ctx.towers.length == 0) return;

    // defend
    if(ctx.enemies.length > 0) {
        return runDefender(ctx, towers);
    } else {
        // record how long the defend lasted
        if(Memory.rooms[ctx.room.name].ctx.defendFlag) {
            Memory.rooms[ctx.room.name].ctx.builderNum -= 1;
            delete Memory.rooms[ctx.room.name].ctx.defendFlag;
        }  
        delete Memory.rooms[ctx.room.name].ctx.defendTime;
    }

    // repair roads
    var roads = ctx.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_ROAD && structure.hits + 800 <= structure.hitsMax;
        }
    });
    if(roads.length != 0) {
        towers[0].repair(roads[0]);
        return;
    }

    // repair containers
    if(ctx.room.memory.ctx.repairerNum && ctx.room.memory.ctx.repairerNum == 0) {
        var containers = ctx.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_CONTAINER && s.hits + 800 <= s.hitsMax;
            }
        });
        if(containers.length != 0) {
            towers[0].repair(containers[0]);
            return;
        }
    }

    // heal creeps
    var needHeal = ctx.creeps.filter((creep) => creep.hits < creep.hitsMax);
    if(needHeal.length != 0) {
        var target = towers[0].pos.findClosestByRange(needHeal);
        towers[0].heal(target);
        return;
    }

    // normal repair ramparts
    var ramparts = ctx.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.structureType == 'rampart' && s.hits < rampartHits;
        }
    }).sort((a, b) => {
        return a.hits - b.hits;
    });
    if(ramparts.length != 0) {
        towers[0].repair(ramparts[0]);
        return;
    }
}

module.exports = {
    Run
};