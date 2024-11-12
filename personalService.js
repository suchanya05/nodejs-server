// personalService.js

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// ตั้งค่าการเชื่อมต่อฐานข้อมูล PostgreSQL
const pool = new Pool({
    host: '26.244.30.47',
    user: 'postgres',
    password: 'p@ssword',
    database: 'postgres',
    port: 5432,
});

// ดึงข้อมูลผู้ใช้ทั้งหมดจาก ne_personal
async function getAllPersonal() {
    const result = await pool.query('SELECT id, username, name, role, profile_picture FROM ne_personal');
    return result.rows;
}

// ดึงข้อมูลผู้ใช้ตาม ID
async function getPersonalById(id) {
    const result = await pool.query('SELECT id, username, name, role, profile_picture FROM ne_personal WHERE id = $1', [id]);
    return result.rows[0];
}

// เพิ่มข้อมูลผู้ใช้ใหม่พร้อมเข้ารหัสรหัสผ่าน
async function addPersonal(req, res) {
    const { username, name, role, password, profile_picture } = req.body;

    try {
        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL Query สำหรับการเพิ่มข้อมูลในฐานข้อมูล
        const result = await pool.query(
            `INSERT INTO ne_personal (username, name, role, password, profile_picture) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [username, name, role, hashedPassword, profile_picture || null]
        );

        res.status(201).json({
            message: 'Personal data added successfully!',
            personal: result.rows[0], // ส่งข้อมูลผู้ใช้งานที่เพิ่มไป
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// อัปเดตข้อมูลผู้ใช้ใน ne_personal พร้อมเข้ารหัสรหัสผ่านใหม่ถ้ามีการเปลี่ยนแปลง
async function updatePersonal(id, updatedPerson) {
    // เริ่มต้น query สำหรับการอัปเดตข้อมูล
    let query = 'UPDATE ne_personal SET username = $1, name = $2, role = $3';
    let values = [updatedPerson.username, updatedPerson.name, updatedPerson.role];

    // ตรวจสอบว่าในข้อมูลที่ส่งมา มีการส่งรหัสผ่านใหม่หรือไม่
    if (updatedPerson.password) {
        // ถ้ามีการส่งรหัสผ่านใหม่ ให้ทำการเข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(updatedPerson.password, 10);  // เข้ารหัสรหัสผ่าน
        query += ', password = $4';  // เพิ่มคอลัมน์ password ในคำสั่ง SQL
        values = [updatedPerson.username, updatedPerson.name, updatedPerson.role, hashedPassword];  // เพิ่มรหัสผ่านที่เข้ารหัสแล้วใน values
    }

    // ทำการอัปเดตข้อมูลในฐานข้อมูล
    query += ' WHERE id = $5 RETURNING id, username, name, role, password';  // คืนค่า id, username, name, role
    values.push(id);  // เพิ่ม id ลงใน values สำหรับการใช้ใน query
    const result = await pool.query(query, values);  // รันคำสั่ง SQL
    return result.rows[0];  // คืนค่าผลลัพธ์
}

// ลบข้อมูลผู้ใช้ตาม ID
async function deletePersonal(id) {
    const result = await pool.query('DELETE FROM ne_personal WHERE id = $1 RETURNING id, username, name, role', [id]);
    return result.rows[0];
}

async function login(req, res) {
    const { username, password } = req.body;

    try {
        // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้ username
        const result = await pool.query('SELECT * FROM ne_personal WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // เปรียบเทียบรหัสผ่านที่ผู้ใช้กรอกกับรหัสผ่านที่เก็บในฐานข้อมูล
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // ถ้ารหัสผ่านตรงกัน ส่งข้อมูลผู้ใช้กลับไป
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                profile_picture: user.profile_picture, // ถ้ามีรูปภาพ
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getAllPersonal,
    getPersonalById,
    addPersonal,
    updatePersonal,
    deletePersonal,
    login,
};
