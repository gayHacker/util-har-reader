let HarReader = require("./HarReader");

const HAR_FILE = "localhost.har";

let filters = {
    match: null,
        host: [
            "google",
            "localhost",
            "127.0.0.1"
        ]
    //     exact_host:[
    //     "accounts.google.com",
    //     "play.google.com"
    // ]
};
// filters = null;

let cfg = {
    show_query_path: true,
    show_params: false,
    show_start_date: true,
    pretty_print: false,
    filters : filters
};
// cfg = null;

let reader = new HarReader(HAR_FILE);
reader.listRequests(cfg);
