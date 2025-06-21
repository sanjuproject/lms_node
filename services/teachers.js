const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getmac = require('getmac');
var macaddress = require('macaddress');
const nodemailer = require("nodemailer");
var request = require('request');
var http = require('http');
//var urlencode = require('urlencode');

async function create(data) {
  const check_duplicate = await db.query(`SELECT COUNT(*) as record_num FROM teachers WHERE is_deleted = 0 and email = '`+ data.email + `' or phone = '` + data.mobile + `'`);
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
          const result = await db.query(`INSERT INTO teachers (name, email, password, phone,  gender) VALUES ('`+ data.name + `','` + data.email + `', '` + hash + `','` + data.mobile + `', '` + data.gender + `')`);

          if (result.affectedRows) {
            status = 200;
            message = 'Teachers registration successfully done';
            response = { status: status, msg: message, teacherid: result.insertId }
            let maildata = {email:data.email,subject:config.teachermail.subject,body:config.teachermail.body}
            helper.sendmail(maildata);
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
  const user_details = await db.query(`SELECT * from teachers WHERE email = '` + data.email + `'`);
  let response = {};
  let token = "";
  let status = 410;
  let demo_exam_submit = 0;
  let exam_unique_id = "";
  let is_subscribe = 0;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (user_details.length == 0) {
      message = 'Login Error: Invalid username or password.Please Try Again';
      response = { status: status, msg: message }
      reject(response);
    }
    else {
      // check password
      bcrypt.compare(data.password, user_details[0].password, (bErr, bResult) => {
        // wrong password
        if (bResult == false) {
          message = 'Login Error: Invalid username or password.Please Try Again';
          response = { status: status, msg: message, error: bErr }
          reject(response);
        }
        if (bResult == true) {
          token = jwt.sign({ id: user_details[0].id }, config.jwttoken, { expiresIn: '24h' });
          db.query("delete from logindevices where `usertype`= 3 and `userid` =" + user_details[0].id)
            .then((resutlt) => {
              db.query("INSERT INTO `logindevices`(`userid`, `usertype`, `login_token`) VALUES (" + user_details[0].id + ",3,'" + token + "')")
            });
          demo_exam_submit = user_details[0].demo_exam_status;
          exam_unique_id = user_details[0].exam_unique_id;

          if (exam_unique_id != '') {
            is_subscribe = 1;
          }
          message = "You've Logged in successfully. Welcome!";
          user_details[0].token = token;
          delete user_details[0].password;
          delete user_details[0].is_deleted;
          delete user_details[0].status;
          response = {
            status: 200, msg: message, data: user_details, demo_exam_submit: demo_exam_submit,
            exam_unique_id: exam_unique_id, is_subscribe: is_subscribe
          }
          resolve(response);

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

module.exports = {
    create,
    signin
  }