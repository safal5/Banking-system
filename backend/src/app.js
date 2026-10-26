const express=require('express');

const cookieParser = require('cookie-parser');
const app=express();

// The React development server runs on a separate origin. Allow it to use the
// cookie-based session while keeping the production API origin configurable.
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(origin => origin.trim());
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json());
app.use(cookieParser());
/**
 * routes accuired
 */

const authRouter=require('./routes/auth.routes');
const accountRouter=require('./routes/account.routes')
const transactionRouter=require('./routes/transaction.routes')

/**
 * routes used
 */
app.get('/',(req,res)=>{
    res.send("system is up and running")
})
app.use('/api/auth',authRouter)
app.use('/api/account',accountRouter)
app.use('/api/transaction',transactionRouter)

module.exports=app;
