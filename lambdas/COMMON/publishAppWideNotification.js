const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    try{
    const {title,body} = JSON.parse(event.body);
    const topicArn = process.env.app_wide_topic_arn
    await sendNotificationToAppWide(topicArn,title,body)
    return Responses._200({
        message:"SUCCESS"
    })
    }catch(error){
        console.log("Error: "+error.message)
        Responses._400({
            message:error.message
        })
    }
    

}
const sendNotificationToAppWide = async (topicArn,title,body) =>{
    var message = Responses._data_msg_notification(title,body,"app_wide",null)
    await SNS.publish(topicArn,JSON.stringify(message))
}