var get_positions_by_dist = function(room, start, dist) {
    var res = [];
    for(var dx = -dist; dx <= dist; dx++) {
        for(var dy = -dist; dy <= dist; dy++) {
            if(Math.abs(dx) + Math.abs(dy) == dist) {
                var x = start.x + dx;
                var y = start.y + dy;
                if(x < 0 || y < 0 || x >= 50 || y >= 50) continue;
                res.push(room.getPositionAt(x, y));
            }
        }
    }
    return res;
};

function GetDirectDistance(pos1, pos2) {
    if(pos1.room != pos2.room) {
        MyAlter("Error: not in one room when get distance!");
    }
    var dx = Math.abs(pos1.x - pos2.x);
    var dy = Math.abs(pos1.y - pos2.y);
    return Math.min(dx, dy) + Math.abs(dx - dy);
}

function CmpByObjDist2GivenPos(pos) {
    return function(a, b) {
        return GetDirectDistance(pos, a.pos) >  GetDirectDistance(pos, b.pos);
    };
}

function DefaultMoveTo(creep, target) {
    creep.memory.needMove = true;
    if(creep.memory.stuck < 3) {
        creep.moveTo(target, {reusePath: 10, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}});
    } else {
        // creep.say('change path');
        creep.moveTo(target, {reusePath: 0, visualizePathStyle: {stroke: '#ffaa00'}});
    }
}

function IsSamePosition(pos1, pos2) {
    return pos1.room = pos2.room && pos1.x == pos2.x && pos1.y == pos2.y;
}

function GetMyCreepsByRole(room, roleName) {
    return room.find(FIND_CREEPS, {
        filter: (creep) => {
            return creep.my && creep.memory.role == roleName;
        }
    });
}

function findNewStore(ctx, creep) {
    var targets = ctx.sourceContainers.filter((container) => {
        return container.store[RESOURCE_ENERGY] > 0;
    });
    if(targets.length == 0) return;
    return creep.pos.findClosestByPath(targets, {ignoreCreeps: true});
}

function GetEnergyFromStore(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!target || !target.structureType || !target.store || target.store[RESOURCE_ENERGY] == 0) {
        target = findNewStore(ctx, creep);
        creep.memory.targetId = target.id;
    }

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
}

function GetEnergyFromControllerStore(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!target || !target.structureType || !target.store || target.store[RESOURCE_ENERGY] == 0) {
        target = ctx.controllerContainer;
        creep.memory.targetId = target.id;
    }

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
}

module.exports = {
    get_positions_by_dist,
    GetDirectDistance,
    CmpByObjDist2GivenPos,
    DefaultMoveTo,
    IsSamePosition,
    GetMyCreepsByRole,
    GetEnergyFromStore,
    GetEnergyFromControllerStore,
}