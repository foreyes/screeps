var cache = {};

Creep.prototype.fecthCache = function() {
	if(cache[this.id] == undefined) {
		cache[this.id] = {};
	}
	this.cache = cache[this.id];
	// this.fecthMoveRate();
}

// DO NOT trying to boost carry or move part
Creep.prototype.fecthMoveRate = function() {
	// get move parts, *2 is becase one move can reduce fatigue by 2
	var moves = this.getActiveBodyparts(MOVE) * 2;
	if(moves == 0) {
		return this.cache.moveRate = 1;
	}
	// always fatigue parts
	if(this.cache.alwaysFatigueParts == undefined) {
		this.cache.alwaysFatigueParts = this.body.filter((part) => {
			return part.type != CARRY && part.type != MOVE;
		}).length;
	}
	// calculate fatigue parts
	var fatigueParts = this.cache.alwaysFatigueParts;
	if(this.store != undefined) {
		fatigueParts += Math.max(parseInt((this.store.getUsedCapacity() + 49) / 50), 0);
	}
	// calculate move rate
	if(fatigueParts == 0) {
		return this.cache.moveRate = 10;
	}
	return this.cache.moveRate = moves / fatigueParts;
}

function FetchCreepCache() {
	for(var name in Game.creeps) {
		Game.creeps[name].fecthCache();
	}
	// for(var name in Game.powerCreeps) {
	// 	Game.powerCreeps[name].fecthCache();
	// }
}

module.exports = {
    FetchCreepCache,
};