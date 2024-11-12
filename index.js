// index.js

const express = require('express');
const bodyParser = require('body-parser');
const personalService = require('./personalService');
const app = express();
const port = 3000;
const cors = require('cors');
// app.use(cors());
app.use(cors({
    origin: 'http://localhost:4200',  // กำหนด origin ที่อนุญาต
}));

// app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
// API: ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/personal', async (req, res) => {
    try {
        const data = await personalService.getAllPersonal();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/login', personalService.login);

// Route สำหรับการเพิ่มข้อมูลผู้ใช้งานใหม่ (รวมถึงรูปภาพ Base64)
app.post('/personal', personalService.addPersonal);

// API: อัปเดตข้อมูลผู้ใช้
app.put('/personal/:id', async (req, res) => {
    const { id } = req.params;               // รับค่า id จากพารามิเตอร์
    const updatedPerson = req.body;           // รับข้อมูลที่อัปเดตมาจาก body

    try {
        const data = await personalService.updatePersonal(id, updatedPerson);  // เรียกใช้ฟังก์ชัน updatePersonal
        if (!data) {
            return res.status(404).json({ message: "User not found" });  // ถ้าไม่พบข้อมูลผู้ใช้
        }
        res.status(200).json(data);  // ส่งข้อมูลที่อัปเดตกลับไป
    } catch (error) {
        res.status(400).json({ message: error.message });  // ถ้าเกิดข้อผิดพลาด
    }
});

// API: ลบข้อมูลผู้ใช้ตาม ID
app.delete('/personal/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await personalService.deletePersonal(id);
        if (!data) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
