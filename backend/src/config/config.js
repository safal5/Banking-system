const dotenv=require('dotenv')
dotenv.config()
if(!process.env.MONGODB_URI){
    throw new Error("MONGODB_URI doesn't exists")
}
if(!process.env.JWT_SECRETKEY){
    throw new Error("JWT_SECRETKEY doesn't exists")
}
if(!process.env.CLIENT_ID){
    throw new Error("CLIENT_ID doesn't exists")
}
if(!process.env.CLIENT_SECRET){
    throw new Error("CLIENT_SECRETY doesn't exists")
}
if(!process.env.REFRESH_TOKEN){
    throw new Error("REFRESH_TOKEN doesn't exists")
}
if(!process.env.EMAIL_USER){
    throw new Error("EMAIL_USER doesn't exists")
}
const config={
    MONGODB_URI:process.env.MONGODB_URI,
    JWT_SECRETKEY:process.env.JWT_SECRETKEY,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN:process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER:process.env.GOOGLE_USER
}
module.exports.config=config
