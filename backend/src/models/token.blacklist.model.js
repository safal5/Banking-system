const mongoose=require('mongoose');
const blacklistSchema=mongoose.Schema({
    token:{
        type:String,
        required:[true,"token is required"],
        unique:true
    }
},{
    timestamps:true
})
blacklistSchema.index({createdAt:1},{expireAfterSeconds:60*60*24*3})

module.exports=mongoose.model("blackList",blacklistSchema)