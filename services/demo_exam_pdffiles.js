const db = require('./db');

async function getdetailsbyparam(data)
{
    const record_details = await db.query("select * from demo_exam_pdffiles where  is_archive = 2 and student_id = "+data.student_id)
    let promise_result = await new Promise((resolve, reject) => {
        if (record_details.length == 0) {
          message = 'No record found.';
          response = {status: 200, msg: message,data:[]}
          reject(response);
        }
        else{
              message = "PDF record list";
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

async function getdetails()
{
    const record_details = await db.query("select * from demo_exam_pdffiles where  is_archive = 2")
    let promise_result = await new Promise((resolve, reject) => {
        if (record_details.length == 0) {
          message = 'No record found.';
          response = {status: 200, msg: message,data:[]}
          reject(response);
        }
        else{
              message = "PDF record list";
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

module.exports = {
    getdetailsbyparam,
    getdetails
}