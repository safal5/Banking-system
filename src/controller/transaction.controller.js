const accountModel=require('../models/account.model')
const transactionModel = require('../models/transaction.model')
const ledgerModel=require('../models/ledger.model')
const mongoose=require('mongoose')
const { sendTransactionEmailSender,sendTransactionEmailReceiver, sendCashDepositedEmail } = require('../services/email.service')
const handleTransaction=async (req,res)=>{
const {from,to,amount,idempotencykey}=req.body
if(!from || !to || !amount || !idempotencykey){
    return res.status(400).json({
        message:"from,to,amount and idempotencykey all required"
    })
}

const sender=await accountModel.findOne({_id:from})
const receiver=await accountModel.findOne({_id:to})
if(!sender || !receiver){
    return res.status(400).json({
        message:"Invalid sender or receiver"
    })
}

const findidempotencykey= await transactionModel.findOne({idempotencykey})
if(findidempotencykey){
    if(findidempotencykey.status=="COMPLETED")
        return res.status(200).json({
        message:"transaction successfully completed",
        transaction:findidempotencykey
    })
    if (findidempotencykey.status=="PENDING")
        return res.status(200).json({
        message:"your transaction is in pending state and being completed"
    })
    if(findidempotencykey.status=="FAILED")
        return res.status(500).json({
        message:'transaction failed. Retry again'
    })
    if(findidempotencykey.status=="REVERSED")
        return res.status(500).json({
        message:"transacrion reversed: Retry again" 
    })
}


if(sender.status!=="ACTIVE" || receiver.status!=="ACTIVE"){
    return res.status(400).json({
        message:'account is not active and not eligible for transaction'
    })
}

const currentBalance=await sender.calculateBalance()
if(currentBalance<amount){
    return res.status(400).json({
        message:"Insufficient Balance",
        amount:currentBalance
    })
}

const session= await mongoose.startSession()
session.startTransaction()
try{
    const [createdTransaction]= await transactionModel.create([{
        from,
        to,
        amount,
        idempotencykey,
        status:"PENDING"
    }],{session})
    const createdDebitLedger=await ledgerModel.create([{
        account:from,
        transaction:createdTransaction._id,
        amount,
        type:'DEBIT'
    }],{session})


    const createdCreditLedger=await ledgerModel.create([{
        account:to,
        transaction:createdTransaction._id,
        amount,
        type:'CREDIT'
    }],{session})
    createdTransaction.status="COMPLETED"
    await  createdTransaction.save({session})
    await session.commitTransaction()
    await sender.populate('user','username email')
    await receiver.populate('user','username email')
    await sendTransactionEmailSender(sender.user.username,receiver.user.username,sender.user.email,amount)
    await sendTransactionEmailReceiver(sender.user.username,receiver.user.username,receiver.user.email,amount)
    return res.status(201).json({
    message:"Transaction successfully done",
    transaction:createdTransaction
})
}catch(err){
    await session.abortTransaction()
    res.status(500).json({
        message:"error occured",
        err:err
    })
}
finally{
    session.endSession()
}



}

const handleSystemInitialTransaction=async(req,res)=>{
const systemAccount=await accountModel.findOne({user:req.user._id})
if(!systemAccount){
    return res.status(500).json({
        message:"Cannot find system Account"
    })
}
const from=systemAccount._id
const {to,idempotencykey,amount}=req.body
if(!to || !idempotencykey || !amount){
    return res.status(400).json({
        message:'to, idempotencyKey and amount is required'
    })
}
const userAccount=await accountModel.findById(to)
if(!userAccount){
    return res.status(400).json({
        message:"Invalid account"
    })
}
const findidempotencykey=await transactionModel.findOne({idempotencykey})

if(findidempotencykey){
    if(findidempotencykey.status=="COMPLETED")
        return res.status(200).json({
        message:"transaction successfully completed",
        transaction:findidempotencykey
    })
    if (findidempotencykey.status=="PENDING")
        return res.status(200).json({
        message:"your transaction is in pending state and being completed"
    })
    if(findidempotencykey.status=="FAILED")
        return res.status(500).json({
        message:'transaction failed. Retry again'
    })
    if(findidempotencykey.status=="REVERSED")
        return res.status(500).json({
        message:"transacrion reversed: Retry again" 
    })
}
if(userAccount.status!=="ACTIVE"){
    return res.status(400).json({
        message:"Your account is not active account. So you can't procced with transaction"
    })
}
const session=await mongoose.startSession()
session.startTransaction()
try{
const createdTransaction= new transactionModel({
    from,
    to,
    amount,
    idempotencykey,
    status:"PENDING"
})
const createdDebitLedger=await ledgerModel.create([{
    account:from,
    transaction:createdTransaction._id,
    amount:amount,
    type:"DEBIT"   
}],{session})



const createdCreditLedger=await ledgerModel.create([{
    account:to,
    transaction:createdTransaction._id,
    amount:amount,
    type:"CREDIT"   
}],{session})
createdTransaction.status="COMPLETED"
await createdTransaction.save({session})
await session.commitTransaction()
await userAccount.populate('user','username email')
await sendCashDepositedEmail(userAccount.user.username,createdTransaction.amount,userAccount.user.email)
return res.status(201).json({
    message:"Cash successfully deposited",
    transaction:createdTransaction
})
}catch(err){
    await session.abortTransaction()
    return res.status(500).json({
        message:"Transaction failed. Try again",
        err:err
    })
}
finally{
    session.endSession()
}

}

module.exports.handleTransaction=handleTransaction
module.exports.handleSystemInitialTransaction=handleSystemInitialTransaction