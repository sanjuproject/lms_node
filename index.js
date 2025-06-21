require('dotenv').config();
const express = require("express");
var cors = require('cors');
const app = express();
const port = 4000;
const https = require('https');
const fs = require('fs');
const studentRouter = require("./routes/lms");
const examRouter = require("./routes/exams");
const subscriveRouter = require("./routes/subscribtion");
const teacherRouter = require("./routes/teachers");
const elibraryRouter = require("./routes/elibrary");
var nodemailer = require('nodemailer');
const performanceRouter = require("./routes/performance");
const archiveperformanceRouter = require("./routes/performance_archive");
const searchRouter = require("./routes/search");
var shortUrl = require("node-url-shortener");
const cronjobRouter = require("./routes/cronjob");
const paymentRouter = require("./payment");
const migrationRouter = require("./routes/migration");
const db = require('./services/db.js');
const { requestLogger, responseLogger } = require('./middleware/logermiddleware');
const { exec } = require('child_process');
const chitcodeRouter = require("./routes/chitcode.js");

/*const studentRouterv2 = require("./routes/v2/lms");
const examRouterv2 = require("./routes/v2/exams");
const subscriveRouterv2 = require("./routes/v2/subscribtion");
const teacherRouterv2 = require("./routes/v2/teachers");
const elibraryRouterv2 = require("./routes/v2/elibrary");
const performanceRouterv2 = require("./routes/v2/performance");
const searchRouterv2 = require("./routes/v2/search");
const cronjobRouterv2 = require("./routes/v2/cronjob");
*/

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Add headers before the routes are defined
app.use(function (req, res, next) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});  

// Use the request logger middleware
//app.use(requestLogger);

// Use the response logger middleware
//app.use(responseLogger);

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});
app.use("/api/lms", studentRouter);
app.use("/api/lms/exams", examRouter);
app.use("/api/lms/subscribe", subscriveRouter);
app.use("/api/lms/elibrary", elibraryRouter);
app.use("/api/lms/teacher", teacherRouter);
app.use("/api/lms/performance", performanceRouter);
app.use("/api/lms/search", searchRouter);


app.use("/apiv2/lms", studentRouter);
app.use("/apiv2/lms/exams", examRouter);
app.use("/apiv2/lms/subscribe", subscriveRouter);
app.use("/apiv2/lms/elibrary", elibraryRouter);
app.use("/apiv2/lms/teacher", teacherRouter);
app.use("/apiv2/lms/performance", performanceRouter);
app.use("/apiv2/lms/performance_archive", archiveperformanceRouter);
app.use("/apiv2/lms/search", searchRouter);
app.use("/apiv2/lms/cronjob", cronjobRouter);
app.use("/apiv2/migration", migrationRouter);
app.use("/api/chitcode",chitcodeRouter);
/* Error handler middleware */

/////////////////////////////// FOR MOBILE ROUTES /////////////////////////

app.use("/mobile/v1/api/lms", studentRouter);
app.use("/mobile/v1/api/lms/exams", examRouter);
app.use("/mobile/v1/api/lms/subscribe", subscriveRouter);
app.use("/mobile/v1/api/lms/elibrary", elibraryRouter);
app.use("/mobile/v1/api/lms/teacher", teacherRouter);
app.use("/mobile/v1/api/lms/performance", performanceRouter);
app.use("/mobile/v1/api/lms/performance_archive", archiveperformanceRouter);
app.use("/mobile/v1/api/lms/search", searchRouter);
app.use("/mobile/v1/api/payment", paymentRouter);

////////////////////////////////////////////////////////////////////////////////
(async function() {
  await db.query("select * from `setting_page`")
.then(result=>{
  if(result.length > 0){
    result.forEach(element=>{
      process.env['GST_RATE'] = element.gst_rate;
    })
  }
})
})();
app.use((err, req, res, next) => 
{
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

app.post('/api/restart', (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  
    exec('pm2 restart lms', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).send(`Error: ${error.message}`);
      }
      if (stderr) {
        return res.status(500).send(`Stderr: ${stderr}`);
      }
      res.send(`PM2 process restarted: ${stdout}`);
    });
  
});

app.listen(port,'0.0.0.0', () => {
  console.log(`Server star working on port no :${port}`);
});
