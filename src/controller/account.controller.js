const accountModel=require('../models/account.model');
async function createAccount(req,res){
const user=req.user;
const createdAccount=await accountModel.create({
    user:user._id
})
await createdAccount.populate('user','username')
return res.status(201).json({
message:`${createdAccount.user.username} Your account is created successfully`,
account:createdAccount
})
}

const getAccount=async (req,res)=>{
    const account=await accountModel.findOne({user:req.user._id})
    if(!account){
        return res.status(500).json({
            message:"Cannot get the account"
        })
    }
    return res.status(200).json({
        account
    })
    
}

const getAccountBalance=async (req,res)=>{
    const account=await accountModel.findOne({_id:req.params.accountId,user:req.user._id})
    if(!account){
        return res.status(500).json({
            message:"Invalid account number"
        })
    }
    const balance=await account.calculateBalance()
    res.status(200).json({
        balance:balance
    })
}

module.exports.createAccount=createAccount;
module.exports.getAccount=getAccount;
module.exports.getAccountBalance=getAccountBalance;

