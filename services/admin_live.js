const db = require('./../db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getmac = require('getmac');
var macaddress = require('macaddress');
const nodemailer = require("nodemailer");
var request = require('request');
var http = require('http');
const multer = require("multer");
require('dotenv').config();
//var urlencode = require('urlencode');
var CryptoJS = require("crypto-js");
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
      message = "Sorry! your record already exist.";
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      bcrypt.hash(data.password, 10, async (err, hash) => {
        if (err) {
          message = "Something went wrong, please try again later.";
        }
        else {

          const result = await db.query(
            `INSERT INTO students (fname, lname, dob, email,password, gender, address, pincode, mobile, 
              standard, board,school_name, school_address,mobile_otp_verify,email_otp_verify) 
            VALUES ('`+ data.fname + `','` + data.lname + `','` + data.dob + `','` + data.email + `', '` + hash + `', '` + data.gender + `','` + data.address + `',
            '`+ data.pincode + `','` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.school_name.replace(/['‘’"“”]/g,'') + `','` + data.school_address.replace(/['‘’"“”]/g,'') + `'
            ,'1','1')`);

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
  let allowed_student_ids = [73,74,75,76];// For LIVE USER 
  const user_details = await db.query(`SELECT students.*,classes.id as class_id, boards.short_code as board_code,boards.name as board_name FROM 
  students left join  classes on classes.class_no = students.standard left join  boards on students.board = boards.id WHERE students.is_deleted = 0 and email = '` + data.email + `' limit 0,1`);
  let response = {};
  let token = "";
  let status = 410;
  let demo_exam_submit = 0;
  let subscribetion_details ={};
  let exam_unique_id = "";
  let total_sch_com_count = 0;
  let live_access = 0;
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
            .then((resutlt) => {
              db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`) VALUES (" + user_details[0].id + ",1,'" + token + "')")
            });
            
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
                        
                            total_sch_com_count += element_inner.no_set + (element_inner.no_module * 3) + (element_inner.no_mock * 2);
                                  if(element_inner.category == 'COMPETITIVE'){
                                    total_amount_paid_com_completed += parseFloat(element_inner.cart_amount);
                                    if(element_inner.no_set == com_completed_last_set){
                                          total_amount_paid_com += parseFloat(element_inner.cart_amount);
                                    }
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
                                      //if()
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
          user_details[0].token = token;
          //user_details[0].is_subscribe = is_subscribe;

          

          delete user_details[0].password;
          delete user_details[0].is_deleted;
          delete user_details[0].status;
          if (exam_unique_id != '') {    
            promise1.then(async (subscribetion_details) => {
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////
              let sch_allquestions = [];
              let sch_correct_ans = [];

              let com_allquestions = [];
              let com_correct_ans = [];
              let sch_correct_ans_calcuation = 0;
              let com_correct_ans_calcuation = 0;
              let sch_total_qus = 0;
              let com_total_qus = 0;
              await db.query("select exam_unique_id,count(*) as total_record from `online_exam_question_answers` where `student_id` = "+user_details[0].id+" group by exam_unique_id")
              .then(exam_sch=>{
                exam_sch.forEach(element=>{
                  sch_allquestions[element.exam_unique_id] = element.total_record;
                })
              })
              await db.query("select exam_unique_id,count(*) as total_record from `online_exam_question_answers` where `post_ans_status` = 1 and `student_id` = "+user_details[0].id+" group by exam_unique_id")
              .then(exam_sch=>{
                exam_sch.forEach(element=>{
                  sch_correct_ans[element.exam_unique_id] = element.total_record;
                  sch_total_qus++;
                })
              })
              
             if(sch_total_qus > 0){
                for (let key in sch_correct_ans) {
                    sch_correct_ans_calcuation += sch_correct_ans[key]/sch_allquestions[key];
                  }
                }
  
            
                await db.query("select exam_unique_id,count(*) as total_record from `online_exam_question_answers_competitive` where `student_id` = "+user_details[0].id+" group by exam_unique_id")
              .then(exam_com=>{
                exam_com.forEach(element=>{
                  com_allquestions[element.exam_unique_id] = element.total_record;
                })
              })
              await db.query("select exam_unique_id,count(*) as total_record from `online_exam_question_answers_competitive` where `post_ans_status` = 1 and `student_id` = "+user_details[0].id+" group by exam_unique_id")
              .then(exam_com=>{
                exam_com.forEach(element=>{
                  com_correct_ans[element.exam_unique_id] = element.total_record;
                  com_total_qus++;
                })
              })

              if(com_total_qus > 0){
                for (let key in com_correct_ans) {
                    com_correct_ans_calcuation += com_correct_ans[key]/com_allquestions[key];
                  }
                }
                
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////
        

              let exam_details = await db.query("SELECT * FROM `exam_completed` left join `exam_completed_competitive` on `exam_completed`.`student_id` = `exam_completed_competitive`.`student_id` where (`exam_completed`.`student_id` = "+user_details[0].id+" or `exam_completed_competitive`.`student_id` = "+user_details[0].id+")");
              
              if(exam_details.length > 0){
                work_status = 3;
              }
              let competitive_overall = 0;
              if(com_correct_ans > 0)
              {
                competitive_overall = ((com_correct_ans/com_allquestions));
              }
              let scholatic_overall = 0;
              if(sch_correct_ans > 0){
                scholatic_overall = ((sch_correct_ans/sch_allquestions));
              }
              if(is_subscribe_e_library > 0 && work_status == 3)
              {
                work_status = 4;
              }

              let performance_overall = parseFloat((((com_correct_ans_calcuation + sch_correct_ans_calcuation)/total_sch_com_count)*100).toFixed(2));
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
              let status = 200;
              if(!allowed_student_ids.includes(user_details[0].id))
                  {
                    live_access = 1;
                    status = 220;
                  }
              user_details[0].live_access = live_access;
              response = {
                status: status, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
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
              user_details[0].total_scholastic_completed = 0;
              user_details[0].total_competitive_completed = 0;
              user_details[0].total_competitive_completed_master = 0;
              user_details[0].total_scholastic_completed_master = 0;
              user_details[0].scholatic_overall = 0;
              user_details[0].competitive_overall = 0;
              user_details[0].feedback_given = get_feedback_details.length; 
              let status = 200;
              if(allowed_student_ids.includes(user_details[0].id))
                  {
                    live_access = 1;
                    status = 220;
                  }
              user_details[0].live_access = live_access;
          response = {
            status: status, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
            exam_unique_id: exam_unique_id, is_subscribe: is_subscribe,is_subscribe_e_library:is_subscribe_e_library
          }
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
    message = "Sorry! your record already exist.";
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


module.exports = {
  create,
  signin,
  verify_mobile_otp,
  verify_email_otp,
  logout,
  send_verification_otp,
  checkuserexist,
  check_duplicate,
  updateprofile_student
}