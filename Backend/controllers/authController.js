const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const roleConfig = {
    'Admin': { table: 'Admin', idColumn: 'AdminID', roleId: 1 },
    'Store Owner': { table: 'Owner', idColumn: 'OwnerID', roleId: 2 },
    'Store Staff': { table: 'Staff', idColumn: 'StaffID', roleId: 3 },
    'Supplier': { table: 'Supplier', idColumn: 'SupplierID', roleId: 4 }
};

// ==========================================
// 1. REGISTER USER (Direct insert, no OTP)
// ==========================================
exports.register = async (req, res) => {
    const { roleName, name, surname, email, mobileNumber, gender, password, disability, disabilityDescription, companyName } = req.body;
    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role.' });
    const { table, roleId } = roleConfig[roleName];

    try {
        // Check if email exists and is already verified
        const [existing] = await db.query(`SELECT IsEmailVerified FROM ${table} WHERE Email = ?`, [email]);
        
        if (existing.length > 0) {
            if (existing[0].IsEmailVerified) {
                return res.status(400).json({ message: 'Email is already registered and verified.' });
            } else {
                // If it exists but is NOT verified, we will overwrite it below
                await db.query(`DELETE FROM ${table} WHERE Email = ?`, [email]);
            }
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements.' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let query = '';
        let values = [];

        // Insert directly (for testing purposes or admins)
        if (roleName === 'Supplier') {
            query = `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, IsEmailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
            values = [companyName, name, surname, email, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, roleId];
        } else if (roleName === 'Admin') {
            query = `INSERT INTO Admin (Name, Surname, Email, MobileNumber, Gender, PasswordHash, RoleID, IsEmailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`;
            values = [name, surname, email, mobileNumber, gender, passwordHash, roleId];
        } else {
            query = `INSERT INTO ${table} (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, IsEmailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
            values = [name, surname, email, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, roleId];
        }

        await db.query(query, values);
        res.status(201).json({ message: `${roleName} registered successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// ==========================================
// 2. LOGIN USER (with proper role mismatch handling)
// ==========================================
exports.login = async (req, res) => {
    const { email, password, roleName, rememberMe } = req.body;

    if (!roleConfig[roleName]) {
        return res.status(400).json({ message: 'Invalid role.' });
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the user across ALL role tables, because we need to know
        // whether the account exists under a different role.
        let foundUser = null;
        let foundRole = null;

        for (const role of Object.keys(roleConfig)) {
            const { table } = roleConfig[role];
            // Case-insensitive email match
            const [rows] = await db.query(
                `SELECT * FROM ${table} WHERE LOWER(Email) = ? LIMIT 1`,
                [cleanEmail]
            );
            if (rows.length > 0) {
                foundUser = rows[0];
                foundRole = role;
                break;
            }
        }

        // If no account exists anywhere with that email → generic error
        if (!foundUser) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        // If the account exists but under a DIFFERENT role → role mismatch
        // (Check this BEFORE the password, so the message is helpful.)
        if (foundRole !== roleName) {
            // For Store Owner / Store Staff tabs, show "not registered as a Store"
            const displayRole =
                (roleName === 'Store Owner' || roleName === 'Store Staff') ? 'Store' : roleName;
            return res.status(403).json({
                message: `This account is not registered as a ${displayRole}.`
            });
        }

        // Role matches — now do the account status checks
        if (foundUser.IsActive === 0) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Contact support.'
            });
        }

        if (!foundUser.IsEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before signing in.'
            });
        }

        // Password check
        const isMatch = await bcrypt.compare(password, foundUser.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        // Success
        const { idColumn } = roleConfig[foundRole];
        const userId = foundUser[idColumn];
        const token = jwt.sign(
            { id: userId, role: foundRole },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '15m' }
        );

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            ...(rememberMe && { maxAge: 7 * 24 * 60 * 60 * 1000 })
        });

        return res.status(200).json({
            message: 'Login successful',
            user: { id: userId, name: foundUser.Name, role: foundRole },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// ==========================================
// 3. SEND OTP (Saves to the user's table)
// ==========================================
exports.sendOTP = async (req, res) => {
    const { email, roleName, name, surname, mobileNumber, gender, password, disability, disabilityDescription, companyName } = req.body; 
    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role.' });
    const { table, roleId } = roleConfig[roleName];

    try {
        // 1. Check if email exists and is verified
        const [existing] = await db.query(`SELECT IsEmailVerified FROM ${table} WHERE Email = ?`, [email]);
        if (existing.length > 0 && existing[0].IsEmailVerified) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // 2. Hash password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        // 4. Insert or Update the user
        if (existing.length > 0) {
            // Update existing unverified user
            await db.query(`UPDATE ${table} SET Name=?, Surname=?, MobileNumber=?, Gender=?, Disability=?, DisabilityDescription=?, PasswordHash=?, EmailOTP=?, EmailOTPExpiry=? WHERE Email=?`, 
            [name, surname, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, otpCode, expiresAt, email]);
        } else {
            // Insert new user
            let query = '';
            let values = [];
            if (roleName === 'Supplier') {
                query = `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                values = [companyName, name, surname, email, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, roleId, otpCode, expiresAt];
            } else if (roleName === 'Admin') {
                query = `INSERT INTO Admin (Name, Surname, Email, MobileNumber, Gender, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                values = [name, surname, email, mobileNumber, gender, passwordHash, roleId, otpCode, expiresAt];
            } else {
                query = `INSERT INTO ${table} (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID, EmailOTP, EmailOTPExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                values = [name, surname, email, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, roleId, otpCode, expiresAt];
            }
            await db.query(query, values);
        }

        // 5. Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'SpazaNet - Verify Your Email',
            text: `Your verification code is: ${otpCode}. It expires in 10 minutes.`
        });

        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP email.' });
    }
};

// ==========================================
// 4. VERIFY OTP (Updates IsEmailVerified to 1)
// ==========================================
exports.verifyOTP = async (req, res) => {
    const { email, otp, roleName } = req.body; // We need roleName to know which table to check
    
    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role.' });
    const { table } = roleConfig[roleName];

    try {
        const [records] = await db.query(`SELECT * FROM ${table} WHERE Email = ? AND EmailOTP = ? AND EmailOTPExpiry > NOW()`, [email, otp]);
        
        if (records.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Mark as verified and clear OTP
        await db.query(`UPDATE ${table} SET IsEmailVerified = 1, EmailOTP = NULL, EmailOTPExpiry = NULL WHERE Email = ?`, [email]);
        
        res.status(200).json({ message: `Email verified successfully. You can now log in.` });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error during verification.' });
    }
};

// ==========================================
// 5. FORGOT PASSWORD (Simplified)
// ==========================================
exports.forgotPassword = async (req, res) => {
    const { email, roleName } = req.body;
    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role' });
    const { table } = roleConfig[roleName];

    try {
        const [users] = await db.query(`SELECT * FROM ${table} WHERE Email = ?`, [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000);

        await db.query(`UPDATE ${table} SET ResetToken = ?, ResetTokenExpiry = ? WHERE Email = ?`, [resetToken, resetExpires, email]);
        res.status(200).json({ message: 'Password reset token generated.', debug_resetToken: resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// 6. RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
    const { token, newPassword, roleName } = req.body;
    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role' });
    const { table } = roleConfig[roleName];

    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) return res.status(400).json({ message: 'Password does not meet complexity requirements' });

        const [users] = await db.query(`SELECT * FROM ${table} WHERE ResetToken = ? AND ResetTokenExpiry > NOW()`, [token]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid or expired reset token' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await db.query(`UPDATE ${table} SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE ResetToken = ?`, [passwordHash, token]);
        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};