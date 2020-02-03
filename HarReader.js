let FS = require("fs");

let HarReader = function (har) {
    this._har = null;

    const fileContents = FS.readFileSync(har);
    const jsHar = JSON.parse(fileContents);
    if (jsHar instanceof Object) {
        this._har = jsHar;
    }
};

HarReader.prototype = {
    listRequests: function (options) {
        const SHOW_QUERY_PATH = !!!options ? true : !(options.show_query_path == false);
        const SHOW_PARAMS = !!!options ? true : !(options.show_params == false);
        const SHOW_START_DATE = !!!options ? false : (options.show_start_date == true);
        const SORT_START_DATE = !!!options ? "asc" : ((options.sort_start_date += "").toLowerCase() == "desc" ? "desc" : "asc");
        const PRETTY_PRINT = !!!options ? false : (options.pretty_print == true);
        const filters = !!!options ? undefined : options.filters;

        try {
            let entries = this.getRequests(filters);
            let out = "";

            this.sortByDate(entries, SORT_START_DATE);
            entries.forEach((entry) => {
                let log = "";

                if (SHOW_START_DATE) {
                    log += entry.startedDateTime + "\t";
                }

                log += entry.method + ": " + entry.protocol + "//" + entry.host;

                if (SHOW_QUERY_PATH) {
                    log += "/" + entry.path;
                }

                if (SHOW_PARAMS) {
                    if (entry.params.length > 0) {
                        if (PRETTY_PRINT) {
                            log += "\n\tparams: " + JSON.stringify(entry.params, undefined, 2).replace(/\n/g, "\n\t");
                        } else {
                            if (!SHOW_QUERY_PATH) {
                                log += " | ";
                            }

                            log += "?";
                            entry.params.forEach((param) => {
                                let tmp = Object.keys(param);

                                if (log.substr(log.length - 1, 1) != "?") {
                                    log += "&";
                                }
                                log += tmp[0] + "=" + param[tmp[0]];
                            });
                        }
                    }
                }

                out += (log + "\n");
            });

            console.log(out);
        } catch (e) {
            throw e;
        }
    },
    getRequests: function (filters) {
        const MATCH_ALL = (!!!filters) || !(typeof filters.match === "string" || Array.isArray(filters.match)) ? null : filters.match;
        const MATCH_HOST = (!!!filters) || !(typeof filters.host === "string" || Array.isArray(filters.host)) ? null : filters.host;
        const EXACT_MATCH_HOST = (!!!filters) || !(typeof filters.exact_host === "string" || Array.isArray(filters.exact_host)) ? null : filters.exact_host;

        try {
            let entries = this._har.log.entries;

            let out = [];

            entries.forEach((entry) => {
                let urlObj = this.url2Obj(entry.request);

                if (null != MATCH_ALL && !this.findInStr(urlObj.url, MATCH_ALL, "g")) {
                    return;
                }
                if (null != MATCH_HOST && !this.findInStr(urlObj.host, MATCH_HOST, "g")) {
                    return;
                }
                if (null != EXACT_MATCH_HOST && !this.findInStr(urlObj.host, EXACT_MATCH_HOST, "g", true)) {
                    return;
                }

                urlObj.startedDateTime = entry.startedDateTime;
                urlObj.time = entry.time;
                out.push(urlObj);
            });
            return out;
        } catch (e) {
            throw e;
        }
    },
    url2Obj: function (request) {
        let url = request.url;

        if ((!url instanceof String) || "" == url) {
            console.log("invalid url: " + url);

            return null;
        }

        try {
            let tmp1 = url.split("//");
            let queryStr = tmp1.slice(1).join("//");
            let tmp2 = queryStr.split("/");

            let protocol = tmp1[0];
            let host = tmp2[0];

            let tmp3 = queryStr.split("?");
            let fullPath = tmp3[0];
            let query = tmp3.slice(1).join("?");

            let path = fullPath.substr(host.length + 1, fullPath.length + 1);
            let params = query.length > 0 ? query.split("&").map(function (mapStr) {
                let tmp = mapStr.split("=");
                let key = tmp.length > 0 ? tmp[0] : null;
                let val = tmp.length > 1 ? tmp.slice(1).join("=") : null;
                let obj = {};
                if (null != key && null != val) {
                    obj[key] = val;
                }

                return tmp.length > 1 ? obj : null;
            }) : [];

            return {
                method: request.method,
                url: url,
                protocol: protocol,
                host: host,
                path: path,
                fullPath: fullPath,
                params: params
            };

        } catch (e) {
            throw e;
        }
    },
    sortByDate: function (entries, order) {
        const ASC = (order + "").toLowerCase() === "asc";
        entries.sort((a, b) => (new Date((ASC ? a : b).startedDateTime)) - (new Date((ASC ? b : a).startedDateTime)));
    },
    findInStr(str, pattern, flag, exactMatch) {
        if (Array.isArray(pattern)) {
            let found = false;
            pattern.forEach(p => found = found || this.findInStr(str, p, flag));
            return found;
        } else {
            if (!!exactMatch) {
                return str === pattern;
            } else {
                let found = str.match(new RegExp(pattern, flag));
                return null != found && found.length > 0;
            }
        }
    }
};


module.exports = HarReader;
