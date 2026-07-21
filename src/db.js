import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://asdrithcontreras:asdrit+-*@cluster0.pvu1i.mongodb.net/indicadores?retryWrites=true&w=majority&appName=Cluster0');
        console.log("Base de datos conectada")
    } catch (error) {
        console.log(error)
    }
}  