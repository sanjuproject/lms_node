const db = require('./db');
const helper = require('../helper');
const config = require('../config');
require('dotenv').config();

async function getexamcategories(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
  }
  let status = config.successStatus;
  let message = "Fetched exam categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,onlineExam_guest as online_subheading,e_library_guest as elibrary_subheading,sub_heading as performance_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }else{
    examCategoriessql = `select id,category,short_code,onlineExam_register as online_subheading,e_library_register as elibrary_subheading,performance as performance_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select * from `exam_completed_competitive` where `student_id` = "+userid+" and exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        if(Element['exam_type'] != 'NTSE'){
          competitive_exam.push(Element['exam_type']);
        }else if(Element['exam_type'] == 'NTSE' && Element['exam_subtype_id'] == 2){
          competitive_exam.push(Element['exam_type']);
        }
      })
    }
   })

   await db.query("select * from `exam_completed` where `student_id` = "+userid+" and exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `elibrary_access_log` where `student_id` = "+userid)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        elibrary_data.push(Element['subject_id']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(elibrary_data.length > 0){
      Element.is_access_library = 1;
    }else{
      Element.is_access_library = 0;
    }
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    finalcategorylist.push(Element);
  
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}

async function getallexamcategories(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
  }
  let status = config.successStatus;
  let message = "Fetched exam categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,onlineExam_guest as online_subheading,e_library_guest as elibrary_subheading,sub_heading as performance_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0`;
  }else{
    examCategoriessql = `select id,category,short_code,onlineExam_register as online_subheading,e_library_register as elibrary_subheading,performance as performance_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select * from `exam_completed_competitive` where `student_id` = "+userid+" and exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `exam_completed` where `student_id` = "+userid+" and exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `elibrary_access_log` where `student_id` = "+userid)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        elibrary_data.push(Element['subject_id']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(elibrary_data.length > 0){
      Element.is_access_library = 1;
    }else{
      Element.is_access_library = 0;
    }
    finalcategorylist.push(Element);
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}


async function getexamcategories_library(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
  }
  let status = config.successStatus;
  let message = "Fetched library categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,e_library_guest as elibrary_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }else{
    examCategoriessql = `select id,category,short_code,e_library_register as elibrary_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select elibrary_visit_log.* from `elibrary_visit_log` left join subjects on elibrary_visit_log.subject_id = subjects.id where `elibrary_visit_log`.`student_id` = "+userid+" and subjects.exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element);
      })
    }
   })

   await db.query("select elibrary_visit_log.* from `elibrary_visit_log` left join subjects on elibrary_visit_log.subject_id = subjects.id where `elibrary_visit_log`.`student_id` = "+userid+" and subjects.exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_access_library = 1;
      }else{
        Element.is_access_library = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_access_library = 1;
      }else{
        Element.is_access_library = 0;
      }
      Element.is_list = 1;
    }
    
    finalcategorylist.push(Element);
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}

///////////////////////////////////// ARCHIVE ///////////////////////////////////////
async function getexamcategories_archive(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  let class_no = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
      class_no = userdata.class;
  }
  let status = config.successStatus;
  let message = "Fetched exam categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,onlineExam_guest as online_subheading,e_library_guest as elibrary_subheading,sub_heading as performance_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }else{
    examCategoriessql = `select id,category,short_code,onlineExam_register as online_subheading,e_library_register as elibrary_subheading,performance as performance_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select * from `exam_completed_competitive_archive` where `previous_class` = "+class_no+" and `student_id` = "+userid+" and exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        if(Element['exam_type'] != 'NTSE'){
          competitive_exam.push(Element['exam_type']);
        }else if(Element['exam_type'] == 'NTSE' && Element['exam_subtype_id'] == 2){
          competitive_exam.push(Element['exam_type']);
        }
      })
    }
   })

   await db.query("select * from `exam_completed_archive` where `previous_class` = "+class_no+" and `student_id` = "+userid+" and exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `elibrary_access_log_archive` where `student_id` = "+userid)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        elibrary_data.push(Element['subject_id']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(elibrary_data.length > 0){
      Element.is_access_library = 1;
    }else{
      Element.is_access_library = 0;
    }
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    finalcategorylist.push(Element);
  
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}

async function getallexamcategories_archive(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  let class_no = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
      class_no = userdata.class;
  }
  let status = config.successStatus;
  let message = "Fetched exam categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,onlineExam_guest as online_subheading,e_library_guest as elibrary_subheading,sub_heading as performance_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0`;
  }else{
    examCategoriessql = `select id,category,short_code,onlineExam_register as online_subheading,e_library_register as elibrary_subheading,performance as performance_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select * from `exam_completed_competitive_archive` where `previous_class` = "+class_no+" and `student_id` = "+userid+" and exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `exam_completed_archive` where `previous_class` = "+class_no+" and `student_id` = "+userid+" and exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

   await db.query("select * from `elibrary_access_log_archive` where `previous_class` = "+class_no+" and `student_id` = "+userid)
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        elibrary_data.push(Element['subject_id']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_exam = 1;
      }else{
        Element.is_exam = 0;
      }
      Element.is_list = 1;
    }
    if(elibrary_data.length > 0){
      Element.is_access_library = 1;
    }else{
      Element.is_access_library = 0;
    }
    finalcategorylist.push(Element);
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}


async function getexamcategories_library_archive(userdata) {
  let response = {};
  let user_id = 0;
  let userid = 0;
  let class_no = 0;
  if(userdata != undefined){
      user_id = 1;
      userid = userdata.id;
      class_no = userdata.class;
  }
  let status = config.successStatus;
  let message = "Fetched library categories.";
  let examCategoriessql = "";
  if(user_id == 0){
    examCategoriessql = `select id,category,short_code,e_library_guest as elibrary_subheading,photo_onlineexam as onlineexam,photo_e_library as e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }else{
    examCategoriessql = `select id,category,short_code,e_library_register as elibrary_subheading,performance_e_library as performance_e_library_sub_heading,photo_onlineexam as onlineexam,photo_e_library as e_library,photo_performance as performance,photo_performance_e_library as photo_performance_e_library from exam_categories where status = 1 and is_deleted = 0 and short_code NOT IN('INT')`;
  }

  let competitive_exam = [];
  let scholastic_exam = []; 
  let elibrary_data = []; 
   await db.query("select elibrary_access_log_archive.* from `elibrary_access_log_archive` left join subjects on elibrary_access_log_archive.subject_id = subjects.id where  `previous_class` = "+class_no+" and  `elibrary_access_log_archive`.`student_id` = "+userid+" and subjects.exam_category_id = 2")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        competitive_exam.push(Element);
      })
    }
   })

   await db.query("select elibrary_access_log_archive.* from `elibrary_access_log_archive` left join subjects on elibrary_access_log_archive.subject_id = subjects.id where  `previous_class` = "+class_no+" and  `elibrary_access_log_archive`.`student_id` = "+userid+" and subjects.exam_category_id = 1")
   .then(result=>{
    if(result.length > 0){
      result.forEach(Element=>{
        scholastic_exam.push(Element['exam_type']);
      })
    }
   })

  let finalcategorylist = [];
  let examCategories = await db.query(examCategoriessql);
  examCategories.forEach(Element=>{
    Element.is_list = 0;
    if(Element.short_code == 'SCH'){
      if(scholastic_exam.length > 0){
        Element.is_access_library = 1;
      }else{
        Element.is_access_library = 0;
      }
      Element.is_list = 1;
    }
    if(Element.short_code == 'COM'){
      if(competitive_exam.length > 0){
        Element.is_access_library = 1;
      }else{
        Element.is_access_library = 0;
      }
      Element.is_list = 1;
    }
    
    finalcategorylist.push(Element);
    Element.category = Element.category.toLowerCase();
    Element.category = Element.category.charAt(0).toUpperCase() + Element.category.slice(1);
    Element.onlineexam = process.env.IMAGEBASEURL+Element.onlineexam;
    Element.e_library = process.env.IMAGEBASEURL+Element.e_library;
    if(user_id != 0){
    Element.performance = process.env.IMAGEBASEURL+Element.performance;
    Element.performance_e_library = process.env.IMAGEBASEURL+Element.photo_performance_e_library;
    }
  })
  response = {status: status, msg: message, data: finalcategorylist};
  return response;
}
module.exports = {
 
  getexamcategories,
  getallexamcategories,
  getexamcategories_library,
  getexamcategories_archive,
  getallexamcategories_archive,
  getexamcategories_library_archive
  
}