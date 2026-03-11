const FinalMark = require("../module/finalMark");

const saveFinalMarks = async (req,res)=>{

try{

const marks = req.body;

await FinalMark.insertMany(marks);

res.json({
message:"Marks stored successfully"
});

}

catch(err){

res.status(500).json({
error:err.message
});

}

};

module.exports = { saveFinalMarks };