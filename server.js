require('dotenv').config();
const app=require('./src/app');
const DBConnection=require('./src/config/connectdb');

DBConnection();

app.listen(3000,()=>{
    console.log("server is running")
})