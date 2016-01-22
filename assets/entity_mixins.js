

Game.CellMoveEnum = {
    CIRCLE_AROUND : 'circle around targetEntity position'
}

Game.CellMoveStrategies = {

    _circleAround: function(x,y,targetPos){
        var del = {x:0, y:0};
        var dist2 = Math.pow(targetPos.y-y, 2) + Math.pow(targetPos.x-x, 2);

        x += 4*(Math.random() - Math.random());
        y += 4*(Math.random() - Math.random());
        var ang = Math.atan2(targetPos.y-y, targetPos.x-x);

        var chg = Math.PI/2 + Math.PI/dist2 - Math.random() * Math.PI/6;
        if (Math.sqrt(dist2) & 2) chg *= -1;
        ang += chg;

        var sin = Math.sin(ang), cos = Math.cos(ang);
        if (Math.abs(sin) > 0.5) del.y = Math.abs(sin) / sin;
        if (Math.abs(cos) > 0.5) del.x = Math.abs(cos) / cos;
        return del;
    },

    _moveToward: function(x,y,targetPos, minDist, maxDist){
        var moveDeltas = {x:0, y:0}; 

        var difX = targetPos.x - x; 
        var difY = targetPos.y - y; 

        var sqrDist = Math.pow(difX,2) + Math.pow(difY,2); 

        //move toward
        if( sqrDist > maxDist || sqrDist < minDist){
            if(Math.abs(difX) > Math.abs(difY)){ moveDeltas.x = Game.util.clamp(difX, -1, 1); }
            else{ moveDeltas.y = Game.util.clamp(difY, -1, 1); }

            //move away 
            if(sqrDist < minDist){
                if(moveDeltas.x !== 0){
                    moveDeltas.x = moveDeltas.x * -1;
                }
                if(moveDeltas.y !== 0){
                    moveDeltas.y = moveDeltas.y * -1;
                }
            }
        }

        return moveDeltas; 
    }, 

    "OpportunisticMurder" : {
        getMoveDeltas: function () {
            var x = this.getX(), y = this.getY(); 

            var neighbours = [];
            for (var dx = -1; dx <= 1; dx++) {
                for (var dy = -1; dy <= 1; dy++) {
                    var en = this.getMap().getEntity(x+dx, y+dy);
                    if (en && en.isSameCellType && !en.isSameCellType(this)) {
                        neighbours.push({x:dx,y:dy});
                    }
                }
            }
            if (neighbours.length > 0) {
                return neighbours.random();
            }

            return this.getMoveDeltas(); 
            //return Game.CellMoveStrategies._circleAround(x,y,this.getTargetEntity().getPos());
        },
    },

    
    "CircleAround" : {
        getMoveDeltas: function(){
            var moveDeltas = Game.CellMoveStrategies._moveToward(
                this.getX(),
                this.getY(),
                this.getTargetEntity().getPos(),
                40, 60); 
            if(moveDeltas.x === 0 && moveDeltas.y === 0){
                return Game.CellMoveStrategies._circleAround(
                    this.getX(),
                    this.getY(),
                    this.getTargetEntity().getPos() ); 
            }
            return moveDeltas; 
        }
    },

    "ClusterAround" : {
        getMoveDeltas: function(){
            var targetPos = this.getTargetEntity().getPos();
            var difX = targetPos.x - this.getX(); 
            var difY = targetPos.y - this.getY();

            if(difX == 0){difX = Math.round( 2*Math.random() - 1 );}
            if(difY == 0){difY = Math.round( 2*Math.random() - 1 );}

            var moveDeltas = {x: Game.util.clamp(difX, -1, 1),
                              y: Game.util.clamp(difY, -1, 1)}; 

            if( this.getMap().getEntity( this.getX() + moveDeltas.x, this.getY() + moveDeltas.y) ){

                
                if(moveDeltas.y === 0){
                    moveDeltas.x = Game.util.randomNegInt(); 
                }
                else if(moveDeltas.x === 0){
                    moveDeltas.y = Game.util.randomNegInt(); 
                }
                else{
                    if(Math.random() > .5){
                        moveDeltas.x = 0; 
                    }
                    else{
                        moveDeltas.y = 0; 
                    }
                }
        }

            return moveDeltas; 
        }
    },

    "WanderAround" : {
        getMoveDeltas: function(){
            return this.getMoveDeltas(); 
        }
    }, 

    "ClumpTogether" : {
        moves : [ {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}, {x:0,y:-1} ], 
        getMoveDeltas: function(){
            if( !this.hasOwnProperty("count") ){
                this.count = 0; 
            }
            this.count ++; 
            this.count %= 4; 
            return Game.CellMoveStrategies["ClumpTogether"].moves[this.count]; 
        }
    },

    "ClusterMove" : {
        getMoveDeltas: function(){
            var neighborCount = 0;
            var ourX = this.getX();
            var ourY = this.getY(); 
            for(x = -1; x<2; x++){
                for(y = -1; y<2; y++){
                    if( x != 0 || y != 0){
                        var entity = this.getMap().getEntity(ourX+x, ourY+y);
                        if(entity && entity.hasOwnProperty("isSameCellType")){
                            if(entity.isSameCellType(this)){
                                neighborCount ++; 
                            }
                        }
                    }
                }
            }
            if(neighborCount > 1){
                return (Game.CellMoveStrategies["ClumpTogether"].getMoveDeltas).call(this); 
            }
            else{
                return (Game.CellMoveStrategies["CircleAround"].getMoveDeltas).call(this); 
            }
        }
    },

    "MoveInDir" : {
        getMoveDeltas: function(){
            return {x:2,y:2}; 
        }
    },

    "NoMove" : {
        getMoveDeltas: function(){
            return {x:0, y:0}; 
        }
    }
}


Game.EntityMixin = {};

// Mixins have a META property is is info about/for the mixin itself and then all other properties. The META property is NOT copied into objects for which this mixin is used - all other properies ARE copied in.

Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker'
  },
  tryWalk: function (map,dx,dy) {
    var targetX = Math.min(Math.max(0,this.getX() + dx),map.getWidth()-1);
    var targetY = Math.min(Math.max(0,this.getY() + dy),map.getHeight()-1);
      if (map.getEntity(targetX,targetY)) { // can't walk into spaces occupied by other entities
          
      this.raiseEntityEvent('bumpEntity',{actor:this,recipient:map.getEntity(targetX,targetY)});
      // NOTE: should bumping an entity always take a turn? might have to get some return data from the event (once event return data is implemented)
      return true;
    }
    var targetTile = map.getTile(targetX,targetY);
    if (targetTile.isWalkable()) {
      // console.log('tryWalk - walkable: '+this.getName());
      this.setPos(targetX,targetY);
      var myMap = this.getMap();
      if (myMap) {
        myMap.updateEntityLocation(this);
      }
      return true;
    } else {
      this.raiseEntityEvent('walkForbidden',{target:targetTile});
    }
    return false;
  }
};

Game.EntityMixin.HitPoints = {
  META: {
    mixinName: 'HitPoints',
    mixinGroup: 'HitPoints',
    stateNamespace: '_HitPoints_attr',
    stateModel:  {
      maxHp: 1,
      curHp: 1
    },
    init: function (template) {
      this.attr._HitPoints_attr.maxHp = template.maxHp || 1;
      this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
    },
    listeners: {
      'attacked': function(evtData) {
        // console.log('HitPoints attacked');

        this.takeHits(evtData.attackPower);
        this.raiseEntityEvent('damagedBy',{damager:evtData.attacker,damageAmount:evtData.attackPower});
        evtData.attacker.raiseEntityEvent('dealtDamage',{damagee:this,damageAmount:evtData.attackPower});
        if (this.getCurHp() <= 0) {
          this.raiseEntityEvent('killed',{entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseEntityEvent('madeKill',{entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        // console.log('HitPoints killed');
        this.destroy();
      }
    }
  },
  getMaxHp: function () {
    return this.attr._HitPoints_attr.maxHp;
  },
  setMaxHp: function (n) {
    this.attr._HitPoints_attr.maxHp = n;
  },
  getCurHp: function () {
    return this.attr._HitPoints_attr.curHp;
  },
  setCurHp: function (n) {
    this.attr._HitPoints_attr.curHp = n;
  },
  takeHits: function (amt) {
    this.attr._HitPoints_attr.curHp -= amt;
  },
  recoverHits: function (amt) {
    this.attr._HitPoints_attr.curHp = Math.min(this.attr._HitPoints_attr.curHp+amt,this.attr._HitPoints_attr.maxHp);
  }
};

//#############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.CellMove = {
  META: {
    mixinName: 'CellMove',
      mixinGroup: 'Cell',
      listeners: {
          'takeTurn': function(evtData){
              //Move strategies , note MoveStrategy called from calling cell's scope
              moveDeltas = (this.moveStrategy.getMoveDeltas).call(this); 

              //DO WALK 
              if (this.hasMixin('Walker')) { 
                  this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
              }
              
          }
      },
  },
  getMoveDeltas: function () {
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },

};

//Manages children cells of cell conglomerates 
Game.EntityMixin.CellController = {
    META: {
        mixinName: 'CellController',
        mixinGroup: 'Cell',
        listeners: {
            //pass cell change event to all children cells 
            'cellChange': function(evtData) {
                if(evtData.keyPress === 'q'){
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterAround"];
                }
                else if(evtData.keyPress === 'e'){
                    this.curMoveStrategy = Game.CellMoveStrategies["CircleAround"];
                }
                else{
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterMove"]; 
                }

                evtData = {}; 
                evtData.moveStrategy = this.curMoveStrategy; 

                this.childrenCells.forEach(
                    function(value1, value2, set){
                        value1.raiseEntityEvent('cellChange',evtData);
                    }

                );

            },
        }
    },
    childrenCells: new Set(),
    curMoveStrategy: Game.CellMoveStrategies["CircleAround"],

    //WARNING NOTE EXTRA REFERENCE, POSSIBLE MEMORY LEAK WITHOUT EXPLICIT REMOVAL 
    addChildrenCell: function(cellEntity){
        this.childrenCells.add(cellEntity); 
    }, 

    removeChildrenCell: function(cellEntity){
        this.childrenCells.delete(cellEntity);
    }
};
/*
//More complex logic pending 
Game.EntityMixin.Killable = {
    META: {
        mixinName: 'Killable', 
        mixinGroup: 'Cell',
        listeners: {
            'destroy': function(evtData) {
                this.destroy();
                this.raiseEntityEvent('destroyed'); 
            }
        }
    }
};
*/

Game.EntityMixin.CellInfect = {
    META: {
        mixinName: 'CellInfect', 
        mixinGroup: 'Cell',
        listeners: {
            'bumpEntity': function(evtData){

                //infect can mean changing behavior and/or appearance of other cell, other cell can also have resistances, cellInformation will probably expose all relevant information about cell, method set to allow for this 
                //evtData.receipient.raiseEntityEvent('infect',);
                if(this.canInfect){
                    if(evtData.recipient.hasOwnProperty("setAppearance")){
                        if(evtData.recipient.getIsInfectable() == true){
                            evtData.recipient.setAppearance(this.getFg(), this.getChar());
                            evtData.recipient.setMoveStrategy(this.getMoveStrategy());
                            evtData.recipient.setParentCell(this.getParentCell());

                            evtData.recipient.setTargetEntity(this.getTargetEntity()); 
                        }
                    }
                }

            }
        }
    }
    
};

//Individual cell memory and identification
// !!! Should be attached to all cells !!! 
Game.EntityMixin.CellStateInformation = {
    META: {
        mixinName: 'CellStateInformation',
        mixinGroup: 'Cell',
        listeners: {
            'cellChange': function(evtData){
                this.setMoveStrategy(evtData.moveStrategy); 
                //this.moveStrategy = evtData.curMoveStrategy; 
            }
        },
        init: function(template){
            Game.Actors.push(this);
            //this.targetEntity = Game.UIMode.gamePlay.getAvatar(); 
        },
    },

    moveStrategy: "WanderAround", 
    moveStrategy: Game.CellMoveStrategies["WanderAround"],
    parentCell: null,
    canInfect: true, 
    isInfectable : true,
    targetEntity : null,

    getTargetEntity : function(){ return this.targetEntity; },
    setTargetEntity: function(targetEntity){ this.targetEntity = targetEntity; }, 

    getParentCell: function(){
        return this.parentCell; 
    },

    setMoveStrategy: function(moveStrategy){
        if(typeof moveStrategy === 'string'){
            this.moveStrategy = Game.CellMoveStrategies[moveStrategy];
        }
        else{
            this.moveStrategy = moveStrategy; 
        }
    },

    getMoveStrategy: function(){
        return this.moveStrategy; 
    }, 

    setParentCell: function(parentCell){

        if(this.parentCell !== null){
            this.parentCell.removeChildrenCell(this);
        }
        
        this.parentCell = parentCell;
        
        if(parentCell){
            parentCell.addChildrenCell(this); 
        }
    },

    setAppearance: function(fg, chr){
        this.setChar(chr);
        this.setFg(fg); 
    }, 

    isSameCellType: function(otherCell){
        return otherCell.getParentCell() == this.getParentCell(); 
    },

    setCanInfect: function(canInfect){
        this.canInfect = canInfect; 
    },

    getIsInfectable: function(){
        return this.isInfectable; 
    },

    setIsInfectable: function(isInfectable){
        this.isInfectable = isInfectable; 
    }, 

    doTurn: function(){
        this.raiseEntityEvent('takeTurn', null); 
    }

};

Game.EntityMixin.Growable = {
    META: {
        mixinName: 'Growable',
        mixinGroup: 'Growable',
        listeners: {
            'takeTurn': function(evtData){
                if(this.curTime > this.growTime){
                    this.grow(); 
                    this.curTime = 0; 
                }
                this.curTime ++; 
            }
        },
    },
    growTime: 1,
    curTime: 0,
    growDir: {x:0,y:1}, 
    grow: function(x,y){

        /*
        if(Math.random() > .9){
            this.setGrowDir(Math.random() * 2 - 1,
                            Math.random() * 2 - 1); 
        }
        */
        this.spread( this.getX() + this.growDir.x, this.getY() + this.growDir.y );

        //Game.util.getMooreNeighborhood.call(this, this.getPos(), this.spread); 
    },
    spread: function(x,y){
        var testObject = { method: 'copySelf', numArg: 2, args: [x, y] };

        //console.log(testObject.method + " " + testObject.numArg + " " + testObject.args[0] ); 

        if(!this.getMap().getEntity(x,y)){

            Game.util.callMethod(this, testObject); 
            //this[testObject.method]( testObject.args[0], testObject.args[1]); 
            //this.copySelf(x, y); 
        }
        

        /*
        if(Math.random() > .8){
            if(this.getMap().withinMapBounds( x, y) && !this.getMap().getEntity(x,y)){

                //this.getMap().createCells(
                this.copySelf({x:x, y:y} );
            }
        }
        */
    },
    copySelf: function(x,y){
        var newEntity = Game.EntityGenerator.create('growable');
        newEntity.setAppearance(this.getFg(), this.getChar()); 
        newEntity.setMoveStrategy(this.getMoveStrategy());
        newEntity.setIsInfectable(false);

        newEntity.setGrowDir(this.getGrowDir()); 
        this.getMap().addEntity(newEntity, {x:x, y:y})
    },
    getGrowDir: function(){
        console.log( this.growDir.x + " " + this.growDir.y); 
        return this.growDir; 
    },
    setGrowDir: function( growDir ){
        this.growDir = growDir; 
    }
}; 


//cells move in concert as one mass normally 
//energy system to move in concert 
