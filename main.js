var async = require("async"),
    FeedParser = require('feedparser')
    request = require('request'),
    fs = require('fs');

var episodes = [ ];

var req = request('http://www.radiolab.org/feeds/podcast/'),
    feedparser = new FeedParser();

req.on('response', function (res) {
  var stream = this;
  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
  stream.pipe(feedparser);
});

feedparser.on('readable', function() {
  var stream = this
    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
    , item;
  while (item = stream.read()) {
    episodes.push(item);
  }
});

feedparser.on('finish', function() {
    episodes.forEach(function (e) { e.pubdate = new Date(e.pubdate); });
    episodes.sort(function (a, b) { return a.pubdate - b.pubdate; });
    async.eachSeries(episodes, function (episode, callback) {
        var url = episode["feedburner:origenclosurelink"]["#"],
            filename = function () {
                var d = episode.pubdate;
                return d.getFullYear() +
                    ("0" + (d.getMonth() + 1)).slice(-2) +
                    ("0" + d.getDate()).slice(-2) +
                    url.match(/(\w+)(\.\w+)+(?!.*(\w+)(\.\w+)+)/)[2];
                }(),
            file = fs.createWriteStream("downloads/" + filename);
        console.log("Attempting download " + url + " to " + filename + "...");
        request
            .get(url)
            .on('error', function(err) {
                console.log(err)
            })
            .on("end", callback)
            .pipe(file);
    }, function (err) {
        if (err) console.log(err);
    });
});