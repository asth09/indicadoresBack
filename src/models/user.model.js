import mongoose from "mongoose";

const userShema = new mongoose.Schema({
    usuario: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String, 
        require: true
    },
},{versionKey:false})

export default mongoose.model('User', userShema)