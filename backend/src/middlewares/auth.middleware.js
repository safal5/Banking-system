const config=require('../config/config').config;
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const userModel = require('../models/user.model');
const sessionModel = require('../models/session.model');
const authMiddleware=async (req,res,next)=>{
    const refreshToken=req.cookies.refreshToken
    if(!refreshToken){
    return res.status(401).json({
        message:"you need to be a valid user"
    })
}
    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session=await sessionModel.findOne({
            refreshToken:refreshTokenHash,
            revoked:false
        })
if(!session){
    return res.status(401).json({
        message:"Forbidden access! not a system user"
    })
}

try{
const decoded=jwt.verify(req.cookies.refreshToken,config.JWT_SECRETKEY);
const user=await userModel.findOne({_id:decoded.id});
if(!user){
    return res.status(401).json({message:"user not found"})
}
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
    const refreshToken=req.cookies.refreshToken
    if(!refreshToken){
        return res.status(401).json({
            message:"you need to be a valid user"
        })
    }
    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session=await sessionModel.findOne({
            refreshToken:refreshTokenHash,
            revoked:false
        })
if(!session){
    return res.status(401).json({
        message:"Forbidden access! not a system user"
    })
}

    try{
    const decoded=jwt.verify(req.cookies.refreshToken,config.JWT_SECRETKEY)
    const user=await userModel.findById(decoded.id).select("+systemUser")
    if(!user || !user.systemUser){
        return res.status(403).json({
            message:"Not system user: unauthorized users cannot be allowed"
        })
    }
    req.user=user
    return next()
    }catch(err){
        return res.status(401).json({
            message:'unauthorized access: token invalid'
        })
    }
}
module.exports.authMiddleware=authMiddleware;
module.exports.authSystemMiddleware=authSystemMiddleware
