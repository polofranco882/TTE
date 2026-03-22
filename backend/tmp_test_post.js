const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'secret';
const adminToken = jwt.sign({ id: 1, email: 'admin@example.com', role: 'admin' }, SECRET);

async function testPost() {
    const body = {
        title: 'Test Video',
        description: 'Test Description',
        video_url: 'data:video/mp4;base64,AAAA...', // simulated
        thumbnail_url: 'data:image/webp;base64,BBBB...',
        display_order: 1
    };
    
    console.log('Sending POST to http://localhost:5000/api/landing-modules/videos');
    try {
        const res = await fetch('http://localhost:5000/api/landing-modules/videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(body)
        });
        
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

testPost();
