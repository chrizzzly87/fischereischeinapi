const express = require("express");
const fetch = require('node-fetch');
const app = express();
const HTMLParser = require('node-html-parser');

const PORT = process.env.PORT || 1987;

app.listen(PORT, () => {
    console.log("Server running on port 1987");
});

app.get("/", (req, res, next) => {
    res.send('läuft');
});

function formatDate(d) {
    let date = new Date(d);
    let month = ('0' + (date.getMonth() + 1)).substring(-2);
    let day = ('0' + date.getDate()).substring(-2);

    return `${month}${day}`;
}

function findCommonElements(arr1, arr2) {
    return arr1.some(item => arr2.indexOf(item) >= 0);
}

let cache = {};

function findDateInString(str) {
    const regex = /(\d{1,4}([.\-\/])\d{1,2}([.\-\/])\d{1,4})/gi;
    const matches = str.match(regex);
    if (matches && matches.length > 1) {
        return matches;
    }
    return null;
}

const routes = [
    {
        name: 'Anglerfreunde Nord e.V.',
        link: 'https://www.anglerfreunde-nord.de/angelpruefung/',
        status: '',
        wrapperSelector: '.cw-lehrgang',
        dateSelector: '.text-grau3',
        dateFormatter: function(val) {
            let dates = findDateInString(val);

            if (dates) {
                return dates;
            }
            return val;
        },
        seatsSelector: '.col-md-12',
        seatsFormatter: function(val) {
            let seats = val.match(/(?:<strong>Restplätze:<\/strong> )([0-9]*)/);
            let full = val.match(/(leider ausgebucht)/);
            console.log(seats);
            if (seats) {
                return parseInt(seats[1].trim());
            } else if (full) {
                return 0;
            }

            return val;
        },
    },
];

app.get("/angelfreunde-nord", (req, res, next) => {

    // let startTime = new Date().getMilliseconds();

    // get current day to check if it's already cached
    // let currentDay = formatDate(Date.now());
    // if (currentDay in cache) {
    //     let totalExecutionTime = new Date().getMilliseconds() - startTime;
    //     let result = cache[currentDay];
    //     result.fromCache = true;
    //     result.executionTime = totalExecutionTime;
    //     res.json(result);
    // } else {

    let result = [];

    routes.forEach(route => {
        fetch(route.link)
            .then(res => res.text())
            .then(body => {
                const parsedBody = HTMLParser.parse(body);
                const wrapper = parsedBody.querySelectorAll(route.wrapperSelector);

                let fishingTrainingData = [];
                if (wrapper) {
                    wrapper.forEach(item => {
                        let date = route.dateFormatter(item.querySelector(route.dateSelector).innerHTML);
                        let seats = route.seatsFormatter(item.querySelector(route.seatsSelector).innerHTML);
                        let res = {
                            route: route.link,
                            status: route.status,
                            seats: seats,
                            date: {},
                        };

                        if (date.length === 2) {
                            res.date.starting = date[0];
                            res.date.ending = date[1];
                        } else {
                            res.date = date;
                        }
                        fishingTrainingData.push(res);
                    });
                }

                // let totalExecutionTime = new Date().getMilliseconds() - startTime;


                // save to cache
                // cache[currentDay] = result;

                // result.push({
                //     name: route.name,
                //     data: fishingTrainingData,
                // });
                // console.log(fishingTrainingData);

                // result.push(fishingTrainingData)

                res.json(fishingTrainingData);
            }
        );
    });


    // }
});