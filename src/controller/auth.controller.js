const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const { registerEmail } = require('../services/email.service');
const tokenBlacklistModel = require('../models/token.blacklist.model');
async function userRegister(req,res){
    const{username,email,password}=req.body;
    const userExists=await userModel.findOne({email});
    if(userExists){
        return res.status(422).json({
            message:"email already exists",
            status:"failed"
        })}

    const user=await userModel.create({
        email,
        username,
        password
    })
    const token=jwt.sign({userid:user._id},process.env.JWT_SECRETKEY,{expiresIn:"3d"});
    res.cookie("token",token);
    res.status(201).json({
        user_id:user._id,
        email:user.email,
        username:user.username
    })
    await registerEmail(user.username,user.email);   
}

async function userLogin(req,res){
    const{email,password}=req.body;
    const user=await userModel.findOne({email}).select("+password")
    if(!user){
        return res.status(401).json({
            message:"email or password is invalid"
        })
    }
    const isValid= await user.comparePassword(password)
    if(!isValid){
        return res.status(401).json({
            message:"email or password is invalid"
        })
    }
    const token=jwt.sign({userid:user._id},process.env.JWT_SECRETKEY,{expiresIn:"3d"});
    res.cookie("token",token);
    res.status(200).json({
        user_id:user._id,
        email:user.email,
        username:user.username
    }) 
}

const userLogout=async (req,res)=>{
    const token=req.cookies.token
    if(!token){
      return res.status(200).json({
        message:"user successfully logged out"
      }) 
    }
    res.cookie("token","")
    await tokenBlacklistModel.create({
        token
    })
    res.status(200).json({message:"user successflly loggged out"})
}

module.exports.userRegister=userRegister;
module.exports.userLogin=userLogin;
module.exports.userLogout=userLogout;