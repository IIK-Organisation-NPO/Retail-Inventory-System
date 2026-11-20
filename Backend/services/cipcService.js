// services/cipcService.js

// CIPC registration numbers look like 2015/123456/07
const REG_NUMBER_REGEX = /^\d{4}\/\d{6}\/\d{2}$/;

function isValidRegNumber(regNumber) {
  return REG_NUMBER_REGEX.test(regNumber);
}

// Fake company data for testing (replaced by the real CIPC provider later)
const MOCK_COMPANIES = {
  '2015/123456/07': {
    companyName: 'Ixopo Traders (Pty) Ltd',
    status: 'In Business',
    address: '12 Main Road, Ixopo, KwaZulu-Natal, 3276',
  },
  '2018/654321/07': {
    companyName: 'Umzimkhulu Supplies (Pty) Ltd',
    status: 'Deregistered',
    address: '5 Church Street, Umzimkhulu, KwaZulu-Natal, 3297',
  },
};

async function lookupCompany(regNumber) {
  const company = MOCK_COMPANIES[regNumber];
  return company || null; // null means "company not found"
}

module.exports = { isValidRegNumber, lookupCompany };