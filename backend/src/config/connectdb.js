const config=require('./config').config
const mongoose=require('mongoose');
function DBConnection(){
    mongoose.connect(config.MONGODB_URI+'/backend-ledger')
    .then(function(){
        console.log('database connected successfully')
    })
    .catch(function(err){
        console.log("error occured "+err);
        process.exit(1);
    })
};
module.exports=DBConnection
