const { randomInt } = require('crypto');
function generateOtp(){
    return randomInt(100000,1000000)
}

function getOtpHtml(otp, expiryMinutes = 5) {
  return `
  <!DOCTYPE html>
  <html>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 100%;">

              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #4caf50; padding: 24px;">
                  <h1 style="margin: 0; font-size: 22px; color: #ffffff;">Verify Your Account</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td align="center" style="padding: 32px 24px;">
                  <p style="margin: 0 0 16px; font-size: 16px; color: #333333;">
                    Use the code below to complete your verification:
                  </p>

                  <div style="display: inline-block; background-color: #f1f8f2; border: 2px dashed #4caf50; border-radius: 8px; padding: 16px 32px; margin: 8px 0 20px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2e7d32;">${otp}</span>
                  </div>

                  <p style="margin: 0; font-size: 14px; color: #666666;">
                    This code expires in <strong>${expiryMinutes} minutes</strong>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #fafafa; padding: 16px 24px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    If you did not request this code, you can ignore this email.<br>
                    Never share this code with anyone.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
module.exports.generateOtp=generateOtp;
module.exports.getOtpHtml=getOtpHtml;