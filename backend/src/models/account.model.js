const mongoose=require('mongoose');
const ledgerModel=require('./ledger.model')
const accountSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:[true,'user is required'],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:['ACTIVE','FROZEN','CLOSED'],
            message:'Status should be one of the active,frozen and closed'
        },
        default:'ACTIVE'
    },
    currency:{
        type:String,
        default:"NPR"
    }

},{
    timestamps:true
})
accountSchema.index({user:1,status:1})

accountSchema.methods.calculateBalance=async function(){
   const balance= await ledgerModel.aggregate([
    {$match:{account:this._id}},
    {
        $group:{
            _id:null,
            totalCredit:{
                $sum:{
                    $cond:[
                        {$eq:["$type","CREDIT"]},
                        "$amount",
                        0
                    ]
                }},
            totalDebit:{
                $sum:{
                    $cond:[
                        {$eq:["$type","DEBIT"]},
                        "$amount",
                        0
                    ]
                },
            }
            }
},{
    $project:{
        _id:0,
        balance:{$subtract:["$totalCredit","$totalDebit"]}
    }
}
]) 
return balance[0]?.balance || 0
}
module.exports=mongoose.model('account',accountSchema)