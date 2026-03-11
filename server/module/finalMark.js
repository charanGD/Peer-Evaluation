const mongoose = require("mongoose");

const finalMarkSchema = new mongoose.Schema({

name:String,

reg:String,

peerAverage:Number,

mentorMark:Number,

finalTotal:Number

});

module.exports = mongoose.model("FinalMark", finalMarkSchema);