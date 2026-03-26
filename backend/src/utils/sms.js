import twilio from "twilio";

export const sendPhoneOtp = async (phone, otp) => {
  try {
    

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: `Your OTP for verification is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    
  } catch (error) {
    
    throw new Error("Failed to send OTP via SMS");
  }
};