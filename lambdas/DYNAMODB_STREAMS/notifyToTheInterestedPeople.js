/*

    This lambda will execute when driver adds a post OR (in other words) a row is inserted to the dynamodb table(DriverPosts).
    It sends notification( on Android Mobile Platform devices) to the people who subscribed to this SNS topic.

*/
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event => {
    const records = event.Records[0];
    console.log(JSON.stringify(records))
    var eventName = records.eventName;
    var pk = records.dynamodb.Keys.PK.S
    
    if(eventName === "INSERT" && pk.startsWith("Rides")){
        try{
        const pickup_city = records.dynamodb.NewImage.location_info.M.pickup_city_name.S
        const destination_city = records.dynamodb.NewImage.location_info.M.dropoff_city_name.S;
        const date = records.dynamodb.NewImage.alert_date.S;
        const topicArn = `${process.env.topicArn}:${pickup_city}_to_${destination_city}_${date}`
        console.log("TopicArn: "+topicArn)
        const payload = Responses._notficationFormat("New Post Added","A new driver has added a post, tap to see...",".view.need_a_ride.AvailableRides");
        
        console.log(JSON.stringify(payload))

              
        await SNS.publish(topicArn,JSON.stringify(payload))    
        }
        
        catch(error){
        console.log('error', error)
        }
        
    }
    else{
        console.log("Not entered")
    }

    

    }
