// TODOs: suicade logic, fix find energy then store, refactor ctx, recycle droped energy
// build err, stats road, refactor stages, extension use, reuse carrier and spawner
// get position by dist, tower logic, wall and rampart
var utils = require('utils');

function fetchGlobalCtx() {
    return {};
}

// make sure spawn's adjusted 4 cells are not wall when respawn.
// spawn should not near by sources.
// sort from small to big
// set a restPos Flag
module.exports.loop = function() {
    // clear memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    // fetch global context
    var gCtx = fetchGlobalCtx();

    // global action begin

    // global action end

    // run room scheduler
    for(var i in Game.rooms) {
        var room = Game.rooms[i];
        require('room_scheduler').Run(gCtx, room);
    }

    // extra
    if(Memory.ctx.ExtraWork && Memory.ctx.ExtraWork.length > 0) {
        var newExt = [];
        for(var i in Memory.ctx.ExtraWork) {
            var workPair = Memory.ctx.ExtraWork[i];
            var creep = Game.getObjectById(workPair.id);
            if(!creep) continue;
            if(workPair.type == 'walk') {
                var target = new RoomPosition(workPair.target.x, workPair.target.y, workPair.target.roomName);
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
            }
            
        }
        Memory.ctx.ExtraWork = newExt;
    }
};