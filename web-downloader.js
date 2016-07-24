"use strict";

// Note that this ES formula does not work yet: import doWhilst from 'async/doWhilst';
const async = require("async"),
      cheerio = require("cheerio"),
      request = require("request");

const downloadFromPage = (pageNo, callback) => {
    console.log("pageNo is " + pageNo);
    request.get({
        "uri": "http://www.radiolab.org/series/podcasts/" + (pageNo > 1 ? pageNo.toString() + "/" : "")
    }, (error, response, body) => {
        console.log(body);
        if (error) return system.exit(1);
        let $ = cheerio.load(body);
        $("div.series-item", "#series-main").each((i, elem) => {
            let title = $("div:nth-child(1) h2:nth-child(2) a:nth-child(1)", elem).text().trim(),
                date = $("div:nth-child(1) > h3:nth-child(3)", elem).text().trim(),
                url = $("#audio_buttons_624449_1469274024632340 > a:nth-child(3)").html();
            date = date.split(",")[2].trim().substr(2, 2) +
                { "January": "01", "February": "02", "March": "03",
                  "April": "04", "May": "05", "June": "06", "July": "07",
                  "August": "08", "September": "09", "October": "10",
                  "November": "11", "December": "12" }[date.split(",")[1].trim().split(" ")[0]] +
                date.split(",")[1].trim().split(" ")[1];
            console.log("- ", title, date, url);
        });
        //$("#series-main div.series-item").each(() => {
        //    console.log($(this).html());
        //});
        callback(null);
    });
}

let pageNo = 0,
    keepGoing = true;
async.doWhilst(
    callback => {
        pageNo++;
        downloadFromPage(pageNo, err => {
            keepGoing = !err;
            keepGoing = false;
        });
    },
    () => !keepGoing,
    err => { }
);
