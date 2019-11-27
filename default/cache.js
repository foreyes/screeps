var cache = {};

Creep.prototype.fecthCache = function() {
	if(cache[this.id] == undefined) {
		cache[this.id] = {};
	}
	this.cache = cache[this.id];
}

function FetchCreepCache() {
	for(var name in Game.creeps) {
		Game.creeps[name].fecthCache();
	}
}

module.exports = {
    FetchCreepCache,
};