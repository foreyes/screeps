const marketConfig = require('market_config');

function isNpcOrder(roomName) {
    for(var i in roomName) {
        var ch = roomName[i];
        if(ch >= '0' && ch <= '9') {
            if(ch == '0') return true;
        }
    }
    return false;
}

function HandleMarket(orders, myOrders) {
    for(var resourceType in marketConfig.rushBuyConfig) {
        var info = marketConfig.rushBuyConfig[resourceType];
        var terminal = Game.rooms[info.roomName].terminal;
        if(terminal && terminal.store[resourceType] >= info.amount) continue;
        var curAmount = terminal.store[resourceType];
        // create order
        var mine = _.filter(myOrders, (order) => {
            return order.type == ORDER_BUY && order.remainingAmount > 0 &&
                    order.resourceType == resourceType;
        });
        if(mine.length == 0) {
            Game.market.createOrder({
                type: ORDER_BUY,
                resourceType: resourceType,
                price: info.price,
                totalAmount: info.once,
                roomName: info.roomName,
            });
            continue;
        }
        // rush buy
        var myPrice = mine[0].price, myId = mine[0].id;
        var higher = orders.filter((order) => {
            return order.type == ORDER_BUY && order.id != myId &&
                    order.resourceType == resourceType &&
                    order.amount > 0 && !isNpcOrder(order.roomName);
        }).sort((a, b) => {
            return b.price - a.price;
        });
        if(higher.length > 0) {
            if(higher[0].price < info.maxPrice) {
                if(higher[0].amount > 1000) {
                    var newPrice = Math.max(info.price, higher[0].price + 0.01);
                    Game.market.changeOrderPrice(myId, newPrice);
                    myPrice = newPrice;
                } else if(higher[0].amount < 10) {
                    Game.market.deal(higher[0].id, higher[0].amount, info.roomName);
                }
            }
        } else {
            if(myPrice > info.price * 1.5) {
                Game.market.changeOrderPrice(myId, myPrice - 0.01);
            }
        }
        // rush sell
        var sells = orders.filter((order) => {
            return order.type == ORDER_SELL && order.resourceType == resourceType &&
                    order.amount > 0 && order.price < myPrice * 1.1;
        }).sort((a, b) => {
            return a.price - b.price;
        });
        if(sells.length > 0) {
            Game.market.deal(sells[0].id, Math.min(8000, info.amount - curAmount, sells[0].amount), info.roomName);
        }
    }

    for(var resourceType in marketConfig.marketBuyConfig) {
        var info = marketConfig.marketBuyConfig[resourceType];
        if(!Game.rooms[info.roomName] || !Game.rooms[info.roomName].terminal || !Game.rooms[info.roomName].terminal.my) {
            continue;
        }
        var terminal = Game.rooms[info.roomName].terminal;
        var curAmount = terminal.store[resourceType];
        if(curAmount < info.least) {
            var exsitOrder = _.filter(myOrders, (order) => {
                return order.type == ORDER_BUY &&
                        order.resourceType == resourceType && order.remainingAmount > 0;
            });
            if(exsitOrder.length == 0) {
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: resourceType,
                    price: info.price,
                    totalAmount: info.least,
                    roomName: info.roomName,
                });
            } 
        }

        if(terminal.cooldown > 0) continue;

        if(curAmount < info.amount) {
            var targets = orders.filter((order) => {
                return order.type == ORDER_SELL &&
                        order.resourceType == resourceType &&
                        order.amount > 0 && order.price <= info.price;
            }).sort((a, b) => {
                return a.price - b.price;
            });
            if(targets.length > 0) {
                Game.market.deal(targets[0].id, Math.min(8000, info.amount - curAmount, targets[0].amount), info.roomName);
            }
        }
    }

    for(var resourceType in marketConfig.marketSellConfig) {
        var info = marketConfig.marketSellConfig[resourceType];
        if(!Game.rooms[info.roomName] || !Game.rooms[info.roomName].terminal || !Game.rooms[info.roomName].terminal.my) {
            continue;
        }
        var terminal = Game.rooms[info.roomName].terminal;
        var curAmount = terminal.store[resourceType];
        if(curAmount <= info.least) continue;

        // only deal order_buy, won't create order_sell.
        if(terminal.cooldown > 0) continue;

        var targets = orders.filter((order) => {
            // ignore my order
            var roomName = order.roomName;
            if(Game.rooms[roomName] && Game.rooms[roomName].my) return false;

            return order.type == ORDER_BUY &&
                    order.resourceType == resourceType &&
                    order.amount > 0 && order.price >= info.price;
        }).sort((a, b) => {
            return b.price - a.price;
        });
        if(targets.length > 0) {
            Game.market.deal(targets[0].id, Math.min(8000, curAmount - info.least, targets[0].amount), info.roomName);
        }
    }
}

module.exports = {
    HandleMarket,
};