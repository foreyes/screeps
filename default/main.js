// TODOs: suicade logic, fix find energy then store, refactor ctx, recycle droped energy
// build err, stats road, refactor stages, extension use, reuse carrier and spawner
// get position by dist, tower logic, wall and rampart
var utils = require('utils');

function fetchGlobalCtx() {
    return {cpu: Game.cpu.getUsed(), roomCpu: {}, creepCpu: {}};
}

function fetchRoomCtx(gCtx, room) {
    if(room.memory.ctx == undefined) {
        require('context').InitRoomCtx(gCtx, room);
    }
    return require('context').FetchRoomCtx(gCtx, room);
}

// make sure spawn's adjusted 4 cells are not wall when respawn.
// spawn should not near by sources.
// sort from small to big
// set a restPos Flag
module.exports.loop = function() {
    // statOutMiner
    Memory.outSpeed = Memory.statOutMiner / (Game.time - Memory.statStart);
    // clear memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            if(Memory.creeps[name].role == 'simple_outer') {
                var room = Game.rooms[Memory.creeps[name].ctrlRoom];
                if(room.memory.simple_outer_his == undefined) {
                    room.memory.simple_outer_his = [];
                }
                var diff = 0 - Memory.creeps[name].cost;
                if(Memory.creeps[name].cnt != undefined) {
                    diff += Memory.creeps[name].cnt;
                }
                room.memory.simple_outer_his.push(diff);
            }
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    // fetch creep cache
    require('cache').FetchCreepCache();
    // cancel unactive orders
    if(Game.time % 1000 == 0) {
        var unactiveOrder = _.filter(Game.market.orders, (order) => {
            return order.amount == 0;
        });
        for(var i in unactiveOrder) {
            Game.market.cancelOrder(unactiveOrder[i].id);
        }
    }
    // fetch global context
    var gCtx = fetchGlobalCtx();

    // global action begin

    // global action end

    // run room scheduler
    for(var i in Game.rooms) {
        try {
            Game.rooms[i].ctx = fetchRoomCtx(gCtx, Game.rooms[i]);
        } catch(err) {
            var errMsg = 'fetch room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }
    for(var i in Game.rooms) {
        try {
            var room = Game.rooms[i];
            require('room_scheduler').Run(gCtx, room);
        } catch(err) {
            var errMsg = 'room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }

    // console.log(JSON.stringify(gCtx.roomCpu));
    // console.log(JSON.stringify(gCtx.creepCpu));

    // extra
    try {
        if(Memory.ExtraWork && Memory.ExtraWork.length > 0) {
            var newExt = [];
            for(var i in Memory.ExtraWork) {
                var workPair = Memory.ExtraWork[i];
                var creep = Game.getObjectById(workPair.id);
                if(!creep) continue;

                if(workPair.type == 'walk') {
                    var target = new RoomPosition(workPair.target.x, workPair.target.y, workPair.target.roomName);
                    if(!target) continue;
                    if(!utils.IsSamePosition(creep.pos, target)) {
                        utils.DefaultMoveTo(creep, target);
                        newExt.push(workPair);
                    }
                } else if(workPair.type == 'attack') {
                    var target = Game.getObjectById(workPair.target);
                    if(!target) continue;
                    var err = creep.attack(target);
                    if(err == ERR_NOT_IN_RANGE) {
                        utils.DefaultMoveTo(creep, target);
                    }
                    newExt.push(workPair);
                } else if(workPair.type == 'heal') {
                    var target = Game.getObjectById(workPair.target);
                    if(!target) continue;
                    var err = creep.heal(target);
                    if(err == ERR_NOT_IN_RANGE) {
                        utils.DefaultMoveTo(creep, target);
                    }
                    newExt.push(workPair);
                } else if(workPair.type == 'dismantle') {
                    var target = Game.getObjectById(workPair.target);
                    if(!target) continue;
                    var err = creep.dismantle(target);
                    if(err == ERR_NOT_IN_RANGE) {
                        utils.DefaultMoveTo(creep, target);
                    }
                    newExt.push(workPair);
                }
                
            }
            Memory.ExtraWork = newExt;
        }
    } catch(err) {
        utils.TraceError(err, 'Extra work error: ');
    }

    // cpu use stats
    if(Memory.cpuUse == undefined) {
        Memory.cpuUse = Game.cpu.getUsed();
    } else {
        Memory.cpuUse = Memory.cpuUse * 0.999 + Game.cpu.getUsed() * 0.001;
    }
    if(Game.time % 100 == 0) {
        console.log(Memory.cpuUse);
    }
};