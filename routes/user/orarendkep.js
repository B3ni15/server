const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const moment = require('moment');

module.exports = async function (req, res) {
    const { TOKEN, INSTITUTE } = req.body;
    const API = 'localhost:3000';

    if (!TOKEN || !INSTITUTE) {
        res.status(400).send("Missing parameters");
        return;
    }

    function getJustdate(date) {
        return new Date(date).toISOString().split('T')[0];
    }

    function getJustHour(date) {
        const KezdetIdopont = new Date(date);
        KezdetIdopont.setHours(KezdetIdopont.getHours() + 2);
        return KezdetIdopont.toISOString().split('T')[1].slice(0, -5);
    }

    class Orarend {
        constructor(token, ist, fromDate, toDate) {
            this.token = token;
            this.ist = ist;
            this.fromDate = fromDate;
            this.toDate = toDate;
        }
    
        async getTimetable() {
            const response = await axios.get(`https://${this.ist}.e-kreta.hu/ellenorzo/V3/Sajat/OrarendElemek?datumTol=${this.fromDate}&datumIg=${this.toDate}`, {
                headers: {
                    "Authorization": "Bearer " + this.token,
                    "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0"
                }
            });
            return response.data;
        }
    }

    async function getOrarend() {
        try {
            function getCurrentMonday() {
                const today = moment();
                const monday = today.day(1);
                return monday.format('YYYY-MM-DD');
            }

            function getCurrentFriday() {
                const today = moment();
                const friday = today.day(7);
                return friday.format('YYYY-MM-DD');
            }

            const fromDate = getCurrentMonday();
            const toDate = getCurrentFriday();

            const orarend = new Orarend(TOKEN, INSTITUTE, fromDate, toDate);
            const timetable = await orarend.getTimetable();
            return timetable;
        } catch (error) {
            throw error;
        }
    }

    const width = 800;
    const height = 600;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    const backgroundColor = '#0F1015';
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#1067ED');
    gradient.addColorStop(1, '#55C2C4');
    context.fillStyle = gradient;
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText('Napi órarend', width / 2, 80);

    const startY = 140;
    const lineHeight = 50;

    try {
        const data = await getOrarend();
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTimePlus2Hours = new Date().toISOString();
        const currentTime = new Date(new Date(currentTimePlus2Hours).getTime() + 2 * 60 * 60 * 1000).toISOString().split('T')[1].slice(0, -5);

        const filteredSchedule = data.filter(item => {
            return getJustdate(item.KezdetIdopont) === currentDate;
        });

        filteredSchedule.sort((a, b) => {
            return new Date(a.KezdetIdopont) - new Date(b.KezdetIdopont);
        });

        filteredSchedule.forEach((item, index) => {
            const y = startY + index * lineHeight;
            const kezdes = getJustHour(item.KezdetIdopont);
            const vegzes = getJustHour(item.VegIdopont);

            if (vegzes < currentTime) {
                context.fillStyle = '#808080';
            } else {
                context.fillStyle = '#FFFFFF';
            }

            context.fillText(`${item.Nev} - ${item.Oraszam}. óra (${kezdes} - ${vegzes})`, width / 2, y);
        });

        const buffer = canvas.toBuffer('image/png');
        const filename = `${currentDate.replace(/-/g, '')}${currentTime.replace(/:/g, '')}`;

        if (fs.existsSync(`./kepek/${filename}.png`)) {
            res.status(200).json({ message: 'Órarend kép már létezik' });
        } else {
            fs.writeFileSync(`./kepek/${filename}.png`, buffer);
            console.log('Órarend kép létrehozva és mentve a "orarend.png" fájlba.');
            res.status(200).json({ id: `${filename}` });
        }
    } catch (error) {
        console.error('Hiba történt az órarend lekérése vagy a fájl mentése során:', error);
        res.status(500).send('Internal Server Error');
    }
}