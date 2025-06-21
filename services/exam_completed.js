const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function chaptercompleted_list(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
 
  const result = await db.query("select * from `exam_completed` where `exam_unique_id` ='"+data.exam_unique_id+"' \
  and `exam_category_id` = 1 and `exam_type` = 1 and `subject_id` = "+data.subject_id+" and `branch_id` = "+data.branch_id+" \
  and `exam_set_counter` = "+data.set_no);
  if (result.length > 0) {
    let completed_chapters_id = [];
    result.forEach(element=>{
        completed_chapters_id.push(element.chapter_id);
    })
    status = 200;
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,data:completed_chapters_id};
  }else{
    status = 200;
    message = 'Exam completed list not found';
    response = {status: status, msg: message,data:[]};
  }
  
  return response;
}

async function getcompletedexam_counter(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
 
  let getallchapters = await db.query("select * from `chapters` where `branch_id` = "+data.branch_id);
  let totalchapters = getallchapters.length;

  let result = await db.query("select exam_type,chapter_id from `exam_completed` where `exam_unique_id` ='"+data.exam_unique_id+"' \
  and `exam_category_id` = 1 and `subject_id` = "+data.subject_id+" and `branch_id` = "+data.branch_id+" \
  and `exam_set_counter` = "+data.set_no+" and `student_id` = "+data.student_id);
  if (result.length > 0) {
    let setary = [];
    let moduleary = [];
    let mackary = [];
    result.forEach(element=>{
      if(element.exam_type === 1)
          setary.push(element.chapter_id);
      else if(element.exam_type === 2)
           moduleary.push(element.chapter_id);
      else if(element.exam_type === 3)
           mackary.push(element.chapter_id);     

    })
    status = 200;
    let examcompleted_percentage = Math.round((setary.length/totalchapters)*100);
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,setdata:setary,mackdata:mackary,moduledata:moduleary,
      examcompleted_percentage:examcompleted_percentage};
  }else{
    status = 200;
    message = 'Exam completed list not found';
    response = {status: status, msg: message,data:[]};
  }
  
  return response;
}

async function examcompletedlist_scholastic(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
   let subject_id = data.subject_id;
   let group_subject_id = data.group_subject_id;
   let case_study_exam = 2;
   //let subject_id = 0;
  /*await db.query("select * from `branches` where `id` = "+branch_id)
  .then(result=>{
    subject_id = result[0].subject_id;
  })*/
  if(typeof data.set_no == "string" && data.set_no.length > 1 && data.set_no.slice(0,2) == 'cs')
    	{
        data.set_no = data.set_no.slice(2,3);
        case_study_exam = 1;
		  }
  let interm_chaters_list = [];
  await db.query("select chapters.id from `interm_storeexamdata` left join chapters on chapters.chapter_no = interm_storeexamdata.chapter  where `interm_storeexamdata`.`case_study_exam` = "+case_study_exam+" and `interm_storeexamdata`.`exam_category_id` = 1 and `subject_id` = "+subject_id+" and `student_id` = "+data.student_id+" and `set_no` = "+data.set_no+" and `interm_storeexamdata`.`subject_group_id` = "+group_subject_id)
  .then(result=>{
    if(result.length > 0){
      result.forEach(element=>{
        interm_chaters_list.push(element);
      })
    }
  })
  let result = "";
  let filter_result = "";
  let filter_result_ary = [];
  let filter_chapter_list = "";
  if(data.set_no == 0)
  {
    
    filter_result = await db.query("select `exam_completed`.`chapter_id` from `exam_completed` where `exam_completed`.`case_study_exam` = "+case_study_exam+" and `exam_completed`.`exam_category_id` = 1 and `exam_completed`.`subject_id` = "+subject_id+" and `exam_completed`.`student_id` = "+data.student_id+" and `exam_completed`.`exam_type` = "+data.exam_type+" and `exam_completed`.`subject_group_id` = "+group_subject_id);

  filter_result.forEach(element=>{
    element.chapter_id.split(',').forEach(element2=>{
      filter_result_ary.push(element2);
    })
  })
if(filter_result_ary.length > 0){
  filter_chapter_list = filter_result_ary.join(',');
  
      result = await db.query("select `exam_completed`.`exam_unique_id`,`exam_completed`.`student_id`,`exam_completed`.`exam_type`,`exam_completed`.`exam_set_counter`,\
      `exam_completed`.`branch_id`,`exam_completed`.`chapter_id`,`exam_completed`.`created_at`,`chapters`.`chapter_name`,`chapters`.`short_code`,`chapters`.`sub_heading` from `exam_completed` left join `chapters` on `chapters`.`id` = `exam_completed`.`chapter_id` where `exam_completed`.`case_study_exam` = "+case_study_exam+" and `exam_completed`.`exam_category_id` = 1 and\
      `exam_completed`.`subject_id` = "+subject_id+" and `exam_completed`.`student_id` = "+data.student_id+" and `exam_completed`.`exam_type` = 1 and `exam_completed`.`chapter_id` not in ("+filter_chapter_list+") and `exam_completed`.`subject_group_id` = "+group_subject_id+" group by `exam_completed`.`chapter_id`");
  
    }
    else{
      result = await db.query("select `exam_completed`.`exam_unique_id`,`exam_completed`.`student_id`,`exam_completed`.`exam_type`,`exam_completed`.`exam_set_counter`,\
      `exam_completed`.`branch_id`,`exam_completed`.`chapter_id`,`exam_completed`.`created_at`,`chapters`.`chapter_name`,`chapters`.`short_code`,`chapters`.`sub_heading` from `exam_completed` left join `chapters` on `chapters`.`id` = `exam_completed`.`chapter_id` where `exam_completed`.`case_study_exam` = "+case_study_exam+" and `exam_completed`.`exam_category_id` = 1 and\
      `exam_completed`.`subject_id` = "+subject_id+" and `exam_completed`.`student_id` = "+data.student_id+" and `exam_completed`.`exam_type` = 1 and `exam_completed`.`subject_group_id` = "+group_subject_id+" group by `exam_completed`.`chapter_id`");
    }
  
}else
  {
  result = await db.query("select `exam_completed`.`exam_unique_id`,`exam_completed`.`student_id`,`exam_completed`.`exam_type`,`exam_completed`.`exam_set_counter`,\
  `exam_completed`.`branch_id`,`exam_completed`.`chapter_id`,`exam_completed`.`created_at`,`chapters`.`chapter_name`,`chapters`.`short_code`,`chapters`.`sub_heading` from `exam_completed` left join `chapters` on `chapters`.`id` = `exam_completed`.`chapter_id` where `exam_completed`.`case_study_exam` = "+case_study_exam+" and `exam_completed`.`exam_category_id` = 1 and\
  `exam_completed`.`subject_id` = "+subject_id+" and `exam_completed`.`exam_set_counter` = "+data.set_no+" and `exam_completed`.`student_id` = "+data.student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id);
  }
  if (result.length > 0) {
    let completed_exam = [];
    let counter = 0;
    result.forEach(element=>{
    if(interm_chaters_list.length > 0){  
      /*interm_chaters_list.contains(element.chapter_id, function(found) 
      {
        if (found) {
          element['attempted'] = 1;
      } 
  });*/
  if(interm_chaters_list.includes(element.chapter_id))
  {
    element['attempted'] = 1;
  }
}
      element.sub_heading = element.sub_heading;
      completed_exam[counter] = element;
      counter++;
    })
    status = 200;
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,completedexams:completed_exam};
    
  }else{
    status = 200;
    message = 'Exam completed list not found';
    response = {status: status, msg: message,completedexams:[]};
  }
  
  return response;
}

async function examcompletedlist_bystudentid(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
   let student_id = data.student_id;
 
  let result = await db.query("select exam_completed.*,online_exam_question_answers.post_ans_status,questions.question_type,chapters.short_code as chapter_name from `exam_completed` left join `online_exam_question_answers` on `online_exam_question_answers`.`exam_unique_id` = `exam_completed`.`exam_unique_id`\
  left join `questions` on `questions`.`id` = `online_exam_question_answers`.`question_id` left join chapters on chapters.id = exam_completed.chapter_id  where `exam_completed`.`student_id` = "+data.student_id);
  if (result.length > 0) {
    let completed_exam = [];
    let counter = 0;
    result.forEach(element=>{
      completed_exam.push(element);
    })
    status = 200;
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,completedexams:completed_exam};
  }else{
    status = 200;
    message = 'Exam completed list not found';
    response = {status: status, msg: message,completedexams:[]};
  }
  
  return response;
}
async function examcompletedlist_bystudentid_subject_id(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
   let student_id = data.student_id;
   let subject_id = data.subject_id;
 
  let result = await db.query("select * from `exam_completed` left join `online_exam_question_answers` on `online_exam_question_answers`.`exam_unique_id` = `exam_completed`.`exam_unique_id`\
  left join `questions` on `questions`.`id` = `online_exam_question_answers`.`question_id`  where `exam_completed`.`student_id` = "+data.student_id+" and `exam_completed`.`subject_id` = "+data.subject_id);
  if (result.length > 0) {
    let completed_exam = [];
    let counter = 0;
    result.forEach(element=>{
      completed_exam.push(element);
    })
    status = 200;
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,completedexams:completed_exam};
  }else{
    status = 200;
    message = 'Exam completed list not found';
    response = {status: status, msg: message,completedexams:[]};
  }
  
  return response;
}

async function examcompletedlist_competitive(data){
  let response = {};
  let status = 410;
  let message = "Something went wrong, please try again later.";
   let subject_id = data.subject_id;
   //let subject_id = 0;
  /*await db.query("select * from `branches` where `id` = "+branch_id)
  .then(result=>{
    subject_id = result[0].subject_id;
  })*/
  let result = await db.query("select * from `exam_completed_competitive` where `exam_category_id` = 2 and\
  `exam_set_counter` = "+data.set_no+" and `student_id` = "+data.student_id+" and `exam_type` = '"+data.exam_type+"' and `exam_subtype_id` = "+data.exam_subtype);
  if (result.length > 0) {
    let completed_exam = [];
    let counter = 0;
    result.forEach(element=>{
      completed_exam[counter] = element;
      counter++;
    })
    status = 200;
    message = 'Chapter wise exam completed list generated';
    response = {status: status, msg: message,completedexams:completed_exam};
  }else{
    status = 410;
    message = 'Competitive exam not given';
    response = {status: status, msg: message,completedexams:[]};
  }
  
  return response;
}


module.exports = {
    chaptercompleted_list,
    getcompletedexam_counter,
    examcompletedlist_scholastic,
    examcompletedlist_bystudentid,
    examcompletedlist_competitive
  }