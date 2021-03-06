Game.EntityGenerator = new Game.Generator('entities',Game.Entity);

Game.EntityGenerator.learn({
    name: 'avatar',
    chr:'@',
    fg: 'black',
    bg: 'lightgreen',
    maxHp: 10,
    mixins: ["WalkerCorporeal", "CellController", "CellStateInformation", "Avatar"]
});

Game.EntityGenerator.learn({
    name: 'cell',
    chr:'#',
    fg: 'lightgreen',
    mixins: ["CellMove", "WalkerCorporeal", "CellStateInformation", "CellInfect"]
});

Game.EntityGenerator.learn({
    name: 'cellController',
    chr: '@',
    fg:'#ffff00',
    mixins: ["WalkerCorporeal", "CellController", "CellStateInformation", "EnemyAvatar", "CellMove"]
});

/*
Game.EntityGenerator.learn({
    name: 'growable',
    chr:'^',
    fg:'#ffff00',
    mixins: ["CellStateInformation", "Growable"]
});
*/

Game.creationFormats = {};

Game.creationFormats.test = {entityType: 'cell', fg : '#CCCCCC', chr : '0', moveStrategy : "NoMove"};

Game.creationFormats.flytrap = {entityType: 'cell', fg : '#CC3366', chr : 'B', moveStrategy : "ClumpTogether"};
Game.creationFormats.wanderer = {entityType: 'cell', fg : '#CCFFFF', chr : 'r', moveStrategy : "WanderAround"};

Game.creationFormats.localInfector = {entityType: 'cell', fg : '#CCFF33', chr : ';', moveStrategy : "OpportunisticMurder"};

Game.creationFormats.cellFollower = {entityType: 'cell', fg : '#66FF33', chr : '#', moveStrategy : "CircleAround"};
Game.creationFormats.cellLeader = {entityType: 'cellController', bg : '#66FF33', chr : '@', moveStrategy : "SwarmWhenWeak", setIsInfectable : false};

Game.creationFormats.rover = {entityType: 'cell', fg : '#FF7F50', chr : 'r', moveStrategy : "LocalMower"};


Game.creationFormats.assassinSwarm = {entityType: 'cell', fg : '#FF0000', chr : '!', moveStrategy : "AssassinSwarm"};

Game.creationFormats.clumpSwarmer = {entityType: 'cell', fg : '#FFD700', chr : '^', moveStrategy : "ClumpSwarmer"};

var infectionPackage = { infectionPackage : {moveStrategy : "Corrupter", chr: '+'}};
infectionPackage.infectionPackage.infectionPackage = infectionPackage;

Game.creationFormats.corrupter = {entityType: 'cell', fg : '#8B008B', chr : '+', moveStrategy : "Corrupter", infectionPackage : infectionPackage};

Game.creationFormats.groupInfector = {entityType: 'cell', fg : '#00FF7F', chr : '%', moveStrategy : "GroupInfector"};

Game.creationFormats.directionalSwarmer = {entityType: 'cell', fg : '#D2691E', chr : 'Y', moveStrategy : "DirectionalSwarmer"};
