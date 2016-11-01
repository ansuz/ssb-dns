var Pull = require("pull-stream");
var KVSet = require("kvset");

module.exports = function SsbDns(cb) {
    var set = new KVSet()
    return Pull.drain(function (msg) {
        var c = msg.value.content;
        if (c.branch) set.remove(c.branch);
        set.add(msg.key, msg.value);
    }, function (err) {
        var records = [];
        for (var key in set.heads) {
            var value = set.heads[key];
            var c = value.content;
            var record = c && c.record;
            if (record) records.push(record);
        }
        cb(err, records);
    });
};