const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "costeiradaniel@gmail.com",
    subject: "Thanks for joining in",
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`
  });
};

const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "costeiradaniel@gmail.com",
    subject: "Sorry we made you leave!",
    text: `Hy ${name}, where we could improve?`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
};