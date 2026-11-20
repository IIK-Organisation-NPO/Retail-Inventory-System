// controllers/storeRegistrationController.js
const { isValidRegNumber, lookupCompany } = require('../services/cipcService');

exports.lookupCompanyByRegNumber = async (req, res) => {
  try {
    const regNumber = (req.body.registrationNumber || '').trim();

    // 1. Check the format
    if (!isValidRegNumber(regNumber)) {
      return res.status(400).json({
        message: 'Invalid registration number. Use the format YYYY/NNNNNN/NN.',
      });
    }

    // 2. Look the company up
    const company = await lookupCompany(regNumber);

    if (!company) {
      return res.status(404).json({
        message: 'No company found for this registration number.',
      });
    }

    // 3. Send the company details back
    return res.status(200).json({
      registrationNumber: regNumber,
      companyName: company.companyName,
      status: company.status,
      registeredAddress: company.address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
