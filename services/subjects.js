const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function storesubjects(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
  const result = await db.query(
    `INSERT INTO subjects (name,exam_type_id) VALUES ('`+data.name+`','`+data.exam_type_id+`')`
  );
  if (result.affectedRows) {
    status = 200;
    message = 'Subject added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getsubject()
{
    const record_details = await db.query(`SELECT subjects.*,exam_type.type_name as type_name FROM subjects left join exam_type 
    on exam_type.id = subjects.exam_type_id WHERE subjects.is_deleted = 0 and subjects.group_exist = 2`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Subjects record list";
          response = {status: 200, msg: message, data: record_details}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function deletesubject(data)
{
    const record_details = await db.query(`SELECT * FROM subjects WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update subjects set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Subject record deleted successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function updatestatussubject(data)
{
    const record_details = await db.query(`SELECT * FROM subjects WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update subjects set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Subject record status updated successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function editsubject(data)
{
    const record_details = await db.query(`SELECT * FROM subjects WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update subjects set name = '`+data.name+`' where id = '`+data.recid+`' `);
          message = "Subject record updated successfully";
          response = {status: 200, msg: message}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}
async function getcompetitivesubject(data,userdata)
{
    const record_details = await db.query(`SELECT subjects.*,exam_type.type_name as type_name FROM subjects left join exam_type 
    on exam_type.id = subjects.exam_type_id WHERE subjects.exam_category_id = 2 and subjects.exam_type_id = `+data.exam_type_id+` and subjects.is_deleted = 0 and subjects.group_exist = 2`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Subjects record list";
          response = {status: 200, msg: message, data: record_details}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}

async function getsubjectsbycategory(data,userdata)
{
  let record_details = [];
  let subjects_id = [];
  let allsubjects_list = [];
  let exclude_subjects = [43,44];
  let all_non_group_subjects = [];

  await db.query("select subjects.elibrary_image,subjects.group_exist,subjects.subject_image,subjects.subject_color_code,subjects.name,subjects.id,subjects.group_subjects from subjects where subjects.is_deleted = 0 and subjects.status = 1 and subjects.group_exist != 3 and subjects.board_id = "+userdata.board+" and subjects.id NOT IN (43,44) group by subjects.id")
  .then(result=>{
    if(result.length > 0)
    {
      result.forEach(Element=>{
        if(all_non_group_subjects[Element.id] == null){
          all_non_group_subjects[Element.id] = {};
        }
        all_non_group_subjects[Element.id] = {"name":Element.name,"library_exist":1,"subject_id":Element.id,"subject_color_code":Element.subject_color_code,"subject_elibrary_image":Element.elibrary_image};
      })
    }
  })

  //console.log(all_non_group_subjects);
  if(data.exam_category == 1){
    await db.query(`SELECT subjects.elibrary_image,subjects.group_exist,subjects.subject_image,subjects.subject_color_code,subjects.name,subjects.id,subjects.group_subjects,purchased_subscribtions_details.student_id,
    purchased_subscribtions_details.has_library,purchased_subscribtions_details.only_elibrary 
    from purchased_subscribtions_details left join subjects on purchased_subscribtions_details.subject_id = subjects.id 
    where (purchased_subscribtions_details.has_library = 1 or purchased_subscribtions_details.only_elibrary = 1) and subjects.is_deleted = 0 and subjects.status = 1 and purchased_subscribtions_details.student_id = `+userdata.id+` and subjects.id NOT IN (43,44) group by subjects.id`)
    .then(result=>{
      let group_subjects_ary = "";
      let group_subjects_ary_final = [];
        result.forEach(Element=>{
              if(Element.group_exist == 3){
                group_subjects_ary = (Element.group_subjects.split(","));
                group_subjects_ary.forEach(Element_inner=>{
                  group_subjects_ary_final.push(parseInt(Element_inner));
                })
              }
            if(Element.student_id == userdata.id && Element.group_exist != 3){
                  let library_exist = 0;
                  
                  if(Element.has_library == 1 || Element.only_elibrary == 1){
                    library_exist = 1;
                    subjects_id.push(Element.id);
                  }else if(Element.group_exist == 2){
                    subjects_id.push(Element.id);
                  }
                    if((subjects_id.includes(Element.id)))
                    {
                      if(!exclude_subjects.includes(Element.id)){
                        allsubjects_list.push(Element.id);
                      record_details.push({"name":Element.name,"library_exist":library_exist,"subject_id":Element.id,"subject_color_code":Element.subject_color_code,"subject_elibrary_image":Element.elibrary_image})
                      }
                    }
                    
                }
        })
       
        group_subjects_ary_final.forEach(Element_sub=>{
          if(!allsubjects_list.includes(Element_sub)){
            
            record_details.push(all_non_group_subjects[Element_sub]);
          }
        })
    })
  
  }else if(data.exam_category == 2){
    await db.query(`SELECT subjects.elibrary_image,subjects.subject_color_code,subjects.name,subjects.id,subjects.group_exist,subjects.group_subjects from subjects \
    where exam_category_id = 2 and is_deleted = 0 and status = 1 and exam_type_id = `+data.exam_type_id+` and subjects.id NOT IN (43,44)`)
    .then(result=>{
      let group_subjects_ary = "";
      let group_subjects_ary_final = [];
      result.forEach(Element=>{
        if(Element.group_exist == 1){
          group_subjects_ary = (Element.group_subjects.split(","));
          group_subjects_ary.forEach(Element_inner=>{
            group_subjects_ary_final.push(parseInt(Element_inner));
          })
        }
      });
      result.forEach(Element=>{
        let library_exist = 1;
        if(!group_subjects_ary_final.includes(Element.id)){
          record_details.push({"name":Element.name,"library_exist":library_exist,"subject_id":Element.id,"subject_color_code":Element.subject_color_code,"subject_elibrary_image":Element.elibrary_image})
        }
      })
  })
  }
     
  let response = {};
  let status = 410;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No subject record found.';
      response = {status: status, msg: message,data:[]}
      reject(response);
    }
    else{
          message = "Subjects record list";
          response = {status: 200, msg: message, data: record_details}
          resolve(response);
    }
  }).then((value) => {
      return value;
  }).catch((err) => {
      return err;
  });

  return promise_result;  
}
module.exports = 
{
  storesubjects,
  getsubject,
  deletesubject,
  updatestatussubject,
  editsubject,
  getcompetitivesubject,
  getsubjectsbycategory
}