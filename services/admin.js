const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getmac = require('getmac');
const academic_session = require('../services/academic_sessions.js');
const IP = require('ip');
const nodemailer = require("nodemailer");
var request = require('request');
var http = require('http');
const multer = require("multer");
//var urlencode = require('urlencode');
var CryptoJS = require("crypto-js");
const questions = require('./questions.js');
require('dotenv').config();

const crypto = require("../helper/common.js");


async function check_duplicate(data) {
  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num,mobile_otp_verify,email_otp_verify\
  FROM students WHERE is_deleted = 0 and id != '`+ data.student_id + `' and (email = '` + data.email + `' or mobile = '` + data.mobile + `')`);

  let result = await new Promise((resolve, reject) => {
    if (check_duplicate[0].record_num > 0) {
      message = "Sorry! record already exist.";
      response = { status: 410, msg: message }
      reject(response);
    } else {
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
          if (data.device_token != '' && data.device_token != undefined) {
            registration_from = 2;
          } else {
            data.device_token = "";
          }
          const ipAddress = "0.0.0.0";

          /*console.log( `INSERT INTO students (fname, lname, dob, email,password, gender, address, pincode, mobile, 
            standard, board,school_name, school_address,mobile_otp_verify,email_otp_verify,ip_address,device_token,registration_from) 
          VALUES ('`+ data.fname + `','` + data.lname + `','` + data.dob + `','` + data.email + `', '` + hash + `', '` + data.gender + `','` + data.address + `',
          '`+ data.pincode + `','` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.school_name.replace(/['‘’"“”]/g,'') + `','` + data.school_address.replace(/['‘’"“”]/g,'') + `'
          ,'1','1','`+ipAddress+`','`+data.device_token+`','`+registration_from+`')`);
*/
          const result = await db.query(
            `INSERT INTO students (fname, lname, dob, email,password, gender, address, pincode, mobile, 
              standard, board,academic_year,school_name, school_address,mobile_otp_verify,email_otp_verify,ip_address,device_token,registration_from) 
            VALUES ('`+ data.fname + `','` + data.lname + `','` + data.dob + `','` + data.email + `', '` + hash + `', '` + data.gender.toLowerCase() + `','` + data.address + `',
            '`+ data.pincode + `','` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.academic_year + `','` + data.school_name.replace(/['‘’"“”]/g, '') + `','` + data.school_address.replace(/['‘’"“”]/g, '') + `'
            ,'1','1','`+ ipAddress + `','` + data.device_token + `','` + registration_from + `')`);

          if (result.affectedRows) {
            let board_name = "";
            await db.query("select * from `boards` where `id` =" + data.board.substring(0, 1))
              .then(result => {
                board_name = result[0].name;
              })
            await db.query("select * from `school_master` where `school_name` = '" + data.school_name.replace(/['‘’"“”]/g, '') + "' and `board` = '" + board_name + "'")
              .then(result => {
                if (result.length == 0) {
                  db.query("INSERT INTO `school_master`(`board`, `school_name`, `school_address`) VALUES (\
                '"+ board_name + "','" + data.school_name.replace(/['‘’"“”]/g, '') + "','" + data.school_address.replace(/['‘’"“”]/g, '') + "')")
                }
              })
            await db.query("delete from `interm_students` where `email` ='" + data.email + "'");

            status = 200;
            message = 'Student registered successfully done';
            let student_name = data.fname + ' ' + data.lname;
            let smsbody = config.registersuccessfull.body.replace("#field1#", student_name);
            smsbody = smsbody.replace("#field2#", process.env.PORTALURL);

            let smsdata = { phonenumber: data.mobile, body: encodeURI(smsbody) }
            helper.sendsms(smsdata);

            let reqest_data = { email: data.email, subject: config.studentregistrationmail.subject, body: config.studentregistrationmail.body.replace("#name#", data.fname) }
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
async function createStudent(data) {
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
      let password = crypto.generatePassword(8);
     
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          message = "Something went wrong, please try again later.";
        }
        else {
          let registration_from = 1;
          if (data.device_token != '' && data.device_token != undefined) {
            registration_from = 2;
          } else {
            data.device_token = "";
          }
          const ipAddress = "0.0.0.0";        
          const result = await db.query(
            `INSERT INTO students (fname, lname, email,password, mobile,standard, board,academic_year, mobile_otp_verify,email_otp_verify,ip_address,device_token,registration_from) 
            VALUES ('`+ data.fname + `','` + data.lname + `','` + data.email + `', '` + hash + `', '` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.academic_year + `','1','1','` + ipAddress + `','` + data.device_token + `','` + registration_from + `')`);

          if (result.affectedRows) {
            let board_name = "";
            await db.query("select * from `boards` where `id` =" + data.board.substring(0, 1))
              .then(result => {
                board_name = result[0].name;
              })

            await db.query("delete from `interm_students` where `email` ='" + data.email + "'");

            status = 200;
            message = 'Student registered successfully done';
            let student_name = data.fname + ' ' + data.lname;
            let smsbody = config.registersuccessfull.body.replace("#field1#", student_name);
            smsbody = smsbody.replace("#field2#", "lms.clvdev.in");

            let smsdata = { phonenumber: data.mobile, body: encodeURI(smsbody) }
            helper.sendsms(smsdata);

            let reqest_data = { email: data.email, subject: config.studentregistrationmail.subject, body: config.studentregistrationmail.body.replace("#name#", data.fname).replace("#USERID#", data.email).replace("#PASSWORD#", password) }
            helper.sendmail(reqest_data);
            response = { status: status, msg: message, studentid: result.insertId }
          }

          resolve(response);
        }
      });
    }

  }).then((value) => {
    return value;
    //
  }).catch((err) => {
    return err;
    //console.error(err);
  });

  return result;
}
async function addFirstSignupData(student_id, exam_type) {
  let response = {};
  const checkIfPresent = await db.query(`SELECT * FROM guest_demo_exam_signup_data WHERE student_id='${student_id}'`);
  if (checkIfPresent.length > 0) {
    const result = await db.query(`UPDATE guest_demo_exam_signup_data SET is_deleted=1 WHERE student_id='${student_id}'`);
    response = { status: 200, msg: 'Data updated successfully!', data: checkIfPresent }
  } else {
    const result = await db.query(`INSERT INTO guest_demo_exam_signup_data (student_id,exam_type) VALUES ('${student_id}','${exam_type}')`);
    response = { status: 200, msg: 'Data inserted successfully!', data: result }
  }
  return response;

}
async function signin(data) {
  let demoquestionsData = "";
  let demoquestionscount = {};
  let exam = {};
  const user_details = await db.query(`SELECT students.*,classes.id as class_id, boards.short_code as board_code,boards.name as board_name,(SELECT case when count(*)>0 then 1 else 0 end FROM guest_demo_exam_signup_data gde WHERE gde.student_id=students.id AND gde.is_deleted=0)isFirstLoginAfterDemoExam FROM students left join  classes on classes.class_no = students.standard left join  boards on students.board = boards.id WHERE students.is_deleted = 0 and email = '` + data.email + `' limit 0,1`);


  if (user_details[0] !== null && user_details[0] !== undefined) {
    if (user_details[0].isFirstLoginAfterDemoExam == 1) {
      await db.query(`UPDATE guest_demo_exam_signup_data SET is_deleted=1 WHERE student_id='${user_details[0].id}'`);
      exam.student_id = user_details[0].id;
      demoquestionsData = await questions.getdemoexamgivencount(exam);
      demoquestionscount =demoquestionsData.demoquestionscount;
    }
  }

  
  let response = {};
  let token = "";
  let status = 410;
  let sch_correct_ans_calcuation = 0;
  let com_correct_ans_calcuation = 0;
  let demo_exam_submit = 0;
  let subscribetion_details = {};
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
      message = 'Login Error: Invalid username or password.Please Try Again.';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      // check password
      bcrypt.compare(data.password, user_details[0].password, async (bErr, bResult) => {
        // wrong password
        if (bResult == false) {
          message = 'Login Error: Invalid username or password.Please Try Again.';
          response = { status: status, msg: message, error: bErr }
          reject(response);
        }
        if (bResult == true) {
          token = jwt.sign({ id: user_details[0].id, class_id: user_details[0].class_id, class: user_details[0].standard, board: user_details[0].board, fname: user_details[0].fname }, config.jwttoken, { expiresIn: '24h' });
          //console.log(token)
          await db.query("delete from logindevices where `usertype`= 1 and `userid` =" + user_details[0].id)
            .then((resutlt) => {
              let login_from = 1;
              if (data.devicetoken != undefined && data.devicetoken != "") {
                login_from = 2;
              }
              const ipAddress = "0.0.0.0";
              db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`,`login_from`,`user_ip_address`,`login_type`) VALUES (" + user_details[0].id + ",1,'" + token + "'," + login_from + ",'" + ipAddress + "',2)")

            });

          demo_exam_submit = user_details[0].demo_exam_status;
          exam_unique_id = user_details[0].exam_unique_id;

          const promise1 = new Promise(async (resolve, reject) => {
            if (exam_unique_id != '') {
              db.query("select * from `purchased_subscribtions` where `is_active` = 1 and `student_id` = " + user_details[0].id)
                .then(result_data => {
                  result_data.forEach(Element => {
                    var subscription_details = JSON.parse(Element.subscription_details);
                    let e_subscribe_sch = 0;
                    let e_subscribe_com = 0;
                    subscription_details.forEach(Element_inner => {

                      if (Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0) {

                        if (is_subscribe == 2 || is_subscribe == 3) {
                          is_subscribe = 3;
                          work_status = 2;
                        }
                        else {
                          is_subscribe = 1;
                        }
                      }
                      if (Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0) {

                        if (is_subscribe == 1 || is_subscribe == 3) {
                          is_subscribe = 3;
                          work_status = 2;
                        }
                        else {
                          is_subscribe = 2;
                        }
                      }
                      //////////////////////// E Library Section ///////////////////
                      if (Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1)) {
                        is_subscribe_e_library = 1;
                        e_subscribe_sch = 1;
                      }
                      if (Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1)) {
                        is_subscribe_e_library = 2;
                        e_subscribe_com = 1;
                      }
                      if (e_subscribe_sch == 1 && e_subscribe_com == 1) {
                        is_subscribe_e_library = 3;
                      }
                    })

                  })

                })
            }
            get_feedback_details = await db.query("select * from `feedback_rating` where `student_id` = " + user_details[0].id);
            /////////////////////////////////////////////////////////////////////////
            let student_id = user_details[0].id; // Student ID from 
            let standard = user_details[0].standard;
            let board = user_details[0].board;

            let total_competitive_master = await db.query("select * from `exam_competitive_subscribtion_master` where `status` = 1 and `is_deleted`= 0 and (`class` = " + standard + " or `class`= 0)");
            let total_scholastic_master = await db.query("select * from `exam_scholastic_subscribtion_master` left join classes on classes.id = exam_scholastic_subscribtion_master.class where \
          `exam_scholastic_subscribtion_master`.`status` = 1 and `exam_scholastic_subscribtion_master`.`is_deleted`= 0 and `classes`.`class_no` = "+ standard + " and `exam_scholastic_subscribtion_master`.`board_id`=" + board);

            //////////// Claculate Total Purchased amount Scholastic //////////
            let total_purchase_price_sch = 0;
            if (total_scholastic_master.length > 0) {
              total_scholastic_master.forEach(element => {
                let package_details_ary = JSON.parse(element.package_details);
                let hightest_value = parseFloat(package_details_ary[0].price);

                package_details_ary.forEach(element_inner => {
                  if (parseFloat(element_inner.price) > hightest_value) {
                    hightest_value = parseFloat(element_inner.price);
                  }
                })
                total_purchase_price_sch += hightest_value;
              })
            }
            //////////////////////////////////////////////////////////////////

            //////////// Claculate Total Purchased amount Competitive //////////
            let total_purchase_price_com = 0;
            if (total_competitive_master.length > 0) {
              let hightest_value = parseFloat(total_competitive_master[0].amount);
              total_competitive_master.forEach(element => {
                if (parseFloat(element.amount) > hightest_value) {
                  hightest_value = parseFloat(element.amount);
                }

                total_purchase_price_com += hightest_value;
              })
            }
            //////////////////////////////////////////////////////////////////
            let total_competitive_completed = await db.query("select * from `exam_completed_competitive` where `student_id` = " + student_id);
            let total_scholastic_completed = await db.query("select * from `exam_completed` where `student_id` = " + student_id + " group by subject_id");
            let total_amount_paid_sch = 0;
            let total_amount_paid_com = 0;
            let total_amount_paid_sch_completed = 0;
            let total_amount_paid_com_completed = 0;
            let sch_completed_sujects = [];
            let com_completed_last_set = 0;

            if (total_scholastic_completed.length > 0) {
              total_scholastic_completed.forEach(element => {
                sch_completed_sujects.push(element.subject_id);
              })
            }
            total_competitive_completed.forEach(element => {
              com_completed_last_set = element.exam_set_counter;
            })
            db.query("select * from `purchased_subscribtions` where `student_id` = " + student_id + " and is_active = 1")
              .then((result, err) => {
                let scholatic_details = [];
                let competive_details = [];
                let counter1 = 0;
                let counter2 = 0;
                if (result.length > 0) {
                  result.forEach(element => {
                    let subscription_details = [];
                    subscription_details = JSON.parse(element.subscription_details);

                    subscription_details.forEach(element_inner => {
                      //total_sch_com_count += element_inner.no_set + (element_inner.no_module * 3) + (element_inner.no_mock * 2);
                      if (element_inner.category == 'COMPETITIVE') {
                        total_amount_paid_com_completed += parseFloat(element_inner.cart_amount);
                        if (element_inner.no_set == com_completed_last_set) {
                          total_amount_paid_com += parseFloat(element_inner.cart_amount);
                        }
                        //total_amount_paid_com += parseFloat(element_inner.cart_amount);
                        competive_details[counter1] = element_inner.subscription_id;
                        counter1++;
                      }
                      if (element_inner.category == 'SCHOLASTIC') {
                        if (sch_completed_sujects.includes(element_inner.subject_id)) {
                          total_amount_paid_sch_completed += parseFloat(element_inner.cart_amount);
                        }
                        total_amount_paid_sch += parseFloat(element_inner.cart_amount);
                        scholatic_details[counter2] = element_inner.subscription_id;
                        counter2++;
                      }
                    })
                  })
                }
                let scholatic_details_count = Math.round((total_amount_paid_sch / total_purchase_price_sch) * 100);
                let competive_details_count = Math.round((total_amount_paid_com / total_purchase_price_com) * 100);
                let total_competitive_completed = 0;
                if (total_amount_paid_com > 0) {
                  total_competitive_completed = Math.round((total_amount_paid_com_completed / total_amount_paid_com) * 100);
                }

                let total_scholastic_completed = 0;
                if (total_amount_paid_sch > 0) {
                  total_scholastic_completed = Math.round((total_amount_paid_sch_completed / total_amount_paid_sch) * 100);
                }

                subscribetion_details = {
                  total_scholastic_master: 100,
                  total_competitive_master: 100, scholatic_details_count: scholatic_details_count, competive_details_count: competive_details_count,
                  total_scholastic_completed: total_scholastic_completed, total_competitive_completed: total_competitive_completed, is_subscribe: is_subscribe,
                  total_competitive_completed_master: 100, total_scholastic_completed_master: 100
                };
                //console.log(subscribetion_details)
                resolve(subscribetion_details);
              })

          });

          message = "You've Logged in successfully. Welcome!";
          user_details[0].token = token;
          //user_details[0].is_subscribe = is_subscribe;




          delete user_details[0].password;
          delete user_details[0].is_deleted;
          delete user_details[0].status;
          if (exam_unique_id != '') {
            promise1.then(async (subscribetion_details) => {


              let exam_details_sch = await db.query("SELECT * FROM `exam_completed` where `exam_completed`.`student_id` = " + user_details[0].id);

              let exam_details_com = await db.query("SELECT * FROM `exam_completed_competitive` where `exam_completed_competitive`.`student_id` = " + user_details[0].id);

              if (exam_details_sch.length > 0 || exam_details_com.length > 0) {
                work_status = 3;
              }
              let competitive_overall = 0;

              let scholatic_overall = 0;

              if (is_subscribe_e_library > 0 && work_status == 3) {
                work_status = 4;
              }

              if (is_subscribe_e_library > 0 && work_status == 1) {
                work_status = 2;
              }
              let performance_overall = 0;
              user_details[0].is_subscribe = subscribetion_details.is_subscribe;
              user_details[0].is_subscribe_e_library = is_subscribe_e_library;
              delete subscribetion_details.is_subscribe;
              user_details[0].work_status = work_status;
              user_details[0].work_status_percentage = Math.ceil((work_status / 5) * 100);
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
              user_details[0].performance_details_comp = [];
              user_details[0].performance_details_sch = [];
              response = {
                status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
                exam_unique_id: exam_unique_id,demoquestionscount
              }
              if (data.devicetoken != undefined) {
                await db.query("update `students` set `device_token` = '" + data.devicetoken + "' where `id` = " + user_details[0].id)
              }
              resolve(response);
            });
          } else {
            user_details[0].is_subscribe = 0;
            user_details[0].is_subscribe_e_library = 0;
            delete subscribetion_details.is_subscribe;
            user_details[0].work_status = 1;
            user_details[0].work_status_percentage = Math.ceil((work_status / 5) * 100);
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
            user_details[0].performance_details_comp = [];
            user_details[0].performance_details_sch = [];
            response = {
              status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
              exam_unique_id: exam_unique_id, is_subscribe: is_subscribe, is_subscribe_e_library: is_subscribe_e_library, demoquestionscount
            }
            db.query("update `students` set `device_token` = '" + data.devicetoken + "' where `id` = " + user_details[0].id)
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
      message = 'Login Error: Invalid username or password.Please Try Again';
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
      message = 'Login Error: Invalid username or password.Please Try Again';
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

      let smsbody = config.registerotp.body.replace("#field1#", mobile_otp);
      smsbody = smsbody.replace("#field2#", '+916289581169');// For Crestest MOBILE NO

      let smsdata = { phonenumber: student_mobile, body: encodeURI(smsbody) }
      helper.sendsms(smsdata);

    }

    if (student_email != '') {

      let mailbody = config.studentregistrationotp.body.replace("#OTP#", email_otp);
      let maildata = { email: data.email, subject: config.studentregistrationotp.subject, body: mailbody }
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

    response = { status: 200, msg: "Shared OTP with student", email_otp: email_otp_encrypt, mobile_otp: mobile_otp_encrypt, otp_valid_time: 5 }
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

      message = "Shared OTP with student";
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
    cb(null, "profilepic_" + Date.now() + ".zip")
  }
});

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
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

async function updateprofile_student(data) {
  const response = check_duplicate(data);
  let response_msg = "";
  if (true) {
    upload(req, res, async function (err) {
      if (err) {
        let response = { status: config.errorStatus, msg: err }
        res.json(response);
      }
      else {
        fs.chmod(req.file.path, 0o777, () => {
          console.log("Trying to write to file");
        });
        const upload_path = req.file.destination + "/" + req.file.filename;
        await db.query("UPDATE `students` SET `fname`='" + data.fname + "',`lname`='" + data.lname + "',`dob`='" + data.dob + "',\
    `email`='"+ data.email + "',`gender`='" + data.gender.toLowerCase() + "',`address`='" + data.address + "',\
    `pincode`='"+ data.pincode + "',`mobile`='" + data.mobile + "',`standard`='" + data.standard + "',`board`='" + data.board + "',`school_name`='" + data.school_name + "',\
    `school_address`='"+ data.school_address + "',profile_pic = '" + upload_path + "' WHERE id=" + data.student_id)
          .then(result => {
            if (result.affectedRows > 0) {
              response_msg = { status: 200, msg: "Student profile update successfully / Profile update successfully" }
            } else {
              response_msg = { status: 410, msg: "Update profile fail" }
            }
            return response_msg;
          })
      }
    });
  }
}

async function ovalallperformance_calculation(user_id) {
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
  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = " + user_id + " and online_exam_question_answers.post_ans_status = 1 GROUP by exam_completed.exam_unique_id")
    .then(exam_sch => {
      exam_sch.forEach(element => {
        sch_correct_ans[element.exam_unique_id] = element.total_record;
      })
    })

  await db.query("SELECT exam_completed.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed.student_id = " + user_id + " GROUP by exam_completed.exam_unique_id")
    .then(exam_sch => {
      exam_sch.forEach(element => {
        sch_allquestions[element.exam_unique_id] = element.total_record;
      })
    })
  for (var key in sch_allquestions) {
    if (parseInt(sch_correct_ans[key]) > 0) {
      sch_correct_ans_calcuation[key] = (sch_correct_ans[key] / sch_allquestions[key]);
    }
    else {
      sch_correct_ans_calcuation[key] = 0;
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////// COM SECTION ///////////////////////////////////////////////////////////////
  await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = " + user_id + " and online_exam_question_answers_competitive.post_ans_status = 1 GROUP by online_exam_question_answers_competitive.exam_unique_id")
    .then(exam_com => {
      exam_com.forEach(element => {
        com_correct_ans[element.exam_unique_id] = element.total_record;
      })
    })

  await db.query("SELECT exam_completed_competitive.exam_unique_id,question_pattern.short_code,questions.id,sum(question_pattern.marks) as total_record FROM `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id left join question_pattern on question_pattern.short_code = questions.question_type where exam_completed_competitive.student_id = " + user_id + " GROUP by online_exam_question_answers_competitive.exam_unique_id")
    .then(exam_com => {
      exam_com.forEach(element => {
        com_allquestions[element.exam_unique_id] = element.total_record;
      })
    })
  for (var key in com_allquestions) {
    if (parseInt(com_correct_ans[key]) > 0) {
      com_correct_ans_calcuation[key] = (com_correct_ans[key] / com_allquestions[key]);
    }
    else {
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



  let performance_overall = (((total_percentage_count) / total_record_count) * 100).toFixed(2);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //console.log(performance_overall);
  return { status: 200, msg: "Overall Performance", performance_overall: 0 };
}

async function getdashboard_data(userdata) {
  const user_details = await db.query(`SELECT students.*,classes.id as class_id, boards.short_code as board_code,boards.name as board_name FROM 
  students left join  classes on classes.class_no = students.standard left join  boards on students.board = boards.id WHERE students.is_deleted = 0 and students.id = '` + userdata.id + `' limit 0,1`);
  let response = {};
  let token = "";
  let status = 410;
  let demo_exam_submit = 0;
  let subscribetion_details = {};
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
      message = 'Login Error: Invalid username or password.Please Try Again';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      ////////////////////////////////// GET MASTER DETAILS  /////////////////////////////////////////
      let chapters_master = [];
      let group_master = [];
      await db.query("select * from `chapters` where `status` = 1 and `is_deleted` = 0 and `standard` = " + user_details[0].standard + " and `exam_category_id` = 1 and `board_id` = " + user_details[0].board + "")
        .then(result => {
          if (result) {
            result.forEach(element => {
              if (chapters_master[element.id] == null) {
                chapters_master[element.id] = "";
              }
              chapters_master[element.id] = element.sub_heading;
            })
          }
        })
      await db.query("select * from `subjects` where `status` = 1 and `is_deleted` = 0 and `exam_category_id` = 1 and `board_id` = " + user_details[0].board + " and group_exist != 2")
        .then(result => {
          if (result) {
            result.forEach(element => {
              if (chapters_master[element.id] == null) {
                group_master[element.id] = "";
              }
              group_master[element.id] = element.name;
            })
          }
        })

      /////////////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////// SUBJECT WISE CHAPTERS ////////////////////////////////////////
      let subjectwist_chapter_counts = [];
      let chapter_count_subscription_subjects = [];
      await db.query("select branch_id,count(*) as chapter_count from `chapters` where is_deleted = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = " + user_details[0].board + " and standard = " + user_details[0].standard + " group by branch_id").then(result => {
        if (result) {
          result.forEach(element => {
            if (subjectwist_chapter_counts[element.branch_id] == null) {
              subjectwist_chapter_counts[element.branch_id] = 0;
            }
            subjectwist_chapter_counts[element.branch_id] = element.chapter_count;
          })
        }
      })

      await db.query("select * from `subjects` where is_deleted = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = " + user_details[0].board).then(result => {
        if (result) {
          result.forEach(element => {
            if (chapter_count_subscription_subjects[element.id] == null) {
              chapter_count_subscription_subjects[element.id] = 0;
            }
            if (element.group_exist == 2 && subjectwist_chapter_counts[element.id] > 0) {
              chapter_count_subscription_subjects[element.id] = subjectwist_chapter_counts[element.id];
            }
            if (element.group_exist == 1) {
              let total_chapter = 0;
              element.group_subjects.split(",").forEach(element_inner => {
                if (subjectwist_chapter_counts[element_inner] != undefined) {
                  total_chapter += parseInt(subjectwist_chapter_counts[element_inner]);
                }

              })
              chapter_count_subscription_subjects[element.id] = total_chapter;
            }
            if (element.group_exist == 3) {
              let total_chapter = 0;
              element.group_subjects.split(",").forEach(element_inner => {
                if (subjectwist_chapter_counts[element_inner] != undefined) {
                  total_chapter += parseInt(subjectwist_chapter_counts[element_inner]);
                } else {
                  total_chapter += parseInt(chapter_count_subscription_subjects[element_inner]);
                }

              })
              chapter_count_subscription_subjects[element.id] = total_chapter;
            }
          })
        }
      })

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////
      if (true) {
        await db.query("select * from `logindevices` where userid = " + userdata.id)
          .then(result => {
            user_details[0].token = result[0].login_token;
          })
        demo_exam_submit = user_details[0].demo_exam_status;
        exam_unique_id = user_details[0].exam_unique_id;

        const promise1 = new Promise(async (resolve, reject) => {
          if (exam_unique_id != '') {
            db.query("select * from `purchased_subscribtions` where `is_active` = 1 and `student_id` = " + user_details[0].id)
              .then(result_data => {
                result_data.forEach(Element => {
                  var subscription_details = JSON.parse(Element.subscription_details);
                  let e_subscribe_sch = 0;
                  let e_subscribe_com = 0;
                  subscription_details.forEach(Element_inner => {

                    if (Element_inner.exam_category_id == 1 && Element_inner.only_elibrary == 0) {

                      if (is_subscribe == 2 || is_subscribe == 3) {
                        is_subscribe = 3;
                        work_status = 2;
                      }
                      else {
                        is_subscribe = 1;
                      }
                    }
                    if (Element_inner.exam_category_id == 2 && Element_inner.only_elibrary == 0) {

                      if (is_subscribe == 1 || is_subscribe == 3) {
                        is_subscribe = 3;
                        work_status = 2;
                      }
                      else {
                        is_subscribe = 2;
                      }
                    }
                    //////////////////////// E Library Section ///////////////////
                    if (Element_inner.exam_category_id == 1 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1)) {
                      is_subscribe_e_library = 1;
                      e_subscribe_sch = 1;
                    }
                    if (Element_inner.exam_category_id == 2 && (Element_inner.has_library == 1 || Element_inner.only_elibrary == 1)) {
                      is_subscribe_e_library = 2;
                      e_subscribe_com = 1;
                    }
                    if (e_subscribe_sch == 1 && e_subscribe_com == 1) {
                      is_subscribe_e_library = 3;
                    }
                  })

                })

              })
          }
          get_feedback_details = await db.query("select * from `feedback_rating` where `student_id` = " + user_details[0].id);
          /////////////////////////////////////////////////////////////////////////
          let student_id = user_details[0].id; // Student ID from 
          let standard = user_details[0].standard;
          let board = user_details[0].board;

          let total_competitive_master = await db.query("select * from `exam_competitive_subscribtion_master` where `status` = 1 and `is_deleted`= 0 and (`class` = " + standard + " or `class`= 0)");
          let total_scholastic_master = await db.query("select * from `exam_scholastic_subscribtion_master` left join classes on classes.id = exam_scholastic_subscribtion_master.class where \
          `exam_scholastic_subscribtion_master`.`status` = 1 and `exam_scholastic_subscribtion_master`.`is_deleted`= 0 and `classes`.`class_no` = "+ standard + " and `exam_scholastic_subscribtion_master`.`board_id`=" + board);

          //////////// Claculate Total Purchased amount Scholastic //////////
          let total_purchase_price_sch = 0;
          if (total_scholastic_master.length > 0) {
            total_scholastic_master.forEach(element => {
              let package_details_ary = JSON.parse(element.package_details);
              let hightest_value = parseFloat(package_details_ary[0].price);

              package_details_ary.forEach(element_inner => {
                if (parseFloat(element_inner.price) > hightest_value) {
                  hightest_value = parseFloat(element_inner.price);
                }
              })
              total_purchase_price_sch += hightest_value;
            })
          }
          //////////////////////////////////////////////////////////////////

          //////////// Claculate Total Purchased amount Competitive //////////
          let total_purchase_price_com = 0;
          if (total_competitive_master.length > 0) {
            let hightest_value = parseFloat(total_competitive_master[0].amount);
            total_competitive_master.forEach(element => {
              if (parseFloat(element.amount) > hightest_value) {
                hightest_value = parseFloat(element.amount);
              }

              total_purchase_price_com += hightest_value;
            })
          }
          //////////////////////////////////////////////////////////////////
          let total_competitive_completed = await db.query("select * from `exam_completed_competitive` where `student_id` = " + student_id);
          let total_scholastic_completed = await db.query("select * from `exam_completed` where `student_id` = " + student_id + " group by subject_id");
          let total_amount_paid_sch = 0;
          let total_amount_paid_com = 0;
          let total_amount_paid_sch_completed = 0;
          let total_amount_paid_com_completed = 0;
          let sch_completed_sujects = [];
          let com_completed_last_set = 0;
          total_scholastic_completed.forEach(element => {
            sch_completed_sujects.push(element.subject_id);
          })

          total_competitive_completed.forEach(element => {
            com_completed_last_set = element.exam_set_counter;
          })
          db.query("select * from `purchased_subscribtions` where `student_id` = " + student_id + " and is_active = 1")
            .then((result, err) => {
              let scholatic_details = [];
              let competive_details = [];
              let counter1 = 0;
              let counter2 = 0;
              result.forEach(element => {
                let subscription_details = [];
                subscription_details = JSON.parse(element.subscription_details);

                subscription_details.forEach(element_inner => {

                  //total_sch_com_count += element_inner.no_set + (element_inner.no_module * 3) + (element_inner.no_mock * 2);
                  if (element_inner.category == 'COMPETITIVE') {

                    total_amount_paid_com_completed += parseFloat(element_inner.cart_amount);
                    if (element_inner.no_set == com_completed_last_set) {
                      total_amount_paid_com += parseFloat(element_inner.cart_amount);
                    }
                    //total_amount_paid_com += parseFloat(element_inner.cart_amount);
                    competive_details[counter1] = element_inner.subscription_id;
                    counter1++;
                  }
                  if (element_inner.category == 'SCHOLASTIC') {
                    if (sch_completed_sujects.includes(element_inner.subject_id)) {
                      total_amount_paid_sch_completed += parseFloat(element_inner.cart_amount);
                    }
                    total_amount_paid_sch += parseFloat(element_inner.cart_amount);
                    scholatic_details[counter2] = element_inner.subscription_id;
                    counter2++;
                  }
                })
              })
              let scholatic_details_count = Math.round((total_amount_paid_sch / total_purchase_price_sch) * 100);
              let competive_details_count = Math.round((total_amount_paid_com / total_purchase_price_com) * 100);
              let total_competitive_completed = 0;
              if (total_amount_paid_com > 0) {
                total_competitive_completed = Math.round((total_amount_paid_com_completed / total_amount_paid_com) * 100);
              }

              let total_scholastic_completed = 0;
              if (total_amount_paid_sch > 0) {
                total_scholastic_completed = Math.round((total_amount_paid_sch_completed / total_amount_paid_sch) * 100);
              }

              subscribetion_details = {
                total_scholastic_master: 100,
                total_competitive_master: 100, scholatic_details_count: scholatic_details_count, competive_details_count: competive_details_count,
                total_scholastic_completed: total_scholastic_completed, total_competitive_completed: total_competitive_completed, is_subscribe: is_subscribe,
                total_competitive_completed_master: 100, total_scholastic_completed_master: 100
              };
              //console.log(subscribetion_details)
              resolve(subscribetion_details);
            })

        });

        message = "You've Logged in successfully. Welcome!";

        //user_details[0].is_subscribe = is_subscribe;




        delete user_details[0].password;
        delete user_details[0].is_deleted;
        delete user_details[0].status;
        if (exam_unique_id != '') {
          promise1.then(async (subscribetion_details) => {

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let user_id = userdata.id;
            //////////////////////////////////// COM PURCHASED STATUS //////////////////////////////////////////////////

            let performance_details_ary_com = {};

            //performance_details_ary['scholastic'] = [];
            let total_competititve_weightage = 0;
            let total_set_completed_cometitive = 0;
            let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where `exam_completed_competitive`.`student_id` = " + user_id + " order by exam_completed_competitive.id ASC";
            let allow_setno_for_calculation_ntse_completed = 0;
            let allow_setno_for_calculation_nstse_completed = 0;
            let allow_setno_for_calculation_other_completed = 0;
            await db.query(query_data)
              .then(result => {
                result.forEach(Element => {
                  if (Element.exam_type == 'NTSE' && Element.exam_subtype_id == 2) {
                    let total_question = 0;
                    if (performance_details_ary_com[Element.exam_type] == null) {
                      performance_details_ary_com[Element.exam_type] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] = 0;
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] = 0;
                    }
                    allow_setno_for_calculation_ntse_completed = Element.exam_set_counter;
                  } else if (Element.exam_type == 'NSTSE') {
                    allow_setno_for_calculation_nstse_completed = Element.exam_set_counter;

                    if (performance_details_ary_com[Element.exam_type] == null) {
                      performance_details_ary_com[Element.exam_type] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] = 0;
                    }
                    performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] = performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] + 1;
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] = 0;
                    }
                    if (Element.post_ans_status == 1) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] = performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] + 1;
                    }
                  } else if (Element.exam_type != 'NTSE' && Element.exam_type != 'NSTSE') {

                    if (performance_details_ary_com[Element.exam_type] == null) {
                      performance_details_ary_com[Element.exam_type] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter] = {};
                    }
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] = 0;
                    }
                    performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] = performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['total'] + 1;
                    if (performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] == null) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] = 0;
                    }
                    if (Element.post_ans_status == 1) {
                      performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] = performance_details_ary_com[Element.exam_type]["set " + Element.exam_set_counter]['correct'] + 1;
                    }
                  }
                })
                result.forEach(Element => {
                  for (let i = 1; i <= allow_setno_for_calculation_ntse_completed; i++) {
                    if (Element.post_ans_status == 1 && i == Element.exam_set_counter && Element.exam_type == 'NTSE') {
                      performance_details_ary_com['NTSE']["set " + i]['correct'] = performance_details_ary_com['NTSE']["set " + i]['correct'] + 1;
                    }
                    if (i == Element.exam_set_counter && Element.exam_type == 'NTSE') {
                      performance_details_ary_com['NTSE']["set " + i]['total'] = performance_details_ary_com['NTSE']["set " + i]['total'] + 1;
                    }
                  }
                })

              })
            let performance_details_ary_com_final = [];

            for (var key in performance_details_ary_com) {
              for (var key2 in performance_details_ary_com[key]) {

                let full_data = {};
                full_data['exam_type'] = key2;
                full_data['score'] = performance_details_ary_com[key][key2]['correct'];
                full_data['total'] = performance_details_ary_com[key][key2]['total'];
                full_data['subject'] = key;
                full_data['chapter_name'] = "-";
                full_data['group_name'] = "-";
                full_data['percentage'] = ((performance_details_ary_com[key][key2]['correct'] / performance_details_ary_com[key][key2]['total']) * 100).toFixed(2);

                performance_details_ary_com_final.push(full_data);
              }
            }

            await db.query("select exam_completed_competitive.* from exam_completed_competitive where `exam_completed_competitive`.`student_id` = " + user_id + " and `exam_completed_competitive`.`exam_type` != 'NTSE' and `exam_completed_competitive`.`exam_type` != 'NSTSE'")
              .then(result => {
                result.forEach(Element => {
                  allow_setno_for_calculation_other_completed += Element.exam_set_counter;
                })
              })
            total_set_completed_cometitive = allow_setno_for_calculation_ntse_completed + allow_setno_for_calculation_nstse_completed + allow_setno_for_calculation_other_completed;

            let set_weightage = 1;
            let library_weightage_ntse = 30;
            let library_weightage_nstse = 8;
            let total_set_purchased_competitve = 0;
            let total_competitve_purchased_weightage = 0;

            let competitve_set_master = [];
            await db.query("select exam_type_id,max(set_count) as total_set from `exam_competitive_subscribtion_master` GROUP by exam_type_id")
              .then(result_set => {
                result_set.forEach(element => {
                  if (competitve_set_master[element.exam_type_id] == null) {
                    competitve_set_master[element.exam_type_id] = "";
                  }
                  competitve_set_master[element.exam_type_id] = element.total_set;
                })
              })

            await db.query("select * from `exam_type` where exam_category_id = 2 and status = 1 and is_deleted = 0")
              .then(result => {
                result.forEach(async element => {
                  if (competitve_set_master[element.id] != undefined) {
                    total_competititve_weightage += competitve_set_master[element.id];
                  }
                })
                total_competititve_weightage += library_weightage_ntse + library_weightage_nstse;
              })

            await db.query("select * from `purchased_subscribtions_details` where `exam_category_id` = 2 and `student_id` = " + user_id)
              .then(result => {
                result.forEach(element => {
                  total_competitve_purchased_weightage += parseInt(element.no_set) * set_weightage;
                  total_set_purchased_competitve += parseInt(element.no_set);
                  if (element.exam_type_id == 1)// NTSE
                  {
                    if (element.has_library == 1 || element.only_elibrary == 1) {
                      total_competitve_purchased_weightage += library_weightage_ntse;
                    }
                  }
                  if (element.exam_type_id == 2)// NSTSE
                  {
                    if (element.has_library == 1 || element.only_elibrary == 1) {
                      total_competitve_purchased_weightage += library_weightage_nstse;
                    }
                  }
                  if (element.exam_type_id > 2)// OTHER EXAM TYPE
                  {
                    if (element.has_library == 1 || element.only_elibrary == 1) {
                      total_competitve_purchased_weightage += library_weightage_nstse;
                    }
                  }
                })
              })

            //console.log(total_set_purchased_competitve);
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

            let existing_subjects_ary = [];
            let group_subjects_ary_list = [];
            let non_group_subjects_ary_list = [];
            let module_mock_cal_subjects = [];
            await db.query("select exam_scholastic_subscribtion_master.subject_id,subjects.group_subjects,subjects.group_exist from `exam_scholastic_subscribtion_master` left join subjects on subjects.id = exam_scholastic_subscribtion_master.subject_id where exam_scholastic_subscribtion_master.board_id = " + userdata.board + " and exam_scholastic_subscribtion_master.class = " + userdata.class + " and exam_scholastic_subscribtion_master.status = 1 and exam_scholastic_subscribtion_master.is_deleted = 0")
              .then(result => {
                if (result.length > 0) {
                  result.forEach(element => {
                    if (element.group_exist == 1) {
                      module_mock_cal_subjects.push(parseInt(element.subject_id));
                    }
                    if (element.group_exist == 2) {
                      existing_subjects_ary.push(element.subject_id);
                      if (non_group_subjects_ary_list[element.subject_id] == null) {
                        non_group_subjects_ary_list[element.subject_id] = [];
                      }
                      non_group_subjects_ary_list[element.subject_id].push(element.subject_id);
                      module_mock_cal_subjects.push(parseInt(element.subject_id));
                    } else {
                      let group_subjects_ary = element.group_subjects.split(",");
                      group_subjects_ary.forEach(element_inner => {

                        if (element.group_exist == 1) {
                          if (group_subjects_ary_list[element.subject_id] == null) {
                            group_subjects_ary_list[element.subject_id] = [];
                          }
                          group_subjects_ary_list[element.subject_id].push(element_inner);
                        }
                        if (element.group_exist == 3) {
                          module_mock_cal_subjects.push(parseInt(element_inner));
                        }
                        existing_subjects_ary.push(parseInt(element_inner));

                      })

                    }
                  })
                }
              })
            let deleted_indexs = [];
            let indexvalue = 0;
            existing_subjects_ary.forEach(element => {
              if (group_subjects_ary_list[element] != undefined) {

                deleted_indexs.push(indexvalue);
                group_subjects_ary_list[element].forEach(element_inner => {
                  existing_subjects_ary.push(parseInt(element_inner));
                })
              }
              indexvalue++;
            })
            let i = 0;
            deleted_indexs.forEach(element => {
              existing_subjects_ary.splice((element - i), 1);
              i++;
            })



            await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = " + userdata.board + " and `standard` = " + userdata.class + " and branch_id IN (" + existing_subjects_ary + ")")
              .then(result => {
                if (result.length > 0) {
                  result.forEach(element => {
                    if (schlastic_chapters_subjectwise[element.branch_id] == null) {
                      schlastic_chapters_subjectwise[element.branch_id] = [];
                    }
                    schlastic_chapters_subjectwise[element.branch_id].push(element.short_code);
                  })
                }
              })

            if (schlastic_chapters_subjectwise.length > 0) {
              schlastic_chapters_subjectwise.forEach(element => {
                total_scholastic_weightage += (elibrary_rate * element.length);
              })
            }
            total_scholastic_weightage += module_mock_cal_subjects.length * 9 + module_mock_cal_subjects.length * 11.4;

            if (schlastic_chapters_subjectwise.length > 0) {
              existing_subjects_ary.forEach(element => {

                if (schlastic_chapters_subjectwise[element] != undefined) {
                  total_scholastic_weightage += (schlastic_chapters_subjectwise[element].length * 2);
                }
              })
            }

            let total_purchsed_chapters_count = 0;
            let total_purchased_count_sch = 0;
            let total_purchased_count_sch_completed = 0;
            let elibrary_sch_count_ch = 0;
            let sch_subject_ary = [];



            ///////////////////////SCH ONLY ELIBRARY //////////////////////////
            let elibrary_subjects_list = [];
            schlastic_chapters_subjectwise = [];
            existing_subjects_ary = [];
            group_subjects_ary_list = [];
            non_group_subjects_ary_list = [];
            module_mock_cal_subjects = [];

            let purchase_ch_test_subjects = [];
            let subject_subscription_group_by = [];

            await db.query("select purchased_subscribtions_details.subject_id,subjects.group_subjects,subjects.group_exist,purchased_subscribtions_details.no_module,purchased_subscribtions_details.no_mock,purchased_subscribtions_details.no_set from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id where purchased_subscribtions_details.exam_category_id = 1 and purchased_subscribtions_details.student_id = " + user_id + " and purchased_subscribtions_details.only_elibrary = 1")
              .then(result => {
                if (result.length > 0) {
                  result.forEach(element => {
                    if (subject_subscription_group_by[element.subject_id] == null) {
                      subject_subscription_group_by[element.subject_id] = "";
                      purchase_ch_test_subjects[element.subject_id] = "";
                    }
                    purchase_ch_test_subjects[element.subject_id] = element.no_set;
                    subject_subscription_group_by[element.subject_id] = element.group_subjects;
                    if (element.group_exist == 1) {



                    }
                    if (element.group_exist == 2) {
                      existing_subjects_ary.push(element.subject_id);
                      if (non_group_subjects_ary_list[element.subject_id] == null) {
                        non_group_subjects_ary_list[element.subject_id] = [];
                      }
                      non_group_subjects_ary_list[element.subject_id].push(element.subject_id);



                    } else {
                      let group_subjects_ary = element.group_subjects.split(",");
                      group_subjects_ary.forEach(element_inner => {

                        if (element.group_exist == 1) {
                          if (group_subjects_ary_list[element.subject_id] == null) {
                            group_subjects_ary_list[element.subject_id] = [];
                          }
                          group_subjects_ary_list[element.subject_id].push(element_inner);
                        }

                        existing_subjects_ary.push(parseInt(element_inner));

                      })

                    }
                  })
                }
              })
            //console.log(total_module_value);
            deleted_indexs = [];
            indexvalue = 0;
            existing_subjects_ary.forEach(element => {
              if (group_subjects_ary_list[element] != undefined) {
                deleted_indexs.push(indexvalue);
                group_subjects_ary_list[element].forEach(element_inner => {
                  existing_subjects_ary.push(parseInt(element_inner));
                })
              }
              indexvalue++;
            })
            i = 0;
            deleted_indexs.forEach(element => {
              if (existing_subjects_ary[existing_subjects_ary.length - 1] == ",") {
                existing_subjects_ary.splice((element - i), 1);
                i++;
              }
            })

            if (existing_subjects_ary.length > 0) {
              await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = " + userdata.board + " and `standard` = " + userdata.class + " and branch_id IN (" + existing_subjects_ary + ")")
                .then(result => {
                  if (result.length > 0) {
                    result.forEach(element => {
                      if (schlastic_chapters_subjectwise[element.branch_id] == null) {
                        schlastic_chapters_subjectwise[element.branch_id] = [];
                      }
                      schlastic_chapters_subjectwise[element.branch_id].push(element.short_code);
                    })
                  }
                })
            }

            if (schlastic_chapters_subjectwise.length > 0) {

              schlastic_chapters_subjectwise.forEach(element => {
                total_purchased_count_sch += (elibrary_rate * element.length);
              })
            }
            /////////////////////////////////////////////////////////////////////


            schlastic_chapters_subjectwise = [];
            existing_subjects_ary = [];
            group_subjects_ary_list = [];
            non_group_subjects_ary_list = [];
            module_mock_cal_subjects = [];
            let module_cal_subjects = [];
            let mock_cal_subjects = [];
            purchase_ch_test_subjects = [];
            subject_subscription_group_by = [];
            let total_module_value = 0;
            let total_mock_value_exam_complete = 0;
            let total_module_value_exam_complete = 0;
            let total_mock_value = 0;
            let purchased_all_chapters_count = 0;
            let total_elibrary_ary = [];
            await db.query("select purchased_subscribtions_details.subject_id,subjects.group_subjects,subjects.group_exist,purchased_subscribtions_details.no_module,purchased_subscribtions_details.no_mock,purchased_subscribtions_details.no_set,purchased_subscribtions_details.has_library,purchased_subscribtions_details.only_elibrary,purchased_subscribtions_details.no_casestudy from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id where purchased_subscribtions_details.exam_category_id = 1 and purchased_subscribtions_details.student_id = " + user_id + "")
              .then(result => {
                if (result.length > 0) {
                  result.forEach(element => {
                    if (element.only_elibrary == 0) {
                      /////////////////////////////////////////////////////////////////////////////////////////////
                      let total_set_no = JSON.parse(element.no_set).length;
                      if (total_set_no > 0) {
                        purchased_all_chapters_count += chapter_count_subscription_subjects[element.subject_id] * total_set_no;
                      }
                      if (element.has_library > 0) {
                        total_elibrary_ary.push(element.subject_id);
                      }
                      if (element.no_casestudy > 0) {
                        purchased_all_chapters_count += chapter_count_subscription_subjects[element.subject_id] * element.no_casestudy;
                      }

                      //////////////////////////////////////////////////////////////////////////////////////////////
                      if (element.no_module == 1 && element.group_exist != 3) {
                        total_module_value += 9;
                        total_module_value_exam_complete += 3;
                      }
                      if (element.no_module == 1 && element.group_exist == 3) {
                        let group_ary = element.group_subjects.split(',');
                        total_module_value += 9 * group_ary.length;
                        total_module_value_exam_complete += 3;
                      }
                      if (element.no_mock == 1 && element.group_exist != 3) {
                        total_mock_value += 11.4;
                        total_mock_value_exam_complete += 2;
                      }
                      if (element.no_mock == 1 && element.group_exist == 3) {
                        let group_ary = element.group_subjects.split(',');
                        total_mock_value += 11.4 * group_ary.length;
                        total_mock_value_exam_complete += 2;
                      }
                      if (subject_subscription_group_by[element.subject_id] == null) {
                        subject_subscription_group_by[element.subject_id] = [];
                        purchase_ch_test_subjects[element.subject_id] = "";
                      }
                      purchase_ch_test_subjects[element.subject_id] = element.no_set;
                      if (element.no_set.length > 2) {
                        subject_subscription_group_by[element.subject_id].push(element.group_subjects);
                      }
                      if (element.group_exist == 1) {
                        module_mock_cal_subjects.push(parseInt(element.subject_id));
                        if (element.no_module == 1) {
                          module_cal_subjects.push(parseInt(element.subject_id));
                        }
                        if (element.no_mock == 1) {
                          mock_cal_subjects.push(parseInt(element.subject_id));
                        }

                      }
                      if (element.group_exist == 2) {
                        existing_subjects_ary.push(element.subject_id);
                        if (non_group_subjects_ary_list[element.subject_id] == null) {
                          non_group_subjects_ary_list[element.subject_id] = [];
                        }
                        non_group_subjects_ary_list[element.subject_id].push(element.subject_id);
                        module_mock_cal_subjects.push(parseInt(element.subject_id));
                        if (element.no_module == 1) {
                          module_cal_subjects.push(parseInt(element.subject_id));
                        }
                        if (element.no_mock == 1) {
                          mock_cal_subjects.push(parseInt(element.subject_id));
                        }
                      } else {
                        if (element.group_subjects != null) {
                          let group_subjects_ary = element.group_subjects.split(",");
                          group_subjects_ary.forEach(element_inner => {

                            if (element.group_exist == 1) {
                              if (group_subjects_ary_list[element.subject_id] == null) {
                                group_subjects_ary_list[element.subject_id] = [];
                              }
                              group_subjects_ary_list[element.subject_id].push(element_inner);
                            }
                            if (element.group_exist == 3) {
                              module_mock_cal_subjects.push(parseInt(element_inner));
                              if (element.no_module == 1) {
                                module_cal_subjects.push(parseInt(element.subject_id));
                              }
                              if (element.no_mock == 1) {
                                mock_cal_subjects.push(parseInt(element.subject_id));
                              }
                            }
                            existing_subjects_ary.push(parseInt(element_inner));
                          })
                        }
                      }
                    } else {
                      total_elibrary_ary.push(element.subject_id);
                    }
                  })
                }
              })
            deleted_indexs = [];
            indexvalue = 0;
            existing_subjects_ary.forEach(element => {
              if (group_subjects_ary_list[element] != undefined) {
                deleted_indexs.push(indexvalue);
                group_subjects_ary_list[element].forEach(element_inner => {
                  existing_subjects_ary.push(parseInt(element_inner));
                })
              }
              indexvalue++;
            })
            i = 0;
            deleted_indexs.forEach(element => {
              if (existing_subjects_ary[existing_subjects_ary.length - 1] == ",") {
                existing_subjects_ary.splice((element - i), 1);
                i++;
              }
            })

            if (existing_subjects_ary.length > 0) {
              await db.query("select * from `chapters` where `is_deleted` = 0 and status = 1 and `exam_category_id` = 1 and `board_id` = " + userdata.board + " and `standard` = " + userdata.class)
                .then(result => {
                  if (result.length > 0) {
                    result.forEach(element => {
                      if (schlastic_chapters_subjectwise[element.branch_id] == null) {
                        schlastic_chapters_subjectwise[element.branch_id] = [];
                      }
                      schlastic_chapters_subjectwise[element.branch_id].push(element.short_code);
                    })
                  }
                })
            }

            //console.log(total_elibrary_ary,total_mock_value,total_module_value,purchased_all_chapters_count,chapter_count_subscription_subjects[41]);
            total_purchased_count_sch = total_mock_value + total_module_value + purchased_all_chapters_count;
            if (schlastic_chapters_subjectwise.length > 0) {

              total_elibrary_ary.forEach(element => {
                total_purchased_count_sch += (elibrary_rate * chapter_count_subscription_subjects[element]);
              })
            }
            total_purchased_count_sch_completed += total_module_value + total_mock_value;
            //total_purchased_count_sch += module_cal_subjects.length * 9 + mock_cal_subjects.length * 11.4;
            if (schlastic_chapters_subjectwise.length > 0) {
              existing_subjects_ary.forEach(element => {

                if (schlastic_chapters_subjectwise[element] != undefined) {
                  //total_purchased_count_sch += (schlastic_chapters_subjectwise[element].length * 2);
                }
              })
            }

            for (let key in subject_subscription_group_by) {
              let set_no = JSON.parse(purchase_ch_test_subjects[key]).length;

              if (subject_subscription_group_by[key] == "") {
                //total_purchased_count_sch += (chapter_count_subscription_subjects[key] * set_no);
                total_purchased_count_sch_completed += (chapter_count_subscription_subjects[key] * set_no);
              }
              else {
                subject_subscription_group_by[key].forEach(element_outer => {

                  element_outer.split(",").forEach(element => {
                    total_purchased_count_sch_completed += chapter_count_subscription_subjects[element];
                    //total_purchased_count_sch += chapter_count_subscription_subjects[element] * set_no;

                    if (schlastic_chapters_subjectwise[element] != undefined) {
                      //total_purchased_count_sch += schlastic_chapters_subjectwise[element].length * set_no;


                    }
                    else {
                      if (group_subjects_ary_list[element] != undefined) {
                        group_subjects_ary_list[element].forEach(element_inner => {
                          if (schlastic_chapters_subjectwise[element_inner] != undefined) {
                            //total_purchased_count_sch += schlastic_chapters_subjectwise[element_inner].length * set_no;


                          }
                        })
                      }
                    }
                  })
                })
              }
            }

            let exam_completed_sch = 0;
            await db.query("select branch_id,count(*) as total_test from `exam_completed` where `student_id` = " + user_id + " and exam_type = 1 group by branch_id")
              .then(result => {
                result.forEach(element => {
                  if (schlastic_chapters_subjectwise[element.branch_id] != undefined) {
                    exam_completed_sch += parseInt(schlastic_chapters_subjectwise[element.branch_id].length) * element.total_test;
                  }
                })
              })

            await db.query("select * from `exam_completed` where `student_id` = " + user_id + " and exam_type = 2")
              .then(result => {
                exam_completed_sch += parseInt(result.length) * 3;
              })

            await db.query("select * from `exam_completed` where `student_id` = " + user_id + " and exam_type = 3")
              .then(result => {
                exam_completed_sch += parseInt(result.length) * 5.7;
              })


            let performance_details_ary_sch_final = [];
            let performance_details_ary_sch = {};

            let exam_wise_sch_total_question = [];
            let exam_wise_sch_total_question_right = [];
            let query_data_sch = "select exam_completed.*,online_exam_question_answers.question_id,online_exam_question_answers.post_ans,online_exam_question_answers.post_ans_status,subjects.name as subject_name,questions.question_type,question_pattern.marks from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join subjects on subjects.id = exam_completed.subject_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where `exam_completed`.`student_id` = " + user_id + " order by exam_completed.id ASC";

            await db.query(query_data_sch)
              .then(result => {
                result.forEach(element => {
                  if (exam_wise_sch_total_question[element.exam_unique_id] == null) {
                    exam_wise_sch_total_question[element.exam_unique_id] = [];
                    exam_wise_sch_total_question_right[element.exam_unique_id] = [];
                  }
                  exam_wise_sch_total_question[element.exam_unique_id].push(element.marks);
                  if (element.post_ans_status == 1) {
                    exam_wise_sch_total_question_right[element.exam_unique_id].push(element.marks);
                  }
                  let exam_type_id = element.exam_type;
                  let exam_type = "";
                  if (exam_type_id == 1) {
                    exam_type = "Test";
                  }
                  else if (exam_type_id == 2) {
                    exam_type = "Module";
                  }
                  else if (exam_type_id == 3) {
                    exam_type = "Mock";
                  }
                  if (performance_details_ary_sch[element.exam_unique_id] == null) {
                    performance_details_ary_sch[element.exam_unique_id] = [];
                  }

                  let correct_marks = (exam_wise_sch_total_question_right[element.exam_unique_id].reduce((partialSum, a) => partialSum + a, 0));
                  let total_marks = exam_wise_sch_total_question[element.exam_unique_id].reduce((partialSum, a) => partialSum + a, 0);

                  let percentage = ((correct_marks / total_marks) * 100).toFixed(2);

                  let exam_type_name = exam_type + " " + element.exam_set_counter;
                  if (element.question_type == 'CSS') {
                    exam_type_name = "Case Study";
                  }
                  let chapter_name = chapters_master[element.chapter_id];

                  let group_name = "Individual Subject";
                  if (element.subject_group_id != 0) {
                    group_name = group_master[element.subject_group_id];
                  }
                  let total_details = { "exam_unique_id": element.exam_unique_id, "total_record": total_marks, "correct_record": correct_marks, "percentage": percentage, "subject": element.subject_name, "exam_type": exam_type_name, "chapter_name": chapter_name, "group_name": group_name, "rec_id": element.id };

                  performance_details_ary_sch[element.exam_unique_id] = JSON.stringify(total_details);

                })
              })

            for (let key in performance_details_ary_sch) {
              performance_details_ary_sch_final.push(JSON.parse(performance_details_ary_sch[key]));
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let total_exam_completed_count_sch = 0;
            await db.query("select count(*) as total_exam from `exam_completed` where `student_id` = " + user_id)
              .then(result => {
                total_exam_completed_count_sch = result[0].total_exam;
              })


            ////////////////////////////////////////// SCH STATUS CAL END //////////////////////////////////////////////////////////////

            let exam_details_sch = await db.query("SELECT * FROM `exam_completed` where `exam_completed`.`student_id` = " + user_details[0].id);

            let exam_details_com = await db.query("SELECT * FROM `exam_completed_competitive` where `exam_completed_competitive`.`student_id` = " + user_details[0].id);

            if (exam_details_sch.length > 0 || exam_details_com.length > 0) {
              work_status = 3;
            }
            let competitive_overall = 0;

            if (is_subscribe_e_library > 0 && work_status == 3) {
              work_status = 4;
            }

            if (is_subscribe_e_library > 0 && work_status == 1) {
              work_status = 2;
            }
            if (is_subscribe == 1 && work_status == 1) {
              work_status = 2;
            }


            //console.log(total_purchased_count_sch,total_scholastic_weightage);

            //////////////////// Performance Score Card TABLE CALCUATION ///////////////////////////
            let total_percentage_calculation_value = 0;
            performance_details_ary_sch_final.forEach(element => {
              total_percentage_calculation_value += element.percentage;
            })
            performance_details_ary_sch_final.forEach(element => {
              total_percentage_calculation_value += element.percentage;
            })
            ////////////////////////////////////////////////////////////////////////////////////////////////
            user_details[0].is_subscribe = subscribetion_details.is_subscribe;
            user_details[0].is_subscribe_e_library = is_subscribe_e_library;
            delete subscribetion_details.is_subscribe;
            user_details[0].work_status = work_status;
            user_details[0].work_status_percentage = Math.ceil((work_status / 5) * 100);
            user_details[0].total_scholastic_master = subscribetion_details.total_scholastic_master;
            user_details[0].total_competitive_master = subscribetion_details.total_competitive_master;
            user_details[0].scholatic_details_purchase = ((total_purchased_count_sch / total_scholastic_weightage) * 100).toFixed(2) == "NaN" ? "0.00" : ((total_purchased_count_sch / total_scholastic_weightage) * 100).toFixed(2);
            user_details[0].competive_details_purchase = (((total_competitve_purchased_weightage) / total_competititve_weightage) * 100).toFixed(2) == "NaN" ? "0.00" : (((total_competitve_purchased_weightage) / total_competititve_weightage) * 100).toFixed(2);
            user_details[0].total_scholastic_completed = ((total_exam_completed_count_sch / total_purchased_count_sch_completed) * 100).toFixed(2) == "NaN" ? "0.00" : ((total_exam_completed_count_sch / total_purchased_count_sch_completed) * 100).toFixed(2); /// THIS IS PREVIOUS CODE

            /////////// AS PER SAUNAK UNDERSTANDING CHAGE THIS LOGIC ///////////
            total_purchased_count_sch_completed = purchased_all_chapters_count + total_module_value_exam_complete + total_mock_value_exam_complete;
            user_details[0].total_scholastic_completed = ((total_exam_completed_count_sch / total_purchased_count_sch_completed) * 100).toFixed(2) == "NaN" ? "0.00" : ((total_exam_completed_count_sch / total_purchased_count_sch_completed) * 100).toFixed(2);
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////

            //user_details[0].total_scholastic_completed = total_exam_completed_count_sch+"aaaaa"+total_purchased_count_sch_completed;

            user_details[0].total_competitive_completed = (((total_set_completed_cometitive) / total_set_purchased_competitve) * 100).toFixed(2) == "NaN" ? "0.00" : (((total_set_completed_cometitive) / total_set_purchased_competitve) * 100).toFixed(2);


            user_details[0].total_competitive_completed_master = subscribetion_details.total_competitive_completed_master;
            user_details[0].total_scholastic_completed_master = subscribetion_details.total_scholastic_completed_master;

            let performance_overall = 0;
            let performance_overall_perventage = 0;
            let total_exam_count = performance_details_ary_sch_final.length + performance_details_ary_com_final.length;

            if (performance_details_ary_com_final) {
              performance_details_ary_com_final.forEach(element => {
                performance_overall_perventage += parseFloat(element.percentage);
              })
            }
            if (performance_details_ary_sch_final) {
              performance_details_ary_sch_final.forEach(element => {
                performance_overall_perventage += parseFloat(element.percentage);
              })
            }

            performance_overall = (performance_overall_perventage / total_exam_count).toFixed(2);

            user_details[0].scholatic_overall = performance_overall == "NaN" ? "0.00" : performance_overall;
            user_details[0].competitive_overall = performance_overall == "NaN" ? "0.00" : performance_overall;
            user_details[0].feedback_given = get_feedback_details.length;

            user_details[0].performance_total_exam_count = total_exam_count;

            user_details[0].performance_details_comp = performance_details_ary_com_final;
            user_details[0].performance_details_sch = performance_details_ary_sch_final;

            let academic_session_details = await academic_session.get_academicsessionsby_id({ id: user_details[0].academic_year });
            let current_date = new Date;
            let current_time = (current_date.getTime());
            //let exp_date = new Date(academic_session_details.course_data[1]+" 23:59:59");
       
            user_details[0].academic_exist = 1;
            if (academic_session_details.course_data == undefined) {
              user_details[0].is_subscribe = 0;
              user_details[0].is_subscribe_e_library = 0;
              user_details[0].academic_exist = 0;
              /*if(user_details[0].is_subscribe == 3)
              {
                user_details[0].is_subscribe = 2;
              }
              else if(user_details[0].is_subscribe == 1)
                {
                  user_details[0].is_subscribe = 0;
                }
              if(user_details[0].is_subscribe_e_library == 3)
              {
                  user_details[0].is_subscribe_e_library = 2;
              }
              if(user_details[0].is_subscribe_e_library == 1)
                {
                    user_details[0].is_subscribe_e_library = 0;
                }*/
            }

            if (academic_session_details.list[0].is_expired == 2) {
              user_details[0].is_subscribe = 0;
              user_details[0].is_subscribe_e_library = 0;
              user_details[0].academic_exist = 0;
            }
            response = {
              status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
              exam_unique_id: exam_unique_id
            }

            resolve(response);
          });
        } else {
          user_details[0].is_subscribe = 0;
          user_details[0].is_subscribe_e_library = 0;
          delete subscribetion_details.is_subscribe;
          user_details[0].work_status = 1;
          user_details[0].work_status_percentage = Math.ceil((work_status / 5) * 100);
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
          user_details[0].performance_details_comp = [];
          user_details[0].performance_details_sch = [];

          let academic_session_details = await academic_session.get_academicsessionsbyid(user_details[0].board);


          response = {
            status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
            exam_unique_id: exam_unique_id, is_subscribe: is_subscribe, is_subscribe_e_library: is_subscribe_e_library
          }
          db.query("update `students` set `device_token` = '" + userdata.devicetoken + "' where `id` = " + user_details[0].id)
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

async function send_verification_otp_update_class(data) {
  const student_email = data.email;
  const student_mobile = data.mobile;

  const email_otp = (Math.floor(100000 + Math.random() * 900000));
  const mobile_otp = (Math.floor(100000 + Math.random() * 900000));

  if (student_mobile != '') {

    let smsbody = config.OTP_update_Class.body.replace("#field1#", mobile_otp);
    //smsbody = smsbody.replace("#field2#",'+916289581169');// For Crestest MOBILE NO

    let smsdata = { phonenumber: student_mobile, body: encodeURI(smsbody) }
    helper.sendsms(smsdata);
  }
  if (student_email != '') {
    let mailbody = config.updateclass_emailotp.body.replace("#OTP#", email_otp);
    mailbody = mailbody.replace("#student#", data.student_name);
    let maildata = { email: data.email, subject: config.updateclass_emailotp.subject, body: mailbody }

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

  response = { status: 200, msg: "Shared OTP with student", email_otp: email_otp_encrypt, mobile_otp: mobile_otp_encrypt, otp_valid_time: 10 }
  return response;
}


async function send_verification_otp_website(data) {

if(data.fname !="" && data.lname !="" && data.mobile != "" && data.email != "" && data.standard !="" && data.board !="" && data.academic_year != ""){
  data.student_name = data.fname + " " + data.lname;
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

      let smsbody = config.registerotp.body.replace("#field1#", mobile_otp);
      smsbody = smsbody.replace("#field2#", '+916289581169');// For Crestest MOBILE NO

      let smsdata = { phonenumber: student_mobile, body: encodeURI(smsbody) }
      helper.sendsms(smsdata);

    }

    if (student_email != '') {

      let mailbody = config.studentregistrationotp.body.replace("#OTP#", email_otp);
      let maildata = { email: data.email, subject: config.studentregistrationotp.subject, body: mailbody }
      helper.sendmail(maildata);
    }

    /////////////////////////////////////////////////////////////////////
    let email_otp_encrypt = CryptoJS.AES.encrypt(email_otp.toString(), process.env.CRYPTO).toString();
    let mobile_otp_encrypt = CryptoJS.AES.encrypt(mobile_otp.toString(), process.env.CRYPTO).toString();
   
    await db.query("select * from `otp_verification_status` where `email` = '" + data.email + "' and mobile_no = '" + data.mobile + "' and standard = '" + data.standard + "' and board = '" + data.board + "'")
			.then(async result => {
				if (result.length == 0) {
					await db.query("INSERT INTO `otp_verification_status`(`student_name`,`mobile_no`, `email`, `standard`, `board`,`mobile_otp`, `email_otp`, `otp_timeout`,`academic_year`) VALUES ('" + data.student_name + "','" + data.mobile + "','" + data.email + "','" + data.standard + "','" + data.board + "','" + data.mobile_otp_status + "','" + data.email_otp_status + "','" + data.otp_timeout + "','" + data.academic_year + "')");
				} else {
					await db.query("update `otp_verification_status` set `mobile_otp` = '" + data.email_otp_status + "', `email_otp` = '" + data.mobile_otp_status + "',`academic_year` = '" + data.academic_year + "',`otp_timeout` = '" + data.otp_timeout + "',`otp_checked` = 1 where `email` = '" + data.email + "'");
				}
			})
			.then(result => {
				response = { status: 200, msg: "Shared OTP with student", email_otp: email_otp_encrypt, mobile_otp: mobile_otp_encrypt, otp_valid_time: 5 }
			})
      
    return response;
  }
}
else{
  response = { status: 200, msg: "Please fill all the details" }
  return response;
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
  updateprofile_student,
  ovalallperformance_calculation,
  getdashboard_data,
  send_verification_otp_update_class,
  createStudent,
  addFirstSignupData,
  send_verification_otp_website
}