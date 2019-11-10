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
    if(pos1.roomName != pos2.roomName) {
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
    if(creep.memory.role == 'miner') {
        creep.moveTo(target, {reusePath: 10, visualizePathStyle: {stroke: '#ffaa00'}});
        return;
    }
    if(creep.memory.stuck < 2) {
        creep.moveTo(target, {reusePath: 10, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}});
    } else {
        delete creep.memory._move;
        creep.moveTo(target, {reusePath: 10, visualizePathStyle: {stroke: '#ffaa00'}});
    }
}

function IsSamePosition(pos1, pos2) {
    return pos1.roomName == pos2.roomName && pos1.x == pos2.x && pos1.y == pos2.y;
}

function GetMyCreepsByRole(room, roleName) {
    return room.find(FIND_CREEPS, {
        filter: (creep) => {
            return creep.my && creep.memory.role == roleName;
        }
    });
}

// find in center
function findNewStore(ctx, creep) {
    var targets = _.filter(ctx.sourceContainers, (container) => {
        return container.store[RESOURCE_ENERGY] >= 100;
    });
    if(targets.length != 0) {
        return creep.pos.findClosestByPath(targets, {ignoreCreeps: true});
    }
    if(ctx.storage == undefined || ctx.storage.store[RESOURCE_ENERGY] < 100) return null;
    return ctx.storage;
}

function isValidEnergyTarget(target, creep) {
    if(!target) return false;
    // dropped
    if(target.resourceType != undefined) {
        return target.resourceType == RESOURCE_ENERGY && target.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
    }
    // structure
    if(target.structureType != undefined) {
        return target.store && target.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
    }
    return false;
}

function findNewEnergyTarget4Worker(ctx, creep) {
    // return null if can not carry more
    if(!creep.store || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return null;
    }
    // get from hostile structures
    var usefulHostileStructures = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.my != undefined && !s.my && s.store && s.store[RESOURCE_ENERGY] > 0;
        }
    });
    if(usefulHostileStructures.length != 0) {
        return creep.pos.findClosestByPath(usefulHostileStructures);
    }
    // get from storage
    if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 0) {
        return ctx.storage;
    }
    // get from container
    if(ctx.centralContainers) {
        var containers = _.filter(ctx.centralContainers, (c) => c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByPath(containers);
        }
    }
    if(ctx.sourceContainers) {
        var containers = _.filter(ctx.sourceContainers, (c) => c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByPath(containers);
        }
    }
    // get from dropped energy
    if(ctx.dropedEnergy) {
        var largeEnergy = ctx.dropedEnergy.filter((de) => de.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(largeEnergy.length > 0) {
            return creep.pos.findClosestByPath(largeEnergy);
        }
        // TODO:
        // return creep.pos.findClosestByPath(ctx.dropedEnergy);
    }
    // TODO: get from tomestone
    return null;
}

function getValidEnergyTarget4Worker(ctx, creep) {
    var target = Game.getObjectById(creep.memory.energyTargetId);
    if(!isValidEnergyTarget(target, creep)) {
        delete creep.memory.energyTargetId;
        target = findNewEnergyTarget4Worker(ctx, creep);
    }
    if(target != null) {
        creep.memory.energyTargetId = target.id;
    }
    return target;
}

function GetEnergy4Worker(ctx, creep) {
    var target = getValidEnergyTarget4Worker(ctx, creep);
    if(target == null) return false;

    // get energy
    if(target.resourceType != undefined) {
        var err = creep.pickup(target);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    } else {
        var err = creep.withdraw(target, RESOURCE_ENERGY);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    }

    return true;
}

function findNewEnergyTarget4Filler(ctx, creep, fillTargetId) {
    // return null if can not carry more
    if(!creep.store || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return null;
    }
    // get from hostile structures
    var usefulHostileStructures = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return s.my != undefined && !s.my && s.store && s.store[RESOURCE_ENERGY] > 0;
        }
    });
    if(usefulHostileStructures.length != 0) {
        return creep.pos.findClosestByPath(usefulHostileStructures);
    }
    // get from dropped energy
    if(ctx.dropedEnergy) {
        var largeEnergy = ctx.dropedEnergy.filter((de) => de.amount >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(largeEnergy.length > 0) {
            return creep.pos.findClosestByPath(largeEnergy);
        }
        // TODO:
        // return creep.pos.findClosestByPath(ctx.dropedEnergy);
    }
    // get from source's container
    if(ctx.sourceContainers) {
        var containers = _.filter(ctx.sourceContainers, (c) => c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500));
        if(containers.length > 0) {
            return creep.pos.findClosestByPath(containers);
        }
    }
    // get from central containers
    if(ctx.centralContainers) {
        var containers = _.filter(ctx.centralContainers, (c) => {
            // stop [get, store] infinite loop.
            return fillTargetId != c.id && c.store[RESOURCE_ENERGY] >= Math.min(creep.store.getFreeCapacity(RESOURCE_ENERGY), 500);
        });
        if(containers.length > 0) {
            return creep.pos.findClosestByPath(containers);
        }
    }
    // get from storage
    if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 0) {
        // stop [get, store] infinite loop.
        if(fillTargetId != ctx.storage.id) {
            return ctx.storage;
        }
    }
    // TODO: get from tomestone
    return null;
}

function getValidEnergyTarget4Filler(ctx, creep, fillTargetId) {
    var target = Game.getObjectById(creep.memory.energyTargetId);
    if(!isValidEnergyTarget(target, creep)) {
        delete creep.memory.energyTargetId;
        target = findNewEnergyTarget4Filler(ctx, creep, fillTargetId);
    }
    if(target != null) {
        creep.memory.energyTargetId = target.id;
    }
    return target;
}

function GetEnergy4Filler(ctx, creep, fillTargetId) {
    var target = getValidEnergyTarget4Filler(ctx, creep, fillTargetId);
    if(target == null) return false;

    // get energy
    if(target.resourceType != undefined) {
        var err = creep.pickup(target);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    } else {
        var err = creep.withdraw(target, RESOURCE_ENERGY);
        if(err == ERR_NOT_IN_RANGE) {
            DefaultMoveTo(creep, target);
        }
    }

    return true;
}

function GetEnergyFromStore(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!target || !target.structureType || !target.store || target.store[RESOURCE_ENERGY] < 100) {
        target = findNewStore(ctx, creep);
    }
    if(ctx.dropedEnergy.length != 0) {
        // TODO: plan closest
        target = creep.pos.findClosestByPath(ctx.dropedEnergy, {ignoreCreeps: true});
        // target = ctx.dropedEnergy[0];
        // ctx.dropedEnergy = ctx.dropedEnergy.slice(1);
    }
    if(!target) return;

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
    err = creep.pickup(target);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
    creep.memory.targetId = target.id;
    creep.memory.fromWhere = target.id;
}

function GetEnergyFromControllerStore(ctx, creep) {
    var target = ctx.controllerContainer;
    if(target.store[RESOURCE_ENERGY] == 0) {
        if(ctx.storage != undefined && ctx.storage.store[RESOURCE_ENERGY] > 0) {
            target = ctx.storage;
        }
    }
    if(target.store[RESOURCE_ENERGY] == 0) {
        return;
    }

    var err = creep.withdraw(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        DefaultMoveTo(creep, target);
    }
}

function IsItemInList(item, lst, eqCond = null) {
    for(var i in lst) {
        if(eqCond == null) {
            if(item == lst[i]) return true;
        } else {
            if(eqCond(item, lst[i])) return true;
        }
    }
    return false;
}

function getContainerPosByFlag(flagName, roomName) {
    var flag = Game.flags[flagName];
    if(!flag || flag.room.name != roomName) return null;
    return flag.pos;
}

function InitSourceAndContainerInfo4Room(roomName) {
    try {
        var room = Game.rooms[roomName];
        room.memory.ctx.sourceIds = {};
        room.memory.ctx.sourceContainerPos = {};
        room.memory.ctx.sourceContainerIds = {};
        room.memory.ctx.centralContainerPos = {};
        room.memory.ctx.centralContainerIds = {};

        var pos = getContainerPosByFlag('cc', roomName);
        if(pos != null){
            room.memory.ctx.controllerContainerPos = pos;
        }
        for(var i in [0, 1]) {
            var flagName = 's' + i;
            var flag = Game.flags[flagName];
            if(flag && flag.room.name == roomName) {
                var sources = room.lookAt(flag.pos).filter((item) => item.type == 'source');
                var source = sources[0].source;
                room.memory.ctx.sourceIds[i] = source.id;
            }
            pos = getContainerPosByFlag('sc' + i, roomName);
            if(pos != null){
                room.memory.ctx.sourceContainerPos[i] = pos;
            }
            pos = getContainerPosByFlag('cc1', roomName);
            if(pos != null) {
                room.memory.ctx.centralContainerPos[i] = pos;
            }
        }
    } catch(err) {
        console.log(err.stack);
    }
}

function ObjMap(obj, func) {
    var res = {};
    for(var i in obj) {
        res[i] = func(obj[i]);
    }
    return res;
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
    IsItemInList,
    GetEnergy4Worker,
    GetEnergy4Filler,
    InitSourceAndContainerInfo4Room,
    ObjMap,
};