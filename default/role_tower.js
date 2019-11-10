var utils = require('utils');

function Run(ctx, tower) {
	// attack
    if(ctx.enemies.length != 0) {
        var target = tower.pos.findClosestByRange(ctx.enemies);
        tower.attack(target);
        return;
    }
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
    // heal
    var needHeal = ctx.creeps.filter((creep) => creep.hits < creep.hitsMax);
    if(needHeal.length != 0) {
    	var target = tower.pos.findClosestByRange(needHeal);
    	tower.heal(target);
    	return;
    }
}

module.exports = {
    Run
};