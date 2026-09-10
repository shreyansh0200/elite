import mongoose from 'mongoose';
const schema=new mongoose.Schema({buyRequestId:{type:mongoose.Schema.Types.ObjectId,ref:'BuyRequest'},listingId:{type:mongoose.Schema.Types.ObjectId,ref:'MarketListing'},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},customerId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},cropType:String,quantity:Number,unit:String,amount:Number,token:String},{timestamps:true});
export default mongoose.model('SaleRecord',schema);
