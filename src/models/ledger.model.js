const mongoose=require('mongoose');
const ledgerSchema=mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        index:true,
        immutable:true,
        required:[true,'account must be associated with ledger']
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        index:true,
        immutable:true,
        required:[true,'transaction must be associated with ledger'] 
    },
    amount:{
        type:Number,
        required:[true,'Amount is needed in ledger'],
        immutable:true
    },
    type:{
        type:String,
        enum:{
            values:['CREDIT','DEBIT'],
            message:'Type should be either DEBIT or CREDIT'
        },
        required:true,
        immutable:true
    }
},{
    timestamps:true
})

const preventmodifyLedgerSchema=()=>{
    throw new Error('ledger is immutable and cannot be modified or deleted')
}

ledgerSchema.pre('findOneAndUptade',preventmodifyLedgerSchema)
ledgerSchema.pre('updateOne',preventmodifyLedgerSchema)
ledgerSchema.pre('deleteMany',preventmodifyLedgerSchema)
ledgerSchema.pre('deleteOne',preventmodifyLedgerSchema)
ledgerSchema.pre('remove',preventmodifyLedgerSchema)
ledgerSchema.pre('updateMany',preventmodifyLedgerSchema)
ledgerSchema.pre('findOneAndDelete',preventmodifyLedgerSchema)
ledgerSchema.pre('findOneAndReplace',preventmodifyLedgerSchema)

module.exports=mongoose.model('ledger',ledgerSchema)