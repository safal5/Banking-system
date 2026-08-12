const nodemailer=require('nodemailer');
const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

const sendMail=async(to,subject,text,html)=>{
    try {
    const info = await transporter.sendMail({
    from: `"Backend-ledger" <${process.env.EMAIL_USER}>`, // sender address
    to, // list of recipients
    subject, // subject line
    text, // plain text body
    html // HTML body
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} catch (err) {
  console.error("Error while sending mail:", err);
}
}
const registerEmail=async(user,email)=>{
    const to=email;
    const subject="Welcome to backend ledger";
    const text=`Hello ${user}.\n\n welcome to our community.\nWe are glad to have you on board\n\nwith regards\nBackend ledger team`;
    const html=`<p>Hello ${user}.</p><p> welcome to our community.</p><p>We are glad to have you on board</p><br><p>with regards</p>Backend ledger team`;
    await sendMail(to,subject,text,html);
}

const sendTransactionEmailSender=async(sender,receiver,email,amount)=>{
  const to=email;
  const subject="Transaction Alert!"
  const text=`${sender}, your transaction to ${receiver} has been done successfully.\nRs ${amount} has been debited from your account`
  const html=`<p>${sender}, your transaction to ${receiver} has been done successfully</p><br><p>Rs ${amount} has been debited from your account</p>`
  await sendMail(to,subject,text,html)
}

const sendTransactionEmailReceiver=async(sender,receiver,email,amount)=>{
  const to=email;
  const subject="Transaction Alert!"
  const text=`Dear ${receiver}, \nRs ${amount} has been credited to your account from ${sender}`
  const html=`<p>Dear ${receiver},</p><br><p>\nRs ${amount} has been credited to your account from ${sender}</p>`
  await sendMail(to,subject,text,html)
}

const sendCashDepositedEmail=async(user,amount,email)=>{
  const to=email;
  const subject="Cash Successfully Deposited"
  const text=`Dear ${user}, Rs.${amount} has been deposited to your account successfully`
  const html=`<p>Dear ${user}, Rs.${amount} has been deposited to your account successfully</p>`
  await sendMail(to,subject,text,html)

}

module.exports.registerEmail=registerEmail
module.exports.sendTransactionEmailSender=sendTransactionEmailSender
module.exports.sendTransactionEmailReceiver=sendTransactionEmailReceiver
module.exports.sendCashDepositedEmail=sendCashDepositedEmail