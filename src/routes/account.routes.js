const express=require('express');
const { createAccount, getAccount, getAccountBalance } = require('../controller/account.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const router=express.Router();

router.post('/create',authMiddleware,createAccount)

router.get('/',authMiddleware,getAccount)

router.get('/getbalance/:accountId',authMiddleware,getAccountBalance)

module.exports=router;