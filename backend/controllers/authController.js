const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mapping Roles to their specific Database Tables and ID columns
const roleConfig = {
    'Admin': { table: 'Admin', idColumn: 'AdminID', roleId: 1 },
    'Owner': { table: 'Owner', idColumn: 'OwnerID', roleId: 2 },
    'Staff': { table: 'Staff', idColumn: 'StaffID', roleId: 3 },
    'Supplier': { table: 'Supplier', idColumn: 'SupplierID', roleId: 4 }
};

// ==========================================
// 1. REGISTER USER (Handles all 4 roles)
// ==========================================
exports.register = async (req, res) => {
    const {
        roleName, name, surname, email, mobileNumber, gender, password,
        disability, disabilityDescription, companyName
    } = req.body;

    if (!roleConfig[roleName]) {
        return res.status(400).json({ message: 'Invalid role. Use Admin, Owner, Staff, or Supplier.' });
    }

    const { table, roleId } = roleConfig[roleName];

    try {
        // A. Email Uniqueness (Check all 4 tables to prevent duplicate logins)
        const tablesToCheck = ['Admin', 'Owner', 'Staff', 'Supplier'];
        for (let t of tablesToCheck) {
            const [existing] = await db.query(`SELECT Email FROM ${t} WHERE Email = ?`, [email]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email is already registered in the system' });
            }
        }

        // B. Password Complexity Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be 8+ chars, with uppercase, lowercase, number, and special character.'
            });
        }

        // C. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // D. Insert into the correct table based on role
        let query = '';
        let values = [];

        if (roleName === 'Supplier') {
            query = `INSERT INTO Supplier (CompanyName, Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            values = [companyName, name, surname, email, mobileNumber, gender, disability || false, disabilityDescription || null, passwordHash, roleId];
        } else if (roleName === 'Admin') {
            query = `INSERT INTO Admin (Name, Surname, Email, MobileNumber, Gender, PasswordHash, RoleID) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
            values = [name, surname, email, mobileNumber, gender, passwordHash, roleId];
        } else {
            // Owner or Staff
            query = `INSERT INTO ${table} (Name, Surname, Email, MobileNumber, Gender, Disability, DisabilityDescription, PasswordHash, RoleID) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
// 2. LOGIN USER
// ==========================================
exports.login = async (req, res) => {
    const { email, password, roleName, rememberMe } = req.body;

    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role' });
    const { table, idColumn } = roleConfig[roleName];

    try {
        const [users] = await db.query(`SELECT * FROM ${table} WHERE Email = ?`, [email]);

        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        const user = users[0];

        if (!user.IsActive) return res.status(403).json({ message: 'Account is disabled' });

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Generate JWT (7 days if Remember Me, else 15 mins)
        const userId = user[idColumn];
        const token = jwt.sign(
            { id: userId, role: roleName },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '15m' }
        );

        // Cookie Options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            ...(rememberMe && { maxAge: 7 * 24 * 60 * 60 * 1000 })
        };

        res.cookie('accessToken', token, cookieOptions);

        res.status(200).json({
            message: 'Login successful',
            user: { id: userId, name: user.Name, role: roleName },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ==========================================
// 3. FORGOT PASSWORD
// ==========================================
exports.forgotPassword = async (req, res) => {
    const { email, roleName } = req.body;

    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role' });
    const { table } = roleConfig[roleName];

    try {
        const [users] = await db.query(`SELECT * FROM ${table} WHERE Email = ?`, [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        // Generate random reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await db.query(
            `UPDATE ${table} SET ResetToken = ?, ResetTokenExpiry = ? WHERE Email = ?`,
            [resetToken, resetExpires, email]
        );

        // NOTE: In production, email this token. For today's MVP, we return it in JSON.
        res.status(200).json({
            message: 'Password reset token generated.',
            debug_resetToken: resetToken
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// 4. RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
    const { token, newPassword, roleName } = req.body;

    if (!roleConfig[roleName]) return res.status(400).json({ message: 'Invalid role' });
    const { table } = roleConfig[roleName];

    try {
        // Check password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password does not meet complexity requirements' });
        }

        // Find user by token and check if expired
        const [users] = await db.query(
            `SELECT * FROM ${table} WHERE ResetToken = ? AND ResetTokenExpiry > NOW()`,
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear token
        await db.query(
            `UPDATE ${table} SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE ResetToken = ?`,
            [passwordHash, token]
        );

        res.status(200).json({ message: 'Password reset successful. You can now login.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};