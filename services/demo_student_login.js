const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const jwt = require('jsonwebtoken');
const IP = require('ip');
async function demologin(data)
{
  let device_type = 1;
  let devicetoken = "";
  if(data.devicetoken != undefined && data.devicetoken !=""){
    devicetoken = data.devicetoken;
    device_type = 2;
  }else{
    devicetoken = "";
  }
  const ipAddress = IP.address();
  await db.query("insert into demo_student_login (device_token,login_device) values('"+devicetoken+"',"+device_type+")");
    
          let user_details = [{}];
          token = jwt.sign({id:0},config.jwttoken,{ expiresIn: '24h' });
          message = "You've Logged in successfully. Welcome!";
          user_details[0].token = token;
          user_details[0].fname = "Guest";
          user_details[0].lname = "";
          user_details[0].id = "0";
          user_details[0].is_subscribe = 0;
          user_details[0].work_status = 0;
          user_details[0].work_status_percentage = 0;
          await db.query("INSERT INTO `guest_login_log`(`user_name`) VALUES ('Guest User')")
          await db.query("insert into `logindevices`(`userid`, `usertype`, `login_token`, `login_from`, `user_ip_address`, `login_type`) values(0,1,'"+token+"',"+device_type+",'"+ipAddress+"',1)")
            response = {status: 200, msg: message, data: user_details,is_subscribe:0}
            return(response);
}

module.exports = {
    demologin
}