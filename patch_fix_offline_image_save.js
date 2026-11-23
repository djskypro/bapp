const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the exact code that saves to the offline database for single users
const oldSave = `                db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,`;

const newSave = `                // CONVERT IMAGE TO FILE BEFORE SAVING TO DB
                let savedText = text;
                if (isImage && text && text.startsWith('data:image')) {
                    savedText = saveImageToFile(text, true);
                }

                db[cleanTo].push({
                    from: from,
                    text: savedText,
                    isImage: isImage || false,`;

serverJs = serverJs.replace(oldSave, newSave);

// Also fix the group message save
const oldGroupSave = `                        db[member].push({
                            from: from, text: text,`;
const newGroupSave = `                        let savedTextG = text;
                        if (isImage && text && text.startsWith('data:image')) {
                            savedTextG = saveImageToFile(text, true);
                        }
                        db[member].push({
                            from: from, text: savedTextG,`;

serverJs = serverJs.replace(oldGroupSave, newGroupSave);

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server will now save images as files BEFORE saving to offline DB!');
