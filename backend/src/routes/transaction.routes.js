const express=require('express');
const { authMiddleware, authSystemMiddleware } = require('../middlewares/auth.middleware');
const { handleTransaction, handleSystemInitialTransaction,getTransactionHistory } = require('../controller/transaction.controller');
const router=express.Router()

router.post('/',authMiddleware,handleTransaction)
router.post('/system/initial-funds',authSystemMiddleware,handleSystemInitialTransaction)
router.get('/history',authMiddleware,getTransactionHistory)



module.exports=router