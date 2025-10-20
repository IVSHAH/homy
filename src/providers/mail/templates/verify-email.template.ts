export const verifyEmailTemplate = (verificationCode: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to Homy!</h2>
    <p>Thank you for registering. Please use the verification code below to verify your email address:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #f4f4f4;
                  border: 2px dashed #4CAF50;
                  padding: 20px;
                  border-radius: 10px;
                  display: inline-block;">
        <span style="font-size: 32px;
                     font-weight: bold;
                     letter-spacing: 5px;
                     color: #4CAF50;">
          ${verificationCode}
        </span>
      </div>
    </div>
    <p>Enter this code in the verification form to complete your registration.</p>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This code will expire in 15 minutes. If you didn't create an account, please ignore this email.
    </p>
  </div>
</body>
</html>
`;
