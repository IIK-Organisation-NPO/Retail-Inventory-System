// config/sms.js
const sendSMS = async (to, otp) => {
  // For now, we simulate the SMS. 
  // In the future, you can replace this block with an API call to Twilio or BulkSMS.
  
  console.log(`\n=========================================`);
  console.log(`📱 SIMULATED SMS TO ${to}`);
  console.log(`Message: Your SpazaNet verification code is: ${otp}`);
  console.log(`=========================================\n`);
  
  // Simulate a network delay so the frontend shows the loading spinner
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  
  return true;
};

module.exports = sendSMS;