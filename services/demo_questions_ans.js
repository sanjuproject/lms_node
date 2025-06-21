const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function storedemoexamanswer(data)
{
    try{
    let response = {};
    let querystringans = "";
    let querystringans_value = "";
    await db.query("delete from `demo_question_answers` where `student_status`="+data[0].student_status+" and `student_id` = "+data[0].student_id+" and `exam_category_id` = "+data[0].exam_category_id+"");

    await db.query("select * from `demo_question_answers` where `student_status`="+data[0].student_status+" and `student_id` = '"+data[0].student_id+"' and `exam_category_id` = '"+data[0].exam_category_id+"'")
    .then(async result=>{
        if(result.length == 0){
            querystringans = "INSERT INTO `demo_question_answers`(`student_id`, `question_id`, `question_no`, `guest_post_ans`, `guest_post_ans_status`,`student_status`,`exam_category_id`) VALUES";
            data.forEach(element => {
                querystringans_value += "('"+element.student_id+"','"+element.question_id+"','"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"','"+element.student_status+"','"+element.exam_category_id+"'),";
            });
            //console.log(querystringans+querystringans_value.slice(0,-1))
            await db.query(querystringans+querystringans_value.slice(0,-1));
            
            await db.query("update `students` SET `demo_exam_status` = 1 where `id` = "+data[0].student_id);
                response = data[0].student_id;
                return response;
        }else{
            response = {status:300,msg:"Demo exam data already exist"}
        }
    })
        
    }
    catch(err)
    {
        response = {status:config.errorStatus,msg:"Store ans fail",error:err}
        return response;
    }
}

async function getquestionslistbydate(data)
{
    try{
    let response = {};
        await db.query("INSERT INTO demo_question_answers_archive (`student_id`,`question_id`,`question_no`,`guest_post_ans`,`guest_post_ans_status`)\
        SELECT `student_id`,`question_id`,`question_no`,`guest_post_ans`,`guest_post_ans_status` FROM demo_question_answers where `created_at` <'"+data+"'")
        .then((result)=>{
            db.query("delete from demo_question_answers where `created_at` <'"+data+"'");
        })
        response = {status:200,msg:"Archived old demo questions done"}
        return response;
    }
    catch(err)
    {
        response = {status:config.errorStatus,msg:"Archive ans fail",error:err}
        return response;
    }
}

async function updatedemoexamanswer(data)
{
    try{
    let response = {};
    let querystringans = "";
    let querystringans_value = "";
    await db.query("delete from `demo_question_answers` where `student_status`="+data[0].student_status+" and `student_id` = "+data[0].student_id+" and `exam_category_id` = "+data[0].exam_category_id+"");
    await db.query("select * from `demo_question_answers` where `student_status`="+data[0].student_status+" and `student_id` = "+data[0].student_id+" and `exam_category_id` = "+data[0].exam_category_id+"")
    .then(async result=>{
        if(result.length < 1){
            querystringans = "INSERT INTO `demo_question_answers`(`student_id`, `question_id`, `question_no`, `guest_post_ans`, `guest_post_ans_status`,`student_status`,`exam_category_id`) VALUES";
            data.forEach(element => {
                querystringans_value += "('"+element.student_id+"','"+element.question_id+"','"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"','"+element.student_status+"','"+element.exam_category_id+"'),";
            });
            //console.log(querystringans+querystringans_value.slice(0,-1))
            await db.query(querystringans+querystringans_value.slice(0,-1));
            
            await db.query("update `students` SET `demo_exam_status` = 1 where `id` = "+data[0].student_id);
                response = data[0].student_id;
                return response;
        }else{
            response = {status:300,msg:"Demo exam data already exist"}
        }
    })
        
    }
    catch(err)
    {
        response = {status:config.errorStatus,msg:"Store ans fail",error:err}
        return response;
    }
}
module.exports = {
    storedemoexamanswer,
    getquestionslistbydate,
    updatedemoexamanswer
}