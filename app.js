

/**
 * Constants used throughout the code.
 *
 */
{var constants = {};
constants.RT3 = Math.sqrt(3);
constants.dA = Math.PI*2/6;
constants.drawRad = 0.95;
}

/**
 * Types of tiles.
 */
{var types = {}
types.water = new Type("water", "#2a7384", "#2a7384");
types.land = new Type("land", "#A8D68E", "#A8D68E");
}

var playerColors = ['pink', 'orange', '#BC8ED6', '#AAE2E3', '#FAF86B'];
var playerNames = ['player 1', 'player 2', 'player 3', 'player 4', 'player 5'];

/**
 * The tile object.
 * 
 * @class Tile
 * @constructor
 * @param {Number} q The column number
 * @param {Number} r The row number
 */ 
function Tile(q, r) {
    this.q = q;
    this.r = r;
    this.type = types.water;
    this.owner = null;
    this.neighbors = null;
    this.borders = null;
    this.key = Tile.toKey(q, r);
	
	this.influencer = [];
	this.seedDist = [];
	this.x = this.q - (this.r - (this.r & 1)) / 2;
	this.z = this.r;
	this.y = -this.x - this.z;
	this.potentialGrowth = [];	// Counts of neighboring land tiles uninfluenced by player
	this.ownedPotentialGrowth = null;	// Count of neighboring land tiles unowned by owner
	this.influence = [];
	this.flagger = null;		
}

/**
 * Serializes a tile by location.
 *
 * @method toKey
 * @static
 * @param {Number} q The column number
 * @param {Number} r The row number
 * @return {String} A serialized form of the row and column
 */
Tile.toKey = function(q, r) {
    return q + "," + r;
};

/**
 * Sets the owner of a tile.
 *
 * @method setOwner
 * @param {Player} player The new owner
 */
Tile.prototype.setOwner = function(player)    {
    this.owner = player;
};

Grid.prototype.setOwner = function(tile, player)    {
	var counter = 0;
	if (tile.owner != null) {	// if previous owner exists, update previous owner's ownedTiles and ownedBorderTiles arrays.
		tile.owner.ownedTiles.splice(tile.owner.ownedTiles.indexOf(tile), 1);	//remove tile from previous owner's ownedTiles array.
		if (tile.ownedPotentialGrowth > 0) {	// if tile is in previous owner's ownedBorderTiles array...
			tile.owner.ownedBorderTiles.splice(tile.owner.ownedBorderTiles.indexOf(tile), 1);	// ... then splice it
		}
	}
	for (var i=0; i < tile.neighbors.length; i++) {	// loop through the tile's neighbors
		if (tile.neighbors[i].owner == tile.owner) {	// if neighbor owned by previous owner
			if (tile.neighbors[i].ownedPotentialGrowth == 0) {	// if neighbor wasn't in previous owner's ownedBorderTiles...
				tile.owner.ownedBorderTiles.push(tile);		// push it.
			}
			tile.neighbors[i].ownedPotentialGrowth++;	// increment neighbor's ownedPotentialGrowth by 1.
		}
		if (tile.neighbors[i].owner == player) {	// if neighbor owned by new owner...
			tile.neighbors[i].ownedPotentialGrowth--;	// decrement neighbor's ownedPotentialGrowth by 1.
			if (tile.neighbors[i].ownedPotentialGrowth == 0) {	// if neighbor's ownedPotentialGrowth is 0...
				player.ownedBorderTiles.splice(player.ownedBorderTiles.indexOf(tile.neighbors[i]), 1);	//  splice neighbor from new owner's ownedBorderTiles. 
			}
		}
		else if (tile.neighbors[i].type != types.water) {	// else if neighbor unowned by player is is not water...
			counter++;
		}
	}
	tile.ownedPotentialGrowth = counter;
    tile.owner = player;
	tile.owner.ownedTiles.push(tile);
	if (tile.ownedPotentialGrowth > 0) {
		tile.owner.ownedBorderTiles.push(tile);
	}
};

/**
 * Sets the type of a tile.
 *
 * @method setType
 * @param {Type} type The new type
 */
Tile.prototype.setType = function(type)    {
    this.type = type;
};

/**
 * The tile draw method.
 *
 * @method draw
 * @param {ViewingWindow} viewingWindow The parent viewing window
 * @param {CanvasRenderingContext2D} context The context of the main canvas
 */
Tile.prototype.draw = function(viewingWindow, context)    {
    var info = viewingWindow.getDisplayInfo(this);
    var gradient;
	var fraction = 0.7;
    context.beginPath();
    
    var angle = constants.dA * (0.5);
    context.moveTo(info.cx + info.rad * Math.cos(angle) * constants.drawRad, info.cy + info.rad * Math.sin(angle) * constants.drawRad);
    for (var i=1; i <= 6; i++) {
        angle += constants.dA;
        context.lineTo(info.cx + info.rad * Math.cos(angle) * constants.drawRad, info.cy + info.rad * Math.sin(angle) * constants.drawRad);
    }
    
	if (this.owner == null) {
		context.strokeStyle = this.type.stroke;
		context.stroke();
		context.fillStyle = this.type.fill;
		context.fill();
	}
	else if (this.seedDist[this.influencer.indexOf(this.owner)] == 0){
		context.fillStyle = this.owner.color;
		context.fill();
		context.strokeStyle = 'black';
		context.stroke();
	}
	else {
		context.strokeStyle = this.owner.color;
		context.stroke();
		context.fillStyle = this.owner.color;
		context.fill();
	}
	if (this.flagger) {
		context.beginPath();
		context.moveTo(info.cx + info.rad * Math.cos(angle) * fraction * constants.drawRad, info.cy + info.rad * Math.sin(angle) * fraction * constants.drawRad);
		for (var i=1; i <= 6; i++) {
			angle += constants.dA;
			context.lineTo(info.cx + info.rad * Math.cos(angle) * fraction * constants.drawRad, info.cy + info.rad * Math.sin(angle) * fraction * constants.drawRad);
		}
		
		context.strokeStyle = 'black';
		context.stroke();
		context.fillStyle = this.flagger.color;
		context.fill();
	}
    
};

/**
 * Sets the neighbors and the number of borders of a given tile to the neighbors property.
 *
 * @method setNeighbors
 * @param {Array} neighbors An array of neighbors with type Tile
 */
Tile.prototype.setNeighbors = function(neighbors) {
    this.neighbors = neighbors;
    this.borders = neighbors.length;
};

/**
 * Controls how the tiles are going to be displayed.
 *
 * @class ViewingWindow
 * @constructor
 * @param {HTMLCanvasElement} canvas The main HTML canvas
 * @param {Grid} grid The base grid object which contains all tiles
 */
function ViewingWindow(canvas, grid)    {
    this.canvas = canvas;
    this.height = canvas.height;
    this.width = canvas.width;
    this.grid = grid;
    
    var heightRadius = this.height/(2*(0.75*this.grid.rows + 0.25));
    var widthRadius = this.width/(constants.RT3*(this.grid.cols + 0.5));
    
    if (heightRadius < widthRadius) {
        this.tileRadius = heightRadius;
        var gridWidth = (this.grid.cols + 0.5)*constants.RT3*this.tileRadius;
        this.offsetX = (this.width - gridWidth)/2;
        this.offsetY = 0;
    } else {
        this.tileRadius = widthRadius;
        var gridHeight = (this.grid.rows - 0.25)*2*this.tileRadius;
        this.offsetX = 0;
        this.offsetY = (this.height - gridHeight)/2;
    }
    
    this.tileHeight = 2*this.tileRadius;
    this.verticalDistance = 0.75*this.tileHeight;
    this.tileWidth = 0.5*constants.RT3*this.tileHeight;
    this.horizontalDistance = this.tileWidth;
    
    this.offsetX += 0.5*this.tileWidth;
    this.offsetY += 0.5*this.tileHeight;

}

/**
 * Returns the location and radius of the tile.
 *
 * @method getDisplayInfo
 * @param {Tile} tile The tile which is being displayed
 * @return {Object} An object with properties "cx", "cy", and "rad"
 */
ViewingWindow.prototype.getDisplayInfo = function(tile)        {
    var center_x = this.offsetX + this.horizontalDistance*tile.q;
    if (tile.r & 1) {
        center_x += 0.5*this.horizontalDistance;
    }
    var center_y = this.offsetY + this.verticalDistance*tile.r;
    return {"cx": center_x, "cy": center_y, "rad": this.tileRadius};
};

/**
 * The master grid which stores all of the tiles.
 *
 * @class Grid
 * @constructor
 * @param {Number} cols The total number of columns
 * @param {Number} rows The total number of rows.
 */
function Grid(cols, rows, proportion, arg1, arg2, players)    {
    var tile;
    
    this.cols = cols;
    this.rows = rows;
    this.tiles = {};
    this.type = types.water;
    this.iterator(function(q, r) {
        tile = new Tile(q, r);
        this.tiles[tile.key] = tile;
    });
    this.setNeighbors();
    this.land = this.generateLand4(proportion, arg1, arg2);
	this.players = this.setPlayers(players);
}

Grid.prototype.updateInfluence = function() {
	var index;
	for (var i=0; i < this.players.length; i++) {
		for (var j=0; j < this.players[i].tiles.length; j++) {
			index = this.players[i].tiles[j].influencer.indexOf(this.players[i]);
			this.players[i].tiles[j].influence[index] += (this.players[i].culture / (this.players[i].tiles[j].seedDist[index] + 1));
		}
	}
	
	this.iterator(function(q, r) {
        var tile = this.getTile(q, r);
		var max = Math.max.apply(Math, tile.influence);
		if (tile.influence.length > 0) {
			if (tile.owner == null) {
			//	tile.owner = tile.influencer[0];
				this.setOwner(tile, tile.influencer[0]);
			}
			if (tile.influence[tile.influencer.indexOf(tile.owner)] < max) {
			//	tile.owner = tile.influencer[tile.influence.indexOf(max)];
				this.setOwner(tile, tile.influencer[tile.influence.indexOf(max)]);
			}
		}
    });
}

Grid.prototype.setPlayers = function(players) {
	var playerArray = [];
	var random;
	var seed;
	for (var i =0; i < players; i++) {
		playerArray.push(new Player(playerNames[i], playerColors[i]));
		random = Math.floor(Math.random() * this.land.tiles.length);
		seed = this.land.tiles[random];
		this.setInfluence(seed, playerArray[i]);
	}
	return playerArray;
}

Grid.prototype.setInfluence = function(tile, player) {
	var potentialGrowthCount = 0;
	tile.influencer.push(player);
	tile.influence.push(1);
	player.tiles.push(tile);
	tile.seedDist.push(this.distance(tile, player.tiles[0]));
	
	for (var i=0; i < tile.neighbors.length; i++) {
		if (tile.neighbors[i].type != types.water && tile.neighbors[i].influencer.indexOf(player) == -1) {
			potentialGrowthCount++;
		}
		if (tile.neighbors[i].influencer.indexOf(player) != -1) {
			tile.neighbors[i].potentialGrowth[tile.neighbors[i].influencer.indexOf(player)]--;
		}
		if (tile.neighbors[i].potentialGrowth[tile.neighbors[i].influencer.indexOf(player)] == 0 && player.borderTiles.indexOf(tile.neighbors[i]) != -1) {
			player.borderTiles.splice(player.borderTiles.indexOf(tile.neighbors[i]), 1);
		}
	}
	tile.potentialGrowth[tile.influencer.indexOf(player)] = potentialGrowthCount;
	if (tile.potentialGrowth[tile.influencer.indexOf(player)] > 0) {
		player.borderTiles.push(tile);
	}
}


Grid.prototype.distance = function(tileA, tileB) {
	return (Math.abs(tileA.x - tileB.x) + Math.abs(tileA.y - tileB.y) + Math.abs(tileA.z - tileB.z)) / 2;
}

Grid.prototype.qrDistance = function(tileA, tileB) {
	return Math.pow(Math.pow(Math.abs(tileA.q - tileB.q), 2) + Math.pow(Math.abs(tileA.r - tileB.r), 2), 0.5);
}

/**
 * Draws the entire grid.
 *
 * @method draw
 * @param {ViewingWindow} viewingWindow The parent viewing window
 * @param {CanvasRenderingContext2D} context The context of the main canvas
 */
Grid.prototype.draw = function(viewingWindow, context) {
	context.clearRect(0, 0, viewingWindow.width, viewingWindow.height);
    this.iterator(function(q, r) {
        this.getTile(q, r).draw(viewingWindow, context);
    });
};

/**
 * The neighbors of an even row in the grid.
 *
 * @property evenNeighbors
 * @type Array
 * @static
 */
Grid.evenNeighbors = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];

/**
 * The neighbors of an odd row in the grid.
 *
 * @property oddNeighbors
 * @type Array
 * @static
 */
Grid.oddNeighbors = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];

/**
 * Sets the neighbors and the number of borders of all tiles in the grid.
 *
 * @method setNeighbors
 */
Grid.prototype.setNeighbors = function() {
    this.iterator(function(q, r) {
        var tile = this.getTile(q, r), 
            neighbors = [], 
            test = r & 1 ? Grid.oddNeighbors : Grid.evenNeighbors,
            neighbor;
                   
        for (var i=0; i < 6; i++) {
            neighbor = this.getTile(q + test[i][0], r + test[i][1]);
            if (neighbor && neighbor.type == this.type) {
                neighbors.push(neighbor);
            }
        }
        tile.setNeighbors(neighbors);
    });
};

/**
 * A helper function which is passed a callback that is executed over all of the grid indices.
 *
 * @method iterator
 * @param {Function} f The callback function
 */
Grid.prototype.iterator = function(f) {
    for (var q = 0; q < this.cols; q++)    {
        for (var r = 0; r < this.rows; r++)    {
            f.call(this, q, r);
        }
    }
};

/**
 * Gets a tile from the grid.
 * 
 * @method getTile
 * @param {Number} q The column number
 * @param {Number} r The row number
 * @return {Tile} The tile at (q, r)
 */
Grid.prototype.getTile = function(q, r)    {
    return this.tiles[Tile.toKey(q, r)];
};

/**
 * Determines whether a tile at (q, r) is in the passed array.
 * 
 * @method inTileArray
 * @param {Number} tileQ The tile column
 * @param {Number} tileR The tile row
 * @param {Array} tiles An array of Tiles
 * @return {Boolean} A boolean value indicated if the given tile was found
 */
Grid.prototype.inTileArray = function(tileQ, tileR, tiles) {
    for (var i=0, max=tiles.length; i < max; i++) {
        if (tiles[i].q == tileQ && tiles[i].r == tileR) {
            return true;
        }
    }
    return false;
};

/**
 * Sets a given Tile as land and updates the "land" and "coast" arrays accordingly.
 *
 * @method setLand
 * @param {Tile} tile The tile being set
 * @param {Array} land An array of Tiles containing the land of the Grid
 * @param {Array} coast An array of Tiles containing the coast of the Grid
 */
Grid.prototype.setLand = function(tile, land, coast) {
    var neighbor;
    
    tile.setType(types.land);
    land.push(tile);
    if (tile.borders != 0) {
        coast.push(tile);
    }
    
    for (var i=0, max=tile.neighbors.length; i < max; i++) {
        neighbor = tile.neighbors[i];
        neighbor.borders--;
        if (neighbor.borders == 0 && coast.indexOf(neighbor) != -1) {
            coast.splice(coast.indexOf(neighbor), 1);
        }
    }
};

/**
 * A method of generating land that picks a random coastal tile and expands from it.
 *
 * @method generateLand
 * @param {Number} proportion The proportion of water to be filled
 * @return {Land} An 0bject containing the land tiles and the coastline
 */
Grid.prototype.generateLand = function(proportion) {
    var seed, 
        coast = [], 
        total = Math.floor(this.rows * this.cols * proportion),
        randomCoast,
        randomNeighbor,
        land = [];
    
    seed = this.getTile(Math.floor(this.cols/2), Math.floor(this.rows/2));
    this.setLand(seed, coast, land);
    total--;
        
    while (total-- > 0) {
        randomCoast = coast[Math.floor(Math.random()*coast.length)];
        randomNeighbor = randomCoast.neighbors[Math.floor(Math.random()*randomCoast.neighbors.length)];
        while (randomNeighbor.type != types.water) {
            randomNeighbor = randomCoast.neighbors[Math.floor(Math.random()*randomCoast.neighbors.length)];
        }
        
        this.setLand(randomNeighbor, land, coast);
    }  
    
    return new Land(land, coast);
    
};

/**
 * A method of generating land that picks a random coastal tile and expands from it, but bases the tile off of how "bordered" it is.
 *
 * @method generateLand
 * @param {Number} proportion The proportion of water to be filled
 * @param {Number} probability The probability of selected the "least-bordered" tile
 * @return {Land} An 0bject containing the land tiles and the coastline
 */
Grid.prototype.generateLand2 = function(proportion, probability) {
    var seed, 
        coast, 
        total = Math.floor(this.rows * this.cols * proportion),
        randomCoast,
        newNeighbor,
        testNeighbor,
        neighbors,
        maxBorders,
        maxNeighbor,
        minBorders,
        minNeighbor,
        land = [];
    
    seed = this.getTile(Math.floor(this.cols/2), Math.floor(this.rows/2));
    seed.setType(types.land);
    land.push(seed);
    total--;
    
    for (var i=0, max=seed.neighbors.length; i < max; i++) {
        seed.neighbors[i].borders--;
    }
    coast = [seed];
    
    while (total-- > 0) {
        randomCoast = coast[Math.floor(Math.random()*coast.length)];
        
        maxBorders = 0;
        minBorders = 6;
        maxNeighbor = null;
        minNeighbor = null;
        for (var i=0, max=randomCoast.neighbors.length; i < max; i++) {
            testNeighbor = randomCoast.neighbors[i];
            if (testNeighbor.type == types.water) {
                if (testNeighbor.borders > maxBorders) {
                    maxBorders = testNeighbor.borders;
                    maxNeighbor = testNeighbor;
                }
                if (testNeighbor.borders < minBorders) {
                    minBorders = testNeighbor.borders;
                    minNeighbor = testNeighbor;
                }
            }
        }
        
        newNeighbor = Math.random() < probability ? minNeighbor : maxNeighbor;
        
        if (newNeighbor == null) {
            total++;
            continue;
        }
        
        this.setLand(newNeighbor, land, coast);
        
    }  
    
    return new Land(land, coast);
    
};

/**
 * A method of generating land that picks random seeds and generates a "blobby spider web" based off of them.
 *
 * @method generateLand3
 * @param {Number} proportion The proportion of water to be filled
 * @param {Number} numSeeds The number of base seeds
 * @return {Land} An 0bject containing the land tiles and the coastline
 */
Grid.prototype.generateLand3 = function(proportion, numSeeds) {
    var seeds = [],
        seedQ,
        seedR,
        seed,
        land = [],
        coast = [];
        
    for (var i=0; i < numSeeds; i++) {
        seedQ = Math.floor(Math.random()*this.cols);
        seedR = Math.floor(Math.random()*this.rows);
        while (this.inTileArray(seedQ, seedR, seeds)) {
            seedQ = Math.floor(Math.random()*this.cols);
            seedR = Math.floor(Math.random()*this.rows);
        }
        seed = this.getTile(seedQ, seedR);
        seeds.push(seed);
        this.setLand(seed, land, coast);
    }

};

/**
 * Ed's method of generating land.
 *
 * @method generateLand3
 * @param {Number} proportion The proportion of water to be filled
 * @param {Number} coastPar Some parameter about the coast
 * @param {Number} neighborPar Some parameter about neighbors
 * @return {Land} An 0bject containing the land tiles and the coastline
 */
Grid.prototype.generateLand4 = function(proportion, coastPar, neighborPar) {
    var maxNeighborC = 0, 
        minNeighborC=0, 
        maxCoastC=0, 
        minCoastC=0,
        seed, 
        coast, 
        total = Math.floor(this.rows * this.cols * proportion),
        randomCoast,
        maxCoast,
        minCoast,
        chosenCoast,
        randomNeighbor,
        maxNeighbor,
        minNeighbor,
        maxCount=0,
        minCount=0,
        maxCount2,
        minCount2,
        random,
        coastMaxArr = [],
        coastMinArr = [],
        neighborMaxArr = [],
        neighborMinArr = [],
        land = [];
    
    seed = this.getTile(Math.floor(this.cols/2), Math.floor(this.rows/2));
    seed.setType(types.land);
    land.push(seed);
    total--;
    
    for (var i=0, max=seed.neighbors.length; i < max; i++) {
        seed.neighbors[i].borders--;
    }
    coast = [seed];
    
    while (total-- > 0) {
        maxCount2 = 0;
        minCount2 = 6;
        for (var i=0; i < coast.length; i++) {
            if (coast[i].borders >= maxCount2) {
                maxCount2 = coast[i].borders;
            }
            if (coast[i].borders <= maxCount2) {
                minCount2 = coast[i].borders;
            }
        }
        coastMaxArr = [];
        coastMinArr = [];
        for (var i=0; i < coast.length; i++) {
            if (coast[i].borders == maxCount2) {
                coastMaxArr.push(coast[i]);
            }
            if (coast[i].borders == minCount2) {
                coastMinArr.push(coast[i]);
            }
        }
        random = Math.floor(Math.random() * coastMaxArr.length);
        maxCoast = coastMaxArr[random];
        
        random = Math.floor(Math.random() * coastMinArr.length);
        minCoast = coastMinArr[random];
        
        random = Math.random();
        random = Math.round(random + (coastPar-0.5)*Math.max(1 - random, random));
        if (random){
            chosenCoast = maxCoast;
            maxCoastC++;
        }
        else {
            chosenCoast = minCoast;
            minCoastC++;
        }

        maxCount = 0;
        minCount = 6;
        for (var i=0; i < chosenCoast.neighbors.length; i++) {
            if (chosenCoast.neighbors[i].type.name != "land") {
                if (chosenCoast.neighbors[i].borders >= maxCount) {
                    maxCount = chosenCoast.neighbors[i].borders;
                }
                if (chosenCoast.neighbors[i].borders <= minCount) {
                    minCount = chosenCoast.neighbors[i].borders;
                }
            }
        }
        neighborMaxArr = [];
        neighborMinArr = [];
        for (var i=0; i < chosenCoast.neighbors.length; i++) {
            if (chosenCoast.neighbors[i].type.name != "land") {
                if (chosenCoast.neighbors[i].borders == maxCount) {
                    neighborMaxArr.push(chosenCoast.neighbors[i]);
                }
                if (chosenCoast.neighbors[i].borders == minCount) {
                    neighborMinArr.push(chosenCoast.neighbors[i]);
                }
            }
        }
        
        random = Math.floor(Math.random() * neighborMaxArr.length);
        maxNeighbor = neighborMaxArr[random];
        random = Math.floor(Math.random() * neighborMinArr.length);
        minNeighbor = neighborMinArr[random];
        
        
        random = Math.random();
        random = Math.round(random + (neighborPar-0.5)*Math.max(1 - random, random));
        if (random){
            chosenNeighbor = maxNeighbor;
            maxNeighborC++;
        }
        else {
            chosenNeighbor = minNeighbor;
            minNeighborC++;
        }
        
        this.setLand(chosenNeighbor, land, coast);
    }
    return new Land(land, coast);    
};

/**
 * A sub-Grid which contains just the land tiles.
 *
 * @class Land
 * @constructor
 * @param {Array} tiles An array of Tiles containing the land of the Grid
 * @param {Array} coast An array of Tiles containing the coast of the Grid
 */
function Land(tiles, coast) {
    this.tiles = tiles;
    this.coast = coast;
}

/**
 * A player in the game.
 *
 * @class Player
 * @constructor
 * @param {String} name The player's name
 * @param {String} color A hex color for the player, e.g. "#2fda4e"
 */
function Player(name, color) {
    this.name = name;
    this.color = color;
	this.tiles = [];
	this.borderTiles = [];
	this.ownedTiles = [];
	this.ownedBorderTiles = [];
	this.flag = null;
	this.military = 1;
	this.culture = 1;
}

/**
 *  The land type object.
 *
 * @class Type
 * @constructor
 * @param {String} name The name of the type, e.g. "land"
 * @param {String} stroke The hex color of the stroke, e.g. "#2fda4e"
 * @param {String} fill The hex color of the fill, e.g. "#2fda4e"
 */
function Type(name, stroke, fill)    {
    this.name = name;
    this.stroke = stroke;
    this.fill = fill;
}

function endTurn() {
	var min;
	var chosenBorder;
	var dist;
	var chosenTile;
	var index;
	for (var x = 0; x < 1; x++) {
		for (var j=0; j < grid.players.length; j++) {
			if (grid.players[j].borderTiles.length > 0) {
				for (var a = 0; a < Math.ceil(grid.players[j].culture / 5); a++) {
					min = 9999;
					for (var i=0; i < grid.players[j].borderTiles.length; i++) {
						index = grid.players[j].borderTiles[i].influencer.indexOf(grid.players[j]);
						if (grid.players[j].borderTiles[i].seedDist[index] < min) {
							min = grid.players[j].borderTiles[i].seedDist[index];
							chosenBorder = grid.players[j].borderTiles[i];
						}
					}
					min = 9999;
					for (var i=0; i < chosenBorder.neighbors.length; i++) {
						if (chosenBorder.neighbors[i].type != types.water && chosenBorder.neighbors[i].influencer.indexOf(grid.players[j]) == -1) {
							dist = grid.distance(chosenBorder.neighbors[i], grid.players[j].tiles[0]);
							if (dist < min) {
								min = dist;
								chosenTile = chosenBorder.neighbors[i];
							}
						}
					}
					grid.setInfluence(chosenTile, grid.players[j]);
				}
			}
		}
	}
	grid.updateInfluence();
	grid.draw(viewingWindow, context);
}

function endTurn2() {
	for (var j=0; j < grid.players.length; j++) {
		var player = grid.players[j];
		var attackScore = player.military;
		var defenseScore;
		var threshhold;
		var random;
		var chosenBorder;
		var chosenTile;
		var min = 999999;
		var distance;
		for (var i=0; i < player.ownedBorderTiles.length; i++) {
			distance = grid.qrDistance(player.ownedBorderTiles[i], player.flag);
			if (distance < min) {
				min = distance;
				chosenBorder = player.ownedBorderTiles[i];
			}
		}
		min = 99999;
		for (var i=0; i < chosenBorder.neighbors.length; i++) {
			var neighbor = chosenBorder.neighbors[i];
			if (neighbor.type != types.water && neighbor.owner != player) {
				distance = grid.qrDistance(neighbor, player.flag);
				if (distance < min) {
					min = distance;
					chosenTile = neighbor;
				}
				
			}
		}
		if (chosenTile.owner == null) {
			grid.setOwner(chosenTile, player);
			chosenTile.draw(viewingWindow, context);
		}
		else {
			defenseScore = chosenTile.owner.military;
			threshhold = defenseScore / (attackScore + defenseScore);
			if (Math.random() > threshhold) {
				grid.setOwner(chosenTile, player);
				chosenTile.draw(viewingWindow, context);
			}
		}
	}
}

function clicker(event, viewingWindow, grid) {
	var player = grid.players[activePlayerIndex];
	var x = event.clientX - viewingWindow.offsetX;
	var y = event.clientY - viewingWindow.offsetY;
	var coor = grid.pixelToCoor(x, y, viewingWindow);
	var coor2 = grid.hexRound(coor[0], coor[1], coor[2]);
	var coor3 = grid.cubeToOffset(coor2[0], coor2[1], coor2[2]);
	var tile = grid.getTile(coor3[0], coor3[1]);
	if (tile.type != types.water) {
		if (player.flag) {
			player.flag.flagger = null;
			player.flag.draw(viewingWindow, context);
		}
		player.flag = tile;
		tile.flagger = player;
		tile.draw(viewingWindow, context);
	}
}

// Converts cube coords (x, y, z) to odd-r offset coords (q, r).
Grid.prototype.cubeToOffset = function(x, y, z) {
	var q = x + (z - (z&1))/2;
	var r = z;
	return [q, r];
}

// Inputs Cartesian x, y coordinates, 
Grid.prototype.pixelToCoor = function(x, y, viewingWindow) {
	// converts to axial q, r coordinates.
	var q = (1/3 * Math.sqrt(3) * x - 1/3 * y) / viewingWindow.tileRadius;
	var r = 2/3 * y / viewingWindow.tileRadius;
	// converts to cube coordinates
	var x = q;
	var z = r;
	var y = -x - z;
	return [x, y, z];
}

//Input is unrounded cube coords. Output is integer cube coords.
Grid.prototype.hexRound = function(x, y, z) {
	var rx = Math.round(x);
	var ry = Math.round(y);
	var rz = Math.round(z);
	
	var x_diff = Math.abs(rx - x);
	var y_diff = Math.abs(ry - y);
	var z_diff = Math.abs(rz - z);
	
	if (x_diff > y_diff && x_diff > z_diff) {
		rx = -ry - rz;
	}
	else if (y_diff > z_diff) {
		ry = -rx - rz;
	}
	else {
		rz = -rx - ry;
	}
	return [rx, ry, rz];
}

function endPlayerTurn() {
	if (allocateChecker != 1){
		var player = grid.players[activePlayerIndex];
		var resources = player.ownedTiles.length;
		player.military += resources /2 ;
		player.culture += resources / 2;
	}
	activePlayerIndex++;
	if (activePlayerIndex >= grid.players.length) {
		endTurn();
		endTurn2();
		activePlayerIndex = 0;
	}
	document.getElementById('gameInfo').innerHTML=grid.players[activePlayerIndex].name + " 's turn";
	document.getElementById('gameInfo').style.color = grid.players[activePlayerIndex].color;
	allocateChecker = 0;
	console.log(grid.players[0].culture);
}

var allocateChecker = null;

function allocate() {
	allocateChecker = 1;
	var player = grid.players[activePlayerIndex];
	var resources = player.ownedTiles.length;
	var prompter = prompt('You have ' + resources + ' resources to allocate. Choose how many to spend on military. The rest will be spend on culture.');
	var military = Number(prompter);
	var culture = resources - military;
	player.military += military;
	player.culture += culture;
}

var canvas, context, grid, viewingWindow, activePlayerIndex;

window.onload = function() {

    canvas = document.getElementById('world');
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
    
    
    context = canvas.getContext('2d');
    context.rect(0, 0, window.innerWidth, window.innerHeight);
    context.fillStyle = types.water.fill;
    context.fill();    
    
    grid = new Grid(25, 15, 0.35, 0, 0, 2);
	grid.updateInfluence();
    viewingWindow = new ViewingWindow(canvas, grid);
    grid.draw(viewingWindow, context);
    window.land = grid.land;
	
	activePlayerIndex = 0;
	

};


