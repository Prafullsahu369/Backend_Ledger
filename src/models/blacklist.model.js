const mongoose = require("mongoose");

const tokenBlackListedSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is Required to Blacklist"],
        unique:[true,"token is Already blacklisted"]
    }
},{
        timestamps:true
    }
)

tokenBlackListedSchema.index({createdAt:1},{
    expireAfterSeconds:60*60*24*3
})

const tokenBlackListModel = mongoose.model("tokenBlackList",tokenBlackListedSchema);

module.exports = tokenBlackListModel;