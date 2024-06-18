var nodemailer = require("nodemailer");

const sendOtpCode = async (data) => {
  console.log("data is email", data);
  var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, //smtp.gmail.com
    port: process.env.MAIL_PORT, //587
    // secure: false, // Use SSL
    auth: {
      user: process.env.MAIL_FROM_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  var sendOtp = {
    from: process.env.MAIL_FROM_ADDRESS,
    to: data.emailAddress,
    subject: "Gif off",
    html: `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>OTP Email Template</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;1,700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0;font-family: 'Poppins', sans-serif;">
        <div style="background: #000A1C; border-radius: 20px; text-align: center; box-shadow: 0 6px 18px 0 rgba(0,0,0,.06);background-position: center; background-size: cover; max-width: 415px; margin: 0 auto; padding: 40px;">
            <img src="${process.env.APP_FULL_LOGO}" alt="Logo Image" style="max-width: 50%;">
            <div style="text-align: start; font-family: 'Urbanist', sans-serif;">
              <p style="margin-bottom: 20px;color: #fff;">Hello ${data.name},</p>
              <p style="margin-bottom: 20px;color: #fff;">You have requested to reset your password. Below is your verification code:</p>
              <h2 style="margin-bottom: 20px;margin-top: 20px; font-size: 20px;font-weight: 500;color: #fff; text-transform: uppercase; text-align:center;font-weight: 600; font-size: 20px; color: #ffff; border-radius: 5px; background-color:rgba(255, 255, 255, 0.06); text-align: center;padding: 5px;"><span style="line-height: 50px;font-weight: 700;font-size: 54px;color: #fff;">${data.otp}</span></h2>
              <p style="margin-bottom: 20px;color: #fff;">If you didn't request this, please ignore this email. The code is valid for a limited time.</p>
              <h1 style="color: #D7D7D7; font-weight: 500; margin: 0; font-size: 17px; line-height: 25px;color: #fff;">Thank you, <br>
                  <span style="font-weight: 600; color: #fff;">GIF OFF Team</span>
              </h1>
            </div>
        </div>
      </body>
    </html>`,
  };

  return await transporter.sendMail(sendOtp);
};

const sendSupportMail = async (data) => {
  console.log("data is email", data);
  var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, //smtp.gmail.com
    port: process.env.MAIL_PORT, //587
    // secure: false, // Use SSL
    auth: {
      user: process.env.MAIL_FROM_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  var sendOtp = {
    from: data.email_address,
    to: process.env.SUPPORT_MAIL_ADDRESS,
    subject: data.subject,
    html: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request - Admin Notification</title>
    </head>
    <body style="margin: 20px; font-family: Arial, sans-serif; background: #000713;">
        <div style="max-width: 600px; margin: 0 auto; background: #000A1C; color: #fff;">
            <div style="background-color: #020F28; color: #fff; padding: 15px; text-align: center;">
                <div>
                <img src="${process.env.APP_FULL_LOGO}" alt="Logo Image" style="max-width: 50%;">
                </div>
                <h2>Support Request</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p  style="color:#788294">A new support request has been submitted. Here are the details:</p>
                <p><strong style="line-height: 30px;">User Name:</strong> <br> ${data.user_name}</p>
                <p><strong style="line-height: 30px;">User Email:</strong> <br> ${data.email_address}</p>
                <p><strong style="line-height: 30px;">Subject:</strong> <br> ${data.subject}</p>
                <p><strong style="line-height: 30px;">Message:</strong> <br> ${data.message}</p>
                <p style="color:#788294">Please take appropriate action to address this request promptly.</p>
                <p style="color:#788294">Thank you for your attention to this matter.</p>
                <p style="color:#788294">Best regards,<br>gif off Team</p>
            </div>
        </div>
    </body>
    </html>`,
  };

  return await transporter.sendMail(sendOtp);
};

module.exports = { sendOtpCode, sendSupportMail };

/*     
`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">s
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;1,700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0;font-family: 'Poppins', sans-serif;">
  <div style="background: linear-gradient(180deg, #b9f0ff8c 0%, #ffeac6c2 100%); max-width: 415px; margin: 0 auto; padding: 40px;background-size: cover; background-position: center;border: 4px solid rgba(255, 255, 255, 0.40); box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.12); border-radius: 20px;">
    <div style="text-align: center;">
      <img src= alt="Logo Image" style="max-width: 100%;">
    </div>
    <p style="font-weight: 600;font-size: 20px;line-height: 30px;color: #000000; margin: 0 0 10px 0;">Hello ${data.name},</p>
    <p style="font-weight: 400;font-size: 15px;line-height: 22px;color: #676767;margin: 0 0 0 0;">We’ve received a request to reset your Password. If you didn’t make the request, just ignore email.</p>
    <h2 style="font-weight: 600; font-size: 20px; line-height: 34px; color: #000000; border-radius: 5px; background: linear-gradient(90deg, #5CCBEA -4.34%, #EFD296 103.9%); padding: 15px; text-align: center;">Your Verification code is<br><span style="display:block;margin-top: 20px;font-weight: 700;font-size: 54px;color: #000000;">${data.otp}</span></h2>
    <p style="font-weight: 400;font-size: 15px;line-height: 22px;color: #676767;margin: 0 0 0 0;">Please do not share your code with anyone else.</p>
    <p style="font-weight: 400;font-size: 15px;line-height: 22px;color: #676767; margin: 15px 0 0; ">If you have any questions or trouble logging on please contact <a href="mailto:info@ad-anima.com" style="font-weight:600;color: #000000;">${process.env.MAIL_FROM_ADDRESS}</a></p>
    <div style="margin-top: 30px;font-weight: 500;font-size: 15px;color: #000000;">
      Thank You,<br> Gif off Team
    </div>
  </div>
</body>
</html>` */
