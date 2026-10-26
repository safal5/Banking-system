const mongoose=require('mongoose');
transactionSchema=new mongoose.Schema({
    from:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"from account is required"],
        index:true
        },
    to:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"to account is required"] ,
        index:true
    },
    amount:{
        type:Number,
        required:[true,"amount is required"],
        min:[0,"transaction cannot be negative"]
    },
    status:{
        type:String,
        enum:{
           values:['PENDING','FAILED','COMPLETED','REVERSED'],
           message:'Status should be either PRNDING,FAILED,COMPLETED or REVERSED'
        },
        default:'PENDING'
    },
    idempotencykey:{
        type:String,
        required:[true,"Idempotency key is required"],
        index:true,
        unique:[true,"Idempotencykey is repeated. Tranaction is still pending. wait"]

    }
},{
    timestamps:true
})
module.exports=mongoose.model('transaction',transactionSchema)
