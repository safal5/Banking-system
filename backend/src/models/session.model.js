const mongoose=require('mongoose')
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports= mongoose.model("Session", sessionSchema);


