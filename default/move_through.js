function getDst(pos, direction) {
	var x = pos.x, y = pos.y, roomName = pos.roomName;
	switch(direction) {
	case TOP: {
		if(y == 0) return -1;
		return new RoomPosition(x, y-1, roomName);
	}
	case TOP_RIGHT: {
		if(x == 49 || y == 0) return -1;
		return new RoomPosition(x+1, y-1, roomName);
	}
	case RIGHT: {
		if(x == 49) return -1;
		return new RoomPosition(x+1, y, roomName);
	}
	case BOTTOM_RIGHT: {
		if(x == 49 || y == 49) return -1;
		return new RoomPosition(x+1, y+1, roomName);
	}
	case BOTTOM: {
		if(y == 49) return -1;
		return new RoomPosition(x, y+1, roomName);
	}
	case BOTTOM_LEFT: {
		if(x == 0 || y == 49) return -1;
		return new RoomPosition(x-1, y+1, roomName);
	}
	case LEFT: {
		if(x == 0) return -1;
		return new RoomPosition(x-1, y, roomName);
	}
	case TOP_LEFT: {
		if(x == 0 || y == 0) return -1;
		return new RoomPosition(x-1, y-1, roomName);
	}
	}
	return null;
}

function getOppositeDirection(direction) {
	switch(direction) {
	case TOP: {
		return BOTTOM;
	}
	case TOP_RIGHT: {
		return BOTTOM_LEFT;
	}
	case RIGHT: {
		return LEFT;
	}
	case BOTTOM_RIGHT: {
		return TOP_LEFT;
	}
	case BOTTOM: {
		return TOP;
	}
	case BOTTOM_LEFT: {
		return TOP_RIGHT;
	}
	case LEFT: {
		return RIGHT;
	}
	case TOP_LEFT: {
		return BOTTOM_RIGHT;
	}
	}
	return null;
}

// pairRecords record pairs which may need to apply move_through.
var pairRecords = [];

function addPair(responser, direction) {
	pairRecords.push([responser, direction]);
}

if(!Creep.prototype._move) {
	// store original 'move' method.
	Creep.prototype._move = Creep.prototype.move;
	// Creep.move will use move_through algorithm. When the dryRun is set to true, this function will
	// check whether the move will meet errors, and return the destination pos if no error will occur.
	// When a creep trying to leave the room, dst return value will be -1.
	Creep.prototype.move = function(direction, dryRun = false) {
		if(!this.my) return ERR_NOT_OWNER;
		if(this.spawning) return ERR_BUSY;
		if(this.fatigue != undefined && this.fatigue > 0) return ERR_TIRED;
		if(this.getActiveBodyparts && this.getActiveBodyparts(MOVE) == 0) return ERR_NO_BODYPART;

		var dst = getDst(this.pos, direction);
		if(dryRun) {
			return dst;
		}
		this.needMove = true;
		// dst == -1 indicate this creep is in Exist.
		if(dst == -1) {
			return 0;
		}
		// find creep and power creep in the dest.
		var creeps = dst.lookFor(LOOK_CREEPS).concat(dst.lookFor(LOOK_POWER_CREEPS));
		if(creeps.length == 1 && creeps[0].my) {
			if(!Memory.inConsole) {
				addPair(creeps[0], getOppositeDirection(direction));
			} else {
				creeps[0]._move(getOppositeDirection(direction));
			}
		}
		return this._move(direction);
	}
}
if(!PowerCreep.prototype._move) {
	PowerCreep.prototype._move = function(direction) {
		if(this.spawnCooldownTime != undefined) {
			return ERR_BUSY;
		}
		return Creep.prototype._move.call(this, direction);
	}
}

function Run() {
	try {
		for(var i in pairRecords) {
			var creep = pairRecords[i][0], direction = pairRecords[i][1];
			if(creep.needMove || creep.memory.noThrough) continue;
			creep._move(direction);
		}
	} catch(err) {
		Memory.inConsole = true;
		pairRecords = [];
		return;
	}
	Memory.inConsole = true;
	pairRecords = [];
}

module.exports = {
	Run
};