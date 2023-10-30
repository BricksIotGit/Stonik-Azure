const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import { Console } from 'console';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const tableName = process.env.driverPostedRidesTableName;
const pk = "Rides";
var currentDate = new Date();
const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
var unixTimestamp = Math.floor(currentDate.getTime()/1000);
var currentTime = unixTimestamp 

exports.handler = async event => {
try{
  let consumedCapacityUnits = 0
  const startCityName = event.pathParameters.city_name;
  const sk = `${startCityName}`
const params = {
    TableName : tableName,
    IndexName: "SortByActiveRidesAll",
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames:{
      "#pk": "ride_status",
      "#sk": "SK"
    },
    ExpressionAttributeValues: {
      ":pk": "ACTIVE",
      ":sk": sk

    }
  }

  const rides = await doc.query(params).promise();
if(rides.Items.length < 0){
    return Responses._200({
        message:"No ride found!"
    })

}
const availableRides = [];
for(let i=0; i<rides.Items.length; i++){
      // console.log("CurrentTime:  "+currentTime)
      // console.log("expdate: "+rides.Items[i].expdate)
      // if(currentDate < rides.Items[i].expdate || currentDate == rides.Items[i].expdate){
        console.log("Enter: "+rides.Items)
        const userPK = "User";
        const userSK = `${rides.Items[i].driver_id}`
        const paramss = {
            TableName : process.env.userTableName,
            ProjectionExpression:"driver_info,image,#nam,is_cnic_verified,is_license_verified,is_phone_verified,notification_token",
            KeyConditionExpression: '#pk = :pk and #sk = :sk',
            ExpressionAttributeNames:{
              "#pk": "PK",
              "#sk": "user_id",
              "#nam":"name"
            },
            ExpressionAttributeValues: {
              ":pk": userPK,
              ":sk": userSK
             
        
            }
          }
        const userr = await doc.query(paramss).promise();
        const userInfo = userr.Items[0]
        const {name:driverName,image,is_cnic_verified,is_license_verified,is_phone_verified} = userInfo
    
        const ride = rides.Items[i];
        const  {latitute:driverPickupLatitude,longitude:driverPickupLongitude} = ride.pickup_latlng
        const  {latitute:driverDropOffLatitude,longitude:driverDropOffLongitude} = ride.dropoff_latlng
        const {pickup_city_name,dropoff_city_name,pickup_location,dropoff_location} = ride.location_info;
        const date_and_time = ride.date_time;
        const seatsLeft = ride.seats_left;
        const alertDate = ride.alert_date;
        const postID = ride.post_id;
        const {name:vehicleName,color,seats,registration_no} = userInfo.driver_info.vehicle_info;
        const vehicle_info = {
            type:vehicleName,
            registration_no:registration_no,
            color:color,
            total_seats:seats,
            color_code:"#fff"
        }
        const driver_info = {
            name:driverName,
            is_phone_verified:is_phone_verified,
            is_cnic_verified:is_cnic_verified,
            is_license_verified:is_license_verified,
            phone_number:ride.driver_id,
            image_url:image
        }
        const location_info = {
            pickup_location:pickup_location,
            dropoff_location:dropoff_location,
            driver_latLng:{
                latitute:driverPickupLatitude,
                longitude:driverPickupLongitude
            },
            driver_drop_off_latlngs:{
                latitute:driverDropOffLatitude,
                longitude:driverDropOffLongitude
            }
        }

        const newRide = {
            id:ride.driver_id,
            post_id:postID,
            notification_token:userInfo.notification_token,
            pickup_city_name:pickup_city_name,
            dropoff_city_name:dropoff_city_name,
            date_and_time:date_and_time,
            seats_left:seatsLeft,
            vehicle_info:vehicle_info,
            driver_info:driver_info,
            alert_date:alertDate,
            location_info:location_info
        }

        availableRides.push(newRide)

    //    }


}
return Responses._200(availableRides)
}catch(error){
    console.log('error', error);
    return Responses._400({ message: error.message});
    }
  

}