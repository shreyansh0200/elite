import Notification from '../models/Notification.js';
export async function notify(userId,message,type='info'){return Notification.create({userId,message,type});}
