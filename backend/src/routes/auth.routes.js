const express=require('express');
const {userRegister,logoutAll,verifyyourEmail,getAccessToken,resendOtp, userLogin, userLogout, currentUser}=require('../controller/auth.controller')
const { authMiddleware }=require('../middlewares/auth.middleware')

const router=express.Router();


router.post('/register',userRegister);
router.post('/access-token',getAccessToken);
router.post('/logout-all',logoutAll);
router.post('/verify-email',verifyyourEmail);
router.post('/resend-otp',resendOtp);
router.post('/login',userLogin);
router.post('/logout',userLogout)
router.get('/me',authMiddleware,currentUser)



module.exports=router;
