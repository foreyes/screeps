var utils = require('utils');

function Run(ctx, tower) {
	// attack
    if(ctx.room.name == 'E35N38') {
        ctx.enemies = ctx.enemies.filter((creep) => {
            return !creep.my && creep.owner.username != 'Divitto';
        });
    }
    if(ctx.enemies.length != 0) {
        var target = tower.pos.findClosestByRange(ctx.enemies);
        tower.attack(target);
        return;
    }
    if(tower.id != ctx.towers[0].id) return;
    // repair
    var roads = ctx.room.find(FIND_STRUCTURES, {
    	filter: (structure) => {
    		return structure.structureType == STRUCTURE_ROAD && structure.hits + 800 <= structure.hitsMax;
    	}
    });
    if(roads.length != 0) {
    	tower.repair(roads[0]);
    	return;
    }
    if(ctx.room.memory.ctx.repairerNum && ctx.room.memory.ctx.repairerNum == 0) {
        var containers = ctx.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_CONTAINER && s.hits + 800 <= s.hitsMax;
            }
        });
        if(containers.length != 0) {
            tower.repair(containers[0]);
            return;
        }
    }
    // repair rampart
    var ramparts = ctx.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.structureType == 'rampart' && s.hits < 1000;
        }
    });
    if(ramparts.length != 0) {
        tower.repair(ramparts[0]);
        return;
    }
    // heal
    var needHeal = ctx.creeps.filter((creep) => creep.hitsMax > creep.hits);
    if(needHeal.length != 0) {
    	var target = tower.pos.findClosestByRange(needHeal);
    	tower.heal(target);
    	return;
    }
}

module.exports = {
    Run
};