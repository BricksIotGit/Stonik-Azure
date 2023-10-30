/*

    This lambda will execute when driver adds a post OR (in other words) a row is inserted to the dynamodb.
    It sends notification( on Android Mobile Platform devices) to the people who subscribed to this SNS topic.

*/
const Responses = require ("./HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "./SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event => {
    try{
    const arn = "arn:aws:sns:us-east-1:933832648874:Faisalabad_to_Lahore_25-05-2021"
    const message = Responses._messageFormat("Title","This message body",".view.need_a_ride.AvailableRides")
    const endpoint = await SNS.publish(arn,JSON.stringify(message))
    return Responses._200({
        id:endpoint
    })
    }catch(error){
        console.log(error.message)
        return Responses._400({
            message:error.message
        })
    }
}
const buildFCMPayloadString = (title,body) => {
    return JSON.stringify({
      data: {
        title: title,
        body:body
      }
    }) 
  };

 