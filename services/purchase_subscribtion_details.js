const db = require('./db');

async function delete_record_byid(data,category){
    let result = await new Promise(async (resolve, reject) => {
        //console.log("delete from `purchased_subscribtions_details` where `exam_category_id` = "+category+" and exam_type_id in("+data+")")
        let query = "select * from `purchased_subscribtions_details` where `exam_category_id` = 1";
        if(data !=''){
            query = "select * from `purchased_subscribtions_details` where `exam_category_id` = "+category+" and exam_type_id in("+data+")";
        }
        await db.query(query)
        .then((result,err)=>{
            if(result.affectedRows > 0){
                response = {status: 200, msg: "Record exist"}
                resolve(response);
            }else{
                reject({status: 200,msg:"Error in query. Please check"});
            }
        });
    

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

async function insert_record(data){
    let result = await new Promise(async (resolve, reject) => {
        await db.query("INSERT INTO `purchased_subscribtions_details`(`student_id`, `subscribtion_payment_trans_id`, \
			`exam_category_id`, `class`, `exam_type_id`, `subscription_id`, `no_set`, `no_module`, `no_mock`, `no_casestudy`,\
			 `cart_amount`, `category`, `category_short_code`, `type_name`, `board_name`, `subject_name`) \
			 VALUES ('"+element.student_id+"','"+req.body.subscribtion_payment_trans_id+"','"+element.exam_category_id+"','"+element.class+"','"+element.exam_type_id+"',\
			 '"+element.subscription_id+"','"+element.no_set+"','"+element.no_module+"','"+element.no_mock+"','"+element.no_casestudy+"',\
			 '"+element.cart_amount+"','"+element.category+"','"+element.category_short_code+"','"+element.type_name+"','"+element.board_name+"','"+element.subject_name+"')")
        .then((result,err)=>{
            if(result.affectedRows > 0){
                response = {status: 200, msg: "Record added successfully"}
                resolve(response);
            }else{
                reject({msg:"Error in query. Please check",error:err});
            }
        });
        

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

async function get_details_by_studentid(data){
    let result = await new Promise(async (resolve, reject) => {
        //console.log("delete from `purchased_subscribtions_details` where `exam_category_id` = "+category+" and exam_type_id in("+data+")")
        let query = "select * from `purchased_subscribtions_details` where `exam_category_id` = "+data.exam_category_id+" and `student_id` = "+data.student_id+"";
       
        await db.query(query)
        .then((result,err)=>{
            if(result.length > 0){
                let subject_ary = [];
                let subject_name_ary = {};
                let subject_id_ary = {};
               result.forEach(element => {
                if(subject_name_ary[element.subject_name] == null){
                    subject_name_ary[element.subject_name] = "";
                    subject_id_ary[element.subject_id] = "";
                }
                subject_name_ary[element.subject_name] = element.subject_id;
                subject_id_ary[element.subject_id] = element.subject_name;
                subject_ary.push(element.subject_id);
                
               }); 
                response = {status: 200, msg: "Subscribed subjects list",subjects_list:subject_ary,subject_name_ary:subject_name_ary,
                subject_id_ary:subject_id_ary}
                resolve(response);
            }else{
                reject({status: 200,msg:"No Record Found",error:err});
            }
        });
    

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

async function get_group_subjectlists(data){
    let result = await new Promise(async (resolve, reject) => {
        let subject_ary = [];
        let record_exist = 0;
        let completed_exam_subject_group_ary = [];
        await db.query("SELECT * FROM `exam_completed` WHERE student_id = "+data.student_id+" GROUP by subject_group_id")
        .then(result=>{
            if(result.length > 0){
                result.forEach(element=>{
                    completed_exam_subject_group_ary.push(element.subject_group_id);
                })      
            }
        })
       let query = "select purchased_subscribtions_details.subject_name,subjects.group_exist,subjects.id as subejct_id,subjects.subject_image from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id where purchased_subscribtions_details.exam_category_id = "+data.exam_category_id+" and purchased_subscribtions_details.student_id = "+data.student_id+" and purchased_subscribtions_details.only_elibrary != 1 and subjects.group_exist = 3 group by subjects.id";


       let query2 = "select purchased_subscribtions_details.subject_name,subjects.group_exist,subjects.id as subejct_id,subjects.subject_image from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id where purchased_subscribtions_details.exam_category_id = "+data.exam_category_id+" and purchased_subscribtions_details.student_id = "+data.student_id+" and purchased_subscribtions_details.only_elibrary != 1 and subjects.group_exist != 3 group by subjects.id";

       await db.query(query).then((result,err)=>{
            if(result.length > 0){
                record_exist = 1;
               result.forEach(element => {
                if(completed_exam_subject_group_ary.includes(element.subejct_id)){
                    element.is_exam = 1;
                }else{
                    element.is_exam = 0;
                }
                subject_ary.push(element);
               }); 
                response = {status: 200, msg: "Subscribed subjects list",subjects_list:subject_ary}
            }
        });
        await db.query(query2).then((result,err)=>{
            if(result.length > 0){
                record_exist = 1;
                if(completed_exam_subject_group_ary.includes(0)){
                    subject_ary.push({subejct_id:0,subject_name:"Individual Subject","group_exist":1,"subject_image":"","is_exam":1});
                }else{
                    subject_ary.push({subejct_id:0,subject_name:"Individual Subject","group_exist":1,"subject_image":"","is_exam":0});
                }
              
                response = {status: 200, msg: "Subscribed subjects list",subjects_list:subject_ary}
            }
        });
        if(record_exist == 1){
            resolve(response);
        }else{
            reject({status: 200,msg:"No Record Found",subjects_list:subject_ary});
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

async function get_group_subjectlists_archive(data){
    let result = await new Promise(async (resolve, reject) => {
        let subject_ary = [];
        let record_exist = 0;
        let completed_exam_subject_group_ary = [];
        await db.query("SELECT * FROM `exam_completed_archive` WHERE previous_class = "+data.class_no+" and student_id = "+data.student_id+" GROUP by subject_group_id")
        .then(result=>{
            if(result.length > 0){
                result.forEach(element=>{
                    completed_exam_subject_group_ary.push(element.subject_group_id);
                })      
            }
        })
       let query = "select subjects.group_exist,subjects.id as subejct_id,subjects.subject_image from subjects where exam_category_id = "+data.exam_category_id+" and subjects.group_exist = 3 group by subjects.id";

       let query2 = "select subjects.group_exist,subjects.id as subejct_id,subjects.subject_image from subjects where exam_category_id = "+data.exam_category_id+" and subjects.group_exist != 3 group by subjects.id";

       await db.query(query).then((result,err)=>{
            if(result.length > 0){
                record_exist = 1;
               result.forEach(element => {
                if(completed_exam_subject_group_ary.includes(element.subejct_id)){
                    element.is_exam = 1;
                    subject_ary.push(element);
                }else{
                    //element.is_exam = 0;
                }
                
               }); 
                response = {status: 200, msg: "Subscribed subjects list",subjects_list:subject_ary}
            }
        });
        await db.query(query2).then((result,err)=>{
            if(result.length > 0){
                record_exist = 1;
                if(completed_exam_subject_group_ary.includes(0)){
                    subject_ary.push({subejct_id:0,subject_name:"Individual Subject","group_exist":1,"subject_image":"","is_exam":1});
                }else{
                    //subject_ary.push({subejct_id:0,subject_name:"Individual Subject","group_exist":1,"subject_image":"","is_exam":0});
                }
              
                response = {status: 200, msg: "Subscribed subjects list",subjects_list:subject_ary}
            }
        });
        if(record_exist == 1){
            resolve(response);
        }else{
            reject({status: 200,msg:"No Record Found",subjects_list:subject_ary});
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
module.exports = {
    delete_record_byid,
    get_details_by_studentid,
    insert_record,
    get_group_subjectlists,
    get_group_subjectlists_archive
}