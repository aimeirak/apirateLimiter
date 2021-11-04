// import Notification from "../model/notifications.js";
import dovenv from "dotenv";
import bodyParser from 'body-parser';
dovenv.config();

class userNotificationController {
  static async sendNotification(req,res) {
    try {
        return res.json({
            status:200,
            title:'Notification',
            message:'the is meeting',
            subscription:{
              remaining_per_sec:req.params.default_requests_per_sec,
              remaining_per_month:req.params.default_requests_per_month
            }
        });
     
    } catch (err) {
      return res.json({
        status: 500,
        error: err.message,
      });
    }
  }
  // static async noUserFound(req,res){
  //       try {
  //         return res.status(404).json({
  //             status:404,
  //             message:'No User Found'
  //         });
      
  //     } catch (err) {
  //       return res.status(500).json({
  //         status: res.statusCode,
  //         error: err.message,
  //       });
  //     }
  // }

}

export default userNotificationController;

  