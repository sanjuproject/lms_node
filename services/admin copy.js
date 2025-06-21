const db = require('./db');
const helper = require('../../helper');
const config = require('../../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getmac = require('getmac');
const IP = require('ip');
const nodemailer = require("nodemailer");
var request = require('request');
var http = require('http');
const multer = require("multer");
//var urlencode = require('urlencode');
var CryptoJS = require("crypto-js");
require('dotenv').config();
async function check_duplicate(data){
  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num,mobile_otp_verify,email_otp_verify\
  FROM students WHERE is_deleted = 0 and id != '`+data.student_id+`' and (email = '`+ data.email + `' or mobile = '` + data.mobile + `')`);

  let result = await new Promise((resolve, reject) => {
    if (check_duplicate[0].record_num > 0) {
      message = "Sorry! record already exist.";
      response = { status: 410, msg: message }
      reject(response);
    }else{
      message = "Ok";
      response = { status: 200, msg: message }
      resolve(response);
    }
  }).then((value) => {
    //console.log(value);
    return value;
    //
  }).catch((err) => {
    return err;
    //console.error(err);
  });
  return result;
}
async function create(data) {
  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num,mobile_otp_verify,email_otp_verify\
   FROM students WHERE is_deleted = 0 and (email = '`+ data.email + `' or mobile = '` + data.mobile + `')`);
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';

  let result = await new Promise((resolve, reject) => {
    if (check_duplicate[0].record_num > 0) {
      message = "Sorry ! Your record already exists";
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      bcrypt.hash(data.password, 10, async (err, hash) => {
        if (err) {
          message = "Something went wrong, please try again later.";
        }
        else {
          let registration_from = 1;
          if(data.device_token !='' && data.device_token != undefined){
            registration_from = 2;
          }else{
            data.device_token = "";
          }
          const ipAddress = IP.address();

          const result = await db.query(
            `INSERT INTO students (fname, lname, dob, email,password, gender, address, pincode, mobile, 
              standard, board,school_name, school_address,mobile_otp_verify,email_otp_verify,ip_address,device_token,registration_from) 
            VALUES ('`+ data.fname + `','` + data.lname + `','` + data.dob + `','` + data.email + `', '` + hash + `', '` + data.gender + `','` + data.address + `',
            '`+ data.pincode + `','` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.school_name.replace(/['‘’"“”]/g,'') + `','` + data.school_address.replace(/['‘’"“”]/g,'') + `'
            ,'1','1','`+ipAddress+`','`+data.device_token+`','`+registration_from+`')`);

          if (result.affectedRows) {
            let board_name = "";
            await db.query("select * from `boards` where `id` ="+data.board.substring(0, 1))
            .then(result=>{
              board_name = result[0].name;
            })
            await db.query("select * from `school_master` where `school_name` = '"+data.school_name.replace(/['‘’"“”]/g,'')+"' and `board` = '"+board_name+"'")
            .then(result=>{
              if(result.length == 0)
              {
                db.query("INSERT INTO `school_master`(`board`, `school_name`, `school_address`) VALUES (\
                '"+board_name+"','"+ data.school_name.replace(/['‘’"“”]/g,'') +"','"+ data.school_address.replace(/['‘’"“”]/g,'') +"')")
              }
            })
            
            status = 200;
            message = 'Student registered successfully done';
            let student_name = data.fname+' '+data.lname;
            let smsbody = config.registersuccessfull.body.replace("#field1#",student_name);
          smsbody = smsbody.replace("#field2#",process.env.PORTALURL);
      
      let smsdata = {phonenumber:data.mobile,body:encodeURI(smsbody)}
      helper.sendsms(smsdata);
          
            let reqest_data = {email:data.email,subject:config.studentregistrationmail.subject,body:config.studentregistrationmail.body}
			helper.sendmail(reqest_data);
            response = { status: status, msg: message, studentid: result.insertId }
          }

          resolve(response);
        }
      });
    }

  }).then((value) => {
    //console.log(value);
    return value;
    //
  }).catch((err) => {
    return err;
    //console.error(err);
  });

  return result;
}

async function signin(data) {
  const user_details = await db.query(`SELECT students.*,classes.id as class_id, boards.short_code as board_code,boards.name as board_name FROM 
  students left join  classes on classes.class_no = students.standard left join  boards on students.board = boards.id WHERE students.is_deleted = 0 and email = '` + data.email + `' limit 0,1`);
  let response = {};
  let token = "";
  let status = 410;
  let sch_correct_ans_calcuation = 0;
  let com_correct_ans_calcuation = 0;
  let demo_exam_submit = 0;
  let subscribetion_details ={};
  let exam_unique_id = "";
  let total_sch_com_count = 0;
  let is_subscribe = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
  let is_subscribe_e_library = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
  let work_status = 1; //1 = Registered,2 = Purchase Subscription,3 = Exam Given,4 = E-library subscribed,5 = Online Class
  let message = 'Something went wrong, please try again later.';
  let get_feedback_details = "";
  let promise_result = await new Promise((resolve, reject) => {
    //console.log(user_details)
    if (user_details.length == 0) {
      message = 'Invalid username or password.';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      // check password
      bcrypt.compare(data.password, user_details[0].password, (bErr, bResult) => {
        // wrong password
        if (bResult == false) {
          message = 'Invalid username or password.';
          response = { status: status, msg: message, error: bErr }
          reject(response);
        }
        if (bResult == true) {
          token = jwt.sign({ id: user_details[0].id,class_id:user_details[0].class_id,class:user_details[0].standard,board:user_details[0].board }, config.jwttoken, { expiresIn: '24h' });
          //console.log(token)
          db.query("delete from logindevices where `usertype`= 1 and `userid` =" + user_details[0].id)
            //.then((resutlt) => {
              let login_from = 1;
              if(data.devicetoken !=undefined && data.devicetoken !=""){
                login_from = 2;
              }
              const ipAddress = IP.address();
                db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`,`login_from`,`user_ip_address`,`login_type`) VALUES (" + user_details[0].id + ",1,'" + token + "',"+login_from+",'"+ipAddress+"',2)")
              
            //});
            
          demo_exam_submit = user_details[0].demo_exam_status;
          exam_unique_id = user_details[0].exam_unique_id;

          const promise1 = new Promise(async (resolve, reject) => {
          if (exam_unique_id != '') {
            db.query("select * from `purchased_subscribtions` where `is_active` = 1 and `student_id` = "+user_details[0].id)
            .then(result_data=>{
              result_data.forEach(Element=>{
                var subscription_details = JSON.parse(Element.subscription_details);
                let e_subscribe_sch = 0;
                let e_subscribe_com = 0;
                subscription_details.forEach(Element_inner=>{
                 
                    if(Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 2 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 1;
                      }
                    }
                    if(Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 1 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 2;
                      }
                      }
                      //////////////////////// E Library Section ///////////////////
                      if(Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 1;
                        e_subscribe_sch = 1;
                      }
                      if(Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 2;
                        e_subscribe_com = 1;
                      }
                      if(e_subscribe_sch == 1 && e_subscribe_com == 1)
                      {
                        is_subscribe_e_library = 3;
                      }
                })                

              })
              
            })
          }
          get_feedback_details = await db.query("select * from `feedback_rating` where `student_id` = "+user_details[0].id);
/////////////////////////////////////////////////////////////////////////
let student_id = user_details[0].id; // Student ID from 
let standard = user_details[0].standard; 
let board = user_details[0].board; 

          let total_competitive_master = await db.query("select * from `exam_competitive_subscribtion_master` where `status` = 1 and `is_deleted`= 0 and (`class` = "+standard+" or `class`= 0)");
          let total_scholastic_master = await db.query("select * from `exam_scholastic_subscribtion_master` left join classes on classes.id = exam_scholastic_subscribtion_master.class where \
          `exam_scholastic_subscribtion_master`.`status` = 1 and `exam_scholastic_subscribtion_master`.`is_deleted`= 0 and `classes`.`class_no` = "+standard+" and `exam_scholastic_subscribtion_master`.`board_id`="+board);
          
          //////////// Claculate Total Purchased amount Scholastic //////////
          let total_purchase_price_sch = 0;
          if(total_scholastic_master.length > 0){
            total_scholastic_master.forEach(element=>{
                let package_details_ary = JSON.parse(element.package_details);
                let hightest_value = parseFloat(package_details_ary[0].price);
               
                package_details_ary.forEach(element_inner=>{
                    if(parseFloat(element_inner.price) > hightest_value)
                    {
                      hightest_value = parseFloat(element_inner.price);
                    }
                })
                total_purchase_price_sch += hightest_value;
            })
        }
          //////////////////////////////////////////////////////////////////

          //////////// Claculate Total Purchased amount Competitive //////////
          let total_purchase_price_com = 0;
          if(total_competitive_master.length > 0){
            let hightest_value = parseFloat(total_competitive_master[0].amount);
            total_competitive_master.forEach(element=>{
                    if(parseFloat(element.amount) > hightest_value)
                    {
                      hightest_value = parseFloat(element.amount);
                    }
            
                total_purchase_price_com += hightest_value;
            })
        }
          //////////////////////////////////////////////////////////////////
          let total_competitive_completed = await db.query("select * from `exam_completed_competitive` where `student_id` = "+student_id);
          let total_scholastic_completed = await db.query("select * from `exam_completed` where `student_id` = "+student_id +" group by subject_id");
          let total_amount_paid_sch = 0;
          let total_amount_paid_com = 0;
          let total_amount_paid_sch_completed = 0;
          let total_amount_paid_com_completed = 0;
          let sch_completed_sujects = [];
          let com_completed_last_set = 0;
     
        if(total_scholastic_completed.length > 0)
        {  
            total_scholastic_completed.forEach(element=>{
              sch_completed_sujects.push(element.subject_id);
            })
        }
          total_competitive_completed.forEach(element=>{
            com_completed_last_set = element.exam_set_counter;
          })
          db.query("select * from `purchased_subscribtions` where `student_id` = "+student_id+" and is_active = 1")
              .then((result,err)=>{
                  let scholatic_details = [];
          let competive_details = [];
                      let counter1 = 0;
                      let counter2 = 0;
            if(result.length > 0)
            {          
                  result.forEach(element=>{
                      let subscription_details = [];
                      subscription_details = JSON.parse(element.subscription_details);
                      
                          subscription_details.forEach(element_inner=>{
                            //total_sch_com_count += element_inner.no_set + (element_inner.no_module * 3) + (element_inner.no_mock * 2);
                                  if(element_inner.category == 'COMPETITIVE'){
                                    total_amount_paid_com_completed += parseFloat(element_inner.cart_amount);
                                    if(element_inner.no_set == com_completed_last_set){
                                          total_amount_paid_com += parseFloat(element_inner.cart_amount);
                                    }
                                    //total_amount_paid_com += parseFloat(element_inner.cart_amount);
                                      competive_details[counter1] = element_inner.subscription_id;
                                      counter1++;
                                  }
                                  if(element_inner.category == 'SCHOLASTIC'){
                                    if(sch_completed_sujects.includes(element_inner.subject_id))
                                    {
                                      total_amount_paid_sch_completed += parseFloat(element_inner.cart_amount);
                                    }
                                    total_amount_paid_sch += parseFloat(element_inner.cart_amount);
                                      scholatic_details[counter2] = element_inner.subscription_id;
                                      counter2++;
                                  }
                          })
                  })
                }
          let scholatic_details_count = Math.round((total_amount_paid_sch/total_purchase_price_sch)*100);
          let competive_details_count = Math.round((total_amount_paid_com/total_purchase_price_com)*100);   
          let total_competitive_completed = 0;
          if(total_amount_paid_com > 0){
              total_competitive_completed = Math.round((total_amount_paid_com_completed/total_amount_paid_com)*100);     
          }
 
          let total_scholastic_completed = 0;
          if(total_amount_paid_sch > 0){
            total_scholastic_completed = Math.round((total_amount_paid_sch_completed/total_amount_paid_sch) * 100);     
        }
      
          subscribetion_details = {total_scholastic_master:100,
          total_competitive_master:100,scholatic_details_count:scholatic_details_count,competive_details_count:competive_details_count,
          total_scholastic_completed:total_scholastic_completed,total_competitive_completed:total_competitive_completed,is_subscribe:is_subscribe,
          total_competitive_completed_master:100,total_scholastic_completed_master:100};
          //console.log(subscribetion_details)
          resolve(subscribetion_details);
        })
       
        });
       
          message = "Logged in successfully";
          user_details[0].token = token;
          //user_details[0].is_subscribe = is_subscribe;

          
                

          delete user_details[0].password;
          delete user_details[0].is_deleted;
          delete user_details[0].status;
          if (exam_unique_id != '') {    
            promise1.then(async (subscribetion_details) => {
              

              let exam_details_sch = await db.query("SELECT * FROM `exam_completed` where `exam_completed`.`student_id` = "+user_details[0].id);
              
              let exam_details_com = await db.query("SELECT * FROM `exam_completed_competitive` where `exam_completed_competitive`.`student_id` = "+user_details[0].id);

              if(exam_details_sch.length > 0 || exam_details_com.length > 0){
                work_status = 3;
              }
              let competitive_overall = 0;
              
              let scholatic_overall = 0;
             
              if(is_subscribe_e_library > 0 && work_status == 3)
              {
                work_status = 4;
              }

              if(is_subscribe_e_library > 0 && work_status == 1){
                work_status = 2;
              }
              let performance_overall = 0;
              user_details[0].is_subscribe = subscribetion_details.is_subscribe;
              user_details[0].is_subscribe_e_library = is_subscribe_e_library;
              delete subscribetion_details.is_subscribe;
              user_details[0].work_status = work_status;
              user_details[0].work_status_percentage = Math.ceil((work_status/5)*100);
              user_details[0].total_scholastic_master = subscribetion_details.total_scholastic_master;
              user_details[0].total_competitive_master = subscribetion_details.total_competitive_master;
              user_details[0].scholatic_details_purchase = subscribetion_details.scholatic_details_count;
              user_details[0].competive_details_purchase = subscribetion_details.competive_details_count;
              user_details[0].total_scholastic_completed = subscribetion_details.total_scholastic_completed;
              user_details[0].total_competitive_completed = subscribetion_details.total_competitive_completed;
              user_details[0].total_competitive_completed_master = subscribetion_details.total_competitive_completed_master;
              user_details[0].total_scholastic_completed_master = subscribetion_details.total_scholastic_completed_master;
              
              user_details[0].scholatic_overall = performance_overall;
              user_details[0].competitive_overall = performance_overall;
              user_details[0].feedback_given = get_feedback_details.length; 
              response = {
                status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
                exam_unique_id: exam_unique_id
              }
              if(data.devicetoken !=undefined){
                await db.query("update `students` set `device_token` = '"+data.devicetoken+"' where `id` = "+user_details[0].id)
              }
              resolve(response);
            });
        }else{
          user_details[0].is_subscribe = 0;
              user_details[0].is_subscribe_e_library = 0;
              delete subscribetion_details.is_subscribe;
              user_details[0].work_status = 1;
              user_details[0].work_status_percentage = Math.ceil((work_status/5)*100);
              user_details[0].total_scholastic_master = subscribetion_details.total_scholastic_master;
              user_details[0].total_competitive_master = subscribetion_details.total_competitive_master;
              user_details[0].scholatic_details_purchase = 0;
              user_details[0].competive_details_purchase = 0;
              user_details[0].total_scholastic_completed = 0;
              user_details[0].total_competitive_completed = 0;
              user_details[0].total_competitive_completed_master = 0;
              user_details[0].total_scholastic_completed_master = 0;
              user_details[0].scholatic_overall = 0;
              user_details[0].competitive_overall = 0;
              user_details[0].feedback_given = get_feedback_details.length; 
          response = {
            status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
            exam_unique_id: exam_unique_id, is_subscribe: is_subscribe,is_subscribe_e_library:is_subscribe_e_library
          }
          db.query("update `students` set `device_token` = '"+data.devicetoken+"' where `id` = "+user_details[0].id)
          resolve(response);
        }
         
         

        }
      });
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  })
  // await db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`) VALUES ("+user_details[0].id+",1,'"+token+"')")

  return promise_result;
}


async function verify_mobile_otp(data) {
  const user_details = await db.query(`SELECT * FROM students WHERE id = '` + data.id + `'`);
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (user_details.length == 0) {
      message = 'Invalid username or password.';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      if (user_details[0].mobile_otp === data.otp) {
        db.query("update `students` set `mobile_otp_verify` = '1' where `id` = '" + user_details[0].id + "'")
          .then((result, err) => {
            response = { status: 200, msg: "Mobile OTP verify successfully done" }
            resolve(response);
          }).catch((err) => {
            response = { status: 410, msg: "Mobile OTP verify update fail" }
            resolve(response);
          })

      }
      else {
        response = { status: 410, msg: "Mobile OTP verification fail" }
        resolve(response);
      }
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  });

  return promise_result;
}

async function verify_email_otp(data) {
  const user_details = await db.query(`SELECT * FROM students WHERE id = '` + data.id + `'`);
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (user_details.length == 0) {
      message = 'Invalid username or password.';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      if (user_details[0].email_otp === data.otp) {
        db.query("update `students` set `email_otp_verify` = '1' where `id` = '" + user_details[0].id + "'")
          .then((result, err) => {
            response = { status: 200, msg: "Email OTP verify successfully done" }
            resolve(response);
          }).catch((err) => {
            response = { status: 410, msg: "Email OTP verify update fail" }
            resolve(response);
          })
      }
      else {
        response = { status: 410, msg: "Eamil OTP verification fail" }
        resolve(response);
      }

    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  });

  return promise_result;
}

async function logout(data) {
  const user_details = await db.query(`SELECT * FROM students WHERE id = '` + data.id + `'`);
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (user_details.length == 0) {
      message = 'User record not exist';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      db.query("delete from logindevices where `usertype` = 2 and `userid` =" + data.id)
        .then((result, err) => {
          response = { status: 200, msg: "Logout from student portal successfully done" }
          resolve(response);
        }).catch((err) => {
          response = { status: 410, msg: "Logout process fail" }
          resolve(response);
        })
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  });

  return promise_result;
}


async function send_verification_otp(data) {

  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num,mobile_otp_verify,email_otp_verify\
   FROM students WHERE is_deleted = 0 and (email = '`+ data.email + `' or mobile = '` + data.mobile + `')`);
  let response = {};
  let status = 410;

  if (check_duplicate[0].record_num > 0) {
    message = "Sorry ! Your record already exists";
    response = { status: status, msg: message }
    return response;
  }
  else {
    const student_email = data.email;
    const student_mobile = data.mobile;
    const email_otp = (Math.floor(100000 + Math.random() * 900000));
    const mobile_otp = (Math.floor(100000 + Math.random() * 900000));

    if (student_mobile != '') {

      let smsbody = config.registerotp.body.replace("#field1#",mobile_otp);
          smsbody = smsbody.replace("#field2#",'+916289581169');// For new MOBILE NO
      
      let smsdata = {phonenumber:student_mobile,body:encodeURI(smsbody)}
      helper.sendsms(smsdata);
     
    }

    if (student_email != '') {
    
      let mailbody = config.studentregistrationotp.body.replace("#OTP#",email_otp);
      let maildata = {email:data.email,subject:config.studentregistrationotp.subject,body:mailbody}
      helper.sendmail(maildata);
    }
    
    /////////////////////////////////////////////////////////////////////
    let email_otp_encrypt = CryptoJS.AES.encrypt(email_otp.toString(), process.env.CRYPTO).toString();
    let mobile_otp_encrypt = CryptoJS.AES.encrypt(mobile_otp.toString(), process.env.CRYPTO).toString();
    // Encrypt
            //var ciphertext = CryptoJS.AES.encrypt(email_otp.toString(), process.env.CRYPTO);
            // Decrypt
            //var bytes  = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPTO);
            //var originalText = bytes.toString(CryptoJS.enc.Utf8);

            //console.log(originalText); // 'my message'

    response = { status: 200, msg: "Shared OTP with student", email_otp: email_otp_encrypt, mobile_otp: mobile_otp_encrypt,otp_valid_time: 5 }
    return response;
  }

}
async function checkuserexist(data) {
  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num FROM students WHERE is_deleted = 0 and (email = '` + data.email + `' or mobile = '` + data.mobile + `')`);
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';

  let result = await new Promise((resolve, reject) => {
    if (check_duplicate[0].record_num > 0) {
      message = "Sorry ! Your record already exists";
      response = { status: status, msg: message, exist: 1 }
      reject(response);
    }
    else {

      message = "User record not exist in the system";
      response = { status: 200, msg: message, exist: 0 }
      resolve(response);
    }

  }).then((value) => {
    //console.log(value);
    return value;
    //
  }).catch((err) => {
    return err;
    //console.error(err);
  });

  return result;
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {

      // Uploads is the Upload_folder_name
      cb(null, "assets/images")
  },
  filename: function (req, file, cb) {
    cb(null,  "profilepic_" + Date.now()+".zip")
  }
});
  
var upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb){
      // Set the filetypes, it is optional
      var filetypes = /png|jpeg|jpg|PNG/;
      var mimetype = filetypes.test(file.mimetype);

      var extname = filetypes.test(path.extname(
                  file.originalname).toLowerCase());
      
      if (mimetype && extname) {
          return cb(null, true);
      }
    
      cb("File upload only supports the "
              + "following filetypes - " + filetypes);
    }
}).single("profile_pic"); 

async function updateprofile_student(data){
   const response = check_duplicate(data);
   let response_msg = "";
   if(true)
   {
    upload(req, res, async function(err){
			if (err) {
				let response = {status: config.errorStatus, msg: err}
				res.json(response);
			}
			else{
				fs.chmod(req.file.path, 0o777, () => {
					console.log("Trying to write to file");	
				});
        const upload_path = req.file.destination+"/"+req.file.filename;
				await db.query("UPDATE `students` SET `fname`='"+data.fname+"',`lname`='"+data.lname+"',`dob`='"+data.dob+"',\
    `email`='"+data.email+"',`gender`='"+data.gender+"',`address`='"+data.address+"',\
    `pincode`='"+data.pincode+"',`mobile`='"+data.mobile+"',`standard`='"+data.standard+"',`board`='"+data.board+"',`school_name`='"+data.school_name+"',\
    `school_address`='"+data.school_address+"',profile_pic = '"+upload_path+"' WHERE id="+data.student_id)
    .then(result=>{
      if(result.affectedRows > 0){
        response_msg = { status: 200, msg: "Student profile update successfully / Profile update successfully" }
      }else{
        response_msg = {status:410,msg:"Update profile fail"}
      }
      return response_msg;
    })
			}
		});
   }
}

async function ovalallperformance_calculation(user_id){
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  let sch_allquestions = [];
  let sch_correct_ans = [];
  let total_sch_com_count = 0;
  let com_allquestions = [];
  let com_correct_ans = [];
  let sch_correct_ans_calcuation = [];
  let com_correct_ans_calcuation = [];
  let total_percentage_count = 0;
  let total_record_count = 0;
  ///////////////////////////////// SCH SECTION ////////////////////////////////////////////
  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = "+user_id+" and online_exam_question_answers.post_ans_status = 1 GROUP by exam_completed.exam_unique_id")
  .then(exam_sch=>{
    exam_sch.forEach(element=>{
      sch_correct_ans[element.exam_unique_id] = element.total_record;
    })
  })

  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = "+user_id+" GROUP by exam_completed.exam_unique_id")
  .then(exam_sch=>{
    exam_sch.forEach(element=>{
      sch_allquestions[element.exam_unique_id] = element.total_record;
    })
  })
  for (var key in sch_allquestions) {
    if(parseInt(sch_correct_ans[key]) > 0){
    sch_correct_ans_calcuation[key] = (sch_correct_ans[key]/sch_allquestions[key]);
    }
    else{
      sch_correct_ans_calcuation[key] = 0;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////// COM SECTION ///////////////////////////////////////////////////////////////
await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = "+user_id+" and online_exam_question_answers_competitive.post_ans_status = 1 GROUP by online_exam_question_answers_competitive.exam_unique_id")
  .then(exam_com=>{
    exam_com.forEach(element=>{
      com_correct_ans[element.exam_unique_id] = element.total_record;
    })
  })

  await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.exam_unique_id")
  .then(exam_com=>{
    exam_com.forEach(element=>{
      com_allquestions[element.exam_unique_id] = element.total_record;
    })
  })
  for (var key in com_allquestions) {
    if(parseInt(com_correct_ans[key]) > 0){
    com_correct_ans_calcuation[key] = (com_correct_ans[key]/com_allquestions[key]);
    }
    else{
      com_correct_ans_calcuation[key] = 0;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  for (var key in com_correct_ans_calcuation) {
    total_percentage_count += com_correct_ans_calcuation[key];
    total_record_count++;
  }

  for (var key in sch_correct_ans_calcuation) {
   // console.log(sch_correct_ans_calcuation[key]);
    total_percentage_count += sch_correct_ans_calcuation[key];
    total_record_count++;
  }

  //console.log(total_percentage_count,total_record_count);

 
    
    let performance_overall = (((total_percentage_count)/total_record_count)*100).toFixed(2);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
   //console.log(performance_overall);
   return {status:200,msg:"Overall Performance",performance_overall:performance_overall};
}

async function getdashboard_data(userdata)
{
  const user_details = await db.query(`SELECT students.*,classes.id as class_id, boards.short_code as board_code,boards.name as board_name FROM 
  students left join  classes on classes.class_no = students.standard left join  boards on students.board = boards.id WHERE students.is_deleted = 0 and students.id = '` + userdata.id + `' limit 0,1`);
  let response = {};
  let token = "";
  let status = 410;
  let demo_exam_submit = 0;
  let subscribetion_details ={};
  let exam_unique_id = "";
  let total_sch_com_count = 0;
  let is_subscribe = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
  let is_subscribe_e_library = 0; // 0 = Not Subscribe ,1 = Scholactic,2 = Competitive, 3 = Both
  let work_status = 1; //1 = Registered,2 = Purchase Subscription,3 = Exam Given,4 = E-library subscribed,5 = Online Class
  let message = 'Something went wrong, please try again later.';
  let get_feedback_details = "";
  let promise_result = await new Promise(async (resolve, reject) => {
    //console.log(user_details)
    if (user_details.length == 0) {
      message = 'Invalid username or password.';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
     
        if (true) {
            await db.query("select * from `logindevices` where userid = "+userdata.id)
            .then(result=>{
              user_details[0].token = result[0].login_token;
            })
          demo_exam_submit = user_details[0].demo_exam_status;
          exam_unique_id = user_details[0].exam_unique_id;

          const promise1 = new Promise(async (resolve, reject) => {
          if (exam_unique_id != '') {
            db.query("select * from `purchased_subscribtions` where `is_active` = 1 and `student_id` = "+user_details[0].id)
            .then(result_data=>{
              result_data.forEach(Element=>{
                var subscription_details = JSON.parse(Element.subscription_details);
                let e_subscribe_sch = 0;
                let e_subscribe_com = 0;
                subscription_details.forEach(Element_inner=>{
                 
                    if(Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 2 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 1;
                      }
                    }
                    if(Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0){
                      
                      if(is_subscribe == 1 || is_subscribe == 3){
                          is_subscribe = 3;
                          work_status = 2;
                      }
                      else{
                          is_subscribe = 2;
                      }
                      }
                      //////////////////////// E Library Section ///////////////////
                      if(Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 1;
                        e_subscribe_sch = 1;
                      }
                      if(Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1))
                      {
                        is_subscribe_e_library = 2;
                        e_subscribe_com = 1;
                      }
                      if(e_subscribe_sch == 1 && e_subscribe_com == 1)
                      {
                        is_subscribe_e_library = 3;
                      }
                })                

              })
              
            })
          }
          get_feedback_details = await db.query("select * from `feedback_rating` where `student_id` = "+user_details[0].id);
/////////////////////////////////////////////////////////////////////////
let student_id = user_details[0].id; // Student ID from 
let standard = user_details[0].standard; 
let board = user_details[0].board; 

          let total_competitive_master = await db.query("select * from `exam_competitive_subscribtion_master` where `status` = 1 and `is_deleted`= 0 and (`class` = "+standard+" or `class`= 0)");
          let total_scholastic_master = await db.query("select * from `exam_scholastic_subscribtion_master` left join classes on classes.id = exam_scholastic_subscribtion_master.class where \
          `exam_scholastic_subscribtion_master`.`status` = 1 and `exam_scholastic_subscribtion_master`.`is_deleted`= 0 and `classes`.`class_no` = "+standard+" and `exam_scholastic_subscribtion_master`.`board_id`="+board);
          
          //////////// Claculate Total Purchased amount Scholastic //////////
          let total_purchase_price_sch = 0;
          if(total_scholastic_master.length > 0){
            total_scholastic_master.forEach(element=>{
                let package_details_ary = JSON.parse(element.package_details);
                let hightest_value = parseFloat(package_details_ary[0].price);
               
                package_details_ary.forEach(element_inner=>{
                    if(parseFloat(element_inner.price) > hightest_value)
                    {
                      hightest_value = parseFloat(element_inner.price);
                    }
                })
                total_purchase_price_sch += hightest_value;
            })
        }
          //////////////////////////////////////////////////////////////////

          //////////// Claculate Total Purchased amount Competitive //////////
          let total_purchase_price_com = 0;
          if(total_competitive_master.length > 0){
            let hightest_value = parseFloat(total_competitive_master[0].amount);
            total_competitive_master.forEach(element=>{
                    if(parseFloat(element.amount) > hightest_value)
                    {
                      hightest_value = parseFloat(element.amount);
                    }
            
                total_purchase_price_com += hightest_value;
            })
        }
          //////////////////////////////////////////////////////////////////
          let total_competitive_completed = await db.query("select * from `exam_completed_competitive` where `student_id` = "+student_id);
          let total_scholastic_completed = await db.query("select * from `exam_completed` where `student_id` = "+student_id +" group by subject_id");
          let total_amount_paid_sch = 0;
          let total_amount_paid_com = 0;
          let total_amount_paid_sch_completed = 0;
          let total_amount_paid_com_completed = 0;
          let sch_completed_sujects = [];
          let com_completed_last_set = 0;
          total_scholastic_completed.forEach(element=>{
            sch_completed_sujects.push(element.subject_id);
          })

          total_competitive_completed.forEach(element=>{
            com_completed_last_set = element.exam_set_counter;
          })
          db.query("select * from `purchased_subscribtions` where `student_id` = "+student_id+" and is_active = 1")
              .then((result,err)=>{
                  let scholatic_details = [];
          let competive_details = [];
                      let counter1 = 0;
                      let counter2 = 0;
                  result.forEach(element=>{
                      let subscription_details = [];
                      subscription_details = JSON.parse(element.subscription_details);
                      
                          subscription_details.forEach(element_inner=>{
                           
                            //total_sch_com_count += element_inner.no_set + (element_inner.no_module * 3) + (element_inner.no_mock * 2);
                                  if(element_inner.category == 'COMPETITIVE'){
                    
                                    total_amount_paid_com_completed += parseFloat(element_inner.cart_amount);
                                    if(element_inner.no_set == com_completed_last_set){
                                          total_amount_paid_com += parseFloat(element_inner.cart_amount);
                                    }
                                    //total_amount_paid_com += parseFloat(element_inner.cart_amount);
                                      competive_details[counter1] = element_inner.subscription_id;
                                      counter1++;
                                  }
                                  if(element_inner.category == 'SCHOLASTIC'){
                                    if(sch_completed_sujects.includes(element_inner.subject_id))
                                    {
                                      total_amount_paid_sch_completed += parseFloat(element_inner.cart_amount);
                                    }
                                    total_amount_paid_sch += parseFloat(element_inner.cart_amount);
                                      scholatic_details[counter2] = element_inner.subscription_id;
                                      counter2++;
                                  }
                          })
                  })
          let scholatic_details_count = Math.round((total_amount_paid_sch/total_purchase_price_sch)*100);
          let competive_details_count = Math.round((total_amount_paid_com/total_purchase_price_com)*100);   
          let total_competitive_completed = 0;
          if(total_amount_paid_com > 0){
              total_competitive_completed = Math.round((total_amount_paid_com_completed/total_amount_paid_com)*100);     
          }
 
          let total_scholastic_completed = 0;
          if(total_amount_paid_sch > 0){
            total_scholastic_completed = Math.round((total_amount_paid_sch_completed/total_amount_paid_sch) * 100);     
        }
      
          subscribetion_details = {total_scholastic_master:100,
          total_competitive_master:100,scholatic_details_count:scholatic_details_count,competive_details_count:competive_details_count,
          total_scholastic_completed:total_scholastic_completed,total_competitive_completed:total_competitive_completed,is_subscribe:is_subscribe,
          total_competitive_completed_master:100,total_scholastic_completed_master:100};
          //console.log(subscribetion_details)
          resolve(subscribetion_details);
        })
       
        });
       
          message = "Logged in successfully";
          
          //user_details[0].is_subscribe = is_subscribe;

          
                

          delete user_details[0].password;
          delete user_details[0].is_deleted;
          delete user_details[0].status;
          if (exam_unique_id != '') {    
            promise1.then(async (subscribetion_details) => {
  
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////
              let user_id = userdata.id;
              let sch_allquestions = [];
  let sch_correct_ans = [];
  let total_sch_com_count = 0;
  let com_allquestions = [];
  let com_correct_ans = [];
  let sch_correct_ans_calcuation = [];
  let com_correct_ans_calcuation = [];
  let total_percentage_count = 0;
  let total_record_count = 0;
  ///////////////////////////////// SCH SECTION ////////////////////////////////////////////
  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = "+user_id+" and online_exam_question_answers.post_ans_status = 1 GROUP by exam_completed.exam_unique_id")
  .then(exam_sch=>{
    exam_sch.forEach(element=>{
      sch_correct_ans[element.exam_unique_id] = element.total_record;
    })
  })

  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = "+user_id+" GROUP by exam_completed.exam_unique_id")
  .then(exam_sch=>{
    exam_sch.forEach(element=>{
      sch_allquestions[element.exam_unique_id] = element.total_record;
    })
  })
  for (var key in sch_allquestions) {
    if(parseInt(sch_correct_ans[key]) > 0){
    sch_correct_ans_calcuation[key] = (sch_correct_ans[key]/sch_allquestions[key]);
    }
    else{
      sch_correct_ans_calcuation[key] = 0;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////// COM SECTION ///////////////////////////////////////////////////////////////
await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = "+user_id+" and online_exam_question_answers_competitive.post_ans_status = 1 GROUP by online_exam_question_answers_competitive.exam_unique_id")
  .then(exam_com=>{
    exam_com.forEach(element=>{
      com_correct_ans[element.exam_unique_id] = element.total_record;
    })
  })

  await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.exam_unique_id")
  .then(exam_com=>{
    exam_com.forEach(element=>{
      com_allquestions[element.exam_unique_id] = element.total_record;
    })
  })
  for (var key in com_allquestions) {
    if(parseInt(com_correct_ans[key]) > 0){
    com_correct_ans_calcuation[key] = (com_correct_ans[key]/com_allquestions[key]);
    }
    else{
      com_correct_ans_calcuation[key] = 0;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  for (var key in com_correct_ans_calcuation) {
    total_percentage_count += com_correct_ans_calcuation[key];
    total_record_count++;
  }

  for (var key in sch_correct_ans_calcuation) {
   // console.log(sch_correct_ans_calcuation[key]);
    total_percentage_count += sch_correct_ans_calcuation[key];
    total_record_count++;
  } 
    
    let performance_overall = (((total_percentage_count)/total_record_count)*100).toFixed(2);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
          
  //////////////////////////////////// COM PURCHASED STATUS //////////////////////////////////////////////////

  let performance_details_ary_com = {};
  
  //performance_details_ary['scholastic'] = [];
  let total_competititve_weightage = 0;
  let total_set_completed_cometitive = 0;
  let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where `exam_completed_competitive`.`student_id` = "+user_id;
let allow_setno_for_calculation_ntse_completed = 0;
let allow_setno_for_calculation_nstse_completed = 0;
  await db.query(query_data)
  .then(result=>{
    result.forEach(Element=>{
      if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
      {
        let total_question = 0;
        if(performance_details_ary_com[Element.exam_type] == null)
        {
          performance_details_ary_com[Element.exam_type] = {};
        }
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter] = {};
        }
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] = 0;
        }
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] = 0;
        }
        allow_setno_for_calculation_ntse_completed = Element.exam_set_counter;
      }else if(Element.exam_type =='NSTSE'){
        allow_setno_for_calculation_nstse_completed = Element.exam_set_counter;

        if(performance_details_ary_com[Element.exam_type] == null)
        {
          performance_details_ary_com[Element.exam_type] = {};
        }
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter] = {};
        }
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] = 0;
        }
        performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] = performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['total'] + 1;
        if(performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] == null)
        {
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] = 0;
        }
        if(Element.post_ans_status == 1){
          performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] = performance_details_ary_com[Element.exam_type]["set "+Element.exam_set_counter]['correct'] + 1;
        }
      }
      if(allow_setno_for_calculation_ntse_completed > 0 && Element.exam_type == 'NTSE'){
        performance_details_ary_com[Element.exam_type]["set "+allow_setno_for_calculation_ntse_completed]['total'] = performance_details_ary_com[Element.exam_type]["set "+allow_setno_for_calculation_ntse_completed]['total'] + 1;
      }
    })
    result.forEach(Element=>{
      for(let i = 1;i<=allow_setno_for_calculation_ntse_completed;i++){
          if(Element.post_ans_status == 1 && i == Element.exam_set_counter &&  Element.exam_type == 'NTSE'){
            
            performance_details_ary_com['NTSE']["set "+i]['correct'] = performance_details_ary_com['NTSE']["set "+i]['correct'] + 1;
            }
        }
      })
    
  })
let performance_details_ary_com_final = [];

for (var key in performance_details_ary_com) {
  for (var key2 in performance_details_ary_com[key]) {
    
    let full_data = {};

    full_data['score'] = performance_details_ary_com[key][key2]['correct'];
    full_data['total'] = performance_details_ary_com[key][key2]['total'];
    full_data['subject'] = key;
    full_data['percentage'] = ((performance_details_ary_com[key][key2]['correct']/performance_details_ary_com[key][key2]['total'])*100).toFixed(2);

    performance_details_ary_com_final.push(full_data);
  }
}
  total_set_completed_cometitive = allow_setno_for_calculation_ntse_completed + allow_setno_for_calculation_nstse_completed;


  let set_weightage = 1;
  let library_weightage_ntse = 30;
  let library_weightage_nstse = 8;
  let total_set_purchased_competitve = 0;
  let total_competitve_purchased_weightage = 0;
  
  let competitve_set_master = [];
  await db.query("select exam_type_id,max(set_count) as total_set from `exam_competitive_subscribtion_master` GROUP by exam_type_id")
      .then(result_set=>{
        result_set.forEach(element=>{
          if(competitve_set_master[element.exam_type_id] == null)
          {
            competitve_set_master[element.exam_type_id] = "";
          }
          competitve_set_master[element.exam_type_id] = element.total_set;
        })
      })

  await db.query("select * from `exam_type` where exam_category_id = 2 and status = 1 and is_deleted = 0")
  .then(result=>{
    result.forEach(async element=>{
      
      total_competititve_weightage += competitve_set_master[element.id];
      })
      total_competititve_weightage += library_weightage_ntse+library_weightage_nstse;
    })
    
  await db.query("select * from `purchased_subscribtions_details` where `exam_category_id` = 2 and `student_id` = "+user_id)
  .then(result=>{
    result.forEach(element=>{
      total_competitve_purchased_weightage += parseInt(element.no_set) * set_weightage;
      total_set_purchased_competitve += parseInt(element.no_set);
      if(element.exam_type_id == 1)// NTSE
      {
          if(element.has_library == 1 || element.only_elibrary == 1)
          {
            total_competitve_purchased_weightage += library_weightage_ntse;
          }
      }
      if(element.exam_type_id == 2)// NSTSE
      {
          if(element.has_library == 1 || element.only_elibrary == 1)
          {
            total_competitve_purchased_weightage += library_weightage_nstse;
          }
      }
    })
  })  
  
  ///////////////////////////////////////////COM PURCHASED STATUS END ////////////////////////////////////////////////////////////////
  ////////////////////////////////////////// SCH STATUS CAL START //////////////////////////////////////////////////////////////
 let mock_value = 5.7 * 2;
 let module_value = 3 * 3;
 let elibrary_rate = 3;
 let total_scholastic_weightage = 0;
  let schlastic_chapters_subjectwise = [];
  let allsubjects_list = "";
  let allsubjects_list_ary_calculation = [];
  let only_group_subjects = "";
  await db.query("SELECT subjects.id,subjects.group_subjects,subjects.group_exist FROM `exam_scholastic_subscribtion_master` left join subjects on subjects.id = exam_scholastic_subscribtion_master.subject_id WHERE exam_scholastic_subscribtion_master.board_id = "+userdata.board+" AND exam_scholastic_subscribtion_master.class = "+userdata.class+" AND exam_scholastic_subscribtion_master.status = 1 AND exam_scholastic_subscribtion_master.is_deleted = 0").then(result=>{
      result.forEach(element=>{
        
        if(element.group_exist == 2){
          allsubjects_list +=element.id+",";
        }
          else if(element.group_exist == 3){
            only_group_subjects +=element.group_subjects+","; 
        }else{
          allsubjects_list +=element.group_subjects+",";
          if(allsubjects_list_ary_calculation[element.id] == null){
            allsubjects_list_ary_calculation[element.id] = "";
          }
          allsubjects_list_ary_calculation[element.id] = element.group_subjects;
        }
      })
  })
  let allsubjects_list_ary = [];
  allsubjects_list_ary = allsubjects_list.split(",");
//console.log(allsubjects_list_ary_calculation);
let uniqueArray = [];
allsubjects_list_ary.forEach(function(item) {
  if(uniqueArray.indexOf(item) < 0) {
    uniqueArray.push(item);
  }
});
let unique_Array = [];
if(uniqueArray.length > 0){
uniqueArray.forEach(element=>{
  if(allsubjects_list_ary_calculation[element] != '' && allsubjects_list_ary_calculation[element] != undefined)
  {
    allsubjects_list += (allsubjects_list_ary_calculation[element]);
  }
})
}
allsubjects_list = allsubjects_list.slice(0,-1);

allsubjects_list_ary = allsubjects_list.split(",");
//console.log(allsubjects_list_ary_calculation);
uniqueArray = [];
allsubjects_list_ary.forEach(function(item) {
  if(uniqueArray.indexOf(item) < 0) {
    uniqueArray.push(item);
  }
});

let subject_lists = uniqueArray.join(",");


  await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = "+userdata.board+" and `standard` = "+userdata.class+" and branch_id IN ("+subject_lists+")")
  .then(result=>{
    if(result.length > 0)
    {
      result.forEach(element=>{
        if(schlastic_chapters_subjectwise[element.branch_id]== null){
          schlastic_chapters_subjectwise[element.branch_id] = [];
        }
        schlastic_chapters_subjectwise[element.branch_id].push(element.short_code);
      })
    }
  })

  if(schlastic_chapters_subjectwise.length > 0){
  schlastic_chapters_subjectwise.forEach(element=>{
    total_scholastic_weightage += (elibrary_rate * element.length);
  })
}

await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = "+userdata.board+" and `standard` = "+userdata.class+" and branch_id IN ("+only_group_subjects.slice(0,-1)+")")
  .then(result=>{
    if(result.length > 0)
    {
      result.forEach(element=>{
        if(schlastic_chapters_subjectwise[element.branch_id]== null){
          schlastic_chapters_subjectwise[element.branch_id] = [];
        }
        schlastic_chapters_subjectwise[element.branch_id].push(element.short_code);
      })
    }
  })

  if(schlastic_chapters_subjectwise.length > 0){
  schlastic_chapters_subjectwise.forEach(element=>{
    total_scholastic_weightage += (element.length * 2) + module_value + mock_value;
  })
}

let total_purchsed_chapters_count = 0;
let total_purchased_count_sch = 0;
let elibrary_sch_count_ch = 0;
let sch_subject_ary = [];
await db.query("select * from `subjects` where `is_deleted`= 0 and status = 1")
.then(result=>{
  result.forEach(element=>{
    if(sch_subject_ary[element.id] == null)
    {
      sch_subject_ary[element.id] = [];
    }
    sch_subject_ary[element.id].push(element);
  })
})


let chapters_count_subjects_ary = [];
await db.query("select branch_id,count(*) as total_chapter from `chapters` where `board_id` = "+userdata.board+" and `standard` = "+userdata.class+" and `is_deleted`= 0 and status = 1 group by branch_id")
.then(result=>{
  result.forEach(element=>{
    if(chapters_count_subjects_ary[element.branch_id] == null)
    {
      chapters_count_subjects_ary[element.branch_id] = [];
    }
    chapters_count_subjects_ary[element.branch_id].push(element.total_chapter);
  })
  
})
let unique_elibrary_list = [];
await db.query("select * from `purchased_subscribtions_details` where `exam_category_id` = 1 and `student_id` = "+user_id)
  .then(result=>{
    result.forEach(async element=>{
      let subject_id = element.subject_id;
       
        result_inner1 = sch_subject_ary[subject_id];
        if(element.no_module == 1){
          total_purchased_count_sch += module_value;
        }
        if(element.no_mock == 1){
          total_purchased_count_sch += mock_value;
        }
        if(element.has_library == 1 || element.only_elibrary == 1){
          //total_purchased_count_sch += mock_value;
        }

          if(result_inner1[0].group_exist == 3){
            let subject_lists_ary = result_inner1[0].group_subjects.split(",");
                subject_lists_ary.forEach(async element_inner1=>{

                          let result_inner2 = sch_subject_ary[element_inner1];
                          if(result_inner2[0].group_exist == 1){ ////////////////////////// ----------------1
                            let subject_lists_ary_inner1 = result_inner2[0].group_subjects.split(",");
  
                                subject_lists_ary_inner1.forEach(async element_inner2=>{ 
                                  
                                      let result_inner3 = sch_subject_ary[element_inner2];
                                      if(result_inner3[0].group_exist == 1){// -------------------------------- 2
                                        let subject_lists_ary_inner2 = result_inner3[0].group_subjects.split(",");
                                            subject_lists_ary_inner2.forEach(async element_inner3=>{
                                              
                                              let result_inner4 = sch_subject_ary[element_inner3];
                                               
                                            })
                                        }else{
                                          if(!unique_elibrary_list.includes(result_inner3[0].id)){
                                            unique_elibrary_list.push(result_inner3[0].id);
                                            }
                                          let set_no_ary = element.no_set.slice(1,-1).split(",");
                                          let set_no = (set_no_ary.length);
                                          total_purchsed_chapters_count += (parseInt(chapters_count_subjects_ary[result_inner3[0].id]) * set_no);
                                        }
                                    
                                })
                                
                          }
                        
                })
          }else if(result_inner1[0].group_exist == 1){ 
            let subject_lists_ary_inner1 = result_inner1[0].group_subjects.split(",");

                subject_lists_ary_inner1.forEach(async element_inner2=>{ 
                  
                      let result_inner3 = sch_subject_ary[element_inner2];
                      if(result_inner3[0].group_exist == 1){// -------------------------------- 1
                        let subject_lists_ary_inner2 = result_inner3[0].group_subjects.split(",");
                            subject_lists_ary_inner2.forEach(async element_inner3=>{
                              
                              let result_inner4 = sch_subject_ary[element_inner3];
                               
                            })
                        }else{
                          if(!unique_elibrary_list.includes(result_inner3[0].id)){
                          unique_elibrary_list.push(result_inner3[0].id);
                          }
                          let set_no_ary = element.no_set.slice(1,-1).split(",");
                          let set_no = (set_no_ary.length);
                          total_purchsed_chapters_count += (parseInt(chapters_count_subjects_ary[result_inner3[0].id]) * set_no);

                          //console.log(chapters_count_subjects_ary[result_inner3[0].id]);
                        }
                    
                })
                
          }
          else if(result_inner1[0].group_exist == 2){ 
                let set_no_ary = element.no_set.slice(1,-1).split(",");
                let set_no = (set_no_ary.length);
                
                if(!unique_elibrary_list.includes(result_inner1[0].id)){
                  unique_elibrary_list.push(result_inner1[0].id);
                }
                  total_purchsed_chapters_count += (parseInt(chapters_count_subjects_ary[result_inner1[0].id]) * set_no);
          }
      
    })
  })
  total_purchased_count_sch += total_purchsed_chapters_count;

  unique_elibrary_list.forEach(element=>{
    if(schlastic_chapters_subjectwise[element] != undefined){
      elibrary_sch_count_ch += schlastic_chapters_subjectwise[element].length;
    }
  })
  total_purchased_count_sch += elibrary_sch_count_ch * 3;

//console.log(total_purchased_count_sch);

  let exam_completed_sch = 0;
  await db.query("select branch_id,count(*) as total_test from `exam_completed` where `student_id` = "+user_id+" and exam_type = 1 group by branch_id")
  .then(result=>{
        result.forEach(element=>{
          if(schlastic_chapters_subjectwise[element.branch_id] != undefined){
            exam_completed_sch += parseInt(schlastic_chapters_subjectwise[element.branch_id].length) * element.total_test;
          }
        })
  })

  await db.query("select * from `exam_completed` where `student_id` = "+user_id+" and exam_type = 2")
  .then(result=>{    
          exam_completed_sch += parseInt(result.length) * 3;
        })

  await db.query("select * from `exam_completed` where `student_id` = "+user_id+" and exam_type = 3")
  .then(result=>{    
          exam_completed_sch += parseInt(result.length) * 5.7;
        })


    let performance_details_ary_sch_final = [];
    let performance_details_ary_sch = {};
    
    let exam_wise_sch_total_question = [];
    let exam_wise_sch_total_question_right = [];
    let query_data_sch = "select exam_completed.*,online_exam_question_answers.question_id,online_exam_question_answers.post_ans,online_exam_question_answers.post_ans_status,subjects.name as subject_name from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join subjects on subjects.id = exam_completed.subject_id where `exam_completed`.`student_id` = "+user_id;

  await db.query(query_data_sch)
  .then(result=>{
    result.forEach(element=>{
      if(exam_wise_sch_total_question[element.exam_unique_id] == null)
      {
        exam_wise_sch_total_question[element.exam_unique_id] = [];
        exam_wise_sch_total_question_right[element.exam_unique_id] = [];
      }
      exam_wise_sch_total_question[element.exam_unique_id].push(element.id);
      if(element.post_ans_status == 1){
        exam_wise_sch_total_question_right[element.exam_unique_id].push(element.id);
      }
      let exam_type_id = element.exam_type;
      let exam_type = "";
      if(exam_type_id == 1){
        exam_type = "Set";
      }
      else if(exam_type_id == 2){
        exam_type = "Module";
      }
      else if(exam_type_id == 3){
        exam_type = "Mock";
      }
      if(performance_details_ary_sch[element.subject_name] == null)
      {
        performance_details_ary_sch[element.subject_name] = [];
      }
      if(performance_details_ary_sch[element.subject_name][exam_type] == null)
      {
        performance_details_ary_sch[element.subject_name][exam_type] = [];
      }
      if(performance_details_ary_sch[element.subject_name][exam_type][element.exam_set_counter] == null)
      {
        performance_details_ary_sch[element.subject_name][exam_type][element.exam_set_counter] = [];
      }
      let percentage = ((exam_wise_sch_total_question_right[element.exam_unique_id].length/exam_wise_sch_total_question[element.exam_unique_id].length)*100).toFixed(2);
      let exam_type_name = exam_type+" "+element.exam_set_counter;
      let total_details = {"exam_unique_id":element.exam_unique_id,"total_record":exam_wise_sch_total_question[element.exam_unique_id].length,"correct_record":exam_wise_sch_total_question_right[element.exam_unique_id].length,"percentage":percentage,"subject":element.subject_name,"exam_type":exam_type_name};

      performance_details_ary_sch[element.subject_name][exam_type][element.exam_set_counter] = JSON.stringify(total_details);

    })
  })

  for(let key in performance_details_ary_sch){
      for(let key2 in performance_details_ary_sch[key]){
        for(let key3 in performance_details_ary_sch[key][key2]){
          performance_details_ary_sch_final.push(JSON.parse(performance_details_ary_sch[key][key2][key3]));
      }
    }
  }

  ////////////////////////////////////////// SCH STATUS CAL END //////////////////////////////////////////////////////////////

              let exam_details_sch = await db.query("SELECT * FROM `exam_completed` where `exam_completed`.`student_id` = "+user_details[0].id);
              
              let exam_details_com = await db.query("SELECT * FROM `exam_completed_competitive` where `exam_completed_competitive`.`student_id` = "+user_details[0].id);

              if(exam_details_sch.length > 0 || exam_details_com.length > 0){
                work_status = 3;
              }
              let competitive_overall = 0;
              
              if(is_subscribe_e_library > 0 && work_status == 3)
              {
                work_status = 4;
              }

              if(is_subscribe_e_library > 0 && work_status == 1){
                work_status = 2;
              }
              if(is_subscribe == 1 && work_status == 1)
              {
                work_status = 2;
              }

              //////////////////// Performance Score Card TABLE CALCUATION ///////////////////////////
              let total_percentage_calculation_value = 0;
              performance_details_ary_sch_final.forEach(element=>{
                total_percentage_calculation_value += element.percentage;
              })
              performance_details_ary_sch_final.forEach(element=>{
                total_percentage_calculation_value += element.percentage;
              })
              ////////////////////////////////////////////////////////////////////////////////////////////////
              user_details[0].is_subscribe = subscribetion_details.is_subscribe;
              user_details[0].is_subscribe_e_library = is_subscribe_e_library;
              delete subscribetion_details.is_subscribe;
              user_details[0].work_status = work_status;
              user_details[0].work_status_percentage = Math.ceil((work_status/5)*100);
              user_details[0].total_scholastic_master = subscribetion_details.total_scholastic_master;
              user_details[0].total_competitive_master = subscribetion_details.total_competitive_master;
              user_details[0].scholatic_details_purchase = ((total_purchased_count_sch/total_scholastic_weightage)*100).toFixed(2)=="NaN"?"0.00":((total_purchased_count_sch/total_scholastic_weightage)*100).toFixed(2);
              user_details[0].competive_details_purchase = (((total_competitve_purchased_weightage)/total_competititve_weightage)*100).toFixed(2)=="NaN"?"0.00":(((total_competitve_purchased_weightage)/total_competititve_weightage)*100).toFixed(2);
              user_details[0].total_scholastic_completed = ((exam_completed_sch/total_scholastic_weightage)*100).toFixed(2)=="NaN"?"0.00":((exam_completed_sch/total_scholastic_weightage)*100).toFixed(2);
              user_details[0].total_competitive_completed = (((total_set_completed_cometitive)/total_set_purchased_competitve)*100).toFixed(2)=="NaN"?"0.00":(((total_set_completed_cometitive)/total_set_purchased_competitve)*100).toFixed(2);

              
              user_details[0].total_competitive_completed_master = subscribetion_details.total_competitive_completed_master;
              user_details[0].total_scholastic_completed_master = subscribetion_details.total_scholastic_completed_master;
              if(performance_overall == undefined || performance_overall == null || performance_overall == "NaN"){
                performance_overall = 0;
              }
              user_details[0].scholatic_overall = performance_overall;
              user_details[0].competitive_overall = performance_overall;
              user_details[0].feedback_given = get_feedback_details.length; 

              user_details[0].performance_total_exam_count = performance_details_ary_sch_final.length + performance_details_ary_com_final.length;
              user_details[0].performance_total_percentage_count = performance_details_ary_sch_final.length + performance_details_ary_com_final.length;
              user_details[0].performance_details_comp = performance_details_ary_com_final;
              user_details[0].performance_details_sch = performance_details_ary_sch_final;
              
              response = {
                status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
                exam_unique_id: exam_unique_id
              }
             
              resolve(response);
            });
        }else{
          user_details[0].is_subscribe = 0;
              user_details[0].is_subscribe_e_library = 0;
              delete subscribetion_details.is_subscribe;
              user_details[0].work_status = 1;
              user_details[0].work_status_percentage = Math.ceil((work_status/5)*100);
              user_details[0].total_scholastic_master = subscribetion_details.total_scholastic_master;
              user_details[0].total_competitive_master = subscribetion_details.total_competitive_master;
              user_details[0].scholatic_details_purchase = 0;
              user_details[0].competive_details_purchase = 0;
              user_details[0].total_scholastic_completed = "0.00";
              user_details[0].total_competitive_completed = "0.00";
              user_details[0].total_competitive_completed_master = 0;
              user_details[0].total_scholastic_completed_master = 0;
              user_details[0].scholatic_overall = 0;
              user_details[0].competitive_overall = 0;
              user_details[0].feedback_given = get_feedback_details.length; 
              user_details[0].performance_details_comp = {};
              user_details[0].performance_details_sch = {};
          response = {
            status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
            exam_unique_id: exam_unique_id, is_subscribe: is_subscribe,is_subscribe_e_library:is_subscribe_e_library
          }
          db.query("update `students` set `device_token` = '"+data.devicetoken+"' where `id` = "+user_details[0].id)
          resolve(response);
        }
         
         

        }
    
    }
  }).then((value) => {
    return value;
  }).catch((err) => {
    return err;
  })
  // await db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`) VALUES ("+user_details[0].id+",1,'"+token+"')")

  return promise_result;
}


module.exports = {
  create,
  signin,
  verify_mobile_otp,
  verify_email_otp,
  logout,
  send_verification_otp,
  checkuserexist,
  check_duplicate,
  updateprofile_student,
  ovalallperformance_calculation,
  getdashboard_data
}