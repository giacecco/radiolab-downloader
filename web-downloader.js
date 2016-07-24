"use strict";

// Note that this ES formula does not work yet: import doWhilst from 'async/doWhilst';
const async = require("async"),
      cheerio = require("cheerio"),
      request = require("request");

const URL_REGEX = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi);

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
                url = ((($("div:nth-child(1) > script", elem) || "").html() || "").match(URL_REGEX) || [ null ])[0];
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
                keepGoing = (pageNo === 1);
                callback(null);
            });
        },
        () => !keepGoing,
        err => { callback(err, episodes); }
    );
}

listDownloadableEpisodes((err, episodes) => {
    console.log(episodes.map(e => ("- " + e.date + " " + e.title + " " + e.url)).join("\n"));
});
