const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storechapters(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";

  const exam_type_code = await db.query(`select exam_type.short_code,branches.branch_code from branches left join subjects on 
  branches.subject_id = subjects.id left join exam_type on exam_type.id = subjects.exam_type_id where branches.id = 1 and 
  branches.is_deleted = 0`);
  
  const getallchapters = await db.query(`SELECT * FROM chapters WHERE is_deleted = 0`);

let chapter_code = exam_type_code[0].short_code+exam_type_code[0].branch_code+"ch".toUpperCase()+(getallchapters.length + 1);
  const result = await db.query(
    `INSERT INTO chapters (chapter_name,short_code,branch_id) VALUES ('`+data.chapter_name+`','`+chapter_code+`','`+data.branch_id+`')`
  );
  if (result.affectedRows) {
    status = 200;
    message = 'Chapter added successfully.';
  }
  response = {status: status, msg: message};
  return response;
}

async function getchapters(data,userid) {
  let response = {};      ///USERID detais :  id: 18,class_id: 10,class: 10,board: 1,iat: 1681118590,exp: 1681204990
  let status = config.successStatus;
  let message = "Fetched chapters.";
  let subjects_id = data.subject_id;
  let group_subject_id = data.group_subject_id;
  let user_id = userid.id;
  let category_id = 0;
  let exam_type_id = 0;
  await db.query("select * from `subjects` where `id` = "+subjects_id+" and is_deleted = 0 and status = 1")
  .then(result=>{
    if(result[0].group_exist == 1){
      subjects_id = (result[0].group_subjects);
      category_id = result[0].exam_category_id;
    }else if(result[0].group_exist == 2){
      category_id = result[0].exam_category_id;
    }
    exam_type_id = result[0].exam_type_id;
  })
  if(+data.set_no == "")
  {
    let where_data = "";
    if(category_id == 1){
      where_data = " and chapters.exam_category_id = 1 and chapters.board_id = "+userid.board +" and chapters.standard = "+userid.class+" order by chapters.order_no ASC";
    }else{
      if(exam_type_id == 2){
            where_data = " and chapters.standard = "+userid.class+" and chapters.exam_category_id = 2 order by chapters.order_no ASC";  
          }
        else{
          where_data = " and chapters.exam_category_id = 2 order by chapters.order_no ASC";
      }
    }
   
     const chapters_ary = await db.query("select chapters.*,subjects.subject_image,subjects.elibrary_image,subjects.subject_code as branch,subjects.name as branch_name,subjects.subject_color_code from `chapters` \
     left join subjects on chapters.branch_id = subjects.id where chapters.is_deleted = 0 and chapters.status = 1 and  `branch_id` IN ("+subjects_id+")"+where_data);
     let chapters_ary_final = [];
     chapters_ary.forEach(Element=>{
      Element.interm_count = 0;
      Element.subject_id = data.subject_id;
      chapters_ary_final.push(Element);
     })
     response = {status: status, msg: message, data: chapters_ary_final};
    return response;
  }else
  {
    let interm_chapter_data = "";
    if(typeof data.set_no == "string" && data.set_no.length > 1 && data.set_no.slice(0,2) == 'cs')
    {

      interm_chapter_data = await db.query("select * from `interm_storeexamdata` where `set_no` = "+data.set_no.slice(2,3)+" and `case_study_exam` = 1 and `student_id` = "+user_id+" and `subject_group_id` = "+group_subject_id);
    }else{
        interm_chapter_data = await db.query("select * from `interm_storeexamdata` where `set_no` = "+data.set_no+" and `case_study_exam` = 2 and `student_id` = "+user_id+" and `subject_group_id` = "+group_subject_id);
    }
      let where_data = "";
      if(category_id == 1){
        where_data = " and chapters.exam_category_id = 1 and chapters.board_id = "+userid.board +" and chapters.standard = "+userid.class+" order by chapters.order_no ASC";
      }else{
        where_data = " and chapters.exam_category_id = 2 order by chapters.order_no ASC";
      }

   const chapters_ary = await db.query("select chapters.*,subjects.subject_image,subjects.elibrary_image,subjects.subject_code as branch,subjects.name as branch_name,subjects.subject_color_code from `chapters` \
   left join subjects on chapters.branch_id = subjects.id where chapters.is_deleted = 0 and chapters.status = 1 and  `branch_id` IN ("+subjects_id+")"+where_data);
   let chapters_ary_final = [];
   chapters_ary.forEach(Element=>{
    Element.interm_count = 0;
    interm_chapter_data.forEach(Element_inner=>{
      if(Element.branch == Element_inner.branch && Element.chapter_no == Element_inner.chapter)
      {
        Element.interm_count = Element_inner.total_attempts;
      }
    })
    Element.subject_id = data.subject_id;
    chapters_ary_final.push(Element);
   })
let chapters_ary_list = [];
chapters_ary_final.forEach(Element=>{
  Element.sub_heading = Element.sub_heading;
  chapters_ary_list.push(Element);
})

  response = {status: status, msg: message, data: chapters_ary_list};
  return response;
  }
}

async function deletechapter(data)
{
    const record_details = await db.query(`SELECT * FROM chapters WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No chapter record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update chapters set is_deleted = 1 where id = '`+data.recid+`' `);
          message = "Chapter record deleted successfully";
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

async function updatestatuschapter(data)
{
    const record_details = await db.query(`SELECT * FROM chapters WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No chapter record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update chapters set status = '`+data.status+`' where id = '`+data.recid+`' `);
          message = "Chapter record status updated successfully";
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

async function editchapters(data)
{
    const record_details = await db.query(`SELECT * FROM chapters WHERE id = '`+data.recid+`' and is_deleted = 0`);
  let response = {};
  let status = config.errorStatus;
  let message = 'Something went wrong, please try again later.';
  let promise_result = await new Promise((resolve, reject) => {
    if (record_details.length == 0) {
      message = 'No chapter record found';
      response = {status: status, msg: message}
      reject(response);
    }
    else{
          db.query(`update chapters set chapter_name = '`+data.chapter_name+`',short_code = '`+data.short_code+`'
          ,branch_id = '`+data.branch_id+`' where id = '`+data.recid+`' `);
          message = "Chapter record updated successfully";
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

async function getchapterbycode(data) {
  let response = {};
  let status = config.successStatus;
  let message = "Fetched Chapter Data";
  const branches = await db.query(`select chapters.*, subjects.exam_category_id from chapters left join branches on 
  branches.id = chapters.branch_id left join subjects on  subjects.id = branches.subject_id \
  where chapters.is_deleted = 0 and chapters.short_code ='`+data+`'`);
  response = {status: status, msg: message, data: branches};
  return response;
}

async function getchaptersbybranch(data){
  let response = {};
  let status = config.successStatus;
  let message = "Fetched branches";
  const branches = await db.query(`select * from chapters where branch_id = `+data.branch_id+``);
  response = {status: status, msg: message, data: branches};
  return response;
}

module.exports = {
  storechapters,
  getchapters,
  deletechapter,
  updatestatuschapter,
  editchapters,
  getchapterbycode,
  getchaptersbybranch
}