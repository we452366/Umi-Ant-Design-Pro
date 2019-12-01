const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const ObjectId=Schema.Types.ObjectId;
let config=process.env.NODE_ENV=='production'?require('./config/prod.js'):require('./config/dev.js')
let conn=mongoose.createConnection(config.dbUrl,{useNewUrlParser:true,useUnifiedTopology:true});
const UseModel=conn.model('User',new Schema({
    userid:{type:String},
    name:{type:String},
    mail:{type:String,required:true},
    password:{type:String,required:true},
    mobile:{type:String,required:true},
    avatar:{type:String,required:true},
    currentAuthority:{type:String,required:true}
}));

module.exports={
    UseModel
}