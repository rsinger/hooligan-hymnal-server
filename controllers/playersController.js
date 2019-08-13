var Players = require('../models/players');
var bodyParser = require('body-parser');
var config = require("../config.js");

var players_cache = {
  data: null,
  last_refresh: 0,
  force_reload: function(res) {
    var that = this;
    Players.find((error, players) => {
      if (error) {
        that.data = null;
        that.last_refresh = 0;
        if(res != null) res.send(error);
      }
      that.data = players;
      that.last_refresh = Date.now();
      if(res != null) res.send(that.data);
    });
  },
  send_data: function(res) {
    if(this.last_refresh + config.cache_timeout < Date.now()) {
      this.force_reload(res);
    } else {
      res.send(this.data);
    }
  }
}

module.exports = app => {
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );

  // returns all players
  app.get('/api/players', (req, res) => {
    players_cache.send_data(res);
  });

  // returns single player by _id
  app.get('/api/players/:id', (req, res) => {
    Players.findById(req.params.id, (error, player) => {
      res.send(song);
      players_cache.force_reload();
    });
  });

  // creates player
  app.post('/api/players', (req, res) => {
    var newPlayer = Players(req.body);
    newPlayer.save((error, player) => {
      error ? res.status(501).send({ error }) : res.send(player);
      players_cache.force_reload();
    });
  });

  // updates player
  app.put('/api/players/:id', (req, res) => {
    Players.findByIdAndUpdate(req.params.id, req.body, (error, player) => {
      error ? res.status(501).send({ error }) : res.send(player);
      players_cache.force_reload();
    });
  });

  //deletes player
  app.delete('/api/players/:id', (req, res) => {
    Players.findByIdAndRemove(req.params.id, error => {
      error
        ? res.status(501).send({ error })
        : res.send({ message: 'Deleted' + req.params.id });
      players_cache.force_reload();
    });
  });
};
