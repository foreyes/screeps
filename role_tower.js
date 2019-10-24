var utils = require('utils');

function Run(ctx, tower) {
	// attack
    if(ctx.enemies.length != 0) {
        var target = tower.pos.findClosestByRange(enemy);
        tower.attack(target);
        return;
    }
    // repair
    var roads = ctx.room.find(FIND_STRUCTURE, {
    	filter: (structure) => {
    		return structure.structureType = STRUCTURE_ROAD && structure.hits + 800 <= structure.hitMax;
    	}
    });
    if(roads.length != 0) {
    	tower.repair(roads[0]);
    	return;
    }
    // TODO: heal
}

module.exports = {
    Run
};