var moveThrough = require('move_through');
var utils = require('utils');

function fetchGlobalCtx() {
    return {cpu: Game.cpu.getUsed(), normalCreepCpu: 0, outCreepCpu: 0};
}

function fetchRoomCtx(gCtx, room) {
    if(room.memory.ctx == undefined) {
        require('context').InitRoomCtx(gCtx, room);
    }
    return require('context').FetchRoomCtx(gCtx, room);
}

module.exports.loop = function() {
    Memory.inConsole = false;
    Memory.processPower = true;

    if(Memory.processPower) {
        try {
            for(var roomName in Game.rooms) {
                var ps = Game.getObjectById(Memory.rooms[roomName].psId);
                if(ps) {
                    ps.processPower();
                }
            }
        } catch(err) {
            var errMsg = 'Run processPower err';
            utils.TraceError(err, errMsg);
        }
    }   

    if(global.runExtension != undefined) {
        try {
            if(global.runExtension()) return 0;
        } catch(err) {
            var errMsg = 'Run extension err';
            utils.TraceError(err, errMsg);
        }
    }

    for(var id in Memory.deposits) {
        if(Game.rooms[Memory.deposits[id].roomName]) {
            if(!Game.getObjectById(id)) {
                delete Memory.deposits[id];
            }
        }
    }

    try {
        require('role_invaderPair').Run();
    } catch(err) {
        var errMsg = 'Invader Pair error: ';
        utils.TraceError(err, errMsg);
    }

    try {
        require('role_invaderPicker').Run();
    } catch(err) {
        var errMsg = 'Invader Picker error: ';
        utils.TraceError(err, errMsg);
    }

    if(Game.cpu.bucket < 2000) {
        var gCtx = fetchGlobalCtx();
        gCtx.allOrders = Game.market.getAllOrders();
        try {
            require('market').HandleMarket(gCtx.allOrders, Game.market.orders);
        } catch(err) {
            var errMsg = 'Market error: ';
            utils.TraceError(err, errMsg);
        }
        return 0;
    }

    require('room_structure_cache');

    if(Memory.profilingflag == 1 || Memory.profileRems == 1) {
        Memory.memoryFetchTime = Game.cpu.getUsed();
        console.log('Parse memory: ' + Memory.memoryFetchTime);
    }
    Memory.moveCpuUseCur = 0;

    utils.ProfileUpdate();
    // statOutMiner
    Memory.outSpeed = Memory.statOutMiner / (Game.time - Memory.statStart);
    // clear memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
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

    utils.ProfileStage('Init: ');

    gCtx.allOrders = Game.market.getAllOrders();
    utils.ProfileStage('Fetch market: ');

    // global action begin

    // global action end

    // run room scheduler
    var stG = Game.cpu.getUsed();
    for(var i in Game.rooms) {
        try {
            Game.rooms[i].ctx = fetchRoomCtx(gCtx, Game.rooms[i]);
        } catch(err) {
            var errMsg = 'fetch room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }

    try {
        require('context').UpdateContext();
    } catch(err) {
        var errMsg = 'update room context error: ';
        utils.TraceError(err, errMsg);
    }
    utils.ProfileStage('Fetch room ctx: ');

    for(var i in Game.rooms) {
        try {
            var room = Game.rooms[i];
            require('room_scheduler').Run(gCtx, room);
        } catch(err) {
            var errMsg = 'room ' + i + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }
    utils.ProfileStage('Run room scheduler: ');

    try {
        require('terminal_scheduler').Run(gCtx);
    } catch(err) {
        var errMsg = 'Terminal scheduler error: ';
        utils.TraceError(err, errMsg);
    }

    utils.ProfileStage('Run terminal scheduler: ');

    for(var i in Game.rooms) {
        try {
            var ctx = Game.rooms[i].ctx;
            if(ctx.my) {
                for(var creep of ctx.managers) {
                    require('role_manager').Run(ctx, creep);
                }
            }
        } catch(err) {
            var errMsg = 'room ' + i + ' manager error: ';
            utils.TraceError(err, errMsg);
        }
    }

    utils.ProfileStage('Run room manager: ');

    for(var powerCreepName in Game.powerCreeps) {
        try {
            var powerCreep = Game.powerCreeps[powerCreepName];
            require('role_powerCreep').Run(powerCreep);
        } catch(err) {
            var errMsg = 'PowerCreep ' + powerCreepName + ' error: ';
            utils.TraceError(err, errMsg);
        }
    }

    utils.ProfileStage('Run power creeps: ');

    // cpu use stats
    if(Memory.cpuUse == undefined) {
        Memory.cpuUse = Game.cpu.getUsed();
    } else {
        Memory.cpuUse = Memory.cpuUse * 0.999 + Game.cpu.getUsed() * 0.001;
    }
    if(Game.time % 100 == 0) {
        console.log(Memory.cpuUse);
    }
    if(Memory.moveCpuUse == undefined) {
        Memory.moveCpuUse = Memory.moveCpuUseCur;
    } else {
        Memory.moveCpuUse = Memory.moveCpuUse * 0.8 + Memory.moveCpuUseCur * 0.2;
    }
    utils.ProfileStage('Stats mean cpu used: ', false, true);

    try {
        require('market').HandleMarket(gCtx.allOrders, Game.market.orders);
    } catch(err) {
        var errMsg = 'Market error: ';
        utils.TraceError(err, errMsg);
    }

    try {
        moveThrough.Run();
    } catch(err) {
        var errMsg = 'Move through error: ';
        utils.TraceError(err, errMsg);
    }
};