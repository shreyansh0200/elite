import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},message:String,type:{type:String,default:'info'},read:{type:Boolean,default:false}},{timestamps:true});
export default mongoose.model('Notification',schema);
