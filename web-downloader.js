"use strict";

// Note that this ES formula does not work yet: import doWhilst from 'async/doWhilst';
const async = require("async"),
      cheerio = require("cheerio"),
      fs = require("fs"),
      request = require("request"),
      // https://github.com/parshap/node-sanitize-filename
      sanitize = require("sanitize-filename");

const MP3_URL_REGEX = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)\.mp3/gi);

// If the destination _filename_ does not exists already, this function
// downloads the file at the specified _url_ to it.
const downloadEpisode = (url, filename, callback) => {
    fs.stat(filename, (err, stat) => {
        if (!err) return callback(null);
        var file = fs.createWriteStream(filename);
        console.log("Downloading " + url + " to " + filename + "...");
        request
            .get(url)
            .on('error', function(err) {
                console.log(err)
            })
            .on("end", callback)
            .pipe(file);
    );
}

const downloadAll = (episodes, callback) => {
    async.eachSeries(episodes, (e, callback) => {
        downloadEpisode(e.url, "downloads/" + sanitize(e.date + " " + e.title + ".mp3"), callback);
    })
}

const listDownloadableEpisodesFromPage = (pageNo, callback) => {
    console.log("Page " + pageNo);
    var episodes = [ ];
    request.get({
        "uri": "http://www.radiolab.org/series/podcasts/" + (pageNo > 1 ? pageNo.toString() + "/" : "")
    }, (err, response, body) => {
        if (err) return system.exit(1);
        let $ = cheerio.load(body);
        $("div.series-item", "#series-main").each((i, elem) => {
            let title = $("div:nth-child(1) h2:nth-child(2) a:nth-child(1)", elem).text().trim(),
                date = $("div:nth-child(1) > h3:nth-child(3)", elem).text().trim(),
                url = ((($("div:nth-child(1) > script", elem) || "").html() || "").match(MP3_URL_REGEX) || [ null ])[0];
            date = date.split(",")[2].trim().substr(2, 2) +
                { "January": "01", "February": "02", "March": "03",
                  "April": "04", "May": "05", "June": "06", "July": "07",
                  "August": "08", "September": "09", "October": "10",
                  "November": "11", "December": "12" }[date.split(",")[1].trim().split(" ")[0]] +
                date.split(",")[1].trim().split(" ")[1];
            if (url) episodes.push({
                "title": title,
                "date": date,
                "url": url
            });
        });
        callback(null, episodes);
    });
}

const listDownloadableEpisodes = callback => {
    let pageNo = 0,
        episodes = [ ],
        keepGoing = true;
    async.doWhilst(
        callback => {
            pageNo++;
            listDownloadableEpisodesFromPage(pageNo, (err, pageEpisodes) => {
                if (err) return system.exit(1);
                episodes = episodes.concat(pageEpisodes);
                // TODO: need to implement check on getting to the last page:
                //       the last page is returned when requesting any number
                //       higher than the last
                keepGoing = (pageNo < 13);
                callback(null);
            });
        },
        () => keepGoing,
        err => { callback(err, episodes); }
    );
}

listDownloadableEpisodes((err, episodes) => {
    if (err) return system.exit(1);
    downloadAll(episodes, err => {
        console.log("Finished.");
    })
});
