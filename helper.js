const nodemailer = require("nodemailer");
var request = require('request');
const urlencode = require("urlencode");
var fs = require('fs');
require('dotenv').config();

async function sendsms(req, res, next){
  let smsurl = 'http://smsc.biz/httpapi/send?username='+process.env.SMSUSERNAME+'&password='+urlencode(process.env.SMSPASSWORD)+'&sender_id='+process.env.SENDERID+'&route=T&phonenumber='+req.phonenumber+'&message='+(req.body)
  var options = {
    'method': 'GET',
    'url': smsurl,
    'headers': {
      'Cookie': 'ci_session=ldmlfig4k22b799v19uvkfofsha2nj7p'
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body,error);
    
  });
  }

function getOffset(currentPage = 1, listPerPage) {
  return (currentPage - 1) * [listPerPage];
}

function emptyOrRows(rows) {
  if (!rows) {
    return [];
  }
  return rows;
}
async function sendmail(req, res, next){
  var transporter = nodemailer.createTransport({
      host: process.env.SMTP,
      port: 587,
      auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPASS
      }
    });
    var mailOptions = "";
    if(req.attachment_exist == 1){
    
    mailOptions = {
      from: process.env.MAILUSER,
      to: req.email,
      bcc:process.env.BCCUSER,
      subject: req.subject,
      attachments:[{'filename': 'invoice.pdf', 'content': fs.createReadStream(process.env.IMAGEUPLOADBASEURL+"payment_gateway/invoice.pdf")}],
      html: `<!doctype html>
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsoft-com:office:office">
      
      <head>
        <title></title><!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style type="text/css">
          #outlook a {
            padding: 0;
          }
      
          body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
      
          table,
          td {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
      
          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
          }
      
          p {
            display: block;
            margin: 13px 0;
          }
        </style>
        <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">
        <style type="text/css">
          @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);
        </style><!--<![endif]-->
        <style type="text/css">
          @media only screen and (min-width:480px) {
            .mj-column-per-100 {
              width: 100% !important;
              max-width: 100%;
            }
          }
        </style>
        <style media="screen and (min-width:480px)">
          .moz-text-html .mj-column-per-100 {
            width: 100% !important;
            max-width: 100%;
          }
        </style>
        <style type="text/css">
          @media only screen and (max-width:480px) {
            table.mj-full-width-mobile {
              width: 100% !important;
            }
      
            td.mj-full-width-mobile {
              width: auto !important;
            }
          }
        </style>
      </head>
      
      <body style="word-spacing:normal;">
        <div>
          <!-- Company Header --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#e3e3e3" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
          <div style="background:#e3e3e3;background-color:#e3e3e3;margin:0px auto;max-width:600px;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#e3e3e3;background-color:#e3e3e3;width:100%;">
              <tbody>
                <tr>
                  <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                    <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                    <div class="mj-column-per-100 mj-outlook-group-fix"
                      style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                        width="100%">
                        <tbody>
                          <tr>
                            <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="border-collapse:collapse;border-spacing:0px;">
                                <tbody>
                                  <tr>
                                    <td style="width:200px;"><img height="auto"
                                        src="https://lms.clvdev.in/static/media/clv_logo.fbb8bbbf743bd343683e.png"
                                        style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;"
                                        width="200"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div><!--[if mso | IE]></td></tr></table><![endif]-->
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!--[if mso | IE]></td></tr></table><![endif]--><!-- Introduction Text --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#f8cf51" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
          <div style="background:#f8cf51;background-color:#f8cf51;margin:0px auto;max-width:600px;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#f8cf51;background-color:#f8cf51;width:100%;">
              <tbody>
                <tr>
                  <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                    <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                    <div class="mj-column-per-100 mj-outlook-group-fix"
                      style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                        width="100%">
                       
      `+req.body+`
      </table>
              </div><!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div><!--[if mso | IE]></td></tr></table><![endif]-->
    <!-- footer --><!-- Social icons --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#062749" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="background:#062749;background-color:#062749;margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#062749;background-color:#062749;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix"
                style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                  width="100%">
                  <tbody>
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div
                          style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:18px;font-weight:bold;line-height:1;text-align:center;color:#ffffff;">
                          new Learning Ventures LLP</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div><!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#062749" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="background:#062749;background-color:#062749;margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#062749;background-color:#062749;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" class="" style="vertical-align:top;width:600px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix"
                style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                  width="100%">
                  <tbody>
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                          style="float:none;display:inline-table;">
                          <tr>
                            <td style="padding:4px;vertical-align:middle;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="background:#55acee;border-radius:3px;width:20px;">
                                <tr>
                                  <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                      href="https://twitter.com/intent/tweet?url=https://twitter.com/newL"
                                      target="_blank"><img height="20"
                                        src="https://www.mailjet.com/images/theme/v1/icons/ico-social/twitter.png"
                                        style="border-radius:3px;display:block;" width="20"></a></td>
                                </tr>
                              </table>
                            </td>
                            <td style="vertical-align:middle;"><a
                                href="https://twitter.com/intent/tweet?url=https://twitter.com/newL"
                                style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                                target="_blank">Share</a></td>
                          </tr>
                        </table><!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                          style="float:none;display:inline-table;">
                          <tr>
                            <td style="padding:4px;vertical-align:middle;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="background:#3b5998;border-radius:3px;width:20px;">
                                <tr>
                                  <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                      href="https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/new-Learning-100416625670686"
                                      target="_blank"><img height="20"
                                        src="https://www.mailjet.com/images/theme/v1/icons/ico-social/facebook.png"
                                        style="border-radius:3px;display:block;" width="20"></a></td>
                                </tr>
                              </table>
                            </td>
                            <td style="vertical-align:middle;"><a
                                href="https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/new-Learning-100416625670686"
                                style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                                target="_blank">Share</a></td>
                          </tr>
                        </table><!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                          style="float:none;display:inline-table;">
                          <tr>
                            <td style="padding:4px;vertical-align:middle;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="background:#0077b5;border-radius:3px;width:20px;">
                                <tr>
                                  <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                      href="https://www.linkedin.com/shareArticle?mini=true&url=https://www.linkedin.com/company/new-learning/&title=&summary=&source="
                                      target="_blank"><img height="20"
                                        src="https://www.mailjet.com/images/theme/v1/icons/ico-social/linkedin.png"
                                        style="border-radius:3px;display:block;" width="20"></a></td>
                                </tr>
                              </table>
                            </td>
                            <td style="vertical-align:middle;"><a
                                href="https://www.linkedin.com/shareArticle?mini=true&url=https://www.linkedin.com/company/new-learning/&title=&summary=&source="
                                style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                                target="_blank">Share</a></td>
                          </tr>
                        </table><!--[if mso | IE]></td><td><![endif]-->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                          style="float:none;display:inline-table;">
                          <tr>
                            <td style="padding:4px;vertical-align:middle;">
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                style="background:#EB3323;border-radius:3px;width:20px;">
                                <tr>
                                  <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                      href="https://www.youtube.com/channel/UCcLyhAsxmh6oM5nM6NTc4-A"
                                      target="_blank"><img height="20"
                                        src="https://www.mailjet.com/images/theme/v1/icons/ico-social/youtube.png"
                                        style="border-radius:3px;display:block;" width="20"></a></td>
                                </tr>
                              </table>
                            </td>
                            <td style="vertical-align:middle;"><a
                                href="https://www.youtube.com/channel/UCcLyhAsxmh6oM5nM6NTc4-A"
                                style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                                target="_blank">Share</a></td>
                          </tr>
                        </table><!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div><!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div><!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>`, // html body
    };
}else{
  mailOptions = {
    from: process.env.MAILUSER,
    to: req.email,
    bcc:process.env.BCCUSER,
    subject: req.subject,
    html: `<!doctype html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
    
    <head>
      <title></title><!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style type="text/css">
        #outlook a {
          padding: 0;
        }
    
        body {
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
    
        table,
        td {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
    
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
    
        p {
          display: block;
          margin: 13px 0;
        }
      </style>
      <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">
      <style type="text/css">
        @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);
      </style><!--<![endif]-->
      <style type="text/css">
        @media only screen and (min-width:480px) {
          .mj-column-per-100 {
            width: 100% !important;
            max-width: 100%;
          }
        }
      </style>
      <style media="screen and (min-width:480px)">
        .moz-text-html .mj-column-per-100 {
          width: 100% !important;
          max-width: 100%;
        }
      </style>
      <style type="text/css">
        @media only screen and (max-width:480px) {
          table.mj-full-width-mobile {
            width: 100% !important;
          }
    
          td.mj-full-width-mobile {
            width: auto !important;
          }
        }
      </style>
    </head>
    
    <body style="word-spacing:normal;">
      <div>
        <!-- Company Header --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#e3e3e3" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
        <div style="background:#e3e3e3;background-color:#e3e3e3;margin:0px auto;max-width:600px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#e3e3e3;background-color:#e3e3e3;width:100%;">
            <tbody>
              <tr>
                <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                  <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                  <div class="mj-column-per-100 mj-outlook-group-fix"
                    style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                      width="100%">
                      <tbody>
                        <tr>
                          <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="border-collapse:collapse;border-spacing:0px;">
                              <tbody>
                                <tr>
                                  <td style="width:200px;"><img height="auto"
                                      src="https://lms.clvdev.in/static/media/clv_logo.fbb8bbbf743bd343683e.png"
                                      style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;"
                                      width="200"></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div><!--[if mso | IE]></td></tr></table><![endif]-->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!--[if mso | IE]></td></tr></table><![endif]--><!-- Introduction Text --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#f8cf51" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
        <div style="background:#f8cf51;background-color:#f8cf51;margin:0px auto;max-width:600px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#f8cf51;background-color:#f8cf51;width:100%;">
            <tbody>
              <tr>
                <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                  <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                  <div class="mj-column-per-100 mj-outlook-group-fix"
                    style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                      width="100%">
                     
    `+req.body+`
    </table>
            </div><!--[if mso | IE]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
  </div><!--[if mso | IE]></td></tr></table><![endif]-->
  <!-- footer --><!-- Social icons --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#062749" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
  <div style="background:#062749;background-color:#062749;margin:0px auto;max-width:600px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#062749;background-color:#062749;width:100%;">
      <tbody>
        <tr>
          <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
            <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
            <div class="mj-column-per-100 mj-outlook-group-fix"
              style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                width="100%">
                <tbody>
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div
                        style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:18px;font-weight:bold;line-height:1;text-align:center;color:#ffffff;">
                        new Learning Ventures LLP</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div><!--[if mso | IE]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="#062749" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
  <div style="background:#062749;background-color:#062749;margin:0px auto;max-width:600px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#062749;background-color:#062749;width:100%;">
      <tbody>
        <tr>
          <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
            <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" class="" style="vertical-align:top;width:600px;" ><![endif]-->
            <div class="mj-column-per-100 mj-outlook-group-fix"
              style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                width="100%">
                <tbody>
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                        style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;vertical-align:middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background:#55acee;border-radius:3px;width:20px;">
                              <tr>
                                <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                    href="https://twitter.com/intent/tweet?url=https://twitter.com/newL"
                                    target="_blank"><img height="20"
                                      src="https://www.mailjet.com/images/theme/v1/icons/ico-social/twitter.png"
                                      style="border-radius:3px;display:block;" width="20"></a></td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;"><a
                              href="https://twitter.com/intent/tweet?url=https://twitter.com/newL"
                              style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                              target="_blank">Share</a></td>
                        </tr>
                      </table><!--[if mso | IE]></td><td><![endif]-->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                        style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;vertical-align:middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background:#3b5998;border-radius:3px;width:20px;">
                              <tr>
                                <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                    href="https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/new-Learning-100416625670686"
                                    target="_blank"><img height="20"
                                      src="https://www.mailjet.com/images/theme/v1/icons/ico-social/facebook.png"
                                      style="border-radius:3px;display:block;" width="20"></a></td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;"><a
                              href="https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/new-Learning-100416625670686"
                              style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                              target="_blank">Share</a></td>
                        </tr>
                      </table><!--[if mso | IE]></td><td><![endif]-->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                        style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;vertical-align:middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background:#0077b5;border-radius:3px;width:20px;">
                              <tr>
                                <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                    href="https://www.linkedin.com/shareArticle?mini=true&url=https://www.linkedin.com/company/new-learning/&title=&summary=&source="
                                    target="_blank"><img height="20"
                                      src="https://www.mailjet.com/images/theme/v1/icons/ico-social/linkedin.png"
                                      style="border-radius:3px;display:block;" width="20"></a></td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;"><a
                              href="https://www.linkedin.com/shareArticle?mini=true&url=https://www.linkedin.com/company/new-learning/&title=&summary=&source="
                              style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                              target="_blank">Share</a></td>
                        </tr>
                      </table><!--[if mso | IE]></td><td><![endif]-->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                        style="float:none;display:inline-table;">
                        <tr>
                          <td style="padding:4px;vertical-align:middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background:#EB3323;border-radius:3px;width:20px;">
                              <tr>
                                <td style="font-size:0;height:20px;vertical-align:middle;width:20px;"><a
                                    href="https://www.youtube.com/channel/UCcLyhAsxmh6oM5nM6NTc4-A"
                                    target="_blank"><img height="20"
                                      src="https://www.mailjet.com/images/theme/v1/icons/ico-social/youtube.png"
                                      style="border-radius:3px;display:block;" width="20"></a></td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;"><a
                              href="https://www.youtube.com/channel/UCcLyhAsxmh6oM5nM6NTc4-A"
                              style="color:#333333;font-size:13px;font-family:Ubuntu, Helvetica, Arial, sans-serif;line-height:22px;text-decoration:none;"
                              target="_blank">Share</a></td>
                        </tr>
                      </table><!--[if mso | IE]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
            </div><!--[if mso | IE]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
  </div><!--[if mso | IE]></td></tr></table><![endif]-->
</div>
</body>

</html>`, // html body
  };
}
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  async function calculate_date_diff(params) {
    var d1 = new Date(params);   
    var d2 = new Date(); 
    var diff = d1.getTime() - d2.getTime();   
            
        var daydiff = diff / (1000 * 60 * 60 * 24); 
        return daydiff;
  }

  async function calculate_date_diff_class(params) {
    var d1 = new Date(params);   
    var d2 = new Date(); 
    var diff = d2.getTime() - d1.getTime();   
            
        var daydiff = diff / (1000 * 60 * 60 * 24); 
        return daydiff;
  }

module.exports = {
  getOffset,
  emptyOrRows,
  sendmail,
  sendsms,
  calculate_date_diff,
  calculate_date_diff_class
}