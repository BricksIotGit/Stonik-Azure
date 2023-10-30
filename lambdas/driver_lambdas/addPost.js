"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    const {driver_id,date_time,no_of_seats_posted,location_info,pickup_latlng,dropoff_latlng,alert_date} = JSON.parse(event.body);
    const {pickup_city_name} = location_info;
    const dateObject = uuidv1();
    const createdAt = Date.now().toString()
    var unixTimestamp = Math.floor(new Date(date_time+" GMT+05:00").getTime()/1000);
    var createdATT=unixTimestamp.toString()
    var expdate = unixTimestamp + 5260000
    

    try{
    const params = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        Item:{
            PK:`Rides`,
            SK:`${pickup_city_name}#${dateObject}`,
            post_id: dateObject,
            driver_id:driver_id,
            created_at:createdATT,
            date_time: date_time,
            no_of_seats_posted: no_of_seats_posted,
            seats_left: no_of_seats_posted,
            location_info: location_info,
            pickup_latlng: pickup_latlng,
            dropoff_latlng: dropoff_latlng,
            alert_date: alert_date,
            user_id:driver_id,
            subscribed_passengrs: [],
            ride_status:`ACTIVE`,
            occupied_seats:0,
            is_ride_cancelled: false,
            expdate: expdate
        }

}
            await doc.put(params).promise();
            return Responses._200({
                id: dateObject,
                driver_id: driver_id,
                post_id: dateObject,
                date_time: date_time,
                no_of_seats_posted: no_of_seats_posted,
                location_info: location_info,
                pickup_latlng: pickup_latlng,
                dropoff_latlng: dropoff_latlng,
                alert_date:alert_date,
                subscribed_passengrs: []
                
            });
                    
        }catch(error){
        console.log('error', error);
        return Responses._400({ message: error.message});
        }

}