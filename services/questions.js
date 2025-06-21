const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const boardsdata = require('./boards.js');
var CryptoJS = require("crypto-js");
var fs = require('fs');

async function demoexamscholaticquestion(data){
    //let chapterno = data.chapter;
    //let finalno = chapterno.match(/\d+/g);
    //const chapter_code = "CH"+(finalno[0]);
    let special_charectors_tags =  [];
    let question_counter = 1;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })

    let demoquestions = [];
    /// 0=live,1=guest demo,2=registered demo 	
    if(data.student_id == 0){
            demoquestions =  await db.query("select * from `questions` where `exam_category` = 1 and `demo_exam` = 1  and `status` = 1 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");    
    }
    else{
            demoquestions =  await db.query("select * from `questions` where `exam_category` = 1 and `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"'\
            and `demo_exam` = 2  and `status` = 1 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");    
    }
    const exam_duration = 20; // 20 min exam duration
    if(demoquestions.length > 0)
    {
        demoquestions.forEach((element)=>{
            let options_details = [];
            let options_details_image = [];
            delete element.is_deleted;
            delete element.status;
            delete element.created_at;
            delete element.updated_at;
            //options_details.push({"A":[element.option_a,element.option_a_image],"B":[element.option_b,element.option_a_image],
            //"C":[element.option_c,element.option_a_image],"D":[element.option_d,element.option_a_image]});
            //element['options'] = options_details;

            //options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
           //"C":element.option_c_image,"D":element.option_d_image});
            //element['options_image'] = options_details_image;
            element['exam_duration'] = exam_duration * 60;
            let question_image_ary = element['question_image'].split(',');
           
            let counter = 1;
            let final_question = element['question'];
           
            question_image_ary.forEach(question_image=>{
                
                let tagname = "#Img"+counter;
                
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                counter++;
            })
            if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){  
            final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
            final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
            final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }
            special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            })

            ////////////////////////////////////////////////////
            let option_image_ary = element['option_a_image'].split(',');
            let counter_option_a = 1;
            let final_question_option_a = element['option_a'];
            option_image_ary.forEach(option_image=>{
                let tagname = "#Img"+counter_option_a;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_a++;
            })
            if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
                final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }
            special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            let option_image_ary_b = element['option_b_image'].split(',');
          
            let counter_option_b = 1;
            let final_question_option_b = element['option_b'];
            option_image_ary_b.forEach(option_image=>{
                let tagname = "#Img"+counter_option_b;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                
                counter_option_b++;
            })
            if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
                final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
                final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }

            special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter++;
            })
            
            ///////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////
            let option_image_ary_c = element['option_c_image'].split(',');
            let counter_option_c = 1;
            let final_question_option_c = element['option_c'];
            option_image_ary_c.forEach(option_image=>{
                let tagname = "#Img"+counter_option_c;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_c++;
            })
            if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
                final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
                final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }
            special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            
            })
            ///////////////////////////////////////////////////////////

             ////////////////////////////////////////////////////
             let option_image_ary_d = element['option_d_image'].split(',');
             let counter_option_d = 1;
             let final_question_option_d = element['option_d'];
             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            
                 counter_option_d++;
             })
             if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
                final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
                final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }
             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////

              ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })
             if(final_question_reason.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
              final_question_reason = (final_question_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
             final_question_reason = (final_question_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }
             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////
            element['question'] = final_question;
            element['option_a'] = final_question_option_a;
            element['option_b'] = final_question_option_b;
            element['option_c'] = final_question_option_c;
            element['option_d'] = final_question_option_d;
            element['reason'] = final_question_reason;

            options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;
            
            element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();


            element['question_counter'] = question_counter;
            question_counter++;
            // Encrypt
            //var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();

            // Decrypt
            //var bytes  = CryptoJS.AES.decrypt(element['answer'], process.env.CRYPTO);
            //var originalText = bytes.toString(CryptoJS.enc.Utf8);

            //console.log(originalText); // 'my message'

        })
        
    }
        let response = {status: config.successStatus, msg: "Demo exam data",exam_duration:exam_duration, data:demoquestions};
        return response;
}

async function demoexamcompetitivequestion(data){
    let demoquestions = [];
    let question_counter = 1;
    let special_charectors_tags =  [];

    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })
    const exam_duration = 20; // 20 min exam duration
    if(parseInt(data.student_id) === 0){
         demoquestions =  await db.query("select * from `questions` where `exam_category` = 2 and `demo_exam` = 1 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");    
    }else{
        if(data.standard !=''){
            if(data.standard >= 8){
                    demoquestions =  await db.query("select * from `questions` where `exam_category` = 2 and `class` = "+data.standard+" and `demo_exam` = 2 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");
                    if(demoquestions.length == 0)
                    {
                        demoquestions =  await db.query("select * from `questions` where `exam_category` = 2 and `demo_exam` = 2 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");
                    }
            }else{
                demoquestions =  await db.query("select * from `questions` where `exam_category` = 2 and `demo_exam` = 2 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");
            }
        }else{
            demoquestions =  await db.query("select * from `questions` where `exam_category` = 2 and  `demo_exam` = 2 and `is_approve` = 1 and `is_deleted` = 0 ORDER BY RAND() LIMIT 20");            
        }
    }
    if(demoquestions.length > 0)
    {
        demoquestions.forEach((element)=>{
            let options_details = [];
            let options_details_image = [];
            delete element.is_deleted;
            delete element.status;
            delete element.created_at;
            delete element.updated_at;
            //options_details.push({"A":element.option_a,"B":element.option_b,"C":element.option_c,
            //"D":element.option_d});
            //element['options'] = options_details;

            //options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
           //"C":element.option_c_image,"D":element.option_d_image});
           // element['options_image'] = options_details_image;
            element['exam_duration'] = exam_duration * 60;


            let question_image_ary = element['question_image'].split(',');
           
            let counter = 1;
            let final_question = element['question'];

            question_image_ary.forEach(question_image=>{
                let tagname = "#Img"+counter;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />') 
                counter++;
            })
            if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){
                final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
            final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
            final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }
            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
             
            })

            ////////////////////////////////////////////////////
            let option_image_ary = element['option_a_image'].split(',');
            let counter_option_a = 1;
            let final_question_option_a = element['option_a'];
            option_image_ary.forEach(option_image=>{
                let tagname = "Img"+counter_option_a;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_a++;
            })
            if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1){

                final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            let option_image_ary_b = element['option_b_image'].split(',');
          
            let counter_option_b = 1;
            let final_question_option_b = element['option_b'];
            option_image_ary_b.forEach(option_image=>{
                let tagname = "#Img"+counter_option_b;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_b++;
            })
            if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////
            let option_image_ary_c = element['option_c_image'].split(',');
            let counter_option_c = 1;
            let final_question_option_c = element['option_c'];
            option_image_ary_c.forEach(option_image=>{
                let tagname = "#Img"+counter_option_c;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_c = final_question_option_c.replaceAll(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_c++;
            })
            if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }
            
            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

             ////////////////////////////////////////////////////
             let option_image_ary_d = element['option_d_image'].split(',');
             let counter_option_d = 1;
             let final_question_option_d = element['option_d'];
             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d.replaceAll(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                 counter_option_d++;
             })
             if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
             {
                final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }

             special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
             ///////////////////////////////////////////////////////////

              ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })
             final_question_reason = (final_question_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
             final_question_reason = (final_question_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////

            element['question'] = final_question;
            element['option_a'] = final_question_option_a;
            element['option_b'] = final_question_option_b;
            element['option_c'] = final_question_option_c;
            element['option_d'] = final_question_option_d;
            element['reason'] = final_question_reason;

            options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;
            element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
            element['question_counter'] = question_counter;
            question_counter++;

        })
         //delete demoquestions[0].is_deleted;
         //delete demoquestions[0].status;
         //delete demoquestions[0].created_at;
         //delete demoquestions[0].updated_at;
    }
   
         let response = {status: config.successStatus, msg: "Demo exam data", data:demoquestions};
         return response;
 }

 async function examscholaticquestion_set(data,userdata){
    let chapterno = data.chapter;
    let finalno = chapterno.match(/\d+/g);
    const chapter_code = "CH"+(finalno[1]);
    let questionslist = [];
    let chapter_id = 0;
    let single_subject_id = data.subject_id;
    let group_subject_id = data.group_subject_id;
    let demoquestions = [];
    let questions_no_config = [];
    let student_id = userdata.id;
    let sequence_no = data.chapter_no;
    let asked_questionslist_no =  [0];
    let asked_questionslist_id =  [0];
    let subject_name = "";
    let chapter_name = "";
    let chapter_title = "";
    let special_charectors_tags =  [];
    let class_id = "";
    let group_exist = 0;
    let subjectid = 0;
    let question_no_ary = [];
    let boardid = 0;
    let branch_name = "";
    let question_counter = 1;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })
    ///////////////////// Exam Duration Section //////////////////////////////////
    let exam_duration = 0; // 20 min exam duration
    let configuration_details = "";
    let examtype_counter = {};
    await boardsdata.getboardbyshortcode(data.board)
    .then(async (board)=>{
        let subject_id = 0;
        let board_id = 0;
    board_id = board.data[0].id;
    boardid = board_id;
    await db.query("select * from `chapters` where `short_code` = '"+data.chapter+"' and `is_deleted` = 0 and status = 1")
    .then(element=>{
        if(element !=''){
        chapter_name = "Chapter "+sequence_no;
        chapter_title = element[0].sub_heading;
        chapter_id = element[0].id;
        }
    })
    await db.query("select * from `classes` where `class_no` = '"+data.standard+"' and `is_deleted` = 0 and status = 1")
    .then(element=>{
        if(element !=''){
            class_id = element[0].id;
        }
    })

   await db.query("select * from `subjects` where `id` = "+single_subject_id+" and `is_deleted` = 0 and status = 1")
    .then(branchdata=>{
       if(branchdata !=''){
        subject_id = branchdata[0].id;
        subject_name = branchdata[0].name;
        group_exist = branchdata[0].group_exist;
       }
    })

    await db.query("select * from `subjects` where `subject_code` = '"+data.branch+"' and `is_deleted` = 0 and status = 1")
    .then(branchdata=>{
       if(branchdata !=''){
        branch_name = branchdata[0].name;
       }
    })

if(subject_id != 0 && group_exist == 1){
    await db.query("select * from `subjects` where `is_deleted` = 0 and status = 1 and  `board_id` = '"+board_id+"' and `group_exist` = 1 and FIND_IN_SET("+subject_id+",group_subjects)")
    .then(branchdata=>{
       if(branchdata !=''){
        subject_id = branchdata[0].id;
        subject_name = branchdata[0].name;
       }
    })  
}


    await db.query("select * from `exam_details_scholastic` where `exam_category_id` = 1 and `board_id` = "+board_id+" and `class_id` = "+class_id+" and \
    `subject_id` = "+subject_id+" and `status` = 1 and `is_deleted` = 0 and type_exam = 1")
    .then(element=>{
        if(element !=''){
        exam_duration = element[0].total_time * 60;
        configuration_details = JSON.parse(element[0].question_type);
        }
    })
    

    var keys = Object.keys(configuration_details);
    for (var i = 0; i < keys.length; i++) {
        let keyname = keys[i];

        examtype_counter[keyname] = 0;
    }
    
     ///////////////////// Exam Duration Section END //////////////////////////////////
     let interm_question_ids = [];
     await db.query("select * from `interm_storeexamdata` where `student_id` = "+student_id)
     .then(async result=>{
        
        if(result.length > 0)
        {
             result.forEach(element=>{
                 interm_exam_exist = 1;
                 exam_data = element.examdata;
                 let exam_questioon_data = {};
                 exam_questioon_data = JSON.parse(decodeURI(exam_data));
                 exam_questioon_data.forEach(element=>{
                     if(element.id > 0){ 
                     interm_question_ids.push(element.id);
                     }
                 })
             })
        }
    })

    await db.query("select question_no,question_id from `online_exam_question_answers` where `student_id` = "+student_id)
    .then(asked_questions=>{
      if(asked_questions.length > 0){  
        asked_questions.forEach(element=>{
            if(element.question_id > 0){
                asked_questionslist_no.push(element.question_no)
                asked_questionslist_id.push(element.question_id)
            }
        })
      }
    })

    if(interm_question_ids.length > 0){
        interm_question_ids.forEach(element_ques=>{
         if(element_ques > 0){   
            asked_questionslist_id.push(element_ques);
         }
        })
    }
   // console.log("select * from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"'and `branch` ='"+data.branch+"' and `chapter_id` ='"+chapter_id+"' and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `id` NOT IN ("+asked_questionslist_id+") ORDER BY RAND(), id ASC")
//return;
    questionslist =  await db.query("select * from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"' and `branch` ='"+data.branch+"' and `chapter_id` ='"+chapter_id+"' and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `id` NOT IN ("+asked_questionslist_id+") ORDER BY RAND(), id ASC");    
    
    subjectid = subject_id;
    //questions_no_config = await db.query("select * from `exam_set_configuration` where `board_id` = "+board.data[0].id+" and `exam_category_id` = 1 and `type` = 1");
    });

   // const keys = Object.keys(configuration_details);
/*for (var i = 0; i < keys.length; i++) {
  console.log(keys[i],configuration_details[keys[i]]);
}*/

    //console.log(questionslist)
   // console.log(configuration_details);
    
    if(questionslist.length > 0)
    {
        questionslist.forEach((element)=>{       
            if(asked_questionslist_no.indexOf(element.question_no) == -1 || asked_questionslist_no.indexOf(element.question_no) == 0)
            {
            if (configuration_details.hasOwnProperty(element.question_type)) {
                if(configuration_details[element.question_type] > examtype_counter[element.question_type]){
                
                examtype_counter[element.question_type] = examtype_counter[element.question_type] + 1;
                //examtype_counter[element.question_type] = 1; 
                //console.log(examtype_counter)
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
                /*options_details.push({"A":element.option_a,"B":element.option_b,"C":element.option_c,
                "D":element.option_d});
                element['options'] = options_details;

                    options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
                    "C":element.option_c_image,"D":element.option_d_image});
                        element['options_image'] = options_details_image;
                        element['exam_duration'] = exam_duration;
                    questionslist.push(element);*/
                    
                    let question_image_ary = element['question_image'].split(',');
         
                let counter = 1;
                let final_question = element['question'];
           
                question_image_ary.forEach(question_image=>{
                let tagname = "#Img"+counter;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" draggable="false" alt="crestest_img" class="image_responsive" />')
                counter++;
            })
            if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

                special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            })
            ////////////////////////////////////////////////////
            let option_image_ary = element['option_a_image'].split(',');
            let counter_option_a = 1;
            let final_question_option_a = element['option_a'];
            option_image_ary.forEach(option_image=>{
                let tagname = "#Img"+counter_option_a;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_a++;
            })
            if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            let option_image_ary_b = element['option_b_image'].split(',');
          
            let counter_option_b = 1;
            let final_question_option_b = element['option_b'];
            option_image_ary_b.forEach(option_image=>{
                let tagname = "#Img"+counter_option_b;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_b++;
            })
            if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }
            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////
            let option_image_ary_c = element['option_c_image'].split(',');
            let counter_option_c = 1;
            let final_question_option_c = element['option_c'];
            option_image_ary_c.forEach(option_image=>{
                let tagname = "#Img"+counter_option_c;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_c++;
            })

            if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

             ////////////////////////////////////////////////////
             let option_image_ary_d = element['option_d_image'].split(',');
             let counter_option_d = 1;
             let final_question_option_d = element['option_d'];
             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                 counter_option_d++;
             })
             if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
             {
                final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }

             special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
             ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })

             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                if(final_question_reason.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_reason = (final_question_reason.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_reason = (final_question_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                    }

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////

            element['question'] = final_question;
            element['option_a'] = final_question_option_a;
            element['option_b'] = final_question_option_b;
            element['option_c'] = final_question_option_c;
            element['option_d'] = final_question_option_d;
            element['reason'] = final_question_reason;
            element['exam_duration'] = exam_duration;
            element['total_attempts'] = 1;

            element['subject_name'] = subject_name;
            element['chapter_name'] = chapter_name;
            element['chapter_title'] = chapter_title;
            element['branch_name'] = branch_name;
            
            question_no_ary.push(element.question_no);

            options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;

            element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
            element['question_counter'] = question_counter;
            demoquestions.push(element);
            question_counter++;
                }
            }
        }
        })
    }

    demoquestions.sort(function(a, b) {
        return a.question_counter - b.question_counter;
      });
   if(demoquestions.length > 0){ 
    await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`,`subject_group_id`, `subject_id`, `examdata`) VALUES ("'+student_id+'",1,1,"'+exam_duration+'",1,"'+boardid+'","'+data.branch+'","'+chapter_code+'",'+data.set_no+',"'+group_subject_id+'","'+subjectid+'","'+encodeURI(JSON.stringify(demoquestions))+'")');
   }
    //console.log("INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,  `exam_time`, `exam_type`, `branch`, `chapter`, `set_no`, `subject_id`, `examdata`) \
    //VALUES ('"+student_id+"',1,'"+exam_duration+"','"+data.board+"','"+data.branch+"','"+chapter_code+"',1,'"+subjectid+"','"+JSON.stringify(demoquestions)+"')")

    //console.log(examtype_counter);
        let response = {status: config.successStatus, msg: "Online exam data",exam_duration:exam_duration, data:demoquestions};
       
        return response;
}

async function onlineexamcompetitivequestion(data,userdata){
   
    var questionslist_set1 = [];
    var questionslist_set2 = [];
    let response = {};
    let demoquestions = [];
    let questions_no_config = [];
    let result = [];
    const subject_id = data.subject_id;
    const student_id = data.student_id;
    let exam_type = data.exam_type;
    let exam_subtype = data.subtype_id;
    let board = userdata.board;
    let configuration_details = "";
    let asked_questionslist_no =  [0];
    let asked_questionslist_id =  [0];
    let question_counter = 1;

    let special_charectors_tags =  [];
    const class_no = data.standard;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })
    ///////////////////// Exam Duration Section //////////////////////////////////
    let exam_duration = 0; // 20 min exam duration
    let exam_type_id = 0;  
    let exam_type_shortcode = "";
    let is_class = 0;
    let subtype_id = data.subtype_id;
    await db.query("select * from `exam_type` where `type_name` = '"+exam_type+"'")
    .then(result=>{
        exam_type_id = result[0].id;
        exam_type_shortcode = result[0].short_code;
        is_class = result[0].is_class;
        
    })
    let class_id = 0;
    if(subtype_id == 0 && class_no != 0 && exam_type == 'NSTSE')
    {
        await db.query("select * from `classes` where `class_no` = '"+class_no+"'")
        .then(result=>{
            class_id = result[0].id;
        })
    }

    let subtypeary = [];
  await db.query("select * from `exam_subtype` where `is_deleted` = 0 and status = 1")
  .then(result=>{
    result.forEach(element=>{
      subtypeary[element.id] = element.subtype_name;
    })
  })

    let subjects_ary = [];
    let subjects_ary_id = [];
    let subject_ids = [];
    let subjectwise_questions_count = {};
    await db.query("select * from `exam_details_competitive` where `exam_type_id` = '"+exam_type_id+"' and exam_subtype_id = '"+subtype_id+"' and class_id = '"+class_id+"' and is_deleted = 0 and status = 1 order by id asc")
    .then(exam_data=>{
        if(exam_data.length !=''){
        exam_duration = exam_data[0].total_time;
        subjects_ary = JSON.parse(exam_data[0].subjects_ary);
        }
    })   
    let subjects_ary_temp = {};
    subjects_ary.forEach(element=>{
        subject_ids.push(element['id']);
        let subjects_ary_temp_inner = {};
        (element['details']).forEach(element2=>{
            subjects_ary_temp_inner[element2['type']] = element2['value'];
            //console.log(element2,element['id'])
        })
        subjects_ary_temp[element['id']] = subjects_ary_temp_inner;
       
        subjectwise_questions_count[element['id']] = subjects_ary_temp_inner;
            
        
        
    })
    //console.log(subject_ids);
    //console.log(subjectwise_questions_count)
    //return;
    

    if(subject_ids !=''){
    let branch_codes = [];
    let branch_code_id = {};
    let branch_id_code = {};
    
    await db.query("select * from `subjects` where `id` in ("+subject_ids+")")
    .then(result=>{
        result.forEach(element=>{
            //branch_codes.push("'"+element.subject_code+"'");   
            //branch_code_id[element.subject_code] = element.id;
            branch_id_code[element.id] = element.subject_code;        
        })
    })
    //console.log("select * from `subjects` where `id` in ("+subject_ids+")")
    subject_ids.forEach(element=>{
        branch_codes.push("'"+branch_id_code[element]+"'");
        branch_code_id[branch_id_code[element]] = parseInt(element);
    })
    //console.log(branch_code_id);
    //return;
    /*
    let branch_ids = [];
   

    await db.query("select * from `branches` where `subject_id` in ("+subject_ids+")")
    .then(result=>{
        result.forEach(element=>{
            branch_ids.push(element.id);
            branch_codes.push("'"+element.branch_code+"'");
        })
    })*/
   
    var chapterslist = [];
    let chapterlist_bybranch = {};
    let chapter_id_ary = [];
    await db.query("select `chapters`.*,`subjects`.`subject_code` as branch_code from `chapters` left join `subjects` on `chapters`.`branch_id` = `subjects`.`id` where `chapters`.`branch_id` in ("+subject_ids+") and chapters.is_deleted = 0")
    .then(chapters=>{
        let i = 0;
        chapters.forEach(element=>{
            chapterslist[i] = element;
            chapter_id_ary.push(element.id);
            if(chapterlist_bybranch[element.branch_code] == null){
                chapterlist_bybranch[element.branch_code] = [];
            }
            chapterlist_bybranch[element.branch_code].push(element.id);
            i++;
        })
    })

    await db.query("select question_no,question_id from `online_exam_question_answers_competitive` where `student_id` = "+student_id+" and `exam_type`='"+exam_type+"'")
    .then(asked_questions=>{
        if(asked_questions.length > 0){ 
        asked_questions.forEach(element=>{
            asked_questionslist_no.push(element.question_no)
            asked_questionslist_id.push(element.question_id)
        })
    }
    })

    let questions = [];
//if(exam_type ==='NS')
{
    exam_type = exam_type.substring(0,2);
    let query_data = "";
  //  console.log("select * from `questions` where  `exam_category` = 2 and `branch` in ("+branch_codes+") and `chapter_id` in ("+chapter_id_ary+") and `exam_type` = '"+exam_type_shortcode+"' and `is_approve` = 1 and `is_deleted` = 0 and `id` NOT IN ("+asked_questionslist_id +") ORDER BY RAND()");
    //return;
    
    if(is_class == 0){
        query_data = "select * from `questions` where  `exam_category` = 2 and `branch` in ("+branch_codes+") and `chapter_id` in ("+chapter_id_ary+") and `exam_type` = '"+exam_type_shortcode+"' and `is_approve` = 1 and `is_deleted` = 0 and `demo_exam` = 0 and `id` NOT IN ("+asked_questionslist_id +") ORDER BY RAND(),branch_id ASC";
    }
    else{
        query_data = "select * from `questions` where  `exam_category` = 2 and `branch` in ("+branch_codes+") and `chapter_id` in ("+chapter_id_ary+") and `exam_type` = '"+exam_type_shortcode+"' and `class` = "+class_no+" and `is_approve` = 1 and `is_deleted` = 0 and `demo_exam` = 0 and `id` NOT IN ("+asked_questionslist_id +") ORDER BY RAND(),branch_id ASC";
    }   
    
    //console.log(query_data);
    //return;
    await db.query(query_data)
    .then(result=>{
        result.forEach(element=>{
             if(asked_questionslist_no.indexOf(element.id) == -1 || asked_questionslist_no.indexOf(element.id) == 0)
            {
                questions.push(element);
            }
        })
    })
}

questions.sort(function(a, b){
    return a.branch_id - b.branch_id;
});
    //return;
    subjects_ary = subjects_ary_temp;
   // console.log(subjects_ary);
    let question_count = {};
    for (const [key, value] of Object.entries(branch_code_id)) {
        
        let examtype_counter = {};
        let total_question_typeer = {};
        let branch_code = key;
        //console.log(branch_code,value)
       
        for (const [key2, value2] of Object.entries(subjects_ary[value])) {
            examtype_counter[key2] = 0;
            total_question_typeer[key2] = value2;
            let i = 0;
            let j = 0;
        }
        question_count[branch_code] = (total_question_typeer);
    }
    //console.log("question_count",branch_code_id);
    for (const [key, value] of Object.entries(branch_code_id)) {
        let i = 0;
        let examtype_counter = {};
        let branch_code = key;
        //console.log(branch_code,value)
        for (const [key2, value2] of Object.entries(subjects_ary[value])) {
            examtype_counter[key2] = 0;
            
            let total_questions = 0;
            for (const [key3, value3] of Object.entries(question_count[branch_code])) {
                total_questions += parseInt(value3);
            } 

            //console.log(max_question_no,total_questions, chapterlist_bybranch[branch_code].length)
            let j = 0;
            let selected_ch = [];
           
            questions.forEach(element_inner2=>{
                if (question_count[branch_code][element_inner2.question_type] > i){
                    
                    let counter = 1;
                    for (item of selected_ch.flat()) {
                        if (item == element_inner2.branch_id) {
                            counter++;
                        }
                    };
             
                    if(!selected_ch.includes(element_inner2.chapter_id) || (selected_ch.length >= chapterlist_bybranch[branch_code].length))
                    //if(max_question_no >= counter)
                    {
                        if(element_inner2.branch == branch_code)
                        {
                           // console.log(element_inner2.branch)
                            selected_ch.push(element_inner2.chapter_id);
                            let options_details = [];
                            let options_details_image = [];
                            delete element_inner2.is_deleted;
                            delete element_inner2.status;
                            delete element_inner2.created_at;
                            delete element_inner2.updated_at;
                           

                        let question_image_ary = element_inner2['question_image'].split(',');
                        let counter = 1;
let final_question = element_inner2['question'];

question_image_ary.forEach(question_image=>{
    
    let tagname = "#Img"+counter;
    
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
    counter++;

    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
    {
        final_question = (final_question.replaceAll("../assets/special_charectors",'assets/special_charectors'))
        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
    }
    special_charectors_tags.forEach(tag_name=>{
    
        let tagname = "#"+tag_name;
        let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
        const replacer = new RegExp(tagname.toString(), 'g');
       
        final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
    
    })
})

////////////////////////////////////////////////////
let option_image_ary = element_inner2['option_a_image'].split(',');
let counter_option_a = 1;
let final_question_option_a = element_inner2['option_a'];
option_image_ary.forEach(option_image=>{
    let tagname = "#Img"+counter_option_a;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_a++;
})
if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
    final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
}

special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////
////////////////////////////////////////////////////
let option_image_ary_b = element_inner2['option_b_image'].split(',');

let counter_option_b = 1;
let final_question_option_b = element_inner2['option_b'];
option_image_ary_b.forEach(option_image=>{
    let tagname = "#Img"+counter_option_b;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_b++;
})
if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
    final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
}
special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////

////////////////////////////////////////////////////
let option_image_ary_c = element_inner2['option_c_image'].split(',');
let counter_option_c = 1;
let final_question_option_c = element_inner2['option_c'];
option_image_ary_c.forEach(option_image=>{
    let tagname = "#Img"+counter_option_c;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_c++;
})
if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
    final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
}
special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////

 ////////////////////////////////////////////////////
 let option_image_ary_d = element_inner2['option_d_image'].split(',');
 let counter_option_d = 1;
 let final_question_option_d = element_inner2['option_d'];
 option_image_ary_d.forEach(option_image=>{
     let tagname = "#Img"+counter_option_d;
     const replacer = new RegExp(tagname.toString(), 'g');
     final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
     counter_option_d++;
 })
 if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
 {
    final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
    final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
 }
 special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
 ///////////////////////////////////////////////////////////

 ////////////////////////////////////////////////////
 let supporting_reason_ary = element_inner2['supporting_reason'].split(',');
 let counter_supporting_reason = 1;
 let final_question_reason = element_inner2['reason'];
 supporting_reason_ary.forEach(option_image=>{
     let tagname = "#Img"+counter_supporting_reason;
     const replacer = new RegExp(tagname.toString(), 'g');
     final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')

     counter_supporting_reason++;
 })

 special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')

})
 ///////////////////////////////////////////////////////////

 element_inner2['question'] = final_question;
 element_inner2['option_a'] = final_question_option_a;
 element_inner2['option_b'] = final_question_option_b;
 element_inner2['option_c'] = final_question_option_c;
 element_inner2['option_d'] = final_question_option_d;
 element_inner2['reason'] = final_question_reason;
 element_inner2['exam_subtype'] = subtypeary[subtype_id];

options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
"D":final_question_option_d});
element_inner2['options'] = options_details;
element_inner2['answer'] = CryptoJS.AES.encrypt(element_inner2['answer'], process.env.CRYPTO).toString();

                            element_inner2['exam_duration'] = exam_duration * 60;
                            element_inner2['total_attempts'] = 1;
                            element_inner2['question_counter'] = question_counter;
                            questionslist_set1.push(element_inner2);
                            question_counter++;
                            i++;
                            
                        }
                    }
                    
                }
                
            }) 
           
        }
        //console.log(questionslist_set1)
      }
    }
if(questionslist_set1!=''){
   await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`, `subject_id`, `examdata`) \
    VALUES ("'+student_id+'",2,1,"'+exam_duration * 60+'",'+exam_type_id+','+board+','+exam_subtype+',0,'+data.set_no+',"0","'+encodeURI(JSON.stringify(questionslist_set1))+'")');
}
      response = {status: config.successStatus, msg: "Cometitive exam data", questions:questionslist_set1};
      return response;
}

async function onlineexamcompetitivequestion_nstse(data){
   
    var questionslist_set1 = [];
    var questionslist_set2 = [];
    let response = {};
    let demoquestions = [];
    let questions_no_config = [];
    let result = [];
    const subject_id = data.subject_id;
    const student_id = data.student_id;
    let exam_type = data.exam_type;
    let configuration_details = "";
    let asked_questionslist_no =  [0];
    let asked_questionslist_id =  [0];
    let question_counter = 1;

    let special_charectors_tags =  [];
    const class_no = data.standard;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })
    ///////////////////// Exam Duration Section //////////////////////////////////
    let exam_duration = 0; // 20 min exam duration
    let exam_type_id = 0;  
    let subtype_id = data.subtype_id;
    await db.query("select * from `exam_type` where `type_name` = '"+exam_type+"'")
    .then(result=>{
        exam_type_id = result[0].id;
    })
    let class_id = 0;
    if(subtype_id == 0)
    {
        await db.query("select * from `classes` where `class_no` = '"+standard+"'")
        .then(result=>{
            class_id = result[0].id;
        })
    }
    let subjects_ary = [];
    let subjects_ary_id = [];
    let subject_ids = [];
    await db.query("select * from `exam_details_competitive` where `exam_type_id` = '"+exam_type_id+"' and exam_subtype_id = '"+subtype_id+"' and class_id = '"+class_id+"' and is_deleted = 0 and status = 1")
    .then(exam_data=>{
        if(exam_data.length !=''){
        exam_duration = exam_data[0].total_time * 60;
        subjects_ary = JSON.parse(exam_data[0].subjects_ary);
        }
    })   
    let subjects_ary_temp = {};
    subjects_ary.forEach(element=>{
        subject_ids.push(element['id']);
        let subjects_ary_temp_inner = {};
        (element['details']).forEach(element2=>{
            subjects_ary_temp_inner[element2['type']] = element2['value'];
            //console.log(element2,element['id'])
        })
        subjects_ary_temp[element['id']] = subjects_ary_temp_inner;
    })
   
   
    if(subject_ids !=''){
    let branch_codes = [];
    let branch_code_id = {};
    await db.query("select * from `subjects` where `id` in ("+subject_ids+")")
    .then(result=>{
        result.forEach(element=>{
            branch_codes.push("'"+element.subject_code+"'");   
            branch_code_id[element.subject_code] = element.id;        
        })
    })
    
   
    var chapterslist = [];
    await db.query("select `chapters`.*,`branches`.`branch_code` from `chapters` left join `branches` on `chapters`.`branch_id` = `branches`.`id` where `chapters`.`branch_id` in ("+subject_ids+")")
    .then(chapters=>{
        let i = 0;
        chapters.forEach(element=>{
            chapterslist[i] = element;
            i++;
        })
    })
//console.log(chapterslist);
//return;
    
    await db.query("select question_no,question_id from `online_exam_question_answers` where `student_id` = "+student_id)
    .then(asked_questions=>{
        if(asked_questions.length > 0){ 
        asked_questions.forEach(element=>{
            asked_questionslist_no.push(element.question_no)
            asked_questionslist_id.push(element.question_id)
        })
    }
    })

    let questions = [];
//if(exam_type ==='NS')
{
    exam_type = exam_type.substring(0,2);
    let query_data = "";
    if(subtype_id == 0){
        query_data = "select * from `questions` where  `exam_category` = 2 and `branch` in ("+branch_codes+") and `exam_type` = '"+exam_type+"' and `class` = "+class_no+" and `is_approve` = 1 and `is_deleted` = 0 and `demo_exam` = 0 and `id` NOT IN ("+asked_questionslist_id +") ORDER BY RAND(), chapter_id asc";
    }else{
        query_data = "select * from `questions` where  `exam_category` = 2 and `branch` in ("+branch_codes+") and `exam_type` = '"+exam_type+"' and `is_approve` = 1 and `is_deleted` = 0 and `demo_exam` = 0 and `id` NOT IN ("+asked_questionslist_id +") ORDER BY RAND(), chapter_id asc";
    }
    await db.query(query_data)
    .then(result=>{
        result.forEach(element=>{
             if(asked_questionslist_no.indexOf(element.question_no) == -1 || asked_questionslist_no.indexOf(element.question_no) == 0)
            {
                questions.push(element);
            }
        })
    })
}

questions.sort(function(a, b){
    return a.chapter_id - b.chapter_id;
});

    subjects_ary = subjects_ary_temp;
    
    let question_count = {};
    for (const [key, value] of Object.entries(branch_code_id)) {
        
        let examtype_counter = {};
        let total_question_typeer = {};
        let branch_code = key;
        //console.log(branch_code,value)
       
        for (const [key2, value2] of Object.entries(subjects_ary[value])) {
            examtype_counter[key2] = 0;
            total_question_typeer[key2] = value2;
            let i = 0;
            let j = 0;
            let selected_ch = [];
        }
        question_count[branch_code] = (total_question_typeer);
    }
    
    for (const [key, value] of Object.entries(branch_code_id)) {
        let i = 0;
        let examtype_counter = {};
        let branch_code = key;
        //console.log(branch_code,value)
        for (const [key2, value2] of Object.entries(subjects_ary[value])) {
            examtype_counter[key2] = 0;
            
            
            let j = 0;
            let selected_ch = [];
           
            questions.forEach(element_inner2=>{
                if (question_count[branch_code][element_inner2.question_type] > i){
                    
                     
                    //if(!selected_ch.includes(element_inner2.chapter))
                    {
                        if(element_inner2.branch == branch_code){
                            //console.log(element_inner2.branch)
                            selected_ch.push(element_inner2.chapter);
                            let options_details = [];
                            let options_details_image = [];
                            delete element_inner2.is_deleted;
                            delete element_inner2.status;
                            delete element_inner2.created_at;
                            delete element_inner2.updated_at;
                           

                        let question_image_ary = element_inner2['question_image'].split(',');
                        let counter = 1;
let final_question = element_inner2['question'];

question_image_ary.forEach(question_image=>{
    
    let tagname = "#Img"+counter;
    
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
    counter++;

    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
    {
        final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
    }

    special_charectors_tags.forEach(tag_name=>{
    
        let tagname = "#"+tag_name;
        let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
        const replacer = new RegExp(tagname.toString(), 'g');
       
        final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
    
    })
})

////////////////////////////////////////////////////
let option_image_ary = element_inner2['option_a_image'].split(',');
let counter_option_a = 1;
let final_question_option_a = element_inner2['option_a'];
option_image_ary.forEach(option_image=>{
    let tagname = "#Img"+counter_option_a;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_a++;
})
if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
    final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'));
}

special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////
////////////////////////////////////////////////////
let option_image_ary_b = element_inner2['option_b_image'].split(',');

let counter_option_b = 1;
let final_question_option_b = element_inner2['option_b'];
option_image_ary_b.forEach(option_image=>{
    let tagname = "#Img"+counter_option_b;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_b++;
})
if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
    final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'));
}

special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////

////////////////////////////////////////////////////
let option_image_ary_c = element_inner2['option_c_image'].split(',');
let counter_option_c = 1;
let final_question_option_c = element_inner2['option_c'];
option_image_ary_c.forEach(option_image=>{
    let tagname = "#Img"+counter_option_c;
    const replacer = new RegExp(tagname.toString(), 'g');
    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
    counter_option_c++;
})
if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
{
    final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
    final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'));
}
special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
///////////////////////////////////////////////////////////

 ////////////////////////////////////////////////////
 let option_image_ary_d = element_inner2['option_d_image'].split(',');
 let counter_option_d = 1;
 let final_question_option_d = element_inner2['option_d'];
 option_image_ary_d.forEach(option_image=>{
     let tagname = "#Img"+counter_option_d;
     const replacer = new RegExp(tagname.toString(), 'g');
     final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
     counter_option_d++;
 })
 if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
 {
    final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
    final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
    final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'));
 }
 special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
   
    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')

})
 ///////////////////////////////////////////////////////////

 ////////////////////////////////////////////////////
 let supporting_reason_ary = element_inner2['supporting_reason'].split(',');
 let counter_supporting_reason = 1;
 let final_question_reason = element_inner2['reason'];
 supporting_reason_ary.forEach(option_image=>{
     let tagname = "#Img"+counter_supporting_reason;
     const replacer = new RegExp(tagname.toString(), 'g');
     final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')

     counter_supporting_reason++;
 })

 special_charectors_tags.forEach(tag_name=>{
    
    let tagname = "#"+tag_name;
    let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
    const replacer = new RegExp(tagname.toString(), 'g');
    
    final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')

})
 ///////////////////////////////////////////////////////////

 element_inner2['question'] = final_question;
 element_inner2['option_a'] = final_question_option_a;
 element_inner2['option_b'] = final_question_option_b;
 element_inner2['option_c'] = final_question_option_c;
 element_inner2['option_d'] = final_question_option_d;
element_inner2['reason'] = final_question_reason;

options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
"D":final_question_option_d});
element_inner2['options'] = options_details;

                            element_inner2['exam_duration'] = exam_duration * 60;
                            element_inner2['total_attempts'] = 1;
                            element_inner2['question_counter'] = question_counter;
                            questionslist_set1.push(element_inner2);
                            question_counter++;
                            i++;
                            
                        }
                    }
                }
            }) 
        }
        //console.log(questionslist_set1)
      }
    }

    await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`, `subject_id`, `examdata`) \
    VALUES ("'+student_id+'",2,1,"'+exam_duration * 60+'",2,"0","0","0",'+data.set_no+',"0","'+encodeURI(JSON.stringify(questionslist))+'")');
      response = {status: config.successStatus, msg: "Cometitive exam data", questions:questionslist_set1};
      return response;
}

async function get_random_question(question_count, questionslist_set1, branch_id){
    const random_chapter = await db.query(`select * from chapters where branch_id = '`+branch_id+`' order by rand()`);
    for (chapter of random_chapter) {
        //console.log("@2");
        if (questionslist_set1.length < question_count) {
           // console.log("@3");
            const question = await db.query(`select * from questions where chapter = '`+chapter.short_code+`' and is_approve = 1 and is_deleted = 0 order by rand() limit 1`);
            if (question.length > 0) {
                questionslist_set1.push(question[0]);
            }
        }
        else{
           // console.log("@4");
            return questionslist_set1;
        }
    }
    get_random_question(question_count, questionslist_set1, branch_id);
}

async function getdemoexamgivencount(data){
    
    /// 0=live,1=guest demo,2=registered demo 	
   let student_id = data.student_id;
    let demoquestionscount_registered =  await db.query("select * from `demo_question_answers` where `student_status` = 1 and `student_id` = "+student_id+" group by exam_category_id order by exam_category_id asc");
    let demoquestionscount_guest =  await db.query("select * from `demo_question_answers` where `student_id` = "+student_id+" and `student_status` = 0 group by exam_category_id order by exam_category_id asc");    
    let demoquestionscount = [];
    let counter = 0;
    let expired_days = 7;
    let expired_text = "Demo assessment expired";
    demoquestionscount_guest.forEach(element=>{
        let headingmsg = "";
        let is_expired = 0;
        
        if(element.exam_category_id == 1){
            headingmsg = "Demo scholastic assessment";
        }
        else if(element.exam_category_id == 2){
            headingmsg = "Demo competitive assessment";
        }
        var d1 = new Date(element.created_at);   
        var d2 = new Date();   
            
        var diff = d2.getTime() - d1.getTime();   
            
        var daydiff = diff / (1000 * 60 * 60 * 24); 
        if(expired_days < daydiff){
            is_expired = 1;
        }
        demoquestionscount.push({"exam_category_id":element.exam_category_id,"student_status":element.student_status,
        "student_id":element.student_id,"headingmsg":headingmsg ,"subheading":"Guest user","exam_date":element.created_at,"is_expired":is_expired,"expired_text":expired_text,"exam_end_date":element.created_at,});
    })

    demoquestionscount_registered.forEach(element2=>{
        let is_expired = 0;
        if(element2.exam_category_id){
            if(element2.exam_category_id == 1){
                headingmsg = "Demo Scholastic assessment";
            }
            else if(element2.exam_category_id == 2){
                headingmsg = "Demo Competitive assessment";
            }    

            var d1 = new Date(element2.created_at);   
        var d2 = new Date();   
            
        var diff = d2.getTime() - d1.getTime();   
            
        var daydiff = diff / (1000 * 60 * 60 * 24); 
        if(expired_days < daydiff){
            is_expired = 1;
        }
            demoquestionscount.push({"exam_category_id":element2.exam_category_id,"student_status":element2.student_status,
            "student_id":element2.student_id,"headingmsg":headingmsg,"subheading":"Registered user","exam_date":element2.created_at,"is_expired":is_expired,"expired_text":expired_text});
        }
    })
        let response = {status: config.successStatus, msg: "Demo exam data", demoquestionscount:demoquestionscount};
        return response;
}

async function getdemoassessmentdetails(data){
    let demoquestions = [];
    /// 0=live,1=guest demo,2=registered demo 	
   
    let demoquestions_ans =  await db.query("select * from `demo_question_answers` where `exam_category_id` = "+data.exam_category_id+" and `student_status` = "+data.student_status+" and `student_id` = "+data.student_id);
    
    let response = {status: config.successStatus, msg: "Demo exam data", demoquestions_ans:demoquestions_ans};
        return response;
}

////////////////////// MODULE SECTION //////////////////////////
async function examscholaticquestion_module(data,userdata){
    let questionslist = [];
    let demoquestions = [];
    let casestudy_demoquestions = [];
    let demoquestions_interm = [];
    let questions_no_config = [];
    let subject_id = data.subject_id;
    let group_subject_id = data.group_subject_id;
    let branch_ids = [];
    let asked_questionslist_no = [0];
    let asked_questionslist_id = [0];
    let student_id = userdata.id;
    let subject_name = "";
    let class_id = "";
    let configuration_details = "";
    let examtype_counter = {};
    let bundle_purchased_status = 0;
    let question_counter = 1;

    await db.query("INSERT INTO `exam_chapter_interm_store`(`student_id`, `chapters`, `subject_group_id`,`subject_id`, `board`,\
    `standard`,`exam_type`) VALUES ("+student_id+",'"+data.chapter_id+"','"+group_subject_id+"','"+subject_id+"','"+data.board+"','"+data.standard+"',2)")

    ///////////////////// Exam Duration Section //////////////////////////////////
    let exam_duration = 0; // 20 min exam duration
         
    await db.query("select * from `boards` where `short_code` = '"+data.board+"'")
    .then(branchdata=>{
        board_id = branchdata[0].id;
    })
    await db.query("select * from `classes` where `class_no` = '"+data.standard+"'")
    .then(classdata=>{
        class_id = classdata[0].id;
    })   

    await db.query("select * from `exam_details_scholastic` where `class_id` = "+class_id+" and `exam_category_id` = 1 and\
     `board_id` ="+board_id+" and `subject_id` ="+subject_id+" and type_exam = 2")
    .then(exam_time=>{
        if(exam_time.length > 0){
         
            exam_duration = exam_time[0].total_time * 60;
            configuration_details = JSON.parse(exam_time[0].question_type);
        }
    })
    let total_question_tobeasked = 0;
    var values = (Object.values(configuration_details));
    for (var i = 0; i < values.length; i++) {
        total_question_tobeasked += parseInt(values[i]);
    }

    var keys = Object.keys(configuration_details);
    for (var i = 0; i < keys.length; i++) {
        let keyname = keys[i];

        examtype_counter[keyname] = 0;
    }
    ///////////////////// Exam Duration Section END //////////////////////////////////
    

    await db.query("select question_no,question_id from `online_exam_question_answers` where `student_id` = "+student_id)
    .then(asked_questions=>{
        if(asked_questions.length > 0){ 
        asked_questions.forEach(element=>{
            asked_questionslist_no.push(element.question_no)
            asked_questionslist_id.push(element.question_id)
        })
    }
    })
    ////////////////// CHECK CASE STUDY PURCHASED OR NOT ////////////////////////////
    await db.query("select * from `purchased_subscribtions_details` where `class` = "+class_id+" and `exam_category_id` = 1 and\
    `subject_id` ="+subject_id+" and exam_type_id = 2 and `student_id` = "+student_id)
    .then(bundle_purchased=>{
        if(bundle_purchased.length > 0){
            bundle_purchased.forEach(element=>{
                if(element.no_casestudy == 1){
                    bundle_purchased_status = element.no_casestudy;
                }
            }) 
        }
    })
     ///////////////////// Exam Completed Section //////////////////////////////////
     let chapter_id = []   
     chapter_id = data.chapter_id;
     /*await db.query("select * from `exam_completed` where `student_id` = "+student_id+" and `subject_id` = "+subject_id+" and `exam_type` = 1")
     .then(completedchapterdata=>{
        completedchapterdata.forEach(element=>{
            chapter_id.push(element.chapter_id);
        })
     })*/   
    // console.log(chapter_id)
     ///////////////////// Exam Completed Section END //////////////////////////////////

    /*await db.query("select * from `branches` where `subject_id` = "+subject_id)
    .then(result=>{
        result.forEach(element=>{
            branch_ids.push("'"+element.branch_code+"'")
        })
    })*/
    
    let subject_name_list = [];
    await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and group_exist = 2")
    .then(result=>{
        result.forEach(element=>{
            subject_name_list[element['id']] = element;
        })
    })

    await db.query("select * from `subjects` where `id` = "+subject_id)
    .then(result=>{
        subject_name = result[0].name;
        if(result[0].group_exist == 2)
        {
            branch_ids.push("'"+result[0].subject_code+"'");
        }else if(result[0].group_exist == 1){
            let group_subjectsary = (result[0].group_subjects).split(",");
            group_subjectsary.forEach(element=>{
                
                branch_ids.push("'"+subject_name_list[element].subject_code+"'");
            })
        }
    })

 
    ////////////////// CASE STUDY SECTION //////////////////////////
    let casestudy_questions_ary = [];
    let case_study_qns_no = 0;
    let counter = 0;
    
    
        if(configuration_details['CSS']){
            case_study_qns_no = configuration_details['CSS'];
        }
        let attended_css_questions = [];
        await db.query("select online_exam_question_answers.*,questions.question_type,questions.css_group_id from `online_exam_question_answers` left join questions on questions.id = online_exam_question_answers.question_id where questions.question_type = 'CSS' and `student_id` = "+student_id)
        .then(result=>{
            result.forEach(element=>{
                attended_css_questions.push(element.css_group_id);
            })
        }) 
     
 
        await db.query("select * from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"' and `branch` in ("+branch_ids+") and `chapter_id` in ("+chapter_id+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `question_type` = 'CSS' group by css_group_id")
        .then(result=>{
            result.forEach(element=>{
          
                if(case_study_qns_no > counter)
                {
                    if(!attended_css_questions.includes(element.css_group_id))
                    {
                        casestudy_questions_ary.push("'"+element.css_group_id+"'");
                        counter++;
                    }
                }
            })
        })   

        if(casestudy_questions_ary != "" && casestudy_questions_ary != undefined && casestudy_questions_ary.length > 0)
        {    
            //casestudy_demoquestions =  await db.query("select * from `questions` where `exam_category` = 1 and `css_group_id` in ("+casestudy_questions_ary+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `question_type` = 'CSS'");
        }
    
    
    ///////////////////////////////////////////////////
    let interm_question_ids = [];
    await db.query("select * from `interm_storeexamdata` where `student_id` = "+userdata.id)
    .then(async result=>{
       
       if(result.length > 0)
       {
            result.forEach(element=>{
                interm_exam_exist = 1;
                exam_data = element.examdata;
                let exam_questioon_data = {};
                exam_questioon_data = JSON.parse(decodeURI(exam_data));
                exam_questioon_data.forEach(element=>{
                    if(element.id > 0){ 
                    interm_question_ids.push(element.id);
                    }
                })
            })
       }
   })

   if(interm_question_ids.length > 0){
    interm_question_ids.forEach(element_ques=>{
     if(element_ques > 0){   
        asked_questionslist_id.push(element_ques);
     }
    })
}

    demoquestions =  await db.query("select * from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"'\
    and `branch` in ("+branch_ids+") and `chapter_id` in ("+chapter_id+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `id` NOT IN ("+asked_questionslist_id+") ORDER BY RAND(), chapter_id ASC");    

    
   
    //exam_duration = 20; // 20 min exam duration
    demoquestions.sort(function(a, b){
        return a.chapter_id - b.chapter_id;
    });
    if(demoquestions.length > 0)
    {
        demoquestions = await pullmockmodule_questions(configuration_details,demoquestions,chapter_id);
        let selected_ch = [];
        
        demoquestions.forEach((element)=>{
               
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
              
                
                //asked_questions_no_ary.push(element['id']);
                let question_image_ary = element['question_image'].split(',');
                let counter = 1;
                    let final_question = element['question'];

                    question_image_ary.forEach(question_image=>{

                    let tagname = "#Img"+counter;

                    const replacer = new RegExp(tagname.toString(), 'g');
                    //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                    //console.log(string.replace(replacer, '/'));

                    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                    counter++;
                    })
                    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question = (final_question.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ////////////////////////////////////////////////////
                    let option_image_ary = element['option_a_image'].split(',');
                    let counter_option_a = 1;
                    let final_question_option_a = element['option_a'];
                    option_image_ary.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_a;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_a++;
                    })
                    if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                        final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    ///////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////
                    let option_image_ary_b = element['option_b_image'].split(',');

                    let counter_option_b = 1;
                    let final_question_option_b = element['option_b'];
                    option_image_ary_b.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_b;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_b++;
                    })
                    if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_c = element['option_c_image'].split(',');
                    let counter_option_c = 1;
                    let final_question_option_c = element['option_c'];
                    option_image_ary_c.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_c;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_c++;
                    })
                    if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_d = element['option_d_image'].split(',');
                    let counter_option_d = 1;
                    let final_question_option_d = element['option_d'];
                    option_image_ary_d.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_d;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_d++;
                    })
                    if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////
                    element['question'] = final_question;
                    element['option_a'] = final_question_option_a;
                    element['option_b'] = final_question_option_b;
                    element['option_c'] = final_question_option_c;
                    element['option_d'] = final_question_option_d;
                    element['subject_name'] = subject_name;
                    options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
                    "D":final_question_option_d});
                    element['options'] = options_details;

                    element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
                element['exam_duration'] = exam_duration;
                element['total_attempts'] = 1;
                element['question_counter'] = question_counter;    
                questionslist.push(element);
                question_counter++;
                
        })
    }
////////////// CASE STUDY SECTION //////////////////
let question_groups = [];
    
    if(casestudy_demoquestions.length > 0)
    {
        casestudy_demoquestions.forEach((element)=>{
            if(!question_groups.includes(element.css_group_id) && element.css_group_id !="" && element.css_group_id != null)
            {
                question_groups.push(element.css_group_id);
            }
                //examtype_counter[element.question_type] = 1; 
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
                
                let question_image_ary = element['question_image'].split(',');
                let counter = 1;
                    let final_question = element['question'];

                    question_image_ary.forEach(question_image=>{

                    let tagname = "#Img"+counter;

                    const replacer = new RegExp(tagname.toString(), 'g');
                    
                    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                    counter++;
                    })
                    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question = (final_question.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ////////////////////////////////////////////////////
                    let option_image_ary = element['option_a_image'].split(',');
                    let counter_option_a = 1;
                    let final_question_option_a = element['option_a'];
                    option_image_ary.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_a;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_a++;
                    })
                    if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////
                    let option_image_ary_b = element['option_b_image'].split(',');

                    let counter_option_b = 1;
                    let final_question_option_b = element['option_b'];
                    option_image_ary_b.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_b;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_b++;
                    })
                    if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_c = element['option_c_image'].split(',');
                    let counter_option_c = 1;
                    let final_question_option_c = element['option_c'];
                    option_image_ary_c.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_c;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_c++;
                    })
                    if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_d = element['option_d_image'].split(',');
                    let counter_option_d = 1;
                    let final_question_option_d = element['option_d'];
                    option_image_ary_d.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_d;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_d++;
                    })
                    if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    
                    ///////////////////////////////////////////////////////////
                    element['question'] = final_question;
                    element['option_a'] = final_question_option_a;
                    element['option_b'] = final_question_option_b;
                    element['option_c'] = final_question_option_c;
                    element['option_d'] = final_question_option_d;
                    element['subject_name'] = subject_name;
                    options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
                    "D":final_question_option_d});
                    element['options'] = options_details;

                    element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
                element['exam_duration'] = exam_duration * 60;
                element['question_counter'] = (question_counter+(parseInt(question_groups.indexOf(element.css_group_id))))+"."+convert_text_toroman(element.question_no.slice(-1));    
                questionslist.push(element);
        })
    }
    
if(questionslist.length > 0){
    await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`,`subject_group_id`, `subject_id`, `examdata`) \
    VALUES ("'+student_id+'",1,1,"'+exam_duration+'",2,"'+userdata.board+'","0","0","'+data.set_no+'","'+group_subject_id+'","'+subject_id+'","'+encodeURI(JSON.stringify(questionslist))+'")');
}
    //console.log(examtype_counter);
        let response = {status: config.successStatus, msg: "Online exam data module",exam_duration:exam_duration, data:questionslist,total_attempts:1};
        return response;
}

////////////////////////////////////////// MOCK SECTION ////////////////////////////////
async function examscholaticquestion_mock(data,userdata){
    let questionslist = [];
    let all_question_pool = [];
    let final_question_pool = [];
    let questions_no_config = [];
    let casestudy_demoquestions = [];
    let subject_id = data.subject_id;
    let group_subject_id = data.group_subject_id;
    let branch_ids = [];
    let asked_questionslist_no =  [0];
    let asked_questionslist_id =  [0];
    let common_questionslist_id =  [0];
    let subject_name = "";
    let student_id = userdata.id;
    let examtype_counter = {};
    let configuration_details = "";
    let bundle_purchased_status = 0;
    let question_counter = 1;
     await db.query("select * from `subjects` where `id` = "+subject_id)
    .then(result=>{
        result.forEach(element=>{
            if(element.group_subjects)
            branch_ids.push(element.group_subjects)
        })
    })
  
    await db.query("INSERT INTO `exam_chapter_interm_store`(`student_id`, `chapters`,`subject_group_id`, `subject_id`, `board`,\
     `standard`,`exam_type`) VALUES ("+student_id+",'"+data.chapter_id+"','"+group_subject_id+"','"+subject_id+"','"+data.board+"','"+data.standard+"',3)")
     ///////////////////// Exam Completed Section END ////////////////////////////////// */


     ////////////////// CHECK CASE STUDY PURCHASED OR NOT ////////////////////////////
    
    await db.query("select * from `purchased_subscribtions_details` where `class` = "+data.standard+" and `exam_category_id` = 1 and\
    `subject_id` ="+subject_id+" and exam_type_id = 2 and `student_id` = "+student_id)
    .then(bundle_purchased=>{
        if(bundle_purchased.length > 0){ 
            bundle_purchased_status = bundle_purchased[0].no_casestudy;
        }
    })

     let exam_duration = 0; // 20 min exam duration
     let total_question_no = 0;    
    await db.query("select * from `boards` where `short_code` = '"+data.board+"'")
    .then(branchdata=>{
        board_id = branchdata[0].id;
    })
    await db.query("select * from `classes` where `class_no` = '"+data.standard+"'")
    .then(classdata=>{
        class_id = classdata[0].id;
    })   
    await db.query("select * from `exam_details_scholastic` where `class_id` = "+class_id+" and `exam_category_id` = 1 and\
     `board_id` ="+board_id+" and `subject_id` ="+subject_id+" and type_exam = 3")
    .then(exam_time=>{
        if(exam_time.length > 0){
            total_question_no = exam_time[0].total_no_question;
            exam_duration = exam_time[0].total_time * 60;
            configuration_details = JSON.parse(exam_time[0].question_type);
        }
    })

    let total_question_tobeasked = 0;
    var values = (Object.values(configuration_details));
    for (var i = 0; i < values.length; i++) {
        total_question_tobeasked += parseInt(values[i]);
    }

    var keys = Object.keys(configuration_details);
    for (var i = 0; i < keys.length; i++) {
        let keyname = keys[i];

        examtype_counter[keyname] = 0;
    }

    ///////////////////// Exam Duration Section END //////////////////////////////////

    let commom_question_no = Math.round(total_question_no * 0.50);
    await db.query("select questions.chapter_id,online_exam_question_answers.question_no,online_exam_question_answers.question_id from online_exam_question_answers left join questions on questions.id = online_exam_question_answers.question_id where online_exam_question_answers.student_id = "+student_id+" and questions.chapter_id IN ("+data.chapter_id+")")
    .then(asked_questions=>{
        if(asked_questions.length > 0){ 
            let i = 0;
        asked_questions.forEach(element=>{
            if(commom_question_no > i)
            { 
                common_questionslist_id.push(element.question_id)
            }  
                asked_questionslist_no.push(element.question_no)
                asked_questionslist_id.push(element.question_id)
            
            i++;
        })
    }
    })

     ///////////////////// Exam Completed Section //////////////////////////////////
     let chapter_id = [];   
     chapter_id = data.chapter_id;
     
    let subject_name_list = [];
    await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and group_exist = 2")
    .then(result=>{
        result.forEach(element=>{
            subject_name_list[element['id']] = element;
        })
    })

    await db.query("select * from `subjects` where `id` = "+subject_id)
    .then(result=>{
        subject_name = result[0].name;
        if(result[0].group_exist == 2)
        {
            if(result[0].subject_code)
                branch_ids.push("'"+result[0].subject_code+"'");
        }else if(result[0].group_exist == 1){
            let group_subjectsary = (result[0].group_subjects).split(",");
            group_subjectsary.forEach(element=>{
                if(subject_name_list[element].subject_code)
                    branch_ids.push("'"+subject_name_list[element].subject_code+"'");
            })
        }
    })

   
    ////////////////// CASE STUDY SECTION //////////////////////////
    let casestudy_questions_ary = [];
    let case_study_qns_no = 2;
    let counter = 0;
    
        let attended_css_questions = [];
        await db.query("select online_exam_question_answers.*,questions.question_type,questions.css_group_id from `online_exam_question_answers` left join questions on questions.id = online_exam_question_answers.question_id where questions.question_type = 'CSS' and `student_id` = "+student_id)
            .then(result=>{
                result.forEach(element=>{
                    attended_css_questions.push(element.css_group_id);
                })
            }) 
         
        if(configuration_details['CSS'])    
            case_study_qns_no = configuration_details['CSS'];


        await db.query("select * from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"' and `branch` in ("+branch_ids+") and `chapter_id` in ("+chapter_id+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `question_type` = 'CSS' group by css_group_id order by css_group_id desc")
        .then(result=>{
            result.forEach(element=>{
                if(case_study_qns_no > counter)
                {
                    if(!attended_css_questions.includes(element.css_group_id))
                    {
                        casestudy_questions_ary.push("'"+element.css_group_id+"'");
                        counter++;
                    }
                }
            })
        })        
    

    ///////////////////////////////////////////////////
    let interm_question_ids = [];
    await db.query("select * from `interm_storeexamdata` where `student_id` = "+student_id)
    .then(async result=>{
       
       if(result.length > 0)
       {
            result.forEach(element=>{
                interm_exam_exist = 1;
                exam_data = element.examdata;
                let exam_questioon_data = {};
                exam_questioon_data = JSON.parse(decodeURI(exam_data));
                exam_questioon_data.forEach(element=>{
                    if(element.id > 0){ 
                    interm_question_ids.push(element.id);
                    }
                })
            })
       }
   })

   if(interm_question_ids.length > 0){
    interm_question_ids.forEach(element_ques=>{
     if(element_ques > 0){   
        asked_questionslist_id.push(element_ques);
     }
    })
}

    let demoquestions_1 =  await db.query("select questions.* from `questions` where `is_deleted` = 0 and `is_approve` = 1 and `id` IN ("+common_questionslist_id+") ORDER BY RAND()");
    
    let demoquestions_2 =  await db.query("select questions.* from `questions` where `exam_category` = 1 and  `exam_type` ='"+data.board+"' and `class` ='"+data.standard+"' and `branch` in ("+branch_ids+") and `chapter_id` in ("+chapter_id+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1 and `id` NOT IN ("+asked_questionslist_id+") ORDER BY RAND(), chapter_id asc");
    
    all_question_pool = demoquestions_1.concat(demoquestions_2);

    if(casestudy_questions_ary != "" && casestudy_questions_ary != undefined && casestudy_questions_ary.length > 0)
    {
        //casestudy_demoquestions =  await db.query("select * from `questions` where `question_type` = 'CSS' and `exam_category` = 1 and `css_group_id` in ("+casestudy_questions_ary+") and `demo_exam` = 0 and `status` = 1 and `is_deleted` = 0 and `is_approve` = 1");
    }

    let demoquestions = [];
    demoquestions = await pullmockmodule_questions(configuration_details,all_question_pool,chapter_id);

    demoquestions.forEach((element)=>{
        let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
              
                let question_image_ary = element['question_image'].split(',');
                let counter = 1;
                    let final_question = element['question'];

                    question_image_ary.forEach(question_image=>{

                    let tagname = "#Img"+counter;

                    const replacer = new RegExp(tagname.toString(), 'g');
                    //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                    //console.log(string.replace(replacer, '/'));

                    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                    counter++;
                    })
                    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question = (final_question.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ////////////////////////////////////////////////////
                    let option_image_ary = element['option_a_image'].split(',');
                    let counter_option_a = 1;
                    let final_question_option_a = element['option_a'];
                    option_image_ary.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_a;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_a++;
                    })
                    if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                        final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    ///////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////
                    let option_image_ary_b = element['option_b_image'].split(',');

                    let counter_option_b = 1;
                    let final_question_option_b = element['option_b'];
                    option_image_ary_b.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_b;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_b++;
                    })
                    if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_c = element['option_c_image'].split(',');
                    let counter_option_c = 1;
                    let final_question_option_c = element['option_c'];
                    option_image_ary_c.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_c;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_c++;
                    })
                    if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_d = element['option_d_image'].split(',');
                    let counter_option_d = 1;
                    let final_question_option_d = element['option_d'];
                    option_image_ary_d.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_d;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_d++;
                    })
                    if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////
                    element['question'] = final_question;
                    element['option_a'] = final_question_option_a;
                    element['option_b'] = final_question_option_b;
                    element['option_c'] = final_question_option_c;
                    element['option_d'] = final_question_option_d;
                    element['subject_name'] = subject_name;
                    options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
                    "D":final_question_option_d});
                    element['options'] = options_details;

                    element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
                element['exam_duration'] = exam_duration;
                element['total_attempts'] = 1;
                element['question_counter'] = question_counter;    
                questionslist.push(element);
                question_counter++;
    })
   
    ////////////// CASE STUDY SECTION //////////////////
    let question_groups = [];
    if(casestudy_demoquestions.length > 0)
    {
        casestudy_demoquestions.forEach((element)=>{
            if(!question_groups.includes(element.css_group_id) && element.css_group_id !="" && element.css_group_id != null)
            {
                question_groups.push(element.css_group_id);
            }
                //examtype_counter[element.question_type] = 1; 
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
                
                let question_image_ary = element['question_image'].split(',');
                let counter = 1;
                    let final_question = element['question'];

                    question_image_ary.forEach(question_image=>{

                    let tagname = "#Img"+counter;

                    const replacer = new RegExp(tagname.toString(), 'g');
                    
                    final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                    counter++;
                    })
                    if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                        final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ////////////////////////////////////////////////////
                    let option_image_ary = element['option_a_image'].split(',');
                    let counter_option_a = 1;
                    let final_question_option_a = element['option_a'];
                    option_image_ary.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_a;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_a++;
                    })
                    if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                    
                        ///////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////
                    let option_image_ary_b = element['option_b_image'].split(',');

                    let counter_option_b = 1;
                    let final_question_option_b = element['option_b'];
                    option_image_ary_b.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_b;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_b++;
                    })

                    if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_b = (final_question_option_b.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_c = element['option_c_image'].split(',');
                    let counter_option_c = 1;
                    let final_question_option_c = element['option_c'];
                    option_image_ary_c.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_c;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_c++;
                    })

                    if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_c = (final_question_option_c.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////

                    ////////////////////////////////////////////////////
                    let option_image_ary_d = element['option_d_image'].split(',');
                    let counter_option_d = 1;
                    let final_question_option_d = element['option_d'];
                    option_image_ary_d.forEach(option_image=>{
                    let tagname = "#Img"+counter_option_d;
                    const replacer = new RegExp(tagname.toString(), 'g');
                    final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                    counter_option_d++;
                    })
                    if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                        final_question_option_d = (final_question_option_d.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
                    }
                        ///////////////////////////////////////////////////////////
                    element['question'] = final_question;
                    element['option_a'] = final_question_option_a;
                    element['option_b'] = final_question_option_b;
                    element['option_c'] = final_question_option_c;
                    element['option_d'] = final_question_option_d;
                    element['subject_name'] = subject_name;
                    options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
                    "D":final_question_option_d});
                    element['options'] = options_details;

                    element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
                element['exam_duration'] = exam_duration * 60;
                element['total_attempts'] = 1;
                element['question_counter'] = question_counter + (parseInt(question_groups.indexOf(element.css_group_id)))+"."+convert_text_toroman(element.question_no.slice(-1));    
                questionslist.push(element);
             
        })
    }

    ///////////////////////////////////////////////////////////////////////////
if(questionslist.length > 0){
   await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`,`subject_group_id`, `subject_id`, `examdata`) \
    VALUES ("'+student_id+'",1,1,"'+exam_duration+'",3,"'+userdata.board+'","0","0",'+data.set_no+',"'+group_subject_id+'","'+subject_id+'","'+encodeURI(JSON.stringify(questionslist))+'")');
}
    //console.log(examtype_counter);
        let response = {status: config.successStatus, msg: "Online exam data mock",exam_duration:exam_duration, data:questionslist};
        return response;
}

/////////////////////////////////// Questions Search Section for Students search section ////////////////////////////////

async function searchexamsquestions(data,userdata){
    //let chapterno = data.chapter;
    //let finalno = chapterno.match(/\d+/g);
    //const chapter_code = "CH"+(finalno[0]);
    let search_text = data.search_text.toString().replace(/'/g, "\\'");;
    let special_charectors_tags =  [];
    let student_id = userdata.id;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })
    let subject_id = data.subject_id;
    let subjects_id = "";
    if(subject_id !="" && subject_id !=undefined && subject_id != 0)
    {
        await db.query("select * from `subjects` where is_deleted = 0 and status = 1 and `id` = "+subject_id)
        .then(result=>{
            if(result[0].group_exist == 1){
                subjects_id = result[0].group_subjects;
            }else{
                subjects_id = subject_id;
            }
        })
    }

    let filter_text_ary = [];
    let search_text_ary = [];
    let final_text_ary = [];
    try{
        const data = fs.readFileSync('assets/filter_searchtext.txt', 'utf8');
            filter_text_ary = data.split(",");
            search_text_ary = search_text.split(" ");
      } catch (err) {
        console.error(err);
      }
      search_text_ary.forEach(element=>{
            if(!filter_text_ary.includes(element.toLowerCase())){
                final_text_ary.push(element);
            }
      })
      search_text = final_text_ary.join(" ");
    let demoquestions = [];
    search_text = search_text.replace(/[^a-zA-Z0-9 ]/g, '');
    /// 0=live,1=guest demo,2=registered demo 	
    if(subject_id !="" && subject_id != undefined && subject_id != 0)
    {
        demoquestions =  await db.query("SELECT * FROM questions WHERE MATCH (question) AGAINST ('"+search_text+"' IN BOOLEAN MODE) and `status` = 1 and `is_approve` = 1 and `is_deleted` = 0 and demo_exam = 0 and branch_id in ("+subjects_id+")");
        
        await db.query("INSERT INTO `searched_questions`(`student_id`, `subject_id`, `search_text`) VALUES ("+student_id+","+subject_id+",'"+search_text+"')")
    }
    else{
        //await db.query("INSERT INTO `searched_questions`(`student_id`, `subject_id`, `search_text`) VALUES ("+student_id+",0,'"+search_text+"')")
        
        demoquestions =  await db.query("SELECT * FROM questions WHERE MATCH (question) AGAINST ('"+search_text+"' IN BOOLEAN MODE) and `status` = 1 and `is_approve` = 1 and `is_deleted` = 0 and demo_exam = 2");
    }
    if(demoquestions.length > 0)
    {
        demoquestions.forEach((element)=>{
            let options_details = [];
            let options_details_image = [];
            delete element.is_deleted;
            delete element.status;
            delete element.created_at;
            delete element.updated_at;
            //options_details.push({"A":[element.option_a,element.option_a_image],"B":[element.option_b,element.option_a_image],
            //"C":[element.option_c,element.option_a_image],"D":[element.option_d,element.option_a_image]});
            //element['options'] = options_details;

            //options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
           //"C":element.option_c_image,"D":element.option_d_image});
            //element['options_image'] = options_details_image;
           
            let question_image_ary = element['question_image'].split(',');
           
            let counter = 1;
            let final_question = element['question'];
           
            question_image_ary.forEach(question_image=>{
                
                let tagname = "#Img"+counter;
                
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question = final_question?.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                counter++;
            })
            final_question = (final_question?.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
            final_question = (final_question?.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
            special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question = final_question?.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            })
            let option_param = "";
            let option_param_image = "";
            if((element['answer']).toUpperCase() == 'A')
            {
                option_param = 'option_a';
                option_param_image = 'option_a_image';
            }
            else if((element['answer']).toUpperCase() == 'B')
            {
                option_param = 'option_b';
                option_param_image = 'option_b_image';
            }
            else if((element['answer']).toUpperCase() == 'C')
            {
                option_param = 'option_c';
                option_param_image = 'option_c_image';
            }
            else if((element['answer']).toUpperCase() == 'D')
            {
                option_param = 'option_d';
                option_param_image = 'option_d_image';
            }
             ////////////////////////////////////////////////////
             let final_question_option_d ="";
             if(typeof element[option_param_image] !== 'undefined')
             {
             let option_image_ary_d = element[option_param_image].split(',');
             let counter_option_d = 1;
             final_question_option_d = element[option_param];

             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d?.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            
                 counter_option_d++;
             })
            }else{
                final_question_option_d = element[option_param];
            }
            final_question_option_d = (final_question_option_d?.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
            final_question_option_d = (final_question_option_d?.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            /* special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" class="option_image_responsive" />')
            
            })*/
             ///////////////////////////////////////////////////////////

              ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })
             final_question_reason = (final_question_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
             final_question_reason = (final_question_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////
            element['question'] = final_question;
            element['right_ans'] = final_question_option_d;
            element['reason'] = final_question_reason;
        })
        
    }
        let response = {status: config.successStatus, msg: "Exam question search data", data:demoquestions};
        return response;
}




async function interm_examscholaticquestion(data,userdata,total_attempts,last_visited_ques_no,total_attempts,postdata){
    
    let questionslist = [];
    let demoquestions = [];
    let exam_questioon_data = {};
    let questions_no_config = [];
    let examdata = data[0].examdata;
    let category_id = data[0].exam_category_id;
    exam_questioon_data = JSON.parse(decodeURI(examdata));
    let duration = data[0].exam_time;
    let branch_name = "";
    let subject_id = "";
    
    //let responsedata = {status: 200, msg: "Online exam data",exam_duration:duration,total_attempts:total_attempts,questions:demoquestions};   

    let asked_questionslist_no =  [0];
    let asked_questionslist_id =  [];
    let post_ans_ary = {};
    let post_ans_status_ary = {};
    let is_visit_ary = [];
    let i = 0;
    exam_questioon_data.forEach(element=>{
        //console.log(element)
        asked_questionslist_id.push(element.id);
        if(element.is_answered_data!=null){
            post_ans_ary[element.id] = ({'question_id':element.id,'is_answered_data':element.is_answered_data});
        }
        if(element.is_answered == 1){
            post_ans_status_ary[element.id] = ({'question_id':element.id,'is_corrected':element.is_corrected});
        }
        if(element.is_visited == 1){
            is_visit_ary[element.id] = ({'question_id':element.id});
        }
    })
    let subject_name = "";
    let chapter_title = "";
    let chapter_name = "";
    let special_charectors_tags =  [];
    let class_id = "";
    let group_exist = 0;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })

    if(postdata.subject_id != undefined){
   
    await db.query("select * from `subjects` where `id` = "+postdata.subject_id)
    .then(branchdata=>{
       if(branchdata !=''){
        subject_id = branchdata[0].id;
        subject_name = branchdata[0].name;
       }
    })
}
    if(postdata.branch != undefined){
    await db.query("select * from `subjects` where `subject_code` = '"+postdata.branch+"'")
    .then(branchdata=>{
       if(branchdata !=''){
        branch_name = branchdata[0].name;
       }
    })
    }
    if(postdata.chapter != undefined){
    await db.query("select * from `chapters` where `short_code` = '"+postdata.chapter+"'")
    .then(element=>{
        if(element !=''){
        chapter_name = element[0].chapter_name;
        chapter_title = element[0].sub_heading;
        }
    })
}
    ///////////////////// Exam Duration Section //////////////////////////////////
    let exam_duration = parseInt(data[0].exam_time); // 20 min exam duration
    let configuration_details = "";
    let examtype_counter = {};
   
     ///////////////////// Exam Duration Section END //////////////////////////////////

    questionslist =  await db.query("select * from `questions` where `id` IN ("+asked_questionslist_id+")");    

    if(questionslist.length > 0)
    {
        questionslist.forEach((element)=>{       
           
            {
       
            {
            
                {
                
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
               
                let question_image_ary = element['question_image'].split(',');
         
                let counter = 1;
                let final_question = element['question'];
           
                question_image_ary.forEach(question_image=>{
                let tagname = "#Img"+counter;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" draggable="false" alt="crestest_img" class="image_responsive" />')
                counter++;
            })
            if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

                special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            })
            ////////////////////////////////////////////////////
            let option_image_ary = element['option_a_image'].split(',');
            let counter_option_a = 1;
            let final_question_option_a = element['option_a'];
            option_image_ary.forEach(option_image=>{
                let tagname = "#Img"+counter_option_a;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_a++;
            })
            if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors",'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            let option_image_ary_b = element['option_b_image'].split(',');
          
            let counter_option_b = 1;
            let final_question_option_b = element['option_b'];
            option_image_ary_b.forEach(option_image=>{
                let tagname = "#Img"+counter_option_b;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_b++;
            })
            if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }
            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////
            let option_image_ary_c = element['option_c_image'].split(',');
            let counter_option_c = 1;
            let final_question_option_c = element['option_c'];
            option_image_ary_c.forEach(option_image=>{
                let tagname = "#Img"+counter_option_c;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_c++;
            })

            if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

             ////////////////////////////////////////////////////
             let option_image_ary_d = element['option_d_image'].split(',');
             let counter_option_d = 1;
             let final_question_option_d = element['option_d'];
             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                 counter_option_d++;
             })
             if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
             {
                final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }

             special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
             ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })

             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                if(final_question_reason.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
                    {
                        final_question_reason = (final_question_reason.replaceAll("../assets/special_charectors",'assets/special_charectors'))
                        final_question_reason = (final_question_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                    }

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////
           
            element['question'] = final_question;
            element['option_a'] = final_question_option_a;
            element['option_b'] = final_question_option_b;
            element['option_c'] = final_question_option_c;
            element['option_d'] = final_question_option_d;
            element['reason'] = final_question_reason;
            element['exam_duration'] = exam_duration;

            element['subject_name'] = subject_name;
            element['chapter_name'] = chapter_name;
            element['chapter_title'] = chapter_title;
            if(branch_name!=undefined){
            element['branch_name'] = branch_name;
            }

            options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;

        if(post_ans_ary[element['id']]){    
            element['is_answered_data'] = post_ans_ary[element['id']]['is_answered_data'];
            element['is_visited'] = 0;
        }
        if(post_ans_status_ary[element['id']]){
            element['is_answered'] = 1;
        }
        if(post_ans_status_ary[element['id']]){
            element['is_corrected'] = post_ans_status_ary[element['id']]['is_corrected'];
            element['guest_post_ans_status'] = post_ans_status_ary[element['id']]['is_corrected'];
        }
        
        if(is_visit_ary[element['id']]){
            element['is_visited'] = 1;
        }
        
            element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
            
            demoquestions.push(element);
                }
            }
        }
        })
    }
    exam_questioon_data[0]['exam_duration'] = duration;
    exam_questioon_data[0]['last_visited_ques_no'] = last_visited_ques_no;
    exam_questioon_data[0]['total_attempts'] = total_attempts;

    demoquestions.forEach(element=>{
        exam_questioon_data.forEach(element2=>{
            if(element.id == element2.id)
                {
                    element2['question'] = element['question'];
                    element2['option_a'] = element['option_a'];
                    element2['option_b'] = element['option_b'];
                    element2['option_c'] = element['option_c'];
                    element2['option_d'] = element['option_d'];
                    element2['options'][0].A = element['option_a'];
                    element2['options'][0].B = element['option_b'];
                    element2['options'][0].C = element['option_c'];
                    element2['options'][0].D = element['option_d'];
                    element2['answer'] = element['answer'];
                    element2['reason'] = element['reason'];
                }
        })
        
    })

    //demoquestions[0]['exam_duration'] = duration;
    //demoquestions[0]['last_visited_ques_no'] = last_visited_ques_no;
    //demoquestions[0]['total_attempts'] = total_attempts;
    //console.log(examtype_counter);
    let response = "";
    if(category_id == 1){
        response = {status: config.successStatus, msg: "Online exam data",exam_duration:exam_duration, data:exam_questioon_data};
    }else{
        response = {status: config.successStatus, msg: "Online exam data",exam_duration:exam_duration, questions:exam_questioon_data};
    }
        return response;
}





async function casestudyquestoion_set(data,userdata){
    let questionslist = [];
    let demoquestions = [];
    let questions_no_config = [];
    let subject_name = "";
    let chapter_name = "";
    let special_charectors_tags =  [];
    let group_exist = 0;
    let subjectid = userdata.subject_id;
    let question_no_ary = [];
    const board_id = userdata.board;
	const class_id = userdata.class;
	const subject_id = data[0].branch_id;
    const branch = data[0].branch;
    const set_no = userdata.set_no;
    let exam_duration = 0;
    let boardid = 0;
    let branch_name = "";
    let student_id = userdata.id;
    await db.query("select * from `special_charectors`")
    .then(result=>{
        result.forEach(element=>{
            special_charectors_tags.push(element.tag_name);
        })
    })

    await db.query("select * from `chapters` where `short_code` = '"+userdata.chapter+"' and `is_deleted` = 0 and status = 1")
    .then(element=>{
        if(element !=''){
        chapter_name = "Chapter "+userdata.sequence_no;
        chapter_title = element[0].sub_heading;
        chapter_id = element[0].id;
        }
    })
    ///////////////////// Exam Duration Section //////////////////////////////////
    
    await db.query("select * from `exam_details_scholastic` where `class_id` = "+class_id+" and `exam_category_id` = 1 and\
     `board_id` ="+board_id+" and `subject_id` ="+subjectid+" and type_exam = 4")
    .then(exam_time=>{
        if(exam_time.length > 0){
            total_question_no = exam_time[0].total_no_question;
            exam_duration = exam_time[0].total_time * 60;
         
        }
    })
   
    ///////////////////// Exam Duration Section END //////////////////////////////////

    if(subjectid != undefined){
   
        await db.query("select * from `subjects` where `id` = "+subjectid)
        .then(branchdata=>{
           if(branchdata !=''){
            
            subject_name = branchdata[0].name;
           }
        })
    }
    
    await db.query("select * from `subjects` where `subject_code` = '"+userdata.branch+"' and `is_deleted` = 0 and status = 1")
    .then(branchdata=>{
       if(branchdata !=''){
        branch_name = branchdata[0].name;
       }
    })
    let configuration_details = "";
    let question_groups = [];
    questionslist = data;
    let question_counter_value = 1;
    if(questionslist.length > 0)
    {
        questionslist.forEach((element)=>{       
          
            if(!question_groups.includes(element.css_group_id) && element.css_group_id !="" && element.css_group_id != null)
            {
                question_groups.push(element.css_group_id);
            }
                let options_details = [];
                let options_details_image = [];
                delete element.is_deleted;
                delete element.status;
                delete element.created_at;
                delete element.updated_at;
                    let question_image_ary = element['question_image'].split(',');
                let counter = 1; // Start Question count from 1
                let final_question = element['question'];
           
                question_image_ary.forEach(question_image=>{
                let tagname = "#Img"+counter;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
                counter++;
            })
            if(final_question.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
                final_question = (final_question.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

                special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            })
            ////////////////////////////////////////////////////
            let option_image_ary = element['option_a_image'].split(',');
            let counter_option_a = 1;
            let final_question_option_a = element['option_a'];
            option_image_ary.forEach(option_image=>{
                let tagname = "#Img"+counter_option_a;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_a++;
            })
            if(final_question_option_a.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
                final_question_option_a = (final_question_option_a.replaceAll('alt=""', 'alt="crestest_img" draggable="false"'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
            let option_image_ary_b = element['option_b_image'].split(',');
          
            let counter_option_b = 1;
            let final_question_option_b = element['option_b'];
            option_image_ary_b.forEach(option_image=>{
                let tagname = "#Img"+counter_option_b;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_b++;
            })
            if(final_question_option_b.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }
            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

            ////////////////////////////////////////////////////
            let option_image_ary_c = element['option_c_image'].split(',');
            let counter_option_c = 1;
            let final_question_option_c = element['option_c'];
            option_image_ary_c.forEach(option_image=>{
                let tagname = "#Img"+counter_option_c;
                const replacer = new RegExp(tagname.toString(), 'g');
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                counter_option_c++;
            })

            if(final_question_option_c.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
            {
                final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
            }

            special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
            ///////////////////////////////////////////////////////////

             ////////////////////////////////////////////////////
             let option_image_ary_d = element['option_d_image'].split(',');
             let counter_option_d = 1;
             let final_question_option_d = element['option_d'];
             option_image_ary_d.forEach(option_image=>{
                 let tagname = "#Img"+counter_option_d;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
                 counter_option_d++;
             })
             if(final_question_option_d.search(process.env.IMAGEBASEURL+'assets/special_charectors') == -1)
             {
                final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
                final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
             }

             special_charectors_tags.forEach(tag_name=>{                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
               
                final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="option_image_responsive" />')
            })
             ///////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////
             let supporting_reason_ary = element['supporting_reason'].split(',');
             let counter_supporting_reason = 1;
             let final_question_reason = element['reason'];
             supporting_reason_ary.forEach(option_image=>{
                 let tagname = "#Img"+counter_supporting_reason;
                 const replacer = new RegExp(tagname.toString(), 'g');
                 final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
                 counter_supporting_reason++;
             })

             special_charectors_tags.forEach(tag_name=>{
                
                let tagname = "#"+tag_name;
                let immage_tag_name = "assets/special_charectors/"+tag_name+".png";
                const replacer = new RegExp(tagname.toString(), 'g');
                //const string = 'e851e2fa-4f00-4609-9dd2-9b3794c59619';
                //console.log(string.replace(replacer, '/'));

                final_question_reason = final_question_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+immage_tag_name+'" alt="crestest_img" draggable="false" class="image_responsive" />')
            
            })
             ///////////////////////////////////////////////////////////

            element['question'] = final_question;
            element['option_a'] = final_question_option_a;
            element['option_b'] = final_question_option_b;
            element['option_c'] = final_question_option_c;
            element['option_d'] = final_question_option_d;
            element['reason'] = final_question_reason;
            element['exam_duration'] = exam_duration;
            element['total_attempts'] = 1;

            element['subject_name'] = subject_name;
            element['chapter_name'] = chapter_name;
            element['chapter_title'] = chapter_title;
            element['branch_name'] = branch_name;
            
            question_no_ary.push(element.question_no);

            options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;

            element['answer'] = CryptoJS.AES.encrypt(element['answer'], process.env.CRYPTO).toString();
            element['question_counter'] = (parseInt(question_groups.indexOf(element.css_group_id)) + 1)+"."+convert_text_toroman(element.question_no.slice(-1));
            demoquestions.push(element);
            question_counter_value++;
               
        })
    }
    demoquestions.sort(function(a, b) {
        return a.question_no - b.question_no;
      });
   if(demoquestions.length > 0){ 

    await db.query('INSERT INTO `interm_storeexamdata`(`student_id`, `exam_category_id`,`total_attempts`,`exam_time`, `exam_type`,`board_id`, `branch`, `chapter`, `set_no`,`subject_group_id`, `subject_id`, `examdata`,`case_study_exam`) VALUES ("'+student_id+'",1,1,"'+exam_duration+'",1,"'+board_id+'","'+branch+'","'+data[0].chapter+'","'+set_no+'","'+"''"+'","'+subjectid+'","'+encodeURI(JSON.stringify(demoquestions))+'",1)');
   }
    //console.log(examtype_counter);
        let response = {status: config.successStatus, msg: "Online exam data",exam_duration:exam_duration, data:demoquestions};
       
        return response;
}

function convert_text_toroman(text){
    let number_ary = {"A":"i","B":"ii","C":"iii","D":"iv","E":"v","F":"vi","G":"vii","H":"viii","I":"ix","J":"x"};
    return number_ary[text];
}
async function pullmockmodule_questions(configuration_details,all_question_pool,chapter_id)
{
    let SWA = parseInt(configuration_details['SWA']);//10;
    let DES = parseInt(configuration_details['DES']);//15;
    let HOT = parseInt(configuration_details['HOT']);//25;
    let CHAPTERS = chapter_id;
    
    all_question_pool.sort(function(a, b){
        return a.chapter_id - b.chapter_id;
    });
    let questions_already_asked = [];
    let questions = all_question_pool.filter(function(objFromA) {
        return !questions_already_asked.find(function(objFromB) {
            return objFromA.id === objFromB.id
        })
    })

    function createPoolCountPerChapter(type, chapters) {
        var values = [];
        let number = type;
        let n = chapters;
        let a = 0;
        while (number > 0 && n > 0) {
            if (a % 2 == 0)
                a = Math.floor(number / n) * 1;
            else
                a = Math.ceil(number / n) * 1;
            number -= a;
            n--;
            values.push(a);
        }
        return values;
    }
    
    let TOTAL_CHAPTERS = chapter_id.length;
    let TOTAL_QUESTIONS = SWA + DES + HOT;

    let SWA_PER_CHAPTER = createPoolCountPerChapter(SWA, TOTAL_CHAPTERS); 
    let DES_PER_CHAPTER = createPoolCountPerChapter(DES, TOTAL_CHAPTERS); 
    let HOT_PER_CHAPTER = createPoolCountPerChapter(HOT, TOTAL_CHAPTERS); 
    //console.log("SWA_PER_CHAPTER", SWA_PER_CHAPTER);
    //console.log("DES_PER_CHAPTER", DES_PER_CHAPTER);
    //console.log("HOT_PER_CHAPTER", HOT_PER_CHAPTER);

    function getMultipleRandom(arr, num) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    }

    function mergeArrays(arrays, prop) {
        const merged = {};
        arrays.forEach(arr => {
            arr.forEach(item => {
                merged[item[prop]] = Object.assign({}, merged[item[prop]], item);
            });
        });
        return Object.values(merged);
    }

    function containsObject(obj, list) {
        var i;
        //console.log("list", list);
        for (i = 0; i < list.length; i++) {
            //console.log(list[i].id, obj.id);
            if (list[i].id === obj.id) {
                return true;
            }
        }
        return false;
    }

    function checkForUniqueness(currentQuestionsPool, selectionPool) {
        let i = 1;
        const MAX_STACK_DEPTH = 5000;
        let question_data = []
        return new Promise(function(resolve, reject) {
    
            let redo = (currentQuestionsPool, selectionPool) => {
             if(i < MAX_STACK_DEPTH){
      
              i++;
                let getQuestion = getMultipleRandom(selectionPool, 1);
                //console.log("getQuestion", getQuestion[0]);
                let doContain = containsObject(getQuestion[0], currentQuestionsPool);
                //console.log("doContain", doContain);
                if(doContain){
                    redo(currentQuestionsPool, selectionPool);
                } else {
                    //console.log("getQuestion>>", getQuestion);
                    resolve(getQuestion);
                }
               
            }else{
                resolve(question_data);
                console.log("MAX_STACK_DEPTH reached",i);
            }
            }
            redo(currentQuestionsPool, selectionPool);
            });
        
    }

    function getQuestions(type, QUES_PER_CHAPTER) {
        return new Promise(function(resolve, reject) {
            let tmpQuestions = [];
            for(let i = 0; i<TOTAL_CHAPTERS; i++){
                let chapterId = CHAPTERS[i];
                //console.log(chapterId);
                let questionCount = QUES_PER_CHAPTER[i];
               // console.log("chapterId", chapterId, "questionCount", questionCount,type);
                let filterAllSWA = questions.filter((element) => {
                    return element.chapter_id == chapterId && element.question_type == type;
                });
                let swaQuestionsPerChapter = getMultipleRandom(filterAllSWA, questionCount);
                tmpQuestions.push(swaQuestionsPerChapter);
            }
            resolve(tmpQuestions);
        });
    }

    async function getAllQuestions() {
        //SWA
        let tmpSWA = await getQuestions("SWA", SWA_PER_CHAPTER);
        filterAllSWAQuestionsPerChapter = mergeArrays(tmpSWA, 'id')
        //console.log("filterAllSWAQuestionsPerChapter", filterAllSWAQuestionsPerChapter);
        //check for total count
        let questionShortage = SWA - filterAllSWAQuestionsPerChapter.length;
        if(questionShortage > 0){
            //pick up one question from the pool randomly
            let filterAllSWA_tmp = questions.filter((element) => {
                return element.question_type == "SWA";
            });
            for(let k=0; k<questionShortage; k++){
                let tmp = await checkForUniqueness(filterAllSWAQuestionsPerChapter, filterAllSWA_tmp);
                tmpSWA.push(tmp);
                filterAllSWAQuestionsPerChapter = mergeArrays(tmpSWA, 'id')
            }
        }

        //DES
        let tmpDES = await getQuestions("DES", DES_PER_CHAPTER);
        filterAllDESQuestionsPerChapter = mergeArrays(tmpDES, 'id')

        //check for total count
        questionShortage = DES - filterAllDESQuestionsPerChapter.length;
        if(questionShortage > 0){
            //pick up one question from the pool randomly
            let filterAllDES_tmp = questions.filter((element) => {
                return element.question_type == "DES";
            });
            for(let k=0; k<questionShortage; k++){
                let tmp = await checkForUniqueness(filterAllDESQuestionsPerChapter, filterAllDES_tmp);
                tmpDES.push(tmp);
                filterAllDESQuestionsPerChapter = mergeArrays(tmpDES, 'id')
            }
        }
        //HOT
        let tmpHOT = await getQuestions("HOT", HOT_PER_CHAPTER);
        filterAllHOTQuestionsPerChapter = mergeArrays(tmpHOT, 'id')

        //check for total count
        questionShortage = HOT - filterAllHOTQuestionsPerChapter.length;
        if(questionShortage > 0){
            //pick up one question from the pool randomly
            let filterAllHOT_tmp = questions.filter((element) => {
                return element.question_type == "HOT";
            });
            for(let k=0; k<questionShortage; k++){
                let tmp = await checkForUniqueness(filterAllHOTQuestionsPerChapter, filterAllHOT_tmp);
                tmpHOT.push(tmp);
                filterAllHOTQuestionsPerChapter = mergeArrays(tmpHOT, 'id')
            }
        }
        return createFinalPool();    
    }
  
    function shuffleFisherYates(array) {
        let i = array.length;
        while (i > 0) {
            const ri = Math.floor(Math.random() * i);
            i--;
            [array[i], array[ri]] = [array[ri], array[i]];
        }
        return array;
    }

    async function createFinalPool() {
        let pool = [...filterAllSWAQuestionsPerChapter, ...filterAllDESQuestionsPerChapter, ...filterAllHOTQuestionsPerChapter]
        let finalPool = shuffleFisherYates(pool)

       return finalPool;
    }
    
    let filterAllSWAQuestionsPerChapter = [];
    let filterAllDESQuestionsPerChapter = [];
    let filterAllHOTQuestionsPerChapter = [];
let demoquestions = [];
    await getAllQuestions().then(result=>{
        demoquestions = result;
    })
    return demoquestions;
}

module.exports = {
    demoexamscholaticquestion,
    demoexamcompetitivequestion,
    examscholaticquestion_set,
    onlineexamcompetitivequestion,
    getdemoexamgivencount,
    getdemoassessmentdetails,
    examscholaticquestion_module,
    examscholaticquestion_mock,
    onlineexamcompetitivequestion_nstse,
    searchexamsquestions,
    interm_examscholaticquestion,
    casestudyquestoion_set,
    pullmockmodule_questions,
}