 
const jwt=require('jsonwebtoken');
const userModel = require('../models/user.model');
const tokenBlacklistModel = require('../models/token.blacklist.model');
const authMiddleware=async (req,res,next)=>{
    const token=req.cookies.token
if(!token){
    return res.status(401).json({
        message:"you need to be a valid user"
    })
}
const blacklistToken=tokenBlacklistModel.findOne({token})
if(blacklistToken){
    return res.status(403).json({
        message:"Forbidden access! not a system user"
    })
}

try{
const decoded=jwt.verify(req.cookies.token,process.env.JWT_SECRETKEY);
const user=await userModel.findOne({_id:decoded.userid});
req.user=user;
return next();
}
catch(err){
    return res.status(401).json({
        message:"error occured:you need to be a valid user"
    })
}
}

const authSystemMiddleware=async(req,res,next)=>{
    if (req.cookies.token===""){
        return res.status(401).json({
            message:'unauthorized users cannot be allowed'
        })
    }
    const blacklistToken=tokenBlacklistModel.findOne({token:req.cookies.token})
    if(blacklistToken){
    return res.status(403).json({
        message:"Forbidden access! not a system user"
    })
}
    try{
    const decoded=jwt.verify(req.cookies.token,process.env.JWT_SECRETKEY)
    const user=await userModel.findById(decoded.userid).select("+systemUser")
    if(!user.systemUser){
        return res.status(403).json({
            message:"Not system user: unauthorized users cannot be allowed"
        })
    }
    req.user=user
    next()
    }catch(err){
        return res.status(401).json({
            message:'unauthorized access: token invalid'
        })
    }
}
module.exports.authMiddleware=authMiddleware;
module.exports.authSystemMiddleware=authSystemMiddleware