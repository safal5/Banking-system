const express=require('express');
const {userRegister, userLogin, userLogout, currentUser}=require('../controller/auth.controller')
const { authMiddleware }=require('../middlewares/auth.middleware')

const router=express.Router();


router.post('/register',userRegister);
router.post('/login',userLogin);
router.post('/logout',userLogout)
router.get('/me',authMiddleware,currentUser)



module.exports=router;
