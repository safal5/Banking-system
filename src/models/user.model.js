const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required"],
        trim:true,
        lowercase:true,
        unique:true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid email address"]
    },
    username:{
        type:String,
        required:true,
        unique:[true,"username already exists"],
        trim:true
    },
  systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
  },
    password:{
        type:String,
        required:true,
        minlength:[8,'Password is too short! Must be at least 8 characters'],
        select:false
    }
},{
    timestamps:true
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next();
    const hash=await bcrypt.hash(this.password,10)
    this.password=hash;
})

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
};

module.exports=mongoose.model('user',userSchema)