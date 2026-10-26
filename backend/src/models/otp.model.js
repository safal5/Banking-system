const mongoose=require('mongoose')
const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otpHash:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    expiresAt:{
        type:Date,
        required:true,
        default: function() {
            return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        }
    }
}, {
    timestamps:true
})
otpSchema.index({expiresAt:1},{expireAfterSeconds:0})
module.exports=mongoose.model("Otp",otpSchema)

