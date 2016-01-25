Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';

Game.UIMode.gameStart = {
    enter: function () {
        Game.Message.send("Welcome to WSRL");
        Game.refresh();
    },
    exit: function () {
        Game.refresh();
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"game start",fg,bg);
        display.drawText(1,3,"press any key to continue",fg,bg);
    },
    handleInput: function (inputType,inputData) {
        if (inputData.charCode !== 0) { // ignore the various modding keys - control, shift, etc.
            Game.switchUiMode(Game.UIMode.gamePersistence);
        }
    }
};

Game.UIMode.gamePersistence = {
    RANDOM_SEED_KEY: 'gameRandomSeed',
    enter: function () {
        Game.refresh();
        //Game.TimeEngine.start();
        //console.log('game persistence');
    },
    exit: function () {
        Game.refresh();
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,3,"press S to save the current game, L to load the saved game, or N start a new one",fg,bg);
        //    console.log('TODO: check whether local storage has a game before offering restore');
        //    console.log('TODO: check whether a game is in progress before offering restore');
    },
    handleInput: function (inputType,inputData) {
        if (inputType == 'keypress') {
            var inputChar = String.fromCharCode(inputData.charCode);
            if (inputChar == 'S') { // ignore the various modding keys - control, shift, etc.
                this.saveGame();
            } else if (inputChar == 'L') {
                this.restoreGame();
            } else if (inputChar == 'N') {
                this.newGame();
            }
        } else if (inputType == 'keydown') {
            if (inputData.keyCode == 27) { // 'Escape'
                Game.switchUiMode(Game.UIMode.gamePlay);
            }
        }
    },
    //dummied out
    saveGame: function () {},
    restoreGame: function () {},
    newGame: function () {
        Game.DATASTORE = {};
        Game.DATASTORE.MAP = {};
        Game.DATASTORE.ENTITY = {};
        Game.initializeTimingEngine();
        Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform()*100000));
        Game.UIMode.gamePlay.setupNewGame();
        Game.switchUiMode(Game.UIMode.gamePlay);
    },
    localStorageAvailable: function () { // NOTE: see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
        try {
            var x = '__storage_test__';
            window.localStorage.setItem( x, x);
            window.localStorage.removeItem(x);
            return true;
        }
        catch(e) {
            Game.Message.send('Sorry, no local data storage is available for this browser');
            return false;
        }
    },
    BASE_toJSON: function(state_hash_name) {
        var state = this.attr;
        if (state_hash_name) {
            state = this[state_hash_name];
        }
        var json = JSON.stringify(state);

        // var json = {};
        // for (var at in state) {
        //   if (state.hasOwnProperty(at)) {
        //     if (state[at] instanceof Object && 'toJSON' in state[at]) {
        //       json[at] = state[at].toJSON();
        //     } else {
        //       json[at] = state[at];
        //     }
        //   }
        // }
        return json;
    },
    BASE_fromJSON: function (json,state_hash_name) {
        console.log("base from json");
        var using_state_hash = 'attr';
        if (state_hash_name) {
            using_state_hash = state_hash_name;
        }
        this[using_state_hash] = JSON.parse(json);
        // for (var at in this[using_state_hash]) {
        //   if (this[using_state_hash].hasOwnProperty(at)) {
        //     if (this[using_state_hash][at] instanceof Object && 'fromJSON' in this[using_state_hash][at]) {
        //       this[using_state_hash][at].fromJSON(json[at]);
        //     } else {
        //       this[using_state_hash][at] = json[at];
        //     }
        //   }
        // }
    }
};

Game.UIMode.gamePlay = {
    attr: {
        _mapId: '',
        _cameraX: 100,
        _cameraY: 100,
        _avatarId: ''
    },
    JSON_KEY: 'uiMode_gamePlay',
    enter: function () {
        if (this.attr._avatarId) {
            this.setCameraToAvatar();
        }
        //Game.TimeEngine.unlock();
        Game.refresh();
        //this.getAvatar().raiseEntityEvent('actionDone');
    },
    exit: function () {
        Game.refresh();
        //Game.TimeEngine.lock();
    },
    getMap: function () {
        return Game.DATASTORE.MAP[this.attr._mapId];
    },
    setMap: function (m) {
        this.attr._mapId = m.getId();
    },
    getAvatar: function () {
        return Game.DATASTORE.ENTITY[this.attr._avatarId];
    },
    setAvatar: function (a) {
        this.attr._avatarId = a.getId();
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        this.getMap().renderOn(display,this.attr._cameraX,this.attr._cameraY);
        // display.drawText(1,1,"game play",fg,bg); // DEV
        // display.drawText(1,3,"press [Enter] to win",fg,bg);
        // display.drawText(1,4,"press [Esc] to lose",fg,bg);
        // display.drawText(1,5,"press = to save, restore, or start a new game",fg,bg);

        //this.renderAvatar(display);
    },
    renderAvatarInfo: function (display) {
        var avatar = this.getAvatar();
        display.drawText(1,1, "avatar x: " + this.getAvatar().getX());
        display.drawText(1,2, "avatar y: " + this.getAvatar().getY());
        display.drawText(1,4, "Swarm:    " + avatar.childrenCells.size);
        var row = 8;
        display.drawText(1,7, "Orders given:");
        avatar.moveStrategyStack.forEach(function (s) {
            if (s[1] < 0) {
                display.drawText(4, row++, s[0]);
            }
            else {
                display.drawText(4, row++, s[0] + " (" + s[1] + " turns)");
            }
        });
    },
    moveAvatar: function (dx,dy) {
        if (this.getAvatar().tryWalk(this.getMap(),dx,dy)) {
            this.setCameraToAvatar();
            return true;
        }
        return false;
    },
    moveCamera: function (dx,dy) {
        this.setCamera(this.attr._cameraX + dx,this.attr._cameraY + dy);
    },
    setCamera: function (sx,sy) {
        this.attr._cameraX = Math.min(Math.max(0,sx),this.getMap().getWidth());
        this.attr._cameraY = Math.min(Math.max(0,sy),this.getMap().getHeight());
        //Game.renderDisplayMain();
    },
    setCameraToAvatar: function () {
        this.setCamera(this.getAvatar().getX(),this.getAvatar().getY());
    },
    handleInput: function (inputType,inputData) {
        var tookTurn = false;
        if (inputType == 'keypress') {

            // NOTE: a lot of repeated call below - think about where/how that might be done differently...?
            var pressedKey = String.fromCharCode(inputData.charCode);
            if (inputData.keyIdentifier == 'Enter') {
                Game.switchUiMode(Game.UIMode.gameWin);
                return;
            }

            switch (pressedKey) {
                case "w":
                    this.moveAvatar(0,-1);
                    break;
                case "a":
                    this.moveAvatar(-1,0);
                    break;
                case "s":
                    this.moveAvatar(0,1);
                    break;
                case "d":
                    this.moveAvatar(1,0);
                    break;
                case "q":
                case "e":
                case "r":
                case "t":
                case "z":
                    this.getAvatar().raiseEntityEvent("cellChange", {keyPress: pressedKey});
                    break;

                default:
                    if (inputType == 'keydown') {
                        if (inputData.keyCode == 27) { // 'Escape'
                            Game.switchUiMode(Game.UIMode.gameLose);
                        }
                        else if (inputData.keyCode == 187) { // '='
                            Game.switchUiMode(Game.UIMode.gamePersistence);
                        }
                    }
                    break;
            }

            if (tookTurn) {
                this.getAvatar().raiseEntityEvent('actionDone');
                Game.Message.ageMessages();
                return true;
            }
        }
    },
    setupNewGame: function () {
        var map = new Game.Map('blankMap');
        this.setMap(map);

        var avatar = Game.EntityGenerator.create('avatar');
        this.setAvatar(avatar);

        this.getMap().addEntity(avatar, map.getRandomWalkableLocation());
        this.setCameraToAvatar();

        //our cells
        Game.creationFormats.cellFollower.parentCell  = avatar;
        Game.creationFormats.cellFollower.targetEntity = avatar;
        map.createEntityAroundPos( avatar.getPos(), 10, 10, Game.creationFormats.cellFollower );

        map.createEntityRandomPos( 25, Game.creationFormats.groupInfector );
        map.createEntityRandomPos( 8, Game.creationFormats.clumpSwarmer );
        map.createEntityRandomPos( 20, Game.creationFormats.flytrap );
        map.createEntityRandomPos( 35, Game.creationFormats.wanderer );


        //parent cell
        Game.creationFormats.cellLeader.fg = '#F345CA';
        var parentCell = map.createEntity(map.getRandomWalkableLocation(), Game.creationFormats.cellLeader );

        //children cells
        Game.creationFormats.cellFollower.parentCell = parentCell;
        Game.creationFormats.cellFollower.targetEntity = parentCell;
        Game.creationFormats.cellFollower.fg = Game.creationFormats.cellLeader.fg;
        map.createEntityAroundPos( parentCell.getPos(), 30, 10, Game.creationFormats.cellFollower );


        //map.createEntityAroundPos( map.getRandomWalkableLocation(), 40, 10, Game.creationFormats.corrupter );
    },
    toJSON: function() {
        return Game.UIMode.gamePersistence.BASE_toJSON.call(this);
    },
    fromJSON: function (json) {
        Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
    }
};

Game.UIMode.gameWin = {
    enter: function () {
        console.log('game winning');
    },
    exit: function () {
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"You WON!!!!",fg,bg);
    },
    handleInput: function (inputType,inputData) {
        Game.Message.clear();
    }
};

Game.UIMode.gameLose = {
    enter: function () {
        console.log('game losing');
    },
    exit: function () {
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"You lost :(",fg,bg);
    },
    handleInput: function (inputType,inputData) {
        Game.Message.clear();
    }
};
