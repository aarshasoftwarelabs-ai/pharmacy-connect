const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1, phone: '9664781007', pharmacyId: 1, role: 'OWNER' }, 'your_super_secret_jwt_key_here');
console.log(token);
