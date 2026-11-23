const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldCatch = `    } catch(err) {
        console.error("Upload error:", err);
        alert("Upload failed. Try again.");
    }`;

const newCatch = `    } catch(err) {
        console.error("Upload error:", err);
        alert("Upload failed: " + err.message);
    }`;

if (html.includes(oldCatch)) {
    html = html.replace(oldCatch, newCatch);
    fs.writeFileSync('index.html', html);
    console.log('✅ Error message now shows the exact reason!');
} else {
    console.log('❌ Could not find the catch block.');
}
